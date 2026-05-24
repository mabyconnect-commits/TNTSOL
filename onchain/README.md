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

- **Builds + unit-tested on host:** `cargo test` passes (9 tests covering the
  payout/fee/reserve math and config guards); `cargo check` clean apart from
  Anchor's benign `anchor-debug` cfg warnings. Pinned to anchor-lang 0.32.1.
- **Not yet:** an SBF build (`anchor build`) or integration tests against a
  validator. The session-start hook installs the Solana CLI + anchor-cli, but a
  full `anchor build` downloads SBF platform-tools at build time — confirm that
  succeeds behind the environment's network policy before relying on it.
- **Program IDs are placeholders.** Run `anchor keys sync` after the first build.

## Prerequisites to build & deploy

On Claude Code on the web these are installed automatically by
`.claude/hooks/session-start.sh`. To set up manually (anchor-lang 0.32.1):

```sh
# Solana CLI (from the GitHub release; release.anza.xyz may be allowlist-blocked)
SOLANA_HOME="$HOME/.local/share/solana/install/active_release"; mkdir -p "$SOLANA_HOME"
curl -sSfL https://github.com/anza-xyz/agave/releases/download/v4.0.0/solana-release-x86_64-unknown-linux-gnu.tar.bz2 \
  | tar -xj -C "$SOLANA_HOME" --strip-components=1
export PATH="$SOLANA_HOME/bin:$PATH"

# Anchor CLI — install anchor-cli directly (avm auto-pulls a pinned legacy
# Solana over the network, which fails behind a TLS-intercepting proxy).
cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli --locked

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
