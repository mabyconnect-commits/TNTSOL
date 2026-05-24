# TNTSOL on-chain programs

Anchor workspace implementing the design in
[`../relayer/ONCHAIN_SPEC.md`](../relayer/ONCHAIN_SPEC.md). Two programs:

- **`platform`** (devnet) — whitelist authority + `total_whitelisted` aggregate;
  `grant_whitelist` (I1), `burn_for_redemption` (I2).
- **`treasury`** (mainnet) — reserve vault, `collect_activation_fee`, and the
  authoritative D1 (per-payout + windowed rate caps) and D2 (solvency vs. the
  attested supply snapshot) gate in `pay_redemption`; plus `post_supply_snapshot`
  (R1 attestation) and `withdraw_surplus`.

## Status

- **Type-checks on host:** `cargo check` passes (the only output is Anchor's
  benign `anchor-debug` cfg warnings).
- **Not yet:** an SBF build (`anchor build`), unit/integration tests, or a
  deploy. Those need the Anchor + Solana CLI, which are not installed in the
  authoring environment.
- **Program IDs are placeholders.** Run `anchor keys sync` after the first build.

## Prerequisites to build & deploy

```sh
# Solana CLI + Anchor (anchor not installed here)
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1 && avm use 0.30.1

anchor build            # SBF build + IDLs
anchor keys sync        # replace placeholder declare_id!/Anchor.toml IDs
anchor deploy --provider.cluster devnet   # platform
# treasury deploys to mainnet under its own multisig upgrade authority
```

## What still needs doing before mainnet

- Anchor TS tests covering: I1/I2 ordering, idempotent receipts, the D1 caps,
  the D2 solvency math, and the R1 snapshot guards (seq/staleness/increase/threshold).
- Fee-proof verification in `grant_whitelist` when `require_fee_proof` is set
  (ONCHAIN_SPEC §7).
- Wire the relayer's real `SolanaAdapter` to these instructions (its
  `OnChainAdapter` interface already maps 1:1 — see ONCHAIN_SPEC §6).
- A `post_supply_snapshot` attester service reading finalized devnet supply.
- Parameter calibration (ONCHAIN_SPEC §8) and a security review of the payout path.
