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

export function loadConfig(env: Env = process.env): RelayerConfig {
  const cfg: RelayerConfig = {
    devnetRpcUrl: env.DEVNET_RPC_URL ?? "https://api.devnet.solana.com",
    mainnetRpcUrl: env.MAINNET_RPC_URL ?? "https://api.mainnet-beta.solana.com",
    mainnetTreasuryKeypair: env.MAINNET_TREASURY_KEYPAIR ?? "",
    devnetAuthorityKeypair: env.DEVNET_AUTHORITY_KEYPAIR ?? "",
    teamWallet: env.TEAM_WALLET ?? "",
    activationFeeBps: int(env, "ACTIVATION_FEE_BPS", 100),
    redemptionRateBps: int(env, "REDEMPTION_RATE_BPS", 80),
    teamSplitBps: int(env, "TEAM_SPLIT_BPS", 2000),
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
  // the full redemption rate per activated unit. If the team slice eats into
  // that reserve, the system is under-reserved by construction.
  const treasuryKeptBps = (cfg.activationFeeBps * (10000 - cfg.teamSplitBps)) / 10000;
  if (treasuryKeptBps < cfg.redemptionRateBps) {
    throw new Error(
      `Treasury keeps ${treasuryKeptBps}bps per activation but owes ${cfg.redemptionRateBps}bps at redemption — ` +
        `under-reserved. Lower TEAM_SPLIT_BPS or REDEMPTION_RATE_BPS, or raise ACTIVATION_FEE_BPS.`,
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
