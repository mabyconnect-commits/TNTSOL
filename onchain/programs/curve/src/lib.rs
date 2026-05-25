use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("kGRq3nZ4HWAopZM9fFvYpJqNXw3xZ16cXfAXsw7gfw4");

// Bonding-curve AMM (pump.fun style). Each launch opens a constant-product
// curve: a vault holds the full token supply and `virtual_sol` seeds the
// starting price. Buys add real SOL and pull tokens out; sells do the reverse.
// When collected real SOL crosses the graduation threshold the curve closes and
// liquidity is meant to migrate to an LP (migration itself is out of scope here;
// `graduate` flips the flag + emits the event a migrator/indexer acts on).
#[program]
pub mod curve {
    use super::*;

    pub fn launch(
        ctx: Context<Launch>,
        virtual_sol: u64,
        token_supply: u64,
        graduation_threshold: u64,
    ) -> Result<()> {
        require!(virtual_sol > 0, CurveError::ZeroAmount);
        require!(token_supply > 0, CurveError::ZeroAmount);
        require!(graduation_threshold > 0, CurveError::ZeroAmount);

        let mint_key = ctx.accounts.mint.key();
        let bump = ctx.bumps.curve;
        let signer: &[&[&[u8]]] = &[&[b"curve", mint_key.as_ref(), &[bump]]];

        // Mint the full supply into the curve's vault (curve PDA is mint authority).
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.curve.to_account_info(),
                },
                signer,
            ),
            token_supply,
        )?;

        let curve = &mut ctx.accounts.curve;
        curve.mint = mint_key;
        curve.creator = ctx.accounts.creator.key();
        curve.sol_reserve = virtual_sol;
        curve.virtual_sol = virtual_sol;
        curve.token_reserve = token_supply;
        curve.real_sol = 0;
        curve.graduation_threshold = graduation_threshold;
        curve.graduated = false;
        curve.bump = bump;

        emit!(Launched { mint: mint_key, creator: curve.creator, token_supply, virtual_sol });
        Ok(())
    }

    pub fn buy(ctx: Context<Buy>, sol_in: u64, min_tokens_out: u64) -> Result<()> {
        let curve = &mut ctx.accounts.curve;
        require!(!curve.graduated, CurveError::Graduated);
        require!(sol_in > 0, CurveError::ZeroAmount);

        let tokens_out = math::tokens_out_for_sol(curve.sol_reserve, curve.token_reserve, sol_in)
            .ok_or(CurveError::MathOverflow)?;
        require!(tokens_out > 0, CurveError::ZeroAmount);
        require!(tokens_out >= min_tokens_out, CurveError::SlippageExceeded);
        require!(tokens_out < curve.token_reserve, CurveError::InsufficientLiquidity);

        // Buyer pays SOL into the curve PDA.
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: curve.to_account_info(),
                },
            ),
            sol_in,
        )?;

        // Curve PDA signs the token payout from the vault.
        let mint_key = curve.mint;
        let signer: &[&[&[u8]]] = &[&[b"curve", mint_key.as_ref(), &[curve.bump]]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.buyer_ata.to_account_info(),
                    authority: curve.to_account_info(),
                },
                signer,
            ),
            tokens_out,
        )?;

        curve.sol_reserve = curve.sol_reserve.checked_add(sol_in).ok_or(CurveError::MathOverflow)?;
        curve.real_sol = curve.real_sol.checked_add(sol_in).ok_or(CurveError::MathOverflow)?;
        curve.token_reserve = curve.token_reserve.checked_sub(tokens_out).ok_or(CurveError::MathOverflow)?;

        // Whitelist the spent devSOL in the platform via CPI, signing as the
        // curve's authority PDA (registered as the platform's program_authority).
        let auth_seeds: &[&[&[u8]]] = &[&[b"cpi_authority", &[ctx.bumps.curve_authority]]];
        platform::cpi::program_activate(
            CpiContext::new_with_signer(
                ctx.accounts.platform_program.to_account_info(),
                platform::cpi::accounts::ProgramActivate {
                    config: ctx.accounts.platform_config.to_account_info(),
                    program_authority: ctx.accounts.curve_authority.to_account_info(),
                    user: ctx.accounts.buyer.to_account_info(),
                    whitelist: ctx.accounts.user_whitelist.to_account_info(),
                    supply: ctx.accounts.platform_supply.to_account_info(),
                    payer: ctx.accounts.buyer.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                auth_seeds,
            ),
            sol_in,
        )?;

        emit!(Traded { mint: mint_key, is_buy: true, sol: sol_in, tokens: tokens_out, real_sol: curve.real_sol });
        Ok(())
    }

    pub fn sell(ctx: Context<Sell>, tokens_in: u64, min_sol_out: u64) -> Result<()> {
        let curve = &mut ctx.accounts.curve;
        require!(!curve.graduated, CurveError::Graduated);
        require!(tokens_in > 0, CurveError::ZeroAmount);

        let sol_out = math::sol_out_for_tokens(curve.sol_reserve, curve.token_reserve, tokens_in)
            .ok_or(CurveError::MathOverflow)?;
        require!(sol_out > 0, CurveError::ZeroAmount);
        require!(sol_out >= min_sol_out, CurveError::SlippageExceeded);
        require!(sol_out <= curve.real_sol, CurveError::InsufficientLiquidity);

        // Seller sends tokens back into the vault.
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.seller_ata.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            tokens_in,
        )?;

        // Pay SOL out of the curve PDA (program-owned: adjust lamports directly).
        **curve.to_account_info().try_borrow_mut_lamports()? -= sol_out;
        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += sol_out;

        curve.token_reserve = curve.token_reserve.checked_add(tokens_in).ok_or(CurveError::MathOverflow)?;
        curve.sol_reserve = curve.sol_reserve.checked_sub(sol_out).ok_or(CurveError::MathOverflow)?;
        curve.real_sol = curve.real_sol.checked_sub(sol_out).ok_or(CurveError::MathOverflow)?;

        emit!(Traded { mint: curve.mint, is_buy: false, sol: sol_out, tokens: tokens_in, real_sol: curve.real_sol });
        Ok(())
    }

    pub fn graduate(ctx: Context<Graduate>) -> Result<()> {
        let curve = &mut ctx.accounts.curve;
        require!(!curve.graduated, CurveError::Graduated);
        require!(curve.real_sol >= curve.graduation_threshold, CurveError::NotReady);
        curve.graduated = true;
        emit!(Graduated { mint: curve.mint, real_sol: curve.real_sol, tokens_left: curve.token_reserve });
        Ok(())
    }
}

// Pure constant-product math (k = sol_reserve * token_reserve). `sol_reserve`
// carries the virtual offset, so price starts finite and rises as tokens leave.
pub mod math {
    pub fn tokens_out_for_sol(sol_reserve: u64, token_reserve: u64, sol_in: u64) -> Option<u64> {
        let k = (sol_reserve as u128).checked_mul(token_reserve as u128)?;
        let new_sol = (sol_reserve as u128).checked_add(sol_in as u128)?;
        let new_token = k.checked_div(new_sol)?;
        let out = (token_reserve as u128).checked_sub(new_token)?;
        u64::try_from(out).ok()
    }

    pub fn sol_out_for_tokens(sol_reserve: u64, token_reserve: u64, tokens_in: u64) -> Option<u64> {
        let k = (sol_reserve as u128).checked_mul(token_reserve as u128)?;
        let new_token = (token_reserve as u128).checked_add(tokens_in as u128)?;
        // Ceil the new SOL reserve so rounding always favors the curve, never the
        // seller — otherwise a buy/sell round trip could net a lamport (a
        // money-printer). ceil(k / new_token) = (k + new_token - 1) / new_token.
        let new_sol = k.checked_add(new_token)?.checked_sub(1)?.checked_div(new_token)?;
        let out = (sol_reserve as u128).checked_sub(new_sol)?;
        u64::try_from(out).ok()
    }
}

#[derive(Accounts)]
pub struct Launch<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(init, payer = creator, mint::decimals = 6, mint::authority = curve)]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = creator,
        space = 8 + BondingCurve::INIT_SPACE,
        seeds = [b"curve", mint.key().as_ref()],
        bump
    )]
    pub curve: Account<'info, BondingCurve>,
    #[account(
        init,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = curve
    )]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [b"curve", mint.key().as_ref()], bump = curve.bump, has_one = mint)]
    pub curve: Account<'info, BondingCurve>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = curve)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer
    )]
    pub buyer_ata: Account<'info, TokenAccount>,
    // --- platform whitelist CPI ---
    /// PDA signer registered as the platform's program_authority.
    #[account(seeds = [b"cpi_authority"], bump)]
    pub curve_authority: SystemAccount<'info>,
    /// CHECK: address-checked; the platform program we CPI into.
    #[account(address = platform::ID)]
    pub platform_program: UncheckedAccount<'info>,
    /// CHECK: validated by the platform program (config PDA).
    pub platform_config: UncheckedAccount<'info>,
    /// CHECK: validated by the platform program (supply PDA).
    #[account(mut)]
    pub platform_supply: UncheckedAccount<'info>,
    /// CHECK: validated by the platform program (whitelist PDA for buyer).
    #[account(mut)]
    pub user_whitelist: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [b"curve", mint.key().as_ref()], bump = curve.bump, has_one = mint)]
    pub curve: Account<'info, BondingCurve>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = curve)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = seller)]
    pub seller_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Graduate<'info> {
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [b"curve", mint.key().as_ref()], bump = curve.bump, has_one = mint)]
    pub curve: Account<'info, BondingCurve>,
}

#[account]
#[derive(InitSpace)]
pub struct BondingCurve {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub sol_reserve: u64,
    pub virtual_sol: u64,
    pub token_reserve: u64,
    pub real_sol: u64,
    pub graduation_threshold: u64,
    pub graduated: bool,
    pub bump: u8,
}

#[event]
pub struct Launched {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub token_supply: u64,
    pub virtual_sol: u64,
}

#[event]
pub struct Traded {
    pub mint: Pubkey,
    pub is_buy: bool,
    pub sol: u64,
    pub tokens: u64,
    pub real_sol: u64,
}

#[event]
pub struct Graduated {
    pub mint: Pubkey,
    pub real_sol: u64,
    pub tokens_left: u64,
}

#[error_code]
pub enum CurveError {
    #[msg("amount must be greater than zero")]
    ZeroAmount,
    #[msg("arithmetic overflow")]
    MathOverflow,
    #[msg("slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("insufficient liquidity in the curve")]
    InsufficientLiquidity,
    #[msg("curve has already graduated")]
    Graduated,
    #[msg("curve has not reached the graduation threshold")]
    NotReady,
}

#[cfg(test)]
mod tests {
    use super::math::*;

    const VSOL: u64 = 30_000_000_000; // 30 SOL virtual
    const SUPPLY: u64 = 1_000_000_000_000_000; // 1B tokens @ 6 decimals

    #[test]
    fn buy_returns_tokens() {
        let out = tokens_out_for_sol(VSOL, SUPPLY, 1_000_000_000).unwrap();
        assert!(out > 0 && out < SUPPLY);
    }

    #[test]
    fn price_rises_as_supply_leaves() {
        // Same SOL buys fewer tokens once the curve has moved up.
        let first = tokens_out_for_sol(VSOL, SUPPLY, 1_000_000_000).unwrap();
        let sol2 = VSOL + 1_000_000_000;
        let tok2 = SUPPLY - first;
        let second = tokens_out_for_sol(sol2, tok2, 1_000_000_000).unwrap();
        assert!(second < first, "later buy should yield fewer tokens");
    }

    #[test]
    fn round_trip_is_loss_making() {
        // Buy then immediately sell the tokens back: you get less SOL out than in
        // (constant-product slippage) — this is what makes wash trading lose money.
        let sol_in = 5_000_000_000u64;
        let tokens = tokens_out_for_sol(VSOL, SUPPLY, sol_in).unwrap();
        let sol_reserve = VSOL + sol_in;
        let token_reserve = SUPPLY - tokens;
        let sol_back = sol_out_for_tokens(sol_reserve, token_reserve, tokens).unwrap();
        assert!(sol_back <= sol_in, "round trip must not be profitable");
    }

    #[test]
    fn k_is_preserved_within_rounding() {
        let sol_in = 2_000_000_000u64;
        let tokens = tokens_out_for_sol(VSOL, SUPPLY, sol_in).unwrap();
        let k0 = VSOL as u128 * SUPPLY as u128;
        let k1 = (VSOL + sol_in) as u128 * (SUPPLY - tokens) as u128;
        // k must not shrink (integer division rounds the buyer's payout down).
        assert!(k1 >= k0);
    }

    #[test]
    fn handles_max_magnitudes_without_overflow() {
        // The u128 intermediates absorb u64*u64, so extreme reserves return a
        // value rather than panicking or wrapping.
        let out = tokens_out_for_sol(u64::MAX, u64::MAX, u64::MAX).unwrap();
        assert!(out <= u64::MAX);
        assert!(sol_out_for_tokens(u64::MAX, u64::MAX, u64::MAX).unwrap() <= u64::MAX);
    }

    #[test]
    fn zero_in_yields_zero_out() {
        assert_eq!(tokens_out_for_sol(VSOL, SUPPLY, 0).unwrap(), 0);
        assert_eq!(sol_out_for_tokens(VSOL, SUPPLY, 0).unwrap(), 0);
    }
}
