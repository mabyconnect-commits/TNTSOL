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

// Activate 100 SOL so there is whitelisted supply + a funded treasury to redeem against.
async function primed(adapter: MockAdapter, store: LedgerStore, cfg: ReturnType<typeof loadConfig>): Promise<void> {
  const act = new ActivationProcessor(store, adapter, cfg);
  await act.process({ id: "seed", user: "U", devnetAmount: 100n * SOL });
}

test("redemption: happy path pays 0.8% and decrements the counter", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    await primed(adapter, store, cfg);

    const treasuryBefore = await adapter.getTreasuryBalance();
    const proc = new RedemptionProcessor(store, adapter, cfg);
    const rec = await proc.process({ id: "r1", user: "U", whitelistedDevnetAmount: 30n * SOL });

    assert.equal(rec.status, "PAID");
    assert.equal(rec.payoutLamports, 240_000_000n); // 0.8% of 30 SOL
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // 100 - 30
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore - 240_000_000n);
  } finally {
    await cleanup();
  }
});

test("redemption: halts when the treasury cannot back remaining supply, then pays after top-up", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    await primed(adapter, store, cfg);

    // Drain the treasury to simulate under-reservation (e.g. external loss).
    adapter.setTreasury(0n);

    const proc = new RedemptionProcessor(store, adapter, cfg);
    const halted = await proc.process({ id: "r2", user: "U", whitelistedDevnetAmount: 30n * SOL });

    assert.equal(halted.status, "HALTED_INSOLVENT");
    // Burn is real, so the counter is decremented exactly once even while halted.
    assert.equal(store.getTotalWhitelisted(), 70n * SOL);

    // Top the treasury back up; retry pays out without decrementing again.
    adapter.setTreasury(1n * SOL);
    const paid = await proc.process({ id: "r2", user: "U", whitelistedDevnetAmount: 30n * SOL });
    assert.equal(paid.status, "PAID");
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // not decremented twice
    assert.equal(await adapter.getTreasuryBalance(), 1n * SOL - 240_000_000n);
  } finally {
    await cleanup();
  }
});

test("redemption: payout failure resumes and never double-pays or double-decrements", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    await primed(adapter, store, cfg);
    const treasuryBefore = await adapter.getTreasuryBalance();

    const proc = new RedemptionProcessor(store, adapter, cfg);
    adapter.failNextPayout = true;
    const first = await proc.process({ id: "r3", user: "U", whitelistedDevnetAmount: 30n * SOL });

    assert.equal(first.status, "OBSERVED"); // payout failed, will retry
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // counter already mirrored the burn
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore); // nothing paid yet

    const second = await proc.process({ id: "r3", user: "U", whitelistedDevnetAmount: 30n * SOL });
    assert.equal(second.status, "PAID");
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // still once
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore - 240_000_000n);
  } finally {
    await cleanup();
  }
});
