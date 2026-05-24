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

  async process(req: RedemptionRequest): Promise<RedemptionRecord> {
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

    // Solvency gate: pay only if the treasury still backs all remaining supply.
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
