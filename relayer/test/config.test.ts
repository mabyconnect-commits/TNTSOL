import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConfig } from "../src/config";

test("default config carries a strictly positive reserve buffer", () => {
  const cfg = loadConfig({});
  const treasuryKeptBps = (cfg.activationFeeBps * (10000 - cfg.teamSplitBps)) / 10000;
  assert.ok(treasuryKeptBps > cfg.redemptionRateBps, "treasury-kept bps must exceed the redemption rate");
});

test("rejects a zero-buffer config (treasury-kept == owed)", () => {
  assert.throws(
    () => loadConfig({ ACTIVATION_FEE_BPS: "100", TEAM_SPLIT_BPS: "2000", REDEMPTION_RATE_BPS: "80" }),
    /non-zero reserve buffer/,
  );
});

test("rejects an under-reserved config (team split eats the reserve)", () => {
  assert.throws(() => loadConfig({ ACTIVATION_FEE_BPS: "100", TEAM_SPLIT_BPS: "5000", REDEMPTION_RATE_BPS: "75" }));
});

test("rejects a tick cap smaller than the per-payout cap", () => {
  assert.throws(
    () => loadConfig({ MAX_PAYOUT_LAMPORTS: "1000", MAX_TICK_PAYOUT_LAMPORTS: "500" }),
    /MAX_TICK_PAYOUT_LAMPORTS/,
  );
});

test("rejects non-integer lamport caps", () => {
  assert.throws(() => loadConfig({ MAX_PAYOUT_LAMPORTS: "1.5" }), /MAX_PAYOUT_LAMPORTS/);
});
