import { Connection, type Keypair } from "@solana/web3.js";
import type { RelayerConfig } from "../config";
import type { ActivationRequest, Lamports, RedemptionRequest, TxResult } from "../types";
import type { OnChainAdapter, PollResult } from "./adapter";

// Real cross-cluster adapter. Reads/writes are stubbed until the Anchor
// programs exist; each TODO marks exactly where program CPIs / instruction
// builders plug in. getTreasuryBalance is live so solvency can already be
// observed against a real mainnet account.
export class SolanaAdapter implements OnChainAdapter {
  constructor(
    private readonly devnet: Connection,
    private readonly mainnet: Connection,
    private readonly treasury: Keypair,
    private readonly devnetAuthority: Keypair,
    private readonly cfg: RelayerConfig,
  ) {
    void this.devnet;
    void this.devnetAuthority;
    void this.cfg;
  }

  async getTreasuryBalance(): Promise<Lamports> {
    const lamports = await this.mainnet.getBalance(this.treasury.publicKey);
    return BigInt(lamports);
  }

  async collectMainnetFee(
    _user: string,
    _treasuryLamports: Lamports,
    _teamLamports: Lamports,
    _idempotencyKey: string,
  ): Promise<TxResult> {
    // TODO: build + send a mainnet tx that moves the treasury slice into the
    // treasury PDA and the team slice to TEAM_WALLET. Encode idempotencyKey as a
    // memo (or a per-activation PDA) so a resend is a verifiable no-op.
    throw new Error("SolanaAdapter.collectMainnetFee not implemented");
  }

  async payRedemption(_user: string, _lamports: Lamports, _idempotencyKey: string): Promise<TxResult> {
    // TODO: invoke the mainnet treasury program's `redeem` after its own
    // on-chain solvency check; idempotency via a per-redemption PDA.
    throw new Error("SolanaAdapter.payRedemption not implemented");
  }

  async whitelistDevnet(_user: string, _amount: Lamports, _idempotencyKey: string): Promise<TxResult> {
    // TODO: send the devnet platform-program instruction that moves `amount`
    // from the user's blacklisted bucket to whitelisted.
    throw new Error("SolanaAdapter.whitelistDevnet not implemented");
  }

  async pollActivationRequests(_cursor: string | null): Promise<PollResult<ActivationRequest>> {
    // TODO: subscribe to / page the devnet program's activation events.
    throw new Error("SolanaAdapter.pollActivationRequests not implemented");
  }

  async pollRedemptionRequests(_cursor: string | null): Promise<PollResult<RedemptionRequest>> {
    // TODO: subscribe to / page the devnet program's burn-for-redemption events.
    throw new Error("SolanaAdapter.pollRedemptionRequests not implemented");
  }
}
