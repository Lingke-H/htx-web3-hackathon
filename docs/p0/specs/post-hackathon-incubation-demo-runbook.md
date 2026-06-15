# Post-Hackathon Incubation Demo Runbook

This runbook covers the narrow P0.8 demo loop:

`project selected -> vault created -> milestone recorded -> oracle report generated -> reviewer releases milestone -> frontend displays updated vault state`

## Scope

- credit-based scout discovery stays separate from incubation
- sponsor budget uses demo-grade accounting units only
- milestone release is authorized and manual
- no automatic investment, token custody, or per-second streaming

## One-Command Smoke Test

Run the full local demo loop with one command:

```bash
bash veil-scout/scripts/run-incubation-e2e.sh
```

This script:

- starts a temporary local Anvil node
- deploys Track A
- seeds the incubation vault
- runs a deterministic Track B advisory report
- manually releases the pending milestone with the authorized reviewer account
- asserts the post-release state
- shuts Anvil down even when the test fails

## One-Command Live Judge Demo

Run the full local judge demo with one command:

```bash
bash veil-scout/scripts/run-live-demo.sh
```

This script:

- starts a temporary local Anvil node
- deploys Track A and seeds the incubation vault
- configures the frontend with a temporary read-only RPC setup
- starts the frontend without touching `.env.local`
- prints the frontend URL, chain ID, vault address, and vault ID
- keeps Anvil and the frontend alive until interrupted

## 1. Deploy Track A

Start a local Anvil node, then deploy the existing P0 contracts plus `IncubationVault`.

```bash
cd veil-scout/track-a-contracts
forge script script/DeployP0.s.sol:DeployP0 \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

This writes `deployment.json`.

## 2. Seed the Incubation Demo Vault

Seed one demo vault with three fixed milestones. The script releases milestone `0`, leaves milestone `1` pending, and keeps the vault active.

```bash
cd veil-scout/track-a-contracts
forge script script/SeedIncubationDemo.s.sol:SeedIncubationDemo \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

This writes `incubation-demo.json` with:

- `incubationVault`
- `vaultId`
- milestone release states

The seed script refuses to create a second demo vault on the same deployment, so reruns do not silently create duplicate state.

Expected seeded state before the second release:

- `nextVaultId = 1`
- `vaultId = 0`
- vault status = `ACTIVE`
- milestone count = `3`
- milestone `0` released = `true`
- milestone `1` released = `false`
- released budget = `4,000`
- remaining budget = `8,000`

## 3. Generate the Track B Milestone Report

Create an advisory release report for the next pending milestone.

```bash
cd veil-scout/track-b-ai-oracle
python -m track_b.cli assess-release \
  --project data/projects/agentpay.json \
  --market-id 0 \
  --vault-id 0 \
  --milestone-id 1
```

The report includes:

- `vaultId`
- `milestoneId`
- `passed`
- `recommendedReleaseAmount`
- `pauseRecommendation`
- `executionSummary`
- evidence and limitations
- a reviewer command preview for `releaseMilestone`

Track B is advisory only. It does not submit the on-chain release.

Expected advisory report checks:

- `passed = true`
- `recommendedReleaseAmount = 4000`
- `vaultId = 0`
- `milestoneId = 1`
- trust boundary text explicitly says the report is advisory only
- no state changes happen before the reviewer release transaction

## 4. Review the Recommendation

Open the generated JSON under `veil-scout/track-b-ai-oracle/data/releases/`.

Confirm:

- the milestone is still unreleased
- the recommended amount matches the fixed on-chain milestone amount
- the trust boundary is explicit: an authorized reviewer still decides whether to submit the transaction

## 5. Execute the Milestone Release

Use the printed command preview or call `releaseMilestone` directly.

Example:

```bash
cast send <INCUBATION_VAULT_ADDRESS> \
  "releaseMilestone(uint256,uint256,string)" \
  0 \
  1 \
  "Proof-of-execution verified; release the second fixed sponsor tranche." \
  --rpc-url http://127.0.0.1:8545 \
  --unlocked \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

This remains an authorized demo action. It is not automatic funding.

Expected state after reviewer release:

- milestone `1` released = `true`
- released budget = `8,000`
- remaining budget = `4,000`
- vault status remains `ACTIVE`

## 6. Refresh the Frontend

Set the frontend config from `incubation-demo.json`:

```bash
cd veil-scout/frontend
export NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
export NEXT_PUBLIC_INCUBATION_VAULT_ADDRESS=<INCUBATION_VAULT_ADDRESS>
export NEXT_PUBLIC_INCUBATION_VAULT_ID=0
export NEXT_PUBLIC_INCUBATION_CHAIN_ID=31337
export NEXT_PUBLIC_INCUBATION_SELECTED_PROJECT=AgentPay
npm run dev
```

When the configured read-only RPC or an injected provider can read the configured vault, the incubation panel shows:

- live contract data
- vault status
- total / released / refunded / remaining sponsor budget
- milestone timeline and release state

If the address is missing, the live read path is misconfigured, or the network cannot be read, the UI falls back to clearly labeled demo data.

## Troubleshooting

### Wrong network

If `NEXT_PUBLIC_INCUBATION_CHAIN_ID` is set and the configured read-only RPC or connected wallet is on a different chain, the incubation panel falls back to demo data and explains the mismatch. This is expected behavior.

### Missing provider

If `NEXT_PUBLIC_RPC_URL` is configured, the incubation panel can still show `Live contract data` without any wallet or injected provider. If there is no configured read-only RPC and no injected provider is available, the panel remains in `Demo fallback data` mode.

### Stale deployment files

The smoke test removes stale `deployment.json` and `incubation-demo.json` before each run. If you are running steps manually, remove both files before redeploying:

```bash
rm -f veil-scout/track-a-contracts/deployment.json
rm -f veil-scout/track-a-contracts/incubation-demo.json
```

### Missing local Anvil

If `anvil` is not installed on the current machine, the local smoke test cannot run. In that case the GitHub Actions `incubation-e2e` job becomes the source of truth for the automated end-to-end check.
