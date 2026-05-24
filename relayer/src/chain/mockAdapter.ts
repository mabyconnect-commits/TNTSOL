import type { ActivationRequest, Lamports, RedemptionRequest, TxResult } from "../types";
import type { OnChainAdapter, PollResult } from "./adapter";

export interface MockOptions {
  startingTreasury?: Lamports;
}

// In-memory stand-in for both clusters. Models a mainnet treasury balance, a
// per-user devnet whitelist ledger, and request queues. Idempotency keys are
// deduped exactly as a real implementation must (via memo lookup / PDA flag),
// so the processor retry paths can be exercised honestly. Failure injection
// flags let tests force a step to throw once.
export class MockAdapter implements OnChainAdapter {
  private treasury: Lamports;
  private readonly whitelistByUser = new Map<string, Lamports>();
  private readonly activationQueue: ActivationRequest[] = [];
  private readonly redemptionQueue: RedemptionRequest[] = [];
  private readonly appliedKeys = new Map<string, TxResult>();

  failNextWhitelist = false;
  failNextPayout = false;

  constructor(opts: MockOptions = {}) {
    this.treasury = opts.startingTreasury ?? 0n;
  }

  // ---- test / demo helpers (not part of OnChainAdapter) ----
  enqueueActivation(req: ActivationRequest): void {
    this.activationQueue.push(req);
  }
  enqueueRedemption(req: RedemptionRequest): void {
    this.redemptionQueue.push(req);
  }
  setTreasury(value: Lamports): void {
    this.treasury = value;
  }
  whitelistOf(user: string): Lamports {
    return this.whitelistByUser.get(user) ?? 0n;
  }

  private sig(): string {
    return "mock-" + Math.random().toString(36).slice(2, 12);
  }

  async collectMainnetFee(
    _user: string,
    treasuryLamports: Lamports,
    _teamLamports: Lamports,
    idempotencyKey: string,
  ): Promise<TxResult> {
    const prev = this.appliedKeys.get(idempotencyKey);
    if (prev) return prev;
    // Team slice is paid out to the team wallet (out of band); only the
    // treasury slice accrues to the reserve balance we track here.
    this.treasury += treasuryLamports;
    const res = { signature: this.sig() };
    this.appliedKeys.set(idempotencyKey, res);
    return res;
  }

  async payRedemption(_user: string, lamports: Lamports, idempotencyKey: string): Promise<TxResult> {
    const prev = this.appliedKeys.get(idempotencyKey);
    if (prev) return prev;
    if (this.failNextPayout) {
      this.failNextPayout = false;
      throw new Error("simulated payout failure");
    }
    if (this.treasury < lamports) throw new Error("treasury underflow");
    this.treasury -= lamports;
    const res = { signature: this.sig() };
    this.appliedKeys.set(idempotencyKey, res);
    return res;
  }

  async getTreasuryBalance(): Promise<Lamports> {
    return this.treasury;
  }

  async whitelistDevnet(user: string, amount: Lamports, idempotencyKey: string): Promise<TxResult> {
    const prev = this.appliedKeys.get(idempotencyKey);
    if (prev) return prev;
    if (this.failNextWhitelist) {
      this.failNextWhitelist = false;
      throw new Error("simulated whitelist failure");
    }
    this.whitelistByUser.set(user, (this.whitelistByUser.get(user) ?? 0n) + amount);
    const res = { signature: this.sig() };
    this.appliedKeys.set(idempotencyKey, res);
    return res;
  }

  async pollActivationRequests(_cursor: string | null): Promise<PollResult<ActivationRequest>> {
    const requests = this.activationQueue.splice(0);
    return { requests, cursor: null };
  }

  async pollRedemptionRequests(_cursor: string | null): Promise<PollResult<RedemptionRequest>> {
    const requests = this.redemptionQueue.splice(0);
    return { requests, cursor: null };
  }
}
