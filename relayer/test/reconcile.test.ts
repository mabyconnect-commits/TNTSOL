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
import { reconcile } from "../src/watcher";

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

test("reconcile: reports solvency and classifies a deferred/failed redemption as pending", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    const activation = new ActivationProcessor(store, adapter, cfg);
    const redemption = new RedemptionProcessor(store, adapter, cfg);

    await activation.process({ id: "a1", user: "U", devnetAmount: 100n * SOL });
    await redemption.process({ id: "r-paid", user: "U", whitelistedDevnetAmount: 30n * SOL });
    adapter.failNextPayout = true;
    const pending = await redemption.process({ id: "r-pending", user: "U", whitelistedDevnetAmount: 30n * SOL });
    assert.equal(pending.status, "OBSERVED"); // payout failed -> awaiting retry

    const report = await reconcile(store, adapter, cfg);

    assert.equal(report.solvent, true);
    assert.ok(report.reserveBuffer >= 0n);
    assert.equal(report.totalWhitelistedDevnet, 40n * SOL); // 100 - 30 - 30 (both burns mirrored)
    assert.equal(report.pendingActivations, 0);
    assert.equal(report.pendingRedemptions, 1);
    assert.equal(report.heldRedemptions, 0);
    assert.equal(report.haltedRedemptions, 0);
  } finally {
    await cleanup();
  }
});

test("reconcile: surfaces under-reservation and held-over-cap redemptions", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({ MAX_PAYOUT_LAMPORTS: "100000000" }); // 0.1 SOL cap
    const activation = new ActivationProcessor(store, adapter, cfg);
    const redemption = new RedemptionProcessor(store, adapter, cfg);

    await activation.process({ id: "a1", user: "U", devnetAmount: 100n * SOL });
    const held = await redemption.process({ id: "r-big", user: "U", whitelistedDevnetAmount: 30n * SOL });
    assert.equal(held.status, "HELD_OVER_CAP");

    adapter.setTreasury(0n); // simulate an external treasury drain

    const report = await reconcile(store, adapter, cfg);

    assert.equal(report.solvent, false);
    assert.ok(report.reserveBuffer < 0n);
    assert.equal(report.heldRedemptions, 1);
  } finally {
    await cleanup();
  }
});
