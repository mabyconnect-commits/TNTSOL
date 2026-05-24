use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

const BPS_DENOM: u128 = 10_000;

// Mainnet treasury program. Custodies the reserve vault, collects activation
// fees, and pays redemptions gated by D1 (per-payout + windowed rate caps) and
// D2 (solvency vs. the latest attested devnet-supply snapshot).
// See ../../../relayer/ONCHAIN_SPEC.md §3.1 / §4.1 / §5.
#[program]
pub mod treasury {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, args: ConfigArgs) -> Result<()> {
        validate_params(&args)?;

        let c = &mut ctx.accounts.config;
        c.authority = args.authority;
        c.activation_fee_bps = args.activation_fee_bps;
        c.redemption_rate_bps = args.redemption_rate_bps;
        c.team_split_bps = args.team_split_bps;
        c.team_wallet = args.team_wallet;
        c.max_payout_lamports = args.max_payout_lamports;
        c.window_payout_cap_lamports = args.window_payout_cap_lamports;
        c.window_slots = args.window_slots;
        c.attester_set = args.attester_set;
        c.attester_threshold = args.attester_threshold;
        c.max_snapshot_staleness_slots = args.max_snapshot_staleness_slots;
        c.max_supply_increase_per_snapshot = args.max_supply_increase_per_snapshot;
        c.bump = ctx.bumps.config;

        let s = &mut ctx.accounts.snapshot;
        s.seq = 0;
        s.total_whitelisted = 0;
        s.as_of_slot = 0; // forces a fresh snapshot before any redemption can pass freshness
        s.as_of_unix = 0;
        s.posted_by = Pubkey::default();
        s.bump = ctx.bumps.snapshot;

        let w = &mut ctx.accounts.window;
        w.window_start_slot = Clock::get()?.slot;
        w.paid_in_window_lamports = 0;
        w.bump = ctx.bumps.window;
        Ok(())
    }

    // Authority (multisig) may retune economic params; the D3 buffer and attester
    // threshold are re-validated.
    pub fn update_config(ctx: Context<UpdateConfig>, args: ConfigArgs) -> Result<()> {
        validate_params(&args)?;
        let c = &mut ctx.accounts.config;
        c.authority = args.authority;
        c.activation_fee_bps = args.activation_fee_bps;
        c.redemption_rate_bps = args.redemption_rate_bps;
        c.team_split_bps = args.team_split_bps;
        c.team_wallet = args.team_wallet;
        c.max_payout_lamports = args.max_payout_lamports;
        c.window_payout_cap_lamports = args.window_payout_cap_lamports;
        c.window_slots = args.window_slots;
        c.attester_set = args.attester_set;
        c.attester_threshold = args.attester_threshold;
        c.max_snapshot_staleness_slots = args.max_snapshot_staleness_slots;
        c.max_supply_increase_per_snapshot = args.max_supply_increase_per_snapshot;
        Ok(())
    }

    pub fn collect_activation_fee(ctx: Context<CollectFee>, _activation_id: String, amount: u64) -> Result<()> {
        require!(amount > 0, TreasuryError::ZeroAmount);
        let c = &ctx.accounts.config;

        let fee = (amount as u128) * (c.activation_fee_bps as u128) / BPS_DENOM;
        let team = fee * (c.team_split_bps as u128) / BPS_DENOM;
        let to_treasury = fee - team;
        let team = u64::try_from(team).map_err(|_| TreasuryError::Overflow)?;
        let to_treasury = u64::try_from(to_treasury).map_err(|_| TreasuryError::Overflow)?;

        if team > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.team_wallet.to_account_info(),
                    },
                ),
                team,
            )?;
        }
        if to_treasury > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                    },
                ),
                to_treasury,
            )?;
        }

        let r = &mut ctx.accounts.receipt;
        r.activation_id = _activation_id;
        r.payer = ctx.accounts.payer.key();
        r.fee_lamports = u64::try_from(fee).map_err(|_| TreasuryError::Overflow)?;
        r.bump = ctx.bumps.receipt;

        emit!(FeeCollected {
            payer: r.payer,
            fee_lamports: r.fee_lamports,
            to_treasury,
            to_team: team,
        });
        Ok(())
    }

    // The authoritative D1 + D2 gate. Idempotent on redemption_id via the receipt
    // PDA (replay => init fails => already paid).
    pub fn pay_redemption(ctx: Context<PayRedemption>, redemption_id: String, whitelisted_amount: u64) -> Result<()> {
        require!(whitelisted_amount > 0, TreasuryError::ZeroAmount);
        let c = &ctx.accounts.config;
        let now = Clock::get()?.slot;

        let payout = u64::try_from((whitelisted_amount as u128) * (c.redemption_rate_bps as u128) / BPS_DENOM)
            .map_err(|_| TreasuryError::Overflow)?;

        // D1 — per-payout cap (0 = unlimited).
        if c.max_payout_lamports > 0 {
            require!(payout <= c.max_payout_lamports, TreasuryError::OverPayoutCap);
        }

        // D1 — windowed rate cap. Roll the window first.
        let w = &mut ctx.accounts.window;
        if now.saturating_sub(w.window_start_slot) >= c.window_slots {
            w.window_start_slot = now;
            w.paid_in_window_lamports = 0;
        }
        if c.window_payout_cap_lamports > 0 {
            let after = w
                .paid_in_window_lamports
                .checked_add(payout)
                .ok_or(TreasuryError::Overflow)?;
            require!(after <= c.window_payout_cap_lamports, TreasuryError::OverWindowCap);
        }

        // D2 — snapshot freshness (stale => halt, the safe failure).
        let snap = &ctx.accounts.snapshot;
        require!(
            now.saturating_sub(snap.as_of_slot) <= c.max_snapshot_staleness_slots,
            TreasuryError::StaleSnapshot
        );

        // D2 — solvency: the vault must still back every remaining whitelisted
        // unit after this payout. remaining = attested_supply - this redemption.
        let vault_after = ctx
            .accounts
            .vault
            .lamports()
            .checked_sub(payout)
            .ok_or(TreasuryError::InsufficientVault)?;
        let remaining_supply = snap.total_whitelisted.saturating_sub(whitelisted_amount);
        let required = (remaining_supply as u128) * (c.redemption_rate_bps as u128) / BPS_DENOM;
        require!((vault_after as u128) >= required, TreasuryError::WouldBreakSolvency);

        // Pay out from the vault PDA.
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault", &[ctx.bumps.vault]]];
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                },
                signer_seeds,
            ),
            payout,
        )?;

        w.paid_in_window_lamports = w.paid_in_window_lamports.saturating_add(payout);

        let r = &mut ctx.accounts.receipt;
        r.redemption_id = redemption_id.clone();
        r.user = ctx.accounts.user.key();
        r.payout_lamports = payout;
        r.paid_slot = now;
        r.bump = ctx.bumps.receipt;

        emit!(RedemptionPaid {
            redemption_id,
            user: r.user,
            payout_lamports: payout,
        });
        Ok(())
    }

    // R1 — accept an attested devnet-supply snapshot. Co-signed by >= threshold
    // members of attester_set, passed as remaining_accounts. Guards: monotonic
    // seq, strictly newer slot, bounded per-update increase.
    pub fn post_supply_snapshot(
        ctx: Context<PostSnapshot>,
        seq: u64,
        total_whitelisted: u64,
        as_of_slot: u64,
        as_of_unix: i64,
    ) -> Result<()> {
        let c = &ctx.accounts.config;
        let snap = &mut ctx.accounts.snapshot;

        require!(seq == snap.seq + 1, TreasuryError::BadSeq);
        require!(as_of_slot > snap.as_of_slot, TreasuryError::StaleUpdate);
        require!(
            total_whitelisted <= snap.total_whitelisted.saturating_add(c.max_supply_increase_per_snapshot),
            TreasuryError::SupplyIncreaseTooLarge
        );

        // Count distinct attester-set signers among the provided accounts.
        let mut counted: Vec<Pubkey> = Vec::new();
        for ai in ctx.remaining_accounts.iter() {
            if ai.is_signer && c.attester_set.contains(ai.key) && !counted.contains(ai.key) {
                counted.push(*ai.key);
            }
        }
        require!(
            counted.len() as u8 >= c.attester_threshold,
            TreasuryError::NotEnoughAttesters
        );

        snap.seq = seq;
        snap.total_whitelisted = total_whitelisted;
        snap.as_of_slot = as_of_slot;
        snap.as_of_unix = as_of_unix;
        snap.posted_by = ctx.accounts.submitter.key();

        emit!(SnapshotPosted {
            seq,
            total_whitelisted,
            as_of_slot,
        });
        Ok(())
    }

    // Authority may withdraw only the surplus above the required reserve.
    pub fn withdraw_surplus(ctx: Context<WithdrawSurplus>, lamports: u64) -> Result<()> {
        let c = &ctx.accounts.config;
        let snap = &ctx.accounts.snapshot;
        let required = (snap.total_whitelisted as u128) * (c.redemption_rate_bps as u128) / BPS_DENOM;
        let vault_after = ctx
            .accounts
            .vault
            .lamports()
            .checked_sub(lamports)
            .ok_or(TreasuryError::InsufficientVault)?;
        require!((vault_after as u128) >= required, TreasuryError::WouldBreakSolvency);

        let signer_seeds: &[&[&[u8]]] = &[&[b"vault", &[ctx.bumps.vault]]];
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                },
                signer_seeds,
            ),
            lamports,
        )?;
        Ok(())
    }
}

fn validate_params(args: &ConfigArgs) -> Result<()> {
    require!(args.team_split_bps <= 10_000, TreasuryError::BadParams);
    require!(args.redemption_rate_bps < args.activation_fee_bps, TreasuryError::BadParams);
    // D3 strict reserve buffer: treasury-kept bps must exceed the redemption rate.
    let kept = (args.activation_fee_bps as u128) * (10_000 - args.team_split_bps as u128) / BPS_DENOM;
    require!(kept > args.redemption_rate_bps as u128, TreasuryError::NoReserveBuffer);
    require!(
        args.attester_threshold > 0 && (args.attester_threshold as usize) <= args.attester_set.len(),
        TreasuryError::BadParams
    );
    // A payout allowed by the per-payout cap must fit a full window (else it can
    // never be paid) — mirrors the relayer config guard.
    if args.window_payout_cap_lamports > 0 && args.max_payout_lamports > 0 {
        require!(
            args.window_payout_cap_lamports >= args.max_payout_lamports,
            TreasuryError::BadParams
        );
    }
    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ConfigArgs {
    pub authority: Pubkey,
    pub activation_fee_bps: u16,
    pub redemption_rate_bps: u16,
    pub team_split_bps: u16,
    pub team_wallet: Pubkey,
    pub max_payout_lamports: u64,
    pub window_payout_cap_lamports: u64,
    pub window_slots: u64,
    pub attester_set: Vec<Pubkey>,
    pub attester_threshold: u8,
    pub max_snapshot_staleness_slots: u64,
    pub max_supply_increase_per_snapshot: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + Config::INIT_SPACE, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(init, payer = payer, space = 8 + SupplySnapshot::INIT_SPACE, seeds = [b"supply"], bump)]
    pub snapshot: Account<'info, SupplySnapshot>,
    #[account(init, payer = payer, space = 8 + PayoutWindow::INIT_SPACE, seeds = [b"window"], bump)]
    pub window: Account<'info, PayoutWindow>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = authority @ TreasuryError::Unauthorized)]
    pub config: Account<'info, Config>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(activation_id: String)]
pub struct CollectFee<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: SystemAccount<'info>,
    /// CHECK: must equal config.team_wallet; receives the team fee slice.
    #[account(mut, address = config.team_wallet @ TreasuryError::WrongTeamWallet)]
    pub team_wallet: UncheckedAccount<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + FeeReceipt::INIT_SPACE,
        seeds = [b"fee", activation_id.as_bytes()],
        bump
    )]
    pub receipt: Account<'info, FeeReceipt>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(redemption_id: String)]
pub struct PayRedemption<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: SystemAccount<'info>,
    #[account(seeds = [b"supply"], bump = snapshot.bump)]
    pub snapshot: Account<'info, SupplySnapshot>,
    #[account(mut, seeds = [b"window"], bump = window.bump)]
    pub window: Account<'info, PayoutWindow>,
    #[account(
        init,
        payer = relayer,
        space = 8 + RedemptionReceipt::INIT_SPACE,
        seeds = [b"redeem", redemption_id.as_bytes()],
        bump
    )]
    pub receipt: Account<'info, RedemptionReceipt>,
    /// CHECK: redemption beneficiary; receives the payout.
    #[account(mut)]
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub relayer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PostSnapshot<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"supply"], bump = snapshot.bump)]
    pub snapshot: Account<'info, SupplySnapshot>,
    pub submitter: Signer<'info>,
    // >= attester_threshold members of config.attester_set are passed as
    // additional signer accounts in remaining_accounts.
}

#[derive(Accounts)]
pub struct WithdrawSurplus<'info> {
    #[account(seeds = [b"config"], bump = config.bump, has_one = authority @ TreasuryError::Unauthorized)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: SystemAccount<'info>,
    #[account(seeds = [b"supply"], bump = snapshot.bump)]
    pub snapshot: Account<'info, SupplySnapshot>,
    pub authority: Signer<'info>,
    /// CHECK: surplus destination chosen by the authority.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
    pub activation_fee_bps: u16,
    pub redemption_rate_bps: u16,
    pub team_split_bps: u16,
    pub team_wallet: Pubkey,
    pub max_payout_lamports: u64,
    pub window_payout_cap_lamports: u64,
    pub window_slots: u64,
    #[max_len(8)]
    pub attester_set: Vec<Pubkey>,
    pub attester_threshold: u8,
    pub max_snapshot_staleness_slots: u64,
    pub max_supply_increase_per_snapshot: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct SupplySnapshot {
    pub seq: u64,
    pub total_whitelisted: u64,
    pub as_of_slot: u64,
    pub as_of_unix: i64,
    pub posted_by: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PayoutWindow {
    pub window_start_slot: u64,
    pub paid_in_window_lamports: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct FeeReceipt {
    #[max_len(88)]
    pub activation_id: String,
    pub payer: Pubkey,
    pub fee_lamports: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct RedemptionReceipt {
    #[max_len(88)]
    pub redemption_id: String,
    pub user: Pubkey,
    pub payout_lamports: u64,
    pub paid_slot: u64,
    pub bump: u8,
}

#[event]
pub struct FeeCollected {
    pub payer: Pubkey,
    pub fee_lamports: u64,
    pub to_treasury: u64,
    pub to_team: u64,
}

#[event]
pub struct RedemptionPaid {
    pub redemption_id: String,
    pub user: Pubkey,
    pub payout_lamports: u64,
}

#[event]
pub struct SnapshotPosted {
    pub seq: u64,
    pub total_whitelisted: u64,
    pub as_of_slot: u64,
}

#[error_code]
pub enum TreasuryError {
    #[msg("amount must be greater than zero")]
    ZeroAmount,
    #[msg("arithmetic overflow")]
    Overflow,
    #[msg("not authorized")]
    Unauthorized,
    #[msg("invalid configuration parameters")]
    BadParams,
    #[msg("config has no strictly positive reserve buffer")]
    NoReserveBuffer,
    #[msg("team wallet does not match config")]
    WrongTeamWallet,
    #[msg("payout exceeds the per-payout cap")]
    OverPayoutCap,
    #[msg("payout exceeds the per-window cap")]
    OverWindowCap,
    #[msg("supply snapshot is stale")]
    StaleSnapshot,
    #[msg("vault has insufficient lamports")]
    InsufficientVault,
    #[msg("payout would break solvency")]
    WouldBreakSolvency,
    #[msg("snapshot seq must increment by one")]
    BadSeq,
    #[msg("snapshot slot must be strictly newer")]
    StaleUpdate,
    #[msg("supply increase exceeds the per-snapshot bound")]
    SupplyIncreaseTooLarge,
    #[msg("not enough attesters signed")]
    NotEnoughAttesters,
}
