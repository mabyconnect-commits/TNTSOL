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
| `src/watcher.ts` | Polls both clusters, drives requests sequentially, reconciles unfinished work each tick, enforces the per-tick payout budget. |
| `src/processors/activation.ts` | Fail-safe ordering: mainnet fee **before** devnet whitelist. |
| `src/processors/redemption.ts` | Mirror observed burn → per-payout cap → tick budget → solvency gate → mainnet payout. |
| `src/solvency.ts` | Pure fee/reserve math and the redemption solvency predicate. |
| `src/ledger/store.ts` | Crash-tolerant file-backed state (atomic temp-then-rename) + idempotency records + cursors. |
| `src/chain/adapter.ts` | The only surface that touches a cluster. Every mutating call takes an idempotency key. |
| `src/chain/solanaAdapter.ts` | Real adapter (stubbed); TODO markers show where program CPIs go. |
| `src/config.ts` | Loads + **validates** fee/split params and payout caps; rejects under-reserved (non-positive-buffer) configs at startup. |

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
guard; I5 is enforced authoritatively on-chain with the relayer as
defense-in-depth.

- **I1 — No whitelist without fee.** Devnet whitelist is granted only after the
  mainnet fee for that activation is confirmed. (Ordering in `activation.ts`.)
- **I2 — No payout without burn.** Mainnet SOL is paid only after the
  corresponding devnet burn is observed. The burn is user-initiated and
  irreversible; the relayer reacts to it. (`redemption.ts`.)
- **I3 — Exactly-once effects.** Every external mutation is idempotent on a
  stable key, so crash-retries never double-charge or double-pay.
- **I4 — Reserve adequacy with a positive buffer.** `treasury_kept_per_unit >
  redemption_rate` *strictly* — a zero-margin design is rejected. Defaults give
  80bps kept vs 75bps owed (a 5bps buffer). Enforced in `config.ts`.
- **I5 — Solvency.** `treasury >= redemption_rate × total_whitelisted` at all
  times. **Authoritative enforcement is on-chain**: the mainnet treasury program
  re-checks this at redemption time and rejects an insolvent payout regardless of
  what the relayer does. The relayer also gates every payout (`canPayRedemption`)
  as defense-in-depth and to avoid a doomed mainnet round-trip.

## 5. Threat model

Assets: (A1) mainnet treasury SOL; (A2) integrity of the whitelist supply
counter; (A3) relayer ledger / idempotency state; (A4) the two signing keys.

| # | Threat | Vector | Mitigation | Residual |
|---|---|---|---|---|
| T1 | Whitelist minted without payment | bug or attacker calls whitelist directly | I1 ordering; on-chain, whitelist authority must be relayer-only and ideally require a fee-proof | R: devnet authority key compromise |
| T2 | Double payout drains treasury | crash/retry, duplicate event, event replay | I3 idempotency keys; per-redemption PDA on-chain | low if keys are truly stable |
| T3 | Pay out more than reserves back | mispriced params, external treasury drain | I4 strict-buffer config guard + on-chain solvency check (authoritative) + relayer gate | low (chain-enforced) |
| T4 | Forged activation/redemption events | spoofed devnet events fed to relayer | adapter must verify events against finalized on-chain state, not trust a feed | depends on real adapter rigor |
| T5 | Ledger tampering / loss | host compromise, disk loss | atomic writes; should reconcile against on-chain truth on boot | R: ledger is a cache, not source of truth |
| T6 | Treasury key theft / mass drain | host compromise, leaked relayer key | multisig treasury authority + on-chain rate limits; relayer-side per-payout cap (holds large redemptions) and per-tick payout cap (caps drain velocity) | R: residual until multisig + on-chain caps ship; relayer caps are defense-in-depth only |
| T7 | Replay across restarts | reprocessing old cursors/events | cursors persisted; idempotency keys; reconcile re-drives by record, not by re-emitting | low |
| T8 | Fee underpayment / rounding leakage | integer truncation favoring user | all math in bigint lamports, floor division; fee floored, payout floored — never rounds in user's favor beyond 1 lamport | acceptable; absorbed by the I4 buffer |

### Trust-boundary note
Event bodies, balances, and any data the adapter ingests from a cluster are
**external input**. The real `SolanaAdapter` must derive requests from
*finalized* on-chain state (confirmed signatures, account reads), never from an
unauthenticated push feed, or T4 becomes trivial.

## 6. Failure modes & recovery

Cross-cluster writes cannot be atomic, so we choose orderings that fail safe and
make every partial state recoverable. Every tick reconciles any record not in a
terminal state (in addition to processing newly polled requests); idempotency
makes re-driving safe.

| Crash / hold point | Resulting state | On reconcile |
|---|---|---|
| After fee, before whitelist | `FEE_COLLECTED` — user paid, not yet whitelisted | resume at whitelist (fee not re-charged) |
| After burn observed, before payout | `OBSERVED`/`HALTED_INSOLVENT` — user owed | re-check solvency, pay (payout not duplicated) |
| Mid ledger write | old file intact (atomic rename) | load last good state |
| Treasury under-reserved at redemption | `HALTED_INSOLVENT`, counter already reflects burn | auto-pays once treasury is topped up |
| Payout exceeds *remaining* tick budget | `OBSERVED`, counter reflects burn | paid on a later tick as budget frees up |
| Payout exceeds a *full* tick budget | `HELD_OVER_CAP`, counter reflects burn | held (would otherwise defer forever); needs the tick cap raised, then a re-drive |
| Payout over per-payout cap | `HELD_OVER_CAP`, counter reflects burn | requires raising the cap / multisig approval, then a re-drive — never auto-paid |

The asymmetry is deliberate: the safe failure is always "platform owes the
user", never "user got value the platform didn't account for".

## 7. Decided design & hardening roadmap

### Adopted (relayer side implemented; on-chain enforcement to follow)

- **D1 — Multisig key custody + on-chain rate limits (addresses T6).** The
  mainnet treasury authority is an N-of-M multisig (e.g. Squads), and the
  treasury program enforces withdrawal limits the relayer *cannot* exceed even
  if its key leaks. **Relayer-side defense-in-depth, shipped:** a per-payout cap
  (`MAX_PAYOUT_LAMPORTS` — single redemptions above it go to `HELD_OVER_CAP` for
  manual/multisig approval) and a per-tick payout cap (`MAX_TICK_PAYOUT_LAMPORTS`
  — caps total real SOL leaving per tick, deferring the rest). These mirror, but
  do not replace, the on-chain limits.
- **D2 — Solvency enforced on-chain (addresses T3).** The mainnet treasury
  program re-checks `treasury >= rate × whitelisted` at redemption and rejects an
  insolvent payout, making I5 a chain invariant rather than a relayer promise.
  The relayer keeps its `canPayRedemption` gate as defense-in-depth. (See the
  attestation dependency in R1 below.)
- **D3 — Non-zero reserve buffer (shipped).** `config.ts` now *rejects* a
  zero-margin design and defaults to 80bps treasury-kept vs 75bps owed. Floor
  rounding (T8) is absorbed by the buffer.

### Still open (need decisions before the Anchor programs lock in)

R1. **Whitelisted-supply attestation.** D2's on-chain check depends on a trustworthy
   `total_whitelisted` number. Decide the source of truth: relayer counter
   (current, weak), an on-chain devnet aggregate, or a periodically attested
   snapshot. This is the input both the on-chain solvency check (D2) and any
   audit relies on, and is the weakest link in D2 until resolved.
R2. **Ledger reconciliation.** On boot, reconcile the local ledger against
   on-chain reality (treasury balance, processed-PDA set) so a tampered or stale
   ledger cannot silently violate invariants.
R3. **Decentralization / liveness.** A single relayer is also a liveness SPOF
   (redemptions stall if it is down). Longer term: multiple relayers with
   on-chain dedup, or permissionless redemption claims that the relayer only
   needs to *fund*, not *authorize*.

## 8. What the mock proves (and doesn't)

The in-memory `MockAdapter` + tests exercise I1–I4, the per-payout / per-tick
caps, and all recovery paths honestly (idempotency, fail-safe ordering,
insolvency-halt-then-recover, cap-defer-then-pay). They do **not** model: real
multisig custody, the *on-chain* solvency check (D2) or rate limits (D1), the
supply attestation (R1), event authenticity, or network/finality behavior. Those
land with the `SolanaAdapter` and the on-chain programs.
