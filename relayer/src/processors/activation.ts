import type { OnChainAdapter } from "../chain/adapter";
import type { RelayerConfig } from "../config";
import type { LedgerStore } from "../ledger/store";
import { feeBreakdown } from "../solvency";
import type { ActivationRecord, ActivationRequest } from "../types";
import { now } from "../util";

// Fail-safe ordering across clusters: ALWAYS collect the mainnet fee before
// whitelisting on devnet. The two writes can't be atomic across clusters, so we
// pick the ordering that fails safe — if we crash between the two, the user has
// paid but isn't yet whitelisted (recoverable on retry), never the reverse
// (whitelisted without paying = a leak).
export class ActivationProcessor {
  constructor(
    private readonly store: LedgerStore,
    private readonly adapter: OnChainAdapter,
    private readonly cfg: RelayerConfig,
  ) {}

  async process(req: ActivationRequest): Promise<ActivationRecord> {
    let rec = this.store.getActivation(req.id);
    if (rec?.status === "WHITELISTED") return rec; // already done

    if (!rec) {
      const { team, treasury } = feeBreakdown(req.devnetAmount, this.cfg.activationFeeBps, this.cfg.teamSplitBps);
      rec = {
        id: req.id,
        user: req.user,
        devnetAmount: req.devnetAmount,
        feeTreasuryLamports: treasury,
        feeTeamLamports: team,
        status: "RECEIVED",
        preWhitelisted: req.preWhitelisted ?? false,
        updatedAt: now(),
      };
      await this.store.putActivation(rec);
    }

    // STEP 1 — mainnet fee first.
    if (rec.status === "RECEIVED" || rec.status === "FAILED") {
      try {
        const res = await this.adapter.collectMainnetFee(
          rec.user,
          rec.feeTreasuryLamports,
          rec.feeTeamLamports,
          `act:${rec.id}:fee`,
        );
        rec = { ...rec, status: "FEE_COLLECTED", mainnetFeeSig: res.signature, error: undefined, updatedAt: now() };
        await this.store.putActivation(rec);
      } catch (e) {
        rec = { ...rec, status: "FAILED", error: String(e), updatedAt: now() };
        await this.store.putActivation(rec);
        return rec; // fee not secured; do not touch devnet
      }
    }

    // STEP 2 — devnet whitelist only after the fee is secured.
    if (rec.status === "FEE_COLLECTED") {
      if (rec.preWhitelisted) {
        // Curve-originated: the whitelist already happened on-chain in
        // platform.program_activate (atomic with the trade). The relayer only
        // had to collect the fee; just mirror the amount into our solvency
        // counter and finish. (No chain write, so nothing to fail here.)
        await this.store.addWhitelisted(rec.devnetAmount);
        rec = { ...rec, status: "WHITELISTED", devnetWhitelistSig: "on-chain", error: undefined, updatedAt: now() };
        await this.store.putActivation(rec);
      } else {
        try {
          const res = await this.adapter.whitelistDevnet(rec.user, rec.devnetAmount, `act:${rec.id}:wl`);
          await this.store.addWhitelisted(rec.devnetAmount);
          rec = { ...rec, status: "WHITELISTED", devnetWhitelistSig: res.signature, error: undefined, updatedAt: now() };
          await this.store.putActivation(rec);
        } catch (e) {
          // Fee already collected — stay at FEE_COLLECTED so retry resumes here.
          rec = { ...rec, error: String(e), updatedAt: now() };
          await this.store.putActivation(rec);
        }
      }
    }

    return rec;
  }
}
