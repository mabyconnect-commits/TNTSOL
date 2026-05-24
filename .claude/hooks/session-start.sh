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

# --- Anchor CLI. Installed straight from source via cargo rather than avm: the
# current avm auto-installs a pinned legacy Solana over the network on `use`,
# which fails here (TLS interception => UnknownIssuer in avm's rust client). A
# direct anchor-cli binary just uses the Solana already on PATH. ---
add_path "$HOME/.cargo/bin"
if ! anchor --version 2>/dev/null | grep -q "$ANCHOR_VER"; then
  echo "[hook] installing anchor-cli $ANCHOR_VER (slow, one-time)..."
  cargo install --git https://github.com/coral-xyz/anchor --tag "v$ANCHOR_VER" anchor-cli --locked --force
fi

echo "[hook] done. solana=$("$SOLANA_HOME/bin/solana" --version 2>/dev/null || echo missing) anchor=$(anchor --version 2>/dev/null || echo pending)"
