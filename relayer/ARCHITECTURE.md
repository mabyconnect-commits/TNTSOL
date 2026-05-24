# TNTSOL Architecture & Threat Model

Status: draft. Scope: the cross-cluster relayer and the trust assumptions it
imposes on the wider platform. Written before the on-chain (Anchor) programs
exist, so it can shape their design rather than document it after the fact.

---

## 1. System context

The platform spans **two Solana clusters that share no state**:

- **Devnet** — where users hold and trade platform SOL. SOL here is either
  *blacklisted* (freshly received, not yet activated) or *whitelisted*
  (activated, redeemable). This is "play" value with no intrinsic worth.
- **Mainnet** — where the treasury holds real SOL and pays real redemptions.

No single on-chain program can read or write both clusters. Every operation
that must couple them — "collect a real fee, then grant devnet whitelist",
"observe a devnet burn, then pay real SOL" — requires an **off-chain relayer**
that holds credentials on both sides and bridges them. The relayer is therefore
not a convenience; it is the load-bearing trust component of the platform.

```
        devnet (platform state)                mainnet (real money)
   ┌──────────────────────────┐          ┌──────────────────────────┐
   │  platform program        │          │  treasury program        │
   │  - blacklist/whitelist   │          │  - reserve PDA           │
   │  - burn-for-redemption   │          │  - team wallet payout    │
   └─────────▲────────┬───────┘          └────────▲─────────┬───────┘
             │ events │ whitelist write            │ balance │ fee in
             │        ▼                             │ read    ▼ payout out
   ┌─────────┴────────────────────────────────────┴──────────────────┐
   │                          RELAYER  (this service)                 │
   │  watcher → processors (activation, redemption) → ledger          │
   │  OnChainAdapter: MockAdapter (today) | SolanaAdapter (future)    │
   └──────────────────────────────────────────────────────────────────┘
```

## 2. Relayer components

| Module | Responsibility |
|---|---|
| `src/watcher.ts` | Polls both clusters, drives requests sequentially, recovers unfinished work on startup. |
| `src/processors/activation.ts` | Fail-safe ordering: mainnet fee **before** devnet whitelist. |
| `src/processors/redemption.ts` | Mirror observed burn → solvency gate → mainnet payout. |
| `src/solvency.ts` | Pure fee/reserve math and the redemption solvency predicate. |
| `src/ledger/store.ts` | Crash-tolerant file-backed state (atomic temp-then-rename) + idempotency records + cursors. |
| `src/chain/adapter.ts` | The only surface that touches a cluster. Every mutating call takes an idempotency key. |
| `src/chain/solanaAdapter.ts` | Real adapter (stubbed); TODO markers show where program CPIs go. |
| `src/config.ts` | Loads + **validates** fee/split params; rejects under-reserved configs at startup. |

## 3. Trust model

The relayer is a **fully trusted, centralized** actor. It custodies:

- **The mainnet treasury signing key** — can move all real reserve SOL.
- **The devnet whitelist authority** — can mint redeemable value out of thin
  air by whitelisting without a corresponding fee.

These two powers are the platform's entire attack surface for catastrophic
loss. Either one, if compromised or buggy, can drain the treasury — directly
(steal mainnet SOL) or indirectly (over-whitelist devnet, then redeem).

**This is the core risk. Everything below is about constraining it.** The
relayer's correctness properties reduce the *accidental*-loss surface; they do
**not** address a compromised key. Key custody (Section 7) is the unsolved part.

## 4. System invariants

These must hold at all times. The relayer enforces I1–I3; I4 is a config-time
guard; I5 is the property we want pushed on-chain.

- **I1 — No whitelist without fee.** Devnet whitelist is granted only after the
  mainnet fee for that activation is confirmed. (Ordering in `activation.ts`.)
- **I2 — No payout without burn.** Mainnet SOL is paid only after the
  corresponding devnet burn is observed. The burn is user-initiated and
  irreversible; the relayer reacts to it. (`redemption.ts`.)
- **I3 — Exactly-once effects.** Every external mutation is idempotent on a
  stable key, so crash-retries never double-charge or double-pay.
- **I4 — Reserve adequacy by construction.** `treasury_kept_per_unit >=
  redemption_rate`, i.e. the team split cannot consume reserves the platform
  will owe. Enforced in `config.ts`.
- **I5 — Solvency.** `treasury >= redemption_rate × total_whitelisted` at all
  times. The relayer gates every payout on this (`canPayRedemption`), but today
  only *it* enforces it — see residual risk R5.

## 5. Threat model

Assets: (A1) mainnet treasury SOL; (A2) integrity of the whitelist supply
counter; (A3) relayer ledger / idempotency state; (A4) the two signing keys.

| # | Threat | Vector | Mitigation | Residual |
|---|---|---|---|---|
| T1 | Whitelist minted without payment | bug or attacker calls whitelist directly | I1 ordering; on-chain, whitelist authority must be relayer-only and ideally require a fee-proof | R: devnet authority key compromise |
| T2 | Double payout drains treasury | crash/retry, duplicate event, event replay | I3 idempotency keys; per-redemption PDA on-chain | low if keys are truly stable |
| T3 | Pay out more than reserves back | mispriced params, external treasury drain | I4 config guard + I5 solvency gate | R5: off-chain-only check |
| T4 | Forged activation/redemption events | spoofed devnet events fed to relayer | adapter must verify events against finalized on-chain state, not trust a feed | depends on real adapter rigor |
| T5 | Ledger tampering / loss | host compromise, disk loss | atomic writes; should reconcile against on-chain truth on boot | R: ledger is a cache, not source of truth |
| T6 | Treasury key theft | host compromise, leaked secret | **unmitigated today** | R-critical (Section 7) |
| T7 | Replay across restarts | reprocessing old cursors/events | cursors persisted; idempotency keys; recover() re-drives by record, not by re-emitting | low |
| T8 | Fee underpayment / rounding leakage | integer truncation favoring user | all math in bigint lamports, floor division; fee floored, payout floored — never rounds in user's favor beyond 1 lamport | acceptable; revisit with buffer |

### Trust-boundary note
Event bodies, balances, and any data the adapter ingests from a cluster are
**external input**. The real `SolanaAdapter` must derive requests from
*finalized* on-chain state (confirmed signatures, account reads), never from an
unauthenticated push feed, or T4 becomes trivial.

## 6. Failure modes & recovery

Cross-cluster writes cannot be atomic, so we choose orderings that fail safe and
make every partial state recoverable. On restart, `watcher.recover()` re-drives
any record not in a terminal state; idempotency makes re-driving safe.

| Crash point | Resulting state | On recovery |
|---|---|---|
| After fee, before whitelist | `FEE_COLLECTED` — user paid, not yet whitelisted | resume at whitelist (fee not re-charged) |
| After burn observed, before payout | `OBSERVED`/`HALTED_INSOLVENT` — user owed | re-check solvency, pay (payout not duplicated) |
| Mid ledger write | old file intact (atomic rename) | load last good state |
| Treasury under-reserved at redemption | `HALTED_INSOLVENT`, counter already reflects burn | auto-pays once treasury is topped up |

The asymmetry is deliberate: the safe failure is always "platform owes the
user", never "user got value the platform didn't account for".

## 7. Open decisions & hardening roadmap

Ordered by risk. Items 1–2 should be settled **before** the Anchor programs
lock the design in.

1. **Key custody (addresses T6, the critical risk).** A hot key on the relayer
   host is the single point of catastrophic failure. Options: HSM / KMS signing,
   a multisig (e.g. Squads) treasury requiring N-of-M, withdrawal rate limits +
   timelocks on the treasury program, and a hard cap on per-tick payout. At
   minimum the treasury program should enforce limits the relayer *cannot*
   exceed even if its key leaks.
2. **Move solvency on-chain (addresses R5/T3).** Today only the relayer checks
   I5; a buggy or malicious relayer can ignore it. The mainnet treasury program
   should enforce `treasury >= rate × whitelisted` *itself* at redemption time,
   reading an attested whitelisted-supply value. This makes solvency a chain
   invariant, not a relayer promise.
3. **Reserve buffer.** Default params give treasury-kept == redemption-owed
   (0.8% == 0.8%): a **zero-buffer** design where any rounding, gas, or timing
   slip tips it insolvent. Recommend a margin (e.g. redemption 0.75%, or a
   reserve factor > 1) and bake it into the I4 guard.
4. **Whitelisted-supply attestation.** I5 depends on a trustworthy
   `total_whitelisted` number. Decide the source of truth: relayer counter
   (current, weak), an on-chain devnet aggregate, or a periodically attested
   snapshot. This is the input both the on-chain check (item 2) and any audit
   relies on.
5. **Ledger reconciliation.** On boot, reconcile the local ledger against
   on-chain reality (treasury balance, processed-PDA set) so a tampered or stale
   ledger cannot silently violate invariants.
6. **Decentralization / liveness.** A single relayer is also a liveness SPOF
   (redemptions stall if it is down). Longer term: multiple relayers with
   on-chain dedup, or permissionless redemption claims that the relayer only
   needs to *fund*, not *authorize*.

## 8. What the mock proves (and doesn't)

The in-memory `MockAdapter` + tests exercise I1–I4 and all recovery paths
honestly (idempotency, fail-safe ordering, insolvency-halt-then-recover). They
do **not** model: real key custody, on-chain solvency enforcement, event
authenticity, or network/finality behavior. Those land with the `SolanaAdapter`
and the on-chain programs, and are exactly the items in Section 7.
