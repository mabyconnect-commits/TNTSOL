import type { OnChainAdapter } from "./chain/adapter";
import type { RelayerConfig } from "./config";
import type { LedgerStore } from "./ledger/store";
import { logger } from "./logger";
import type { ActivationProcessor } from "./processors/activation";
import type { RedemptionProcessor } from "./processors/redemption";
import { sleep } from "./util";

// Polls both clusters for new activation/redemption requests and drives them
// through the processors. Processing is sequential so the solvency counter
// stays consistent. On startup, recover() re-drives any record left unfinished
// by a previous crash before new polling begins.
export class Watcher {
  private running = false;

  constructor(
    private readonly adapter: OnChainAdapter,
    private readonly store: LedgerStore,
    private readonly activation: ActivationProcessor,
    private readonly redemption: RedemptionProcessor,
    private readonly cfg: RelayerConfig,
  ) {}

  async recover(): Promise<void> {
    for (const rec of this.store.listActivations()) {
      if (rec.status !== "WHITELISTED") {
        logger.info("recovering activation", { id: rec.id, status: rec.status });
        await this.activation.process({ id: rec.id, user: rec.user, devnetAmount: rec.devnetAmount });
      }
    }
    for (const rec of this.store.listRedemptions()) {
      if (rec.status !== "PAID") {
        logger.info("recovering redemption", { id: rec.id, status: rec.status });
        await this.redemption.process({
          id: rec.id,
          user: rec.user,
          whitelistedDevnetAmount: rec.whitelistedDevnetAmount,
        });
      }
    }
  }

  async tick(): Promise<void> {
    const acts = await this.adapter.pollActivationRequests(this.store.getCursor("activation"));
    for (const req of acts.requests) {
      const rec = await this.activation.process(req);
      logger.info("activation processed", { id: rec.id, status: rec.status });
    }
    if (acts.cursor !== null) await this.store.setCursor("activation", acts.cursor);

    const reds = await this.adapter.pollRedemptionRequests(this.store.getCursor("redemption"));
    for (const req of reds.requests) {
      const rec = await this.redemption.process(req);
      logger.info("redemption processed", { id: rec.id, status: rec.status });
    }
    if (reds.cursor !== null) await this.store.setCursor("redemption", reds.cursor);
  }

  async start(signal: AbortSignal): Promise<void> {
    this.running = true;
    await this.recover();
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
