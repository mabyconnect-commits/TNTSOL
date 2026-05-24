import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { MockAdapter } from "../src/chain/mockAdapter";
import { loadConfig } from "../src/config";
import { LedgerStore } from "../src/ledger/store";
import { ActivationProcessor } from "../src/processors/activation";
import { RedemptionProcessor } from "../src/processors/redemption";
import { redemptionPayout } from "../src/solvency";
import { Watcher } from "../src/watcher";

const SOL = 1_000_000_000n;

async function tmpStore(): Promise<{ store: LedgerStore; cleanup: () => Promise<void> }> {
  const file = path.join(os.tmpdir(), `relayer-test-${Math.random().toString(36).slice(2)}.json`);
  const store = await LedgerStore.open(file);
  return {
    store,
    cleanup: async () => {
      await fs.rm(file, { force: true });
      await fs.rm(`${file}.tmp`, { force: true });
    },
  };
}

test("watcher: per-tick payout cap pays one redemption now and defers the rest to the next tick", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const base = loadConfig({});
    const onePayout = redemptionPayout(30n * SOL, base.redemptionRateBps);
    // Budget fits exactly one 30-SOL redemption per tick.
    const cfg = loadConfig({ MAX_TICK_PAYOUT_LAMPORTS: onePayout.toString() });

    const adapter = new MockAdapter();
    const activation = new ActivationProcessor(store, adapter, cfg);
    const redemption = new RedemptionProcessor(store, adapter, cfg);
    const watcher = new Watcher(adapter, store, activation, redemption, cfg);

    // Fund treasury + whitelist via a 200-SOL activation.
    await activation.process({ id: "seed", user: "U", devnetAmount: 200n * SOL });

    adapter.enqueueRedemption({ id: "w1", user: "U", whitelistedDevnetAmount: 30n * SOL });
    adapter.enqueueRedemption({ id: "w2", user: "U", whitelistedDevnetAmount: 30n * SOL });

    await watcher.tick();
    let paid = store.listRedemptions().filter((r) => r.status === "PAID").length;
    assert.equal(paid, 1, "only one payout should clear under the tick budget");

    await watcher.tick();
    paid = store.listRedemptions().filter((r) => r.status === "PAID").length;
    assert.equal(paid, 2, "the deferred payout clears on the next tick");
    assert.equal(store.getTotalWhitelisted(), 140n * SOL); // 200 - 30 - 30
  } finally {
    await cleanup();
  }
});
