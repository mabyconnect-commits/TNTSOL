import type { OnChainAdapter } from "./chain/adapter";
import type { RelayerConfig } from "./config";
import type { LedgerStore } from "./ledger/store";
import { logger } from "./logger";
import type { ActivationProcessor } from "./processors/activation";
import type { RedemptionProcessor } from "./processors/redemption";
import type { RedemptionRecord } from "./types";
import { sleep } from "./util";

// Polls both clusters for new requests and drives them through the processors,
// then reconciles any record left unfinished by a crash, a deferral, or a
// solvency halt. Processing is sequential so the solvency counter stays
// consistent. A per-tick payout budget rate-limits how much real SOL can leave
// the treasury in a single tick (mirroring the on-chain rate limit).
export class Watcher {
  private running = false;

  constructor(
    private readonly adapter: OnChainAdapter,
    private readonly store: LedgerStore,
    private readonly activation: ActivationProcessor,
    private readonly redemption: RedemptionProcessor,
    private readonly cfg: RelayerConfig,
  ) {}

  async tick(): Promise<void> {
    const unlimited = this.cfg.maxTickPayoutLamports === 0n;
    let budget = this.cfg.maxTickPayoutLamports;
    const remaining = (): bigint | undefined => (unlimited ? undefined : budget);
    const charge = (rec: RedemptionRecord): void => {
      if (!unlimited && rec.status === "PAID") budget -= rec.payoutLamports;
    };
    const handledRedemptions = new Set<string>();

    // --- activations: new from the queue, then reconcile unfinished ---
    const acts = await this.adapter.pollActivationRequests(this.store.getCursor("activation"));
    for (const req of acts.requests) {
      const rec = await this.activation.process(req);
      logger.info("activation processed", { id: rec.id, status: rec.status });
    }
    if (acts.cursor !== null) await this.store.setCursor("activation", acts.cursor);
    for (const rec of this.store.listActivations()) {
      if (rec.status !== "WHITELISTED") {
        await this.activation.process({ id: rec.id, user: rec.user, devnetAmount: rec.devnetAmount });
      }
    }

    // --- redemptions: new from the queue, then reconcile, sharing one budget ---
    const reds = await this.adapter.pollRedemptionRequests(this.store.getCursor("redemption"));
    for (const req of reds.requests) {
      const rec = await this.redemption.process(req, remaining());
      charge(rec);
      handledRedemptions.add(rec.id);
      logger.info("redemption processed", { id: rec.id, status: rec.status });
    }
    if (reds.cursor !== null) await this.store.setCursor("redemption", reds.cursor);
    for (const rec of this.store.listRedemptions()) {
      if (handledRedemptions.has(rec.id)) continue;
      // Retry only states that can make progress without operator action. A
      // HELD_OVER_CAP record needs an explicit cap change + re-drive, so skip it.
      if (rec.status === "OBSERVED" || rec.status === "HALTED_INSOLVENT") {
        const updated = await this.redemption.process(
          { id: rec.id, user: rec.user, whitelistedDevnetAmount: rec.whitelistedDevnetAmount },
          remaining(),
        );
        charge(updated);
      }
    }
  }

  async start(signal: AbortSignal): Promise<void> {
    this.running = true;
    const pendingActs = this.store.listActivations().filter((r) => r.status !== "WHITELISTED").length;
    const pendingReds = this.store.listRedemptions().filter((r) => r.status !== "PAID").length;
    if (pendingActs > 0 || pendingReds > 0) {
      logger.info("resuming with unfinished work", { pendingActs, pendingReds });
    }
    while (this.running && !signal.aborted) {
      try {
        await this.tick();
      } catch (e) {
        logger.error("tick failed", { error: String(e) });
      }
      await sleep(this.cfg.pollIntervalMs, signal);
    }
  }

  stop(): void {
    this.running = false;
  }
}
