// Lamports are integer amounts (1e9 per SOL). Always bigint, never float.
export type Lamports = bigint;

// A blacklisted->whitelisted activation triggered on devnet (first use of
// blacklisted SOL in a trade). On-chain, curve.buy -> platform.program_activate
// RESERVES the amount into the user's `pending` bucket and emits ActivationPending
// (with fee_owed); the relayer collects the mainnet fee, then finalizes the
// whitelist (fee-first). The mainnet fee must be collected before finalizing.
export interface ActivationRequest {
  id: string; // unique, idempotent key (e.g. the devnet trade signature)
  user: string; // base58 pubkey
  devnetAmount: Lamports; // amount reserved in `pending`, to whitelist after the fee
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
