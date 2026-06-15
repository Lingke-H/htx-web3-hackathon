# Post-Hackathon Incubation Demo Runbook

This runbook covers the narrow P0.6 demo loop:

`project selected -> vault created -> milestone recorded -> oracle report generated -> reviewer releases milestone -> frontend displays updated vault state`

## Scope

- credit-based scout discovery stays separate from incubation
- sponsor budget uses demo-grade accounting units only
- milestone release is authorized and manual
- no automatic investment, token custody, or per-second streaming

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
  --private-key $ORACLE_PRIVATE_KEY
```

This remains an authorized demo action. It is not automatic funding.

## 6. Refresh the Frontend

Set the frontend config from `incubation-demo.json`:

```bash
cd veil-scout/frontend
export NEXT_PUBLIC_INCUBATION_VAULT_ADDRESS=<INCUBATION_VAULT_ADDRESS>
export NEXT_PUBLIC_INCUBATION_VAULT_ID=0
export NEXT_PUBLIC_INCUBATION_SELECTED_PROJECT=AgentPay
npm run dev
```

When an injected wallet/provider is available and the configured vault can be read, the incubation panel shows:

- live contract data
- vault status
- total / released / refunded / remaining sponsor budget
- milestone timeline and release state

If the address is missing, the provider is unavailable, or the network cannot be read, the UI falls back to clearly labeled demo data.
