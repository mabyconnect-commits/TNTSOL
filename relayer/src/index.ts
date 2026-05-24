import type { OnChainAdapter } from "./chain/adapter";
import { MockAdapter } from "./chain/mockAdapter";
import { SolanaAdapter } from "./chain/solanaAdapter";
import { loadKeypair, makeConnection } from "./clusters";
import { loadConfig } from "./config";
import { LedgerStore } from "./ledger/store";
import { logger } from "./logger";
import { ActivationProcessor } from "./processors/activation";
import { RedemptionProcessor } from "./processors/redemption";
import { solvencyView } from "./solvency";
import { Watcher } from "./watcher";

async function buildAdapter(cfg: ReturnType<typeof loadConfig>): Promise<OnChainAdapter> {
  if (cfg.useMockAdapter) {
    const mock = new MockAdapter();
    if (process.env.RELAYER_DEMO === "true") seedDemo(mock);
    return mock;
  }
  const devnet = makeConnection(cfg.devnetRpcUrl);
  const mainnet = makeConnection(cfg.mainnetRpcUrl);
  const treasury = await loadKeypair(cfg.mainnetTreasuryKeypair);
  const authority = await loadKeypair(cfg.devnetAuthorityKeypair);
  return new SolanaAdapter(devnet, mainnet, treasury, authority, cfg);
}

// Seeds one activation + one redemption so `npm run demo` shows the pipeline
// end to end against the mock.
function seedDemo(mock: MockAdapter): void {
  const user = "DemoUser1111111111111111111111111111111111";
  const oneSol = 1_000_000_000n;
  mock.enqueueActivation({ id: "demo-activation-1", user, devnetAmount: 100n * oneSol });
  // This redemption only pays out once the activation above has whitelisted
  // supply and funded the treasury; otherwise it halts on solvency.
  mock.enqueueRedemption({ id: "demo-redemption-1", user, whitelistedDevnetAmount: 30n * oneSol });
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  logger.info("relayer starting", {
    useMockAdapter: cfg.useMockAdapter,
    activationFeeBps: cfg.activationFeeBps,
    redemptionRateBps: cfg.redemptionRateBps,
    teamSplitBps: cfg.teamSplitBps,
  });

  const store = await LedgerStore.open(cfg.ledgerPath);
  const adapter = await buildAdapter(cfg);
  const activation = new ActivationProcessor(store, adapter, cfg);
  const redemption = new RedemptionProcessor(store, adapter, cfg);
  const watcher = new Watcher(adapter, store, activation, redemption, cfg);

  const ac = new AbortController();
  const shutdown = (sig: string) => {
    logger.info("shutting down", { signal: sig });
    watcher.stop();
    ac.abort();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await watcher.start(ac.signal);

  const treasury = await adapter.getTreasuryBalance();
  const view = solvencyView(treasury, store.getTotalWhitelisted(), cfg.redemptionRateBps);
  logger.info("relayer stopped", { ...view });
}

main().catch((e) => {
  logger.error("fatal", { error: String(e) });
  process.exit(1);
});
