import assert from "node:assert/strict";
import { test } from "node:test";
import { canPayRedemption, feeBreakdown, redemptionPayout, requiredReserves, solvencyView } from "../src/solvency";

const SOL = 1_000_000_000n;

test("feeBreakdown splits 1% fee 80/20 treasury/team", () => {
  const { total, team, treasury } = feeBreakdown(100n * SOL, 100, 2000);
  assert.equal(total, 1n * SOL); // 1% of 100 SOL
  assert.equal(team, 200_000_000n); // 20% of 1 SOL
  assert.equal(treasury, 800_000_000n); // 80% of 1 SOL
});

test("redemptionPayout is 0.8% of whitelisted amount", () => {
  assert.equal(redemptionPayout(30n * SOL, 80), 240_000_000n); // 0.8% of 30 SOL
});

test("requiredReserves tracks 0.8% of whitelisted supply", () => {
  assert.equal(requiredReserves(1000n * SOL, 80), 8n * SOL);
});

test("solvencyView flags under-reservation", () => {
  const ok = solvencyView(8n * SOL, 1000n * SOL, 80);
  assert.equal(ok.solvent, true);
  const bad = solvencyView(8n * SOL - 1n, 1000n * SOL, 80);
  assert.equal(bad.solvent, false);
});

test("canPayRedemption refuses when payout would break the invariant", () => {
  // Treasury exactly backs 100 SOL whitelisted (0.8 SOL). After burning 30,
  // remaining whitelisted is 70 (needs 0.56 SOL); paying 0.24 leaves 0.56 — ok.
  const treasury = 800_000_000n;
  assert.equal(canPayRedemption(treasury, 70n * SOL, 240_000_000n, 80), true);
  // If the treasury is a hair short, the same payout must be refused.
  assert.equal(canPayRedemption(treasury - 1n, 70n * SOL, 240_000_000n, 80), false);
});

test("canPayRedemption refuses on treasury underflow", () => {
  assert.equal(canPayRedemption(100n, 0n, 200n, 80), false);
});
