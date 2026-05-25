#!/usr/bin/env bash
# Run Anchor integration tests against a fresh local validator.
#
# `anchor test` normally starts its own validator, but in some sandboxed
# environments its port-availability probe false-positives ("rpc port 8899 is
# already in use" with nothing actually listening). So we start the validator
# ourselves and run the suite with --skip-local-validator.
#
# Usage: bash scripts/anchor-test.sh   (pass extra anchor flags, e.g. --skip-build)
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=8899
LEDGER=/tmp/tntsol-test-ledger

# Free the port from any prior run (by port, never by process-name match).
fuser -k "$PORT/tcp" 2>/dev/null || true
sleep 2

solana-test-validator --reset --quiet --ledger "$LEDGER" >/tmp/tntsol-validator.log 2>&1 &
VALIDATOR_PID=$!
trap 'kill "$VALIDATOR_PID" 2>/dev/null || true' EXIT

echo "waiting for local validator on :$PORT ..."
for _ in $(seq 1 30); do
  solana --url "http://127.0.0.1:$PORT" cluster-version >/dev/null 2>&1 && break
  sleep 1
done

anchor test --skip-local-validator "$@"
