import { PublicKey } from "@solana/web3.js";

export interface RelayerConfig {
  devnetRpcUrl: string;
  mainnetRpcUrl: string;
  mainnetTreasuryKeypair: string;
  devnetAuthorityKeypair: string;
  teamWallet: string;
  activationFeeBps: number;
  redemptionRateBps: number;
  teamSplitBps: number;
  // Relayer-side defense-in-depth mirroring the on-chain treasury rate limits a
  // multisig authority would enforce. 0 = unlimited.
  maxPayoutLamports: bigint; // cap on a single redemption; larger ones are held for manual approval
  maxTickPayoutLamports: bigint; // cap on total payout per poll tick; excess defers to the next tick
  ledgerPath: string;
  pollIntervalMs: number;
  useMockAdapter: boolean;
}

type Env = Record<string, string | undefined>;

function int(env: Env, name: string, def: number): number {
  const v = env[name];
  if (v === undefined || v === "") return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new Error(`Invalid ${name}: ${v} (expected non-negative integer)`);
  return n;
}

function bool(env: Env, name: string, def: boolean): boolean {
  const v = env[name];
  if (v === undefined || v === "") return def;
  return v === "true" || v === "1";
}

function lamports(env: Env, name: string, def: bigint): bigint {
  const v = env[name];
  if (v === undefined || v === "") return def;
  if (!/^\d+$/.test(v)) throw new Error(`Invalid ${name}: ${v} (expected non-negative integer lamports)`);
  return BigInt(v);
}

export function loadConfig(env: Env = process.env): RelayerConfig {
  const cfg: RelayerConfig = {
    devnetRpcUrl: env.DEVNET_RPC_URL ?? "https://api.devnet.solana.com",
    mainnetRpcUrl: env.MAINNET_RPC_URL ?? "https://api.mainnet-beta.solana.com",
    mainnetTreasuryKeypair: env.MAINNET_TREASURY_KEYPAIR ?? "",
    devnetAuthorityKeypair: env.DEVNET_AUTHORITY_KEYPAIR ?? "",
    teamWallet: env.TEAM_WALLET ?? "",
    activationFeeBps: int(env, "ACTIVATION_FEE_BPS", 100),
    // 75bps redemption vs 80bps treasury-kept => a deliberate 5bps reserve buffer.
    redemptionRateBps: int(env, "REDEMPTION_RATE_BPS", 75),
    teamSplitBps: int(env, "TEAM_SPLIT_BPS", 2000),
    maxPayoutLamports: lamports(env, "MAX_PAYOUT_LAMPORTS", 0n),
    maxTickPayoutLamports: lamports(env, "MAX_TICK_PAYOUT_LAMPORTS", 0n),
    ledgerPath: env.LEDGER_PATH ?? "./ledger.json",
    pollIntervalMs: int(env, "POLL_INTERVAL_MS", 3000),
    useMockAdapter: bool(env, "USE_MOCK_ADAPTER", true),
  };
  validate(cfg);
  return cfg;
}

function validate(cfg: RelayerConfig): void {
  if (cfg.teamSplitBps > 10000) {
    throw new Error(`TEAM_SPLIT_BPS must be <= 10000, got ${cfg.teamSplitBps}`);
  }
  if (cfg.redemptionRateBps >= cfg.activationFeeBps) {
    throw new Error(
      `REDEMPTION_RATE_BPS (${cfg.redemptionRateBps}) must be < ACTIVATION_FEE_BPS (${cfg.activationFeeBps}); ` +
        `otherwise the platform pays out at least what it collects and has no margin.`,
    );
  }
  // The treasury only keeps the non-team slice of each fee, yet it must reserve
  // the full redemption rate per activated unit. Require a STRICTLY positive
  // buffer: a zero-margin design (treasury-kept == owed) tips insolvent on any
  // rounding, gas, or timing slip, so we reject it outright.
  const treasuryKeptBps = (cfg.activationFeeBps * (10000 - cfg.teamSplitBps)) / 10000;
  if (treasuryKeptBps <= cfg.redemptionRateBps) {
    throw new Error(
      `Treasury keeps ${treasuryKeptBps}bps per activation but owes ${cfg.redemptionRateBps}bps at redemption — ` +
        `requires a non-zero reserve buffer. Lower TEAM_SPLIT_BPS or REDEMPTION_RATE_BPS, or raise ACTIVATION_FEE_BPS.`,
    );
  }

  // A single payout allowed by the per-payout cap must be able to fit within a
  // tick budget, or it could never be paid.
  if (
    cfg.maxTickPayoutLamports > 0n &&
    cfg.maxPayoutLamports > 0n &&
    cfg.maxTickPayoutLamports < cfg.maxPayoutLamports
  ) {
    throw new Error(
      `MAX_TICK_PAYOUT_LAMPORTS (${cfg.maxTickPayoutLamports}) must be >= MAX_PAYOUT_LAMPORTS ` +
        `(${cfg.maxPayoutLamports}) or a payout under the per-payout cap could never fit in a tick.`,
    );
  }

  if (!cfg.useMockAdapter) {
    requirePubkey("TEAM_WALLET", cfg.teamWallet);
    if (!cfg.mainnetTreasuryKeypair) throw new Error("MAINNET_TREASURY_KEYPAIR is required when USE_MOCK_ADAPTER=false");
    if (!cfg.devnetAuthorityKeypair) throw new Error("DEVNET_AUTHORITY_KEYPAIR is required when USE_MOCK_ADAPTER=false");
  }
}

function requirePubkey(name: string, value: string): void {
  if (!value) throw new Error(`${name} is required`);
  try {
    new PublicKey(value);
  } catch {
    throw new Error(`Invalid ${name} pubkey: ${value}`);
  }
}
