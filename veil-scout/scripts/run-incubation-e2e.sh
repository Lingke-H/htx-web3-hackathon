#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRACK_A_DIR="$ROOT_DIR/track-a-contracts"
TRACK_B_DIR="$ROOT_DIR/track-b-ai-oracle"

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
ANVIL_HOST="${ANVIL_HOST:-127.0.0.1}"
ANVIL_PORT="${ANVIL_PORT:-8545}"
CHAIN_ID="${CHAIN_ID:-31337}"
DEPLOYER_ADDRESS="${DEPLOYER_ADDRESS:-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266}"
ORACLE_REVIEWER_ADDRESS="${ORACLE_REVIEWER_ADDRESS:-$DEPLOYER_ADDRESS}"
LOOPBACK_NO_PROXY="${LOOPBACK_NO_PROXY:-127.0.0.1,localhost}"

export NO_PROXY="${NO_PROXY:+$NO_PROXY,}$LOOPBACK_NO_PROXY"
export no_proxy="${no_proxy:+$no_proxy,}$LOOPBACK_NO_PROXY"

if ! command -v forge >/dev/null 2>&1; then
  echo "forge is required to run the incubation e2e smoke test." >&2
  exit 127
fi

if ! command -v anvil >/dev/null 2>&1; then
  echo "anvil is required to run the incubation e2e smoke test." >&2
  exit 127
fi

TRACK_B_PYTHON="${TRACK_B_PYTHON:-}"
if [[ -z "$TRACK_B_PYTHON" ]]; then
  if [[ -x "$TRACK_B_DIR/.venv/bin/python" ]]; then
    TRACK_B_PYTHON="$TRACK_B_DIR/.venv/bin/python"
  else
    TRACK_B_PYTHON="$(command -v python3 || command -v python)"
  fi
fi

if [[ -z "$TRACK_B_PYTHON" ]]; then
  echo "python3 or a configured TRACK_B_PYTHON is required." >&2
  exit 127
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/veil-incubation-e2e.XXXXXX")"
ANVIL_LOG="$TMP_DIR/anvil.log"

cleanup() {
  if [[ -n "${ANVIL_PID:-}" ]] && kill -0 "$ANVIL_PID" 2>/dev/null; then
    kill "$ANVIL_PID" 2>/dev/null || true
    wait "$ANVIL_PID" 2>/dev/null || true
  fi
  rm -f "$TRACK_A_DIR/deployment.json" "$TRACK_A_DIR/incubation-demo.json"
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

rm -f "$TRACK_A_DIR/deployment.json" "$TRACK_A_DIR/incubation-demo.json"

anvil \
  --host "$ANVIL_HOST" \
  --port "$ANVIL_PORT" \
  --chain-id "$CHAIN_ID" \
  --accounts 10 \
  --block-base-fee-per-gas 0 \
  --gas-price 0 \
  --disable-min-priority-fee >"$ANVIL_LOG" 2>&1 &
ANVIL_PID=$!

for _ in $(seq 1 60); do
  if curl -sSf -X POST "$RPC_URL" \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
    break
  fi
  sleep 0.5
done

if ! curl -sSf -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
  echo "Anvil did not become ready. Log output:" >&2
  cat "$ANVIL_LOG" >&2
  exit 1
fi

(
  cd "$TRACK_A_DIR"
  forge script script/DeployP0.s.sol:DeployP0 --rpc-url "$RPC_URL" --broadcast --slow --unlocked --sender "$DEPLOYER_ADDRESS"
  forge script script/SeedIncubationDemo.s.sol:SeedIncubationDemo --rpc-url "$RPC_URL" --broadcast --slow --unlocked --sender "$DEPLOYER_ADDRESS"
)

TRACK_B_DATA_DIR="$TMP_DIR/track-b-data" \
DEPLOYMENT_JSON="$TRACK_A_DIR/deployment.json" \
CONTRACTS_DIR="$TRACK_A_DIR" \
RPC_URL="$RPC_URL" \
CHAIN_ID="$CHAIN_ID" \
ORACLE_REVIEWER_ADDRESS="$ORACLE_REVIEWER_ADDRESS" \
"$TRACK_B_PYTHON" "$TRACK_B_DIR/scripts/incubation_e2e.py" \
  --rpc-url "$RPC_URL" \
  --deployment-json "$TRACK_A_DIR/deployment.json" \
  --incubation-demo-json "$TRACK_A_DIR/incubation-demo.json" \
  --track-a-dir "$TRACK_A_DIR" \
  --track-b-dir "$TRACK_B_DIR" \
  --track-b-data-dir "$TMP_DIR/track-b-data"
