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
- **SBF build works:** `anchor build` produces `target/deploy/{platform,treasury}.so`
  (~267K / ~317K) plus IDLs. The session-start hook pre-installs SBF
  platform-tools (fetched via curl, since cargo-build-sbf's own downloader trips
  the proxy TLS interception).
- **Program IDs** (synced via `anchor keys sync`):
  - `platform` (devnet): `E2DwHR9UdVgcdAZ4TpkjUY65x8s5qJ6TLHDh1n8gChAo`
  - `treasury` (mainnet): `Ccucx2681CT5JhV181myXGx1ZVh7n4nrFb83njNEmaZj`
  - Keypairs live in `target/deploy/*.json` — **gitignored; do not commit.**
- **Not deployed:** the Claude Code web sandbox blocks `api.devnet.solana.com`
  (`host_not_allowed`), so airdrops and `anchor deploy` must run from a machine
  with network access. See "Deploy to devnet" below.

## Prerequisites to build & deploy

On Claude Code on the web these are installed automatically by
`.claude/hooks/session-start.sh`. To set up manually (anchor-lang 0.32.1):

```sh
# Solana CLI (from the GitHub release; release.anza.xyz may be allowlist-blocked)
SOLANA_HOME="$HOME/.local/share/solana/install/active_release"; mkdir -p "$SOLANA_HOME"
curl -sSfL https://github.com/anza-xyz/agave/releases/download/v4.0.0/solana-release-x86_64-unknown-linux-gnu.tar.bz2 \
  | tar -xj -C "$SOLANA_HOME" --strip-components=1
export PATH="$SOLANA_HOME/bin:$PATH"

# Anchor CLI — download the prebuilt binary. (Compiling anchor-cli needs system
# libudev; avm auto-pulls a pinned legacy Solana over the network, which fails
# behind a TLS-intercepting proxy.)
ANCHOR_BIN="$HOME/.local/share/anchor/bin"; mkdir -p "$ANCHOR_BIN"
curl -sSfL -o "$ANCHOR_BIN/anchor" \
  https://github.com/coral-xyz/anchor/releases/download/v0.32.1/anchor-0.32.1-x86_64-unknown-linux-gnu
chmod +x "$ANCHOR_BIN/anchor"; export PATH="$ANCHOR_BIN:$PATH"

anchor build            # SBF build + IDLs  (works in the web sandbox)
```

## Deploy to devnet

Must run where `api.devnet.solana.com` is reachable (your machine, not the web
sandbox):

```sh
solana config set --url devnet
solana-keygen new -o ~/.config/solana/id.json     # if you don't have one
solana airdrop 2                                   # fund the deployer
anchor build
anchor deploy --provider.cluster devnet            # deploys `platform`
# treasury deploys to mainnet under its own multisig upgrade authority
```

`anchor keys sync` is already done (IDs above); re-run it only if you regenerate
the program keypairs.

## What still needs doing before mainnet

- Anchor TS tests covering: I1/I2 ordering, idempotent receipts, the D1 caps,
  the D2 solvency math, and the R1 snapshot guards (seq/staleness/increase/threshold).
- Fee-proof verification in `grant_whitelist` when `require_fee_proof` is set
  (ONCHAIN_SPEC §7).
- Wire the relayer's real `SolanaAdapter` to these instructions (its
  `OnChainAdapter` interface already maps 1:1 — see ONCHAIN_SPEC §6).
- A `post_supply_snapshot` attester service reading finalized devnet supply.
- Parameter calibration (ONCHAIN_SPEC §8) and a security review of the payout path.
