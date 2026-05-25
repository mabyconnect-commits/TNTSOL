#!/bin/bash
# TNTSOL session-start hook for Claude Code on the web.
# Installs project deps + the Solana/Anchor toolchain so future sessions can run
# the relayer tests, the on-chain `cargo test`, and `anchor build`/deploy.
set -euo pipefail

# Web only — local environments are assumed to be set up by the developer.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ENV_FILE="${CLAUDE_ENV_FILE:-/dev/null}"
SOLANA_VER="v4.0.0"
ANCHOR_VER="0.32.1"

# Append an export to the session env file once (idempotent across resumes).
add_path() {
  local line="export PATH=\"$1:\$PATH\""
  export PATH="$1:$PATH"
  if [ "$ENV_FILE" != "/dev/null" ] && ! grep -qF "$line" "$ENV_FILE" 2>/dev/null; then
    echo "$line" >> "$ENV_FILE"
  fi
}

echo "[hook] relayer npm deps..."
( cd "$ROOT/relayer" && npm install --no-audit --no-fund )

echo "[hook] onchain cargo deps..."
( cd "$ROOT/onchain" && cargo fetch )

# --- Solana CLI. release.anza.xyz is NOT on the web allowlist, so install the
# prebuilt CLI straight from the GitHub release instead. ---
SOLANA_HOME="$HOME/.local/share/solana/install/active_release"
if ! "$SOLANA_HOME/bin/solana" --version 2>/dev/null | grep -q "${SOLANA_VER#v}"; then
  echo "[hook] installing Solana CLI $SOLANA_VER from GitHub..."
  mkdir -p "$SOLANA_HOME"
  curl -sSfL "https://github.com/anza-xyz/agave/releases/download/$SOLANA_VER/solana-release-x86_64-unknown-linux-gnu.tar.bz2" \
    | tar -xj -C "$SOLANA_HOME" --strip-components=1
fi
add_path "$SOLANA_HOME/bin"

# --- Anchor CLI: download the prebuilt binary from the GitHub release. Building
# it here fails two ways (anchor-cli's hidapi dep needs system libudev; avm
# auto-pulls a pinned legacy Solana over the network and trips the environment's
# TLS interception). The prebuilt binary just uses the Solana already on PATH. ---
add_path "$HOME/.cargo/bin"
ANCHOR_BIN_DIR="$HOME/.local/share/anchor/bin"
if ! "$ANCHOR_BIN_DIR/anchor" --version 2>/dev/null | grep -q "$ANCHOR_VER"; then
  echo "[hook] installing anchor-cli $ANCHOR_VER (prebuilt)..."
  mkdir -p "$ANCHOR_BIN_DIR"
  curl -sSfL -o "$ANCHOR_BIN_DIR/anchor" \
    "https://github.com/coral-xyz/anchor/releases/download/v$ANCHOR_VER/anchor-$ANCHOR_VER-x86_64-unknown-linux-gnu"
  chmod +x "$ANCHOR_BIN_DIR/anchor"
fi
add_path "$ANCHOR_BIN_DIR" # last add_path wins precedence over any cargo/avm shim

# --- SBF platform-tools (needed by `anchor build` / cargo-build-sbf). Its Rust
# downloader trips the proxy's TLS interception (UnknownIssuer), so fetch the
# release tarball via curl (which trusts the proxy CA) and unpack it into the
# cache path cargo-build-sbf looks for. ~500MB, one-time (persists in cache). ---
PT_VER="v1.53"
PT_DIR="$HOME/.cache/solana/$PT_VER/platform-tools"
if [ ! -d "$PT_DIR/rust" ]; then
  echo "[hook] installing SBF platform-tools $PT_VER (large, one-time)..."
  mkdir -p "$PT_DIR"
  curl -sSfL -o /tmp/platform-tools.tar.bz2 \
    "https://github.com/anza-xyz/platform-tools/releases/download/$PT_VER/platform-tools-linux-x86_64.tar.bz2" \
    && tar -xjf /tmp/platform-tools.tar.bz2 -C "$PT_DIR" && rm -f /tmp/platform-tools.tar.bz2
fi

echo "[hook] done. solana=$("$SOLANA_HOME/bin/solana" --version 2>/dev/null || echo missing) anchor=$(anchor --version 2>/dev/null || echo pending) sbf-tools=$([ -d "$PT_DIR/rust" ] && echo ok || echo pending)"
