// Lamports are integer amounts (1e9 per SOL). Always bigint, never float.
export type Lamports = bigint;

// A blacklisted->whitelisted activation triggered on devnet (first use of
// blacklisted SOL in a trade). The mainnet fee must be collected for it.
export interface ActivationRequest {
  id: string; // unique, idempotent key (e.g. the devnet trade signature)
  user: string; // base58 pubkey
  devnetAmount: Lamports; // amount of blacklisted devnet SOL being activated
  // True when the devnet whitelist already happened ON-CHAIN (curve.buy ->
  // platform.program_activate). The relayer then only owes the mainnet fee and
  // must NOT re-whitelist. NOTE: this inverts the fail-safe ordering — the
  // whitelist precedes the fee — so an uncollectable fee leaves a user
  // whitelisted-but-unpaid. See ActivationProcessor for the guard/risk note.
  preWhitelisted?: boolean;
}

// A redemption: the user has already BURNED whitelisted devnet SOL on devnet,
// and is owed a mainnet SOL payout.
export interface RedemptionRequest {
  id: string; // unique, idempotent key (e.g. the devnet burn signature)
  user: string;
  whitelistedDevnetAmount: Lamports; // amount of whitelisted devnet burned
}

export interface TxResult {
  signature: string;
}

export type ActivationStatus = "RECEIVED" | "FEE_COLLECTED" | "WHITELISTED" | "FAILED";
export type RedemptionStatus = "OBSERVED" | "HELD_OVER_CAP" | "HALTED_INSOLVENT" | "PAID" | "FAILED";

export interface ActivationRecord {
  id: string;
  user: string;
  devnetAmount: Lamports;
  feeTreasuryLamports: Lamports; // mainnet portion that stays in treasury
  feeTeamLamports: Lamports; // mainnet portion paid to the team wallet
  status: ActivationStatus;
  preWhitelisted?: boolean; // whitelist happened on-chain; relayer only owes the fee
  mainnetFeeSig?: string;
  devnetWhitelistSig?: string;
  error?: string;
  updatedAt: string;
}

export interface RedemptionRecord {
  id: string;
  user: string;
  whitelistedDevnetAmount: Lamports;
  payoutLamports: Lamports;
  status: RedemptionStatus;
  counterDecremented: boolean; // whether we've mirrored the on-chain burn in our counter
  payoutSig?: string;
  error?: string;
  updatedAt: string;
}
