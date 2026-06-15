#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRACK_A_DIR="$ROOT_DIR/track-a-contracts"
FRONTEND_DIR="$ROOT_DIR/frontend"

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
ANVIL_HOST="${ANVIL_HOST:-127.0.0.1}"
ANVIL_PORT="${ANVIL_PORT:-8545}"
CHAIN_ID="${CHAIN_ID:-31337}"
PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
LOOPBACK_NO_PROXY="${LOOPBACK_NO_PROXY:-127.0.0.1,localhost}"

FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
FRONTEND_URL="http://${FRONTEND_HOST}:${FRONTEND_PORT}"
FRONTEND_SELECTED_PROJECT="${FRONTEND_SELECTED_PROJECT:-AgentPay}"
FRONTEND_INCUBATION_CHAIN_ID="${FRONTEND_INCUBATION_CHAIN_ID:-$CHAIN_ID}"
FRONTEND_RPC_URL="${FRONTEND_RPC_URL:-$RPC_URL}"
FRONTEND_READY_ATTEMPTS="${FRONTEND_READY_ATTEMPTS:-240}"

export NO_PROXY="${NO_PROXY:+$NO_PROXY,}$LOOPBACK_NO_PROXY"
export no_proxy="${no_proxy:+$no_proxy,}$LOOPBACK_NO_PROXY"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/veil-live-demo.XXXXXX")"
ANVIL_LOG="$TMP_DIR/anvil.log"
FRONTEND_LOG="$TMP_DIR/frontend.log"
FRONTEND_ENV_FILE="$TMP_DIR/frontend-demo.env"

cleanup() {
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${ANVIL_PID:-}" ]] && kill -0 "$ANVIL_PID" 2>/dev/null; then
    kill "$ANVIL_PID" 2>/dev/null || true
    wait "$ANVIL_PID" 2>/dev/null || true
  fi
  rm -f "$TRACK_A_DIR/deployment.json" "$TRACK_A_DIR/incubation-demo.json"
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "$2" >&2
    exit 127
  fi
}

wait_for_http() {
  local url="$1"
  local label="$2"

  for _ in $(seq 1 "$FRONTEND_READY_ATTEMPTS"); do
    if curl -sSf "$url" >/dev/null 2>&1; then
      return 0
    fi
    if [[ -n "${FRONTEND_PID:-}" ]] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo "$label exited before it became ready. Recent log output:" >&2
      tail -n 80 "$FRONTEND_LOG" >&2 || true
      exit 1
    fi
    sleep 0.5
  done

  echo "$label did not become ready in time. Recent log output:" >&2
  tail -n 80 "$FRONTEND_LOG" >&2 || true
  exit 1
}

require_command forge "forge is required to run the live judge demo."
require_command anvil "anvil is required to run the live judge demo."
require_command python3 "python3 is required to configure the live judge demo."
require_command curl "curl is required to probe the local demo services."
require_command npm "npm is required to start the live judge demo frontend."

if lsof -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
  echo "Port $FRONTEND_PORT is already in use. Set FRONTEND_PORT to a free port and rerun the live judge demo." >&2
  exit 1
fi

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
  forge script script/DeployP0.s.sol:DeployP0 --rpc-url "$RPC_URL" --broadcast --slow
  forge script script/SeedIncubationDemo.s.sol:SeedIncubationDemo --rpc-url "$RPC_URL" --broadcast --slow
)

python3 - "$TRACK_A_DIR/deployment.json" "$TRACK_A_DIR/incubation-demo.json" "$FRONTEND_ENV_FILE" "$FRONTEND_RPC_URL" "$FRONTEND_INCUBATION_CHAIN_ID" "$FRONTEND_SELECTED_PROJECT" <<'PY'
import json
import sys
from pathlib import Path

deployment_path = Path(sys.argv[1])
demo_path = Path(sys.argv[2])
env_path = Path(sys.argv[3])
rpc_url = sys.argv[4]
chain_id = sys.argv[5]
selected_project = sys.argv[6]

deployment = json.loads(deployment_path.read_text())
demo = json.loads(demo_path.read_text())

env_path.write_text(
    "\n".join(
        [
            f"NEXT_PUBLIC_RPC_URL={rpc_url}",
            f"NEXT_PUBLIC_INCUBATION_CHAIN_ID={chain_id}",
            f"NEXT_PUBLIC_INCUBATION_VAULT_ADDRESS={deployment['incubationVault']}",
            f"NEXT_PUBLIC_INCUBATION_VAULT_ID={demo['vaultId']}",
            f"NEXT_PUBLIC_INCUBATION_SELECTED_PROJECT={selected_project}",
        ]
    )
    + "\n",
    encoding="utf-8",
)
PY

(
  cd "$FRONTEND_DIR"
  set -a
  source "$FRONTEND_ENV_FILE"
  set +a
  npm run dev -- --webpack --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

wait_for_http "$FRONTEND_URL" "The frontend webpack dev server"

VAULT_ADDRESS="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["incubationVault"])' "$TRACK_A_DIR/deployment.json")"
VAULT_ID="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["vaultId"])' "$TRACK_A_DIR/incubation-demo.json")"

cat <<EOF
Live judge demo is ready.

Frontend URL: $FRONTEND_URL
Chain ID: $CHAIN_ID
Vault address: $VAULT_ADDRESS
Vault ID: $VAULT_ID
Read-only RPC: $FRONTEND_RPC_URL

Expected initial UI state:
- data source label: Live contract data
- vault status: ACTIVE
- milestone count: 3
- milestone 0: Released
- milestone 1: Under review
- released budget: 4,000
- remaining budget: 8,000

Logs:
- Anvil: $ANVIL_LOG
- Frontend: $FRONTEND_LOG

Press Ctrl-C to stop the demo and clean up temporary files.
EOF

wait "$FRONTEND_PID"
