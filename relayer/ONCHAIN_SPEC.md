# TNTSOL on-chain interface & supply-attestation spec

Status: **design** (no programs implemented yet). This locks the on-chain
program surface and the whitelisted-supply attestation (roadmap item **R1**) so
the eventual Anchor implementation is mechanical and the relayer's
`OnChainAdapter` maps 1:1 to real instructions. Read alongside
[`ARCHITECTURE.md`](./ARCHITECTURE.md) — the invariants (I1–I5) and decisions
(D1–D3) referenced here are defined there.

## 1. Goal

Today every invariant is enforced *only* by the relayer (`MockAdapter` in code).
This spec moves the two that protect real money to be **authoritative on-chain**,
with the relayer demoted to defense-in-depth:

- **D1 — payout caps / rate limits**, enforced by the mainnet treasury program.
- **D2 — solvency** (`treasury ≥ rate × total_whitelisted`), enforced by the
  mainnet treasury program at payout time.

The hard part is that D2 needs a number — `total_whitelisted` — that lives on a
**different cluster** (devnet). A Solana program cannot read another cluster's
state, so D2 depends on an **attested supply snapshot** bridged to mainnet. That
bridge is R1 and is specified in §5.

## 2. Two programs, two clusters

```
                 mainnet (real SOL)                     devnet (platform bucket)
        ┌──────────────────────────────┐        ┌────────────────────────────────┐
        │      treasury program        │        │      platform program          │
        │  - vault PDA (holds SOL)     │        │  - supply PDA (total_whitelisted)│
        │  - Config (multisig auth)    │        │  - per-user whitelist balance   │
        │  - SupplySnapshot (attested) │        │  - BurnReceipt PDAs             │
        │  - RedemptionReceipt PDAs    │        │  - Config (whitelist authority) │
        │  - PayoutWindow (rate cap)   │        │                                 │
        └──────────────────────────────┘        └────────────────────────────────┘
```

- **Treasury program (mainnet)** custodies the reserve, collects activation
  fees, and pays redemptions — gated by D1 + D2. Authority is an N-of-M multisig
  (Squads-style), never a single hot key.
- **Platform program (devnet)** is the source of truth for `total_whitelisted`:
  it grants whitelist on activation and burns on redemption, maintaining the
  supply aggregate that the attester snapshots.

## 3. Account model

### 3.1 Treasury program (mainnet)

| Account | Kind | Fields |
|---|---|---|
| `Config` | singleton PDA `["config"]` | `authority` (multisig pubkey), `activation_fee_bps`, `redemption_rate_bps`, `team_split_bps`, `team_wallet`, `max_payout_lamports`, `window_payout_cap_lamports`, `window_slots`, `attester_set` (Vec<Pubkey>), `attester_threshold` (u8), `max_snapshot_staleness_slots`, `max_supply_increase_per_snapshot` |
| `Vault` | PDA `["vault"]`, system-owned, program-signed | holds reserve SOL |
| `SupplySnapshot` | singleton PDA `["supply"]` | `total_whitelisted`, `as_of_slot`, `as_of_unix`, `seq` (monotonic), `posted_by` |
| `PayoutWindow` | singleton PDA `["window"]` | `window_start_slot`, `paid_in_window_lamports` |
| `RedemptionReceipt` | PDA `["redeem", redemption_id]` | `redemption_id`, `user`, `payout_lamports`, `paid_slot` — existence ⇒ already paid (I3) |

### 3.2 Platform program (devnet)

| Account | Kind | Fields |
|---|---|---|
| `Config` | singleton PDA `["config"]` | `whitelist_authority` (relayer pubkey), `require_fee_proof` (bool) |
| `SupplyState` | singleton PDA `["supply"]` | `total_whitelisted` (u64), `last_update_slot` |
| `WhitelistBalance` | PDA `["wl", user]` | `user`, `amount` |
| `BurnReceipt` | PDA `["burn", redemption_id]` | `redemption_id`, `user`, `amount`, `burn_slot` — the artifact the relayer observes for I2 |

## 4. Instruction interface

Each instruction notes the **relayer adapter method** it backs (see
`src/chain/adapter.ts`) and the **invariant** it enforces. `*_id` arguments are
the idempotency keys the adapter already passes; the per-id receipt PDA makes
every mutating call exactly-once (I3) — a replay hits "account already exists"
and is treated as a no-op success.

### 4.1 Treasury program (mainnet)

- **`initialize(config_args)`** — one-time; sets `Config`. Validates the D3
  buffer on-chain too: reject unless `activation_fee_bps × (10_000 −
  team_split_bps) / 10_000 > redemption_rate_bps`.
- **`collect_activation_fee(activation_id, amount)`** → adapter `collectMainnetFee`.
  Splits `fee = amount × activation_fee_bps`; routes `team = fee × team_split_bps`
  to `team_wallet`, remainder to `Vault`. Writes a fee receipt PDA keyed by
  `activation_id`. Enforces the fee math; D3 is already guaranteed by config.
- **`pay_redemption(redemption_id, user, whitelisted_amount)`** → adapter
  `payRedemption`. Checks, in order:
  1. **I3** — `RedemptionReceipt["redeem", redemption_id]` must not exist.
  2. `payout = whitelisted_amount × redemption_rate_bps / 10_000`.
  3. **D1 per-payout** — `payout ≤ max_payout_lamports` (0 = unlimited).
  4. **D1 rate** — roll `PayoutWindow` if `current_slot − window_start ≥
     window_slots`; require `paid_in_window + payout ≤ window_payout_cap`.
  5. **D2 freshness** — `current_slot − SupplySnapshot.as_of_slot ≤
     max_snapshot_staleness_slots` (stale ⇒ reject; redemptions halt safely).
  6. **D2 solvency** — `vault_balance − payout ≥ redemption_rate_bps / 10_000 ×
     (SupplySnapshot.total_whitelisted − whitelisted_amount)`.
  7. Transfer `payout` from `Vault` to `user`; create the receipt; bump window.
- **`post_supply_snapshot(seq, total_whitelisted, as_of_slot, as_of_unix)`** —
  the attestation entry point (§5). Multisig-signed by ≥ `attester_threshold` of
  `attester_set`. Checks `seq == SupplySnapshot.seq + 1` (monotonic, no replay),
  `as_of_slot` strictly newer, and the anti-spoof bound
  `total_whitelisted ≤ prev_total + max_supply_increase_per_snapshot`.
- **`update_config(...)`** / **`withdraw_surplus(...)`** — multisig-only admin;
  surplus = `vault_balance − required_reserves(snapshot)`.

### 4.2 Platform program (devnet)

- **`grant_whitelist(activation_id, user, amount, fee_proof?)`** → adapter
  `whitelistDevnet`. `whitelist_authority`-signed (the relayer). **I1**: if
  `require_fee_proof`, verify a proof that the mainnet fee for `activation_id`
  was collected before granting. Increments `WhitelistBalance[user]` and
  `SupplyState.total_whitelisted`; idempotent on `activation_id`.
- **`burn_for_redemption(redemption_id, amount)`** — **user-initiated**. Burns
  `amount` from the caller's `WhitelistBalance`, decrements
  `SupplyState.total_whitelisted`, writes `BurnReceipt["burn", redemption_id]`.
  This is the irreversible, user-driven event that the relayer's
  `pollRedemptionRequests` observes — guaranteeing **I2** (burn precedes payout).

### 4.3 Event sources (`pollActivationRequests` / `pollRedemptionRequests`)

The real adapter must derive requests from **finalized** state, not a push feed
(threat T4): page confirmed signatures of the platform program and decode
`grant_whitelist` (→ `ActivationRequest`) and `burn_for_redemption` (→
`RedemptionRequest`) instructions. Cursor = last finalized signature.

## 5. R1 — whitelisted-supply attestation

**Problem.** D2 lives on mainnet but `total_whitelisted` is authoritative on
devnet, and no program can read across clusters. We need that number on mainnet,
trustworthily.

**Chosen design: multisig-attested snapshots with conservative on-chain guards.**

1. **Source of truth.** Devnet `SupplyState.total_whitelisted` (§3.2) is the
   real value, mutated only by `grant_whitelist` / `burn_for_redemption`.
2. **Attesters.** A set of M independent signers (the same Squads members or a
   distinct oracle set) each read *finalized* devnet `SupplyState` and co-sign a
   snapshot `{seq, total_whitelisted, as_of_slot, as_of_unix}`.
3. **Bridge.** Any party submits the co-signed snapshot via
   `post_supply_snapshot`; the treasury program accepts it only with ≥
   `attester_threshold` valid signatures.
4. **On-chain guards that bound a bad/compromised attestation:**
   - **Staleness window** — `pay_redemption` rejects if the snapshot is older
     than `max_snapshot_staleness_slots`. A stalled attester therefore *halts
     redemptions* (safe failure: platform owes the user, never overpays).
   - **Monotonic `seq`** — no replay or reordering of snapshots.
   - **Bounded increase** — `total_whitelisted` may rise by at most
     `max_supply_increase_per_snapshot` per update, so an attester cannot inflate
     supply to justify draining the vault in one step.
   - **Threshold** — a single compromised attester key cannot post anything.

**Why a lagging snapshot is safe.** Redemptions *reduce* true supply, so checking
solvency against an older (higher) snapshot is conservative — it over-reserves
and at worst halts a valid payout temporarily. Activations *raise* true supply
between snapshots, but each activation also funds the vault with a fee that
over-covers its own reserve requirement (the D3 buffer), so unsnapshotted
activations cannot make the system insolvent. The only residual drain vector —
many redemptions inside one staleness window — is bounded by the D1
`window_payout_cap`. Tuning rule: `window_payout_cap` per
`max_snapshot_staleness_slots` must stay below the buffer the vault carries.

**Failure modes.**

| Event | Effect | Safe? |
|---|---|---|
| Attester service down | snapshots stale → redemptions halt | yes (owes user) |
| 1 attester key leaked | cannot post (below threshold) | yes |
| Threshold of keys leaked | can post a bad snapshot, but bounded by per-update increase cap + window payout cap | partial — sized by params |
| Devnet reorg before finality | attesters must only read finalized state | yes if respected |

## 6. Relayer ↔ on-chain mapping

| Relayer (`OnChainAdapter`) | On-chain instruction | Enforcement moves to chain? |
|---|---|---|
| `collectMainnetFee` | treasury `collect_activation_fee` | fee math + D3 |
| `payRedemption` | treasury `pay_redemption` | **D1 + D2 (authoritative)** |
| `whitelistDevnet` | platform `grant_whitelist` | I1 |
| `getTreasuryBalance` | read `Vault` lamports | — |
| `pollActivationRequests` | decode `grant_whitelist` sigs | T4 |
| `pollRedemptionRequests` | decode `burn_for_redemption` sigs | I2, T4 |
| (none) | platform `burn_for_redemption` | user-initiated, not relayer |
| (new) `postSupplySnapshot` | treasury `post_supply_snapshot` | R1 |

After this lands, the relayer keeps its `canPayRedemption` gate, per-payout and
per-tick caps, and boot reconciliation as **defense-in-depth** — useful to avoid
doomed mainnet round-trips and to alert operators, but no longer the only thing
standing between a bug and the treasury.

## 7. Still-open decisions

- **Fee-proof for I1.** Cheapest trustworthy way to prove on devnet that a
  mainnet fee was paid: a co-signed attestation (reuse §5's attester set) vs. the
  relayer authority being trusted for `grant_whitelist` (weaker, current model).
- **Attester set identity.** Same multisig as the treasury authority, or a
  separate oracle set? Separate reduces correlated-compromise risk.
- **Vault custody at scale.** Single vault PDA vs. hot/cold split with a capped
  hot vault the relayer can draw from and a multisig-gated cold reserve.
- **Parameter sizing.** Concrete values for `window_payout_cap`,
  `window_slots`, `max_snapshot_staleness_slots`, and
  `max_supply_increase_per_snapshot`, derived from expected volume and the D3
  buffer (the §5 tuning rule).
- **Anchor vs. native.** Anchor for speed/IDL (the relayer can generate a typed
  client) vs. native for smaller surface. Recommend Anchor.
