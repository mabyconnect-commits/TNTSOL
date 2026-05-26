import type { OnChainAdapter } from "../chain/adapter";
import type { RelayerConfig } from "../config";
import type { LedgerStore } from "../ledger/store";
import { canPayRedemption, redemptionPayout } from "../solvency";
import type { RedemptionRecord, RedemptionRequest } from "../types";
import { now } from "../util";

// The devnet burn has ALREADY happened by the time we observe a redemption
// request (the user burned irreversibly on-chain). So the safe ordering is:
// mirror the burn in our counter exactly once, gate on solvency, then pay
// mainnet. A crash before payout leaves the user owed (recoverable); we never
// pay twice (idempotency key) and never burn-less-pay.
export class RedemptionProcessor {
  constructor(
    private readonly store: LedgerStore,
    private readonly adapter: OnChainAdapter,
    private readonly cfg: RelayerConfig,
  ) {}

  // tickBudgetRemaining: lamports the relayer may still pay out in the current
  // poll tick (undefined = unlimited). Passed by the watcher to enforce the
  // per-tick rate limit; a payout that exceeds it is deferred to a later tick.
  async process(req: RedemptionRequest, tickBudgetRemaining?: bigint): Promise<RedemptionRecord> {
    let rec = this.store.getRedemption(req.id);
    if (rec?.status === "PAID") return rec; // already paid

    if (!rec) {
      const payout = redemptionPayout(req.whitelistedDevnetAmount, this.cfg.redemptionRateBps);
      rec = {
        id: req.id,
        user: req.user,
        whitelistedDevnetAmount: req.whitelistedDevnetAmount,
        payoutLamports: payout,
        status: "OBSERVED",
        counterDecremented: false,
        updatedAt: now(),
      };
      await this.store.putRedemption(rec);
    }

    // Mirror the on-chain burn into our whitelisted counter exactly once.
    if (!rec.counterDecremented) {
      await this.store.subWhitelisted(rec.whitelistedDevnetAmount);
      rec = { ...rec, counterDecremented: true, updatedAt: now() };
      await this.store.putRedemption(rec);
    }

    // Per-payout cap: an unusually large single payout is held for manual /
    // multisig approval rather than auto-paid. Defense-in-depth against a
    // relayer-key compromise draining the treasury via one giant redemption.
    if (this.cfg.maxPayoutLamports > 0n && rec.payoutLamports > this.cfg.maxPayoutLamports) {
      rec = { ...rec, status: "HELD_OVER_CAP", updatedAt: now() };
      await this.store.putRedemption(rec);
      return rec; // requires raising the cap / explicit approval, then a re-drive
    }

    // Per-tick budget. If the payout exceeds even a full, fresh tick budget it
    // can never be paid by the tick mechanism, so hold it for operator action
    // (raise the tick cap) rather than deferring it forever. Otherwise it merely
    // exceeds the *remaining* budget this tick and is retried on a later tick.
    if (tickBudgetRemaining !== undefined && rec.payoutLamports > tickBudgetRemaining) {
      const exceedsFullTick =
        this.cfg.maxTickPayoutLamports > 0n && rec.payoutLamports > this.cfg.maxTickPayoutLamports;
      rec = { ...rec, status: exceedsFullTick ? "HELD_OVER_CAP" : "OBSERVED", updatedAt: now() };
      await this.store.putRedemption(rec);
      return rec;
    }

    // Solvency gate: pay only if the treasury still backs all remaining supply.
    // The mainnet treasury program is the authoritative enforcer of this; the
    // check here is defense-in-depth (and avoids a doomed mainnet round-trip).
    const treasury = await this.adapter.getTreasuryBalance();
    const whitelistedAfterBurn = this.store.getTotalWhitelisted();
    if (!canPayRedemption(treasury, whitelistedAfterBurn, rec.payoutLamports, this.cfg.redemptionRateBps)) {
      rec = { ...rec, status: "HALTED_INSOLVENT", updatedAt: now() };
      await this.store.putRedemption(rec);
      return rec; // retried later; will pay once the treasury is topped up
    }

    // Pay mainnet (idempotent).
    try {
      const res = await this.adapter.payRedemption(rec.user, rec.payoutLamports, `red:${rec.id}:payout`);
      rec = { ...rec, status: "PAID", payoutSig: res.signature, error: undefined, updatedAt: now() };
      await this.store.putRedemption(rec);
    } catch (e) {
      // Counter already decremented (burn is real); resume from OBSERVED.
      rec = { ...rec, status: "OBSERVED", error: String(e), updatedAt: now() };
      await this.store.putRedemption(rec);
    }

    return rec;
  }
}
