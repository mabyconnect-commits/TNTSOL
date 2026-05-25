use anchor_lang::prelude::*;

declare_id!("E2DwHR9UdVgcdAZ4TpkjUY65x8s5qJ6TLHDh1n8gChAo");

// Devnet platform program. Source of truth for `total_whitelisted`: grants
// whitelist on activation (I1) and burns on redemption (I2). The burn receipt
// is the artifact the relayer observes to drive a mainnet payout.
// See ../../../relayer/ONCHAIN_SPEC.md §3.2 / §4.2.
#[program]
pub mod platform {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        whitelist_authority: Pubkey,
        program_authority: Pubkey,
        activation_fee_bps: u16,
        require_fee_proof: bool,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.whitelist_authority = whitelist_authority;
        cfg.program_authority = program_authority;
        cfg.activation_fee_bps = activation_fee_bps;
        cfg.require_fee_proof = require_fee_proof;
        cfg.bump = ctx.bumps.config;

        let supply = &mut ctx.accounts.supply;
        supply.total_whitelisted = 0;
        supply.last_update_slot = Clock::get()?.slot;
        supply.bump = ctx.bumps.supply;
        Ok(())
    }

    // I1: only the relayer authority can grant whitelist. Idempotent on
    // activation_id via the per-id seed on `grant_receipt` (replay => the init
    // fails, which the relayer treats as an already-applied no-op).
    pub fn grant_whitelist(ctx: Context<GrantWhitelist>, _activation_id: String, amount: u64) -> Result<()> {
        require!(amount > 0, PlatformError::ZeroAmount);
        // NOTE: when `require_fee_proof` is set, a proof that the mainnet fee for
        // this activation_id was collected must be verified here before granting
        // (ONCHAIN_SPEC §7, fee-proof for I1). Left as a documented TODO.

        let wl = &mut ctx.accounts.whitelist;
        if wl.user == Pubkey::default() {
            wl.user = ctx.accounts.user.key();
            wl.bump = ctx.bumps.whitelist;
        }
        wl.whitelisted = wl.whitelisted.checked_add(amount).ok_or(PlatformError::Overflow)?;

        let supply = &mut ctx.accounts.supply;
        supply.total_whitelisted = supply
            .total_whitelisted
            .checked_add(amount)
            .ok_or(PlatformError::Overflow)?;
        supply.last_update_slot = Clock::get()?.slot;

        let receipt = &mut ctx.accounts.grant_receipt;
        receipt.activation_id = _activation_id;
        receipt.user = wl.user;
        receipt.amount = amount;
        receipt.bump = ctx.bumps.grant_receipt;

        emit!(WhitelistGranted {
            user: wl.user,
            amount,
            total_whitelisted: supply.total_whitelisted,
        });
        Ok(())
    }

    // I2: user-initiated burn. Decrements supply and writes a BurnReceipt the
    // relayer polls. The burn is irreversible and must precede any payout.
    pub fn burn_for_redemption(ctx: Context<BurnForRedemption>, redemption_id: String, amount: u64) -> Result<()> {
        require!(amount > 0, PlatformError::ZeroAmount);

        let wl = &mut ctx.accounts.whitelist;
        require!(wl.whitelisted >= amount, PlatformError::InsufficientWhitelist);
        wl.whitelisted -= amount;

        let supply = &mut ctx.accounts.supply;
        supply.total_whitelisted = supply
            .total_whitelisted
            .checked_sub(amount)
            .ok_or(PlatformError::Overflow)?;
        let now = Clock::get()?.slot;
        supply.last_update_slot = now;

        let receipt = &mut ctx.accounts.receipt;
        receipt.redemption_id = redemption_id.clone();
        receipt.user = ctx.accounts.user.key();
        receipt.amount = amount;
        receipt.burn_slot = now;
        receipt.bump = ctx.bumps.receipt;

        emit!(BurnedForRedemption {
            redemption_id,
            user: receipt.user,
            amount,
            total_whitelisted: supply.total_whitelisted,
        });
        Ok(())
    }

    // Records freely-obtained devSOL (faucet / P2P) into the caller's blacklisted
    // bucket. Self-served stand-in for the deposit/transfer-hook inflow.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, PlatformError::ZeroAmount);
        let wl = &mut ctx.accounts.whitelist;
        if wl.user == Pubkey::default() {
            wl.user = ctx.accounts.user.key();
            wl.bump = ctx.bumps.whitelist;
        }
        wl.blacklisted = wl.blacklisted.checked_add(amount).ok_or(PlatformError::Overflow)?;
        Ok(())
    }

    // Program-driven activation: an authorized sibling program (the bonding-curve
    // AMM) reports a trade of `trade_amount` devSOL via CPI, signing as
    // `program_authority`. The user's whitelisted devSOL covers the trade fee-free;
    // only the remainder pulled from the blacklisted bucket is activated (moved to
    // whitelisted, counted into total_whitelisted) and owes the 1% activation fee.
    // The fee is paid in mainnet SOL by the relayer (cross-network), so it's
    // emitted here as `fee_owed_mainnet` rather than charged on-chain.
    pub fn program_activate(ctx: Context<ProgramActivate>, trade_amount: u64) -> Result<()> {
        require!(trade_amount > 0, PlatformError::ZeroAmount);
        let fee_bps = ctx.accounts.config.activation_fee_bps as u128;

        let wl = &mut ctx.accounts.whitelist;
        if wl.user == Pubkey::default() {
            wl.user = ctx.accounts.user.key();
            wl.bump = ctx.bumps.whitelist;
        }
        let from_blacklist = trade_amount.saturating_sub(wl.whitelisted);
        require!(from_blacklist <= wl.blacklisted, PlatformError::InsufficientFunds);
        wl.blacklisted -= from_blacklist;
        wl.whitelisted = wl.whitelisted.checked_add(from_blacklist).ok_or(PlatformError::Overflow)?;
        let user = wl.user;

        let supply = &mut ctx.accounts.supply;
        supply.total_whitelisted = supply
            .total_whitelisted
            .checked_add(from_blacklist)
            .ok_or(PlatformError::Overflow)?;
        supply.last_update_slot = Clock::get()?.slot;
        let total = supply.total_whitelisted;

        let fee_owed = ((from_blacklist as u128).checked_mul(fee_bps).ok_or(PlatformError::Overflow)? / 10_000) as u64;

        emit!(Activated {
            user,
            trade_amount,
            activated: from_blacklist,
            fee_owed_mainnet: fee_owed,
            total_whitelisted: total,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + Config::INIT_SPACE, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(init, payer = payer, space = 8 + SupplyState::INIT_SPACE, seeds = [b"supply"], bump)]
    pub supply: Account<'info, SupplyState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(activation_id: String)]
pub struct GrantWhitelist<'info> {
    #[account(seeds = [b"config"], bump = config.bump, has_one = whitelist_authority @ PlatformError::Unauthorized)]
    pub config: Account<'info, Config>,
    pub whitelist_authority: Signer<'info>,
    /// CHECK: only used as a key and as a PDA seed for the whitelist balance.
    pub user: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + WhitelistBalance::INIT_SPACE,
        seeds = [b"wl", user.key().as_ref()],
        bump
    )]
    pub whitelist: Account<'info, WhitelistBalance>,
    #[account(mut, seeds = [b"supply"], bump = supply.bump)]
    pub supply: Account<'info, SupplyState>,
    #[account(
        init,
        payer = payer,
        space = 8 + GrantReceipt::INIT_SPACE,
        seeds = [b"grant", activation_id.as_bytes()],
        bump
    )]
    pub grant_receipt: Account<'info, GrantReceipt>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(redemption_id: String)]
pub struct BurnForRedemption<'info> {
    #[account(mut, seeds = [b"wl", user.key().as_ref()], bump = whitelist.bump, has_one = user @ PlatformError::Unauthorized)]
    pub whitelist: Account<'info, WhitelistBalance>,
    #[account(mut, seeds = [b"supply"], bump = supply.bump)]
    pub supply: Account<'info, SupplyState>,
    #[account(
        init,
        payer = user,
        space = 8 + BurnReceipt::INIT_SPACE,
        seeds = [b"burn", redemption_id.as_bytes()],
        bump
    )]
    pub receipt: Account<'info, BurnReceipt>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + WhitelistBalance::INIT_SPACE,
        seeds = [b"wl", user.key().as_ref()],
        bump
    )]
    pub whitelist: Account<'info, WhitelistBalance>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProgramActivate<'info> {
    #[account(seeds = [b"config"], bump = config.bump, has_one = program_authority @ PlatformError::Unauthorized)]
    pub config: Account<'info, Config>,
    pub program_authority: Signer<'info>,
    /// CHECK: only used as a key and as a PDA seed for the whitelist balance.
    pub user: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + WhitelistBalance::INIT_SPACE,
        seeds = [b"wl", user.key().as_ref()],
        bump
    )]
    pub whitelist: Account<'info, WhitelistBalance>,
    #[account(mut, seeds = [b"supply"], bump = supply.bump)]
    pub supply: Account<'info, SupplyState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub whitelist_authority: Pubkey,
    pub program_authority: Pubkey,
    pub activation_fee_bps: u16,
    pub require_fee_proof: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct SupplyState {
    pub total_whitelisted: u64,
    pub last_update_slot: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct WhitelistBalance {
    pub user: Pubkey,
    pub whitelisted: u64,
    pub blacklisted: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct GrantReceipt {
    #[max_len(88)]
    pub activation_id: String,
    pub user: Pubkey,
    pub amount: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BurnReceipt {
    #[max_len(88)]
    pub redemption_id: String,
    pub user: Pubkey,
    pub amount: u64,
    pub burn_slot: u64,
    pub bump: u8,
}

#[event]
pub struct WhitelistGranted {
    pub user: Pubkey,
    pub amount: u64,
    pub total_whitelisted: u64,
}

#[event]
pub struct Activated {
    pub user: Pubkey,
    pub trade_amount: u64,
    pub activated: u64,
    pub fee_owed_mainnet: u64,
    pub total_whitelisted: u64,
}

#[event]
pub struct BurnedForRedemption {
    pub redemption_id: String,
    pub user: Pubkey,
    pub amount: u64,
    pub total_whitelisted: u64,
}

#[error_code]
pub enum PlatformError {
    #[msg("amount must be greater than zero")]
    ZeroAmount,
    #[msg("arithmetic overflow")]
    Overflow,
    #[msg("not authorized")]
    Unauthorized,
    #[msg("insufficient whitelist balance")]
    InsufficientWhitelist,
    #[msg("insufficient funds: trade exceeds whitelisted + blacklisted balance")]
    InsufficientFunds,
}
