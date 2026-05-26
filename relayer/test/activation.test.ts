import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { MockAdapter } from "../src/chain/mockAdapter";
import { loadConfig } from "../src/config";
import { LedgerStore } from "../src/ledger/store";
import { ActivationProcessor } from "../src/processors/activation";

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

test("activation: happy path collects fee then whitelists", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    const proc = new ActivationProcessor(store, adapter, cfg);

    const rec = await proc.process({ id: "a1", user: "U", devnetAmount: 100n * SOL });

    assert.equal(rec.status, "WHITELISTED");
    assert.equal(store.getTotalWhitelisted(), 100n * SOL);
    // treasury got the 0.8% treasury slice; user got 100 SOL whitelisted on devnet
    assert.equal(await adapter.getTreasuryBalance(), 800_000_000n);
    assert.equal(adapter.whitelistOf("U"), 100n * SOL);
  } finally {
    await cleanup();
  }
});

test("activation: fail-safe ordering — whitelist failure never whitelists without fee, and never double-charges on retry", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    const proc = new ActivationProcessor(store, adapter, cfg);

    adapter.failNextWhitelist = true;
    const first = await proc.process({ id: "a2", user: "U", devnetAmount: 100n * SOL });

    // Fee secured, but devnet whitelist failed -> stuck at FEE_COLLECTED, counter untouched.
    assert.equal(first.status, "FEE_COLLECTED");
    assert.equal(store.getTotalWhitelisted(), 0n);
    assert.equal(await adapter.getTreasuryBalance(), 800_000_000n);
    assert.equal(adapter.whitelistOf("U"), 0n);

    // Retry: resumes at whitelist, fee is NOT charged again (idempotency key).
    const second = await proc.process({ id: "a2", user: "U", devnetAmount: 100n * SOL });
    assert.equal(second.status, "WHITELISTED");
    assert.equal(store.getTotalWhitelisted(), 100n * SOL);
    assert.equal(await adapter.getTreasuryBalance(), 800_000_000n); // unchanged: no double fee
    assert.equal(adapter.whitelistOf("U"), 100n * SOL);
  } finally {
    await cleanup();
  }
});

test("activation: reprocessing a completed request is a no-op", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    const proc = new ActivationProcessor(store, adapter, cfg);

    await proc.process({ id: "a3", user: "U", devnetAmount: 50n * SOL });
    await proc.process({ id: "a3", user: "U", devnetAmount: 50n * SOL });

    assert.equal(store.getTotalWhitelisted(), 50n * SOL); // counted once
    assert.equal(await adapter.getTreasuryBalance(), 400_000_000n); // 0.8% of 50 SOL, once
  } finally {
    await cleanup();
  }
});
