import type { ActivationRequest, Lamports, RedemptionRequest, TxResult } from "../types";

export interface PollResult<T> {
  requests: T[];
  cursor: string | null;
}

// The only surface the relayer uses to touch either cluster. Every mutating
// call takes an idempotencyKey so a retry after a crash never double-charges or
// double-pays: the implementation must make repeated calls with the same key a
// no-op that returns the original result.
export interface OnChainAdapter {
  // --- mainnet (real money) ---
  collectMainnetFee(
    user: string,
    treasuryLamports: Lamports,
    teamLamports: Lamports,
    idempotencyKey: string,
  ): Promise<TxResult>;
  payRedemption(user: string, lamports: Lamports, idempotencyKey: string): Promise<TxResult>;
  getTreasuryBalance(): Promise<Lamports>;

  // --- devnet (platform bucket state) ---
  whitelistDevnet(user: string, amount: Lamports, idempotencyKey: string): Promise<TxResult>;

  // --- event sources ---
  pollActivationRequests(cursor: string | null): Promise<PollResult<ActivationRequest>>;
  pollRedemptionRequests(cursor: string | null): Promise<PollResult<RedemptionRequest>>;
}
