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

// Activate `sol` SOL so there is whitelisted supply + a funded treasury to redeem against.
async function prime(adapter: MockAdapter, store: LedgerStore, cfg: ReturnType<typeof loadConfig>, sol: bigint): Promise<void> {
  const act = new ActivationProcessor(store, adapter, cfg);
  await act.process({ id: "seed", user: "U", devnetAmount: sol * SOL });
}

test("redemption: happy path pays the redemption rate and decrements the counter", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    await prime(adapter, store, cfg, 100n);

    const treasuryBefore = await adapter.getTreasuryBalance();
    const expected = redemptionPayout(30n * SOL, cfg.redemptionRateBps);
    const proc = new RedemptionProcessor(store, adapter, cfg);
    const rec = await proc.process({ id: "r1", user: "U", whitelistedDevnetAmount: 30n * SOL });

    assert.equal(rec.status, "PAID");
    assert.equal(rec.payoutLamports, expected);
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // 100 - 30
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore - expected);
  } finally {
    await cleanup();
  }
});

test("redemption: halts when the treasury cannot back remaining supply, then pays after top-up", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    await prime(adapter, store, cfg, 100n);
    const expected = redemptionPayout(30n * SOL, cfg.redemptionRateBps);

    adapter.setTreasury(0n); // simulate under-reservation (external loss)

    const proc = new RedemptionProcessor(store, adapter, cfg);
    const halted = await proc.process({ id: "r2", user: "U", whitelistedDevnetAmount: 30n * SOL });

    assert.equal(halted.status, "HALTED_INSOLVENT");
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // burn is real -> mirrored once

    adapter.setTreasury(1n * SOL); // top up
    const paid = await proc.process({ id: "r2", user: "U", whitelistedDevnetAmount: 30n * SOL });
    assert.equal(paid.status, "PAID");
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // not decremented twice
    assert.equal(await adapter.getTreasuryBalance(), 1n * SOL - expected);
  } finally {
    await cleanup();
  }
});

test("redemption: payout failure resumes and never double-pays or double-decrements", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    await prime(adapter, store, cfg, 100n);
    const treasuryBefore = await adapter.getTreasuryBalance();
    const expected = redemptionPayout(30n * SOL, cfg.redemptionRateBps);

    const proc = new RedemptionProcessor(store, adapter, cfg);
    adapter.failNextPayout = true;
    const first = await proc.process({ id: "r3", user: "U", whitelistedDevnetAmount: 30n * SOL });

    assert.equal(first.status, "OBSERVED");
    assert.equal(store.getTotalWhitelisted(), 70n * SOL);
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore);

    const second = await proc.process({ id: "r3", user: "U", whitelistedDevnetAmount: 30n * SOL });
    assert.equal(second.status, "PAID");
    assert.equal(store.getTotalWhitelisted(), 70n * SOL);
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore - expected);
  } finally {
    await cleanup();
  }
});

test("redemption: a single payout over the per-payout cap is held for approval", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({ MAX_PAYOUT_LAMPORTS: "100000000" }); // 0.1 SOL cap
    await prime(adapter, store, cfg, 100n);
    const treasuryBefore = await adapter.getTreasuryBalance();

    const proc = new RedemptionProcessor(store, adapter, cfg);
    const rec = await proc.process({ id: "rc", user: "U", whitelistedDevnetAmount: 30n * SOL });

    assert.equal(rec.status, "HELD_OVER_CAP");
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // burn mirrored
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore); // nothing paid
  } finally {
    await cleanup();
  }
});

test("redemption: a payout larger than the whole tick budget is held, not deferred forever", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const base = loadConfig({});
    const payout = redemptionPayout(30n * SOL, base.redemptionRateBps);
    // Per-payout cap unlimited, but the tick cap is below a single payout — the
    // dangerous case that would otherwise defer this redemption forever.
    const cfg = loadConfig({ MAX_TICK_PAYOUT_LAMPORTS: (payout - 1n).toString() });
    await prime(adapter, store, cfg, 100n);
    const treasuryBefore = await adapter.getTreasuryBalance();

    const proc = new RedemptionProcessor(store, adapter, cfg);
    const rec = await proc.process(
      { id: "rt", user: "U", whitelistedDevnetAmount: 30n * SOL },
      cfg.maxTickPayoutLamports, // a full, fresh tick budget
    );

    assert.equal(rec.status, "HELD_OVER_CAP");
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // burn mirrored
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore); // nothing paid
  } finally {
    await cleanup();
  }
});

test("redemption: payout exceeding the remaining tick budget is deferred, then paid", async () => {
  const { store, cleanup } = await tmpStore();
  try {
    const adapter = new MockAdapter();
    const cfg = loadConfig({});
    await prime(adapter, store, cfg, 100n);
    const treasuryBefore = await adapter.getTreasuryBalance();
    const payout = redemptionPayout(30n * SOL, cfg.redemptionRateBps);

    const proc = new RedemptionProcessor(store, adapter, cfg);
    const deferred = await proc.process({ id: "rb", user: "U", whitelistedDevnetAmount: 30n * SOL }, payout - 1n);
    assert.equal(deferred.status, "OBSERVED");
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore); // unpaid

    const paid = await proc.process({ id: "rb", user: "U", whitelistedDevnetAmount: 30n * SOL }, payout);
    assert.equal(paid.status, "PAID");
    assert.equal(store.getTotalWhitelisted(), 70n * SOL); // decremented once
    assert.equal(await adapter.getTreasuryBalance(), treasuryBefore - payout);
  } finally {
    await cleanup();
  }
});
