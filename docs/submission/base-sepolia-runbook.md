# Base Sepolia Public Proof Runbook

This runbook creates the judge-facing public proof loop for Veil Scout itself as the evaluated builder. It must be executed with real secrets and test ETH; no private keys are committed or embedded in scripts.

## Required Environment

```bash
export NEXT_PUBLIC_DEMO_MODE=public
export NEXT_PUBLIC_RPC_URL=<base-sepolia-rpc-url>
export NEXT_PUBLIC_CHAIN_ID=84532

export PRIVATE_KEY=<deployer-or-settlement-private-key>
export CLAIM_SIGNER_PRIVATE_KEY=<claim-signer-private-key>
export SCOUT_A_PRIVATE_KEY=<scout-a-private-key>
export SCOUT_B_PRIVATE_KEY=<scout-b-private-key>
export OPENAI_API_KEY=<openai-api-key>
```

The deployer, claim signer, and two Scout keys must be distinct where the script requires distinct roles. The deployer funds both Scout wallets with a small amount of Base Sepolia ETH.

## Lifecycle

1. Build and test from the implementation commit.
2. Deploy the P0 contracts to Base Sepolia.
3. Set frontend public variables:
   - `NEXT_PUBLIC_MARKET_ADDRESS`
   - `NEXT_PUBLIC_MARKET_ID`
   - `NEXT_PUBLIC_LEADERBOARD_ADDRESS`
   - `NEXT_PUBLIC_INCUBATION_VAULT_ADDRESS`
   - `NEXT_PUBLIC_INCUBATION_VAULT_ID`
   - `NEXT_PUBLIC_EVIDENCE_MANIFEST_URL=/evidence/manifest.json`
4. Seed the public demo market and vault:

```bash
cd veil-scout/track-a-contracts
forge script script/SeedPublicDemo.s.sol:SeedPublicDemo \
  --rpc-url "$NEXT_PUBLIC_RPC_URL" \
  --broadcast
```

Expected public market shape:

- chain ID `84532`
- Veil Scout repo: `Lingke-H/htx-web3-hackathon`
- rule: at least 1 merged PR in the 30-day window ending at the resolution deadline
- Scout A YES `350 SCOUT`
- Scout B NO `250 SCOUT`
- Crowd Odds: approximately `58.33% YES`
- three unreleased incubation milestones

5. Generate real AI Prior evidence:

```bash
cd ../track-b-ai-oracle
export TRACK_B_DATA_DIR=data/public-proof
python -m track_b.cli analyze --project data/projects/veil-scout.json
```

6. After the resolution deadline, generate verification and release assessment artifacts, then settle/finalize:

```bash
python -m track_b.cli verify --project data/projects/veil-scout.json --market-id "$NEXT_PUBLIC_MARKET_ID"
python -m track_b.cli assess-release --project data/projects/veil-scout.json --market-id "$NEXT_PUBLIC_MARKET_ID" --vault-id "$NEXT_PUBLIC_INCUBATION_VAULT_ID" --milestone-id 0

cd ../track-a-contracts
export VERIFICATION_PASSED=true
forge script script/FinalizePublicDemo.s.sol:FinalizePublicDemo \
  --rpc-url "$NEXT_PUBLIC_RPC_URL" \
  --broadcast
```

7. Copy `project.json`, `github-snapshot.json`, `deployment.json`, `ai-report.json`, `verification.json`, and `release-assessment.json` into `veil-scout/frontend/public/evidence/` with the canonical artifact names:

```bash
mkdir -p ../frontend/public/evidence
cp data/projects/veil-scout.json ../frontend/public/evidence/project.json
cp data/public-proof/reports/veil-scout-github-snapshot.json ../frontend/public/evidence/github-snapshot.json
cp data/public-proof/reports/veil-scout-ai-report.json ../frontend/public/evidence/ai-report.json
cp data/public-proof/settlements/veil-scout-verification-market-${NEXT_PUBLIC_MARKET_ID}.json ../frontend/public/evidence/verification.json
cp data/public-proof/releases/veil-scout-market-${NEXT_PUBLIC_MARKET_ID}-vault-${NEXT_PUBLIC_INCUBATION_VAULT_ID}-milestone-0.json ../frontend/public/evidence/release-assessment.json
cp ../track-a-contracts/deployment.json ../frontend/public/evidence/deployment.json
```
8. Build the manifest from the exact code commit:

```bash
cd ../track-b-ai-oracle
python -m track_b.cli build-evidence \
  --evidence-dir ../frontend/public/evidence \
  --code-commit "$(git rev-parse HEAD)"
python -m track_b.cli verify-evidence --evidence-dir ../frontend/public/evidence
```

9. Open the frontend in public mode and verify that the Public Proof panel reads Base Sepolia, shows explorer links, and keeps `releaseMilestone` disabled unless the connected wallet has `ORACLE_ROLE` on chain `84532`.
10. With the authorized reviewer wallet, release milestone 0 from the frontend. Wait for the receipt, confirm the panel refreshes, and record the transaction URL in `deployment.json`, then rebuild and re-verify the manifest if the release transaction is part of the final evidence bundle.

## Failure Conditions

The public evidence bundle must fail if any of the following occur:

- GitHub data is unavailable;
- OpenAI fallback is used;
- artifact digests do not match;
- any required contract address is zero;
- chain ID is not `84532`;
- verification or release assessment does not pass;
- frontend environment variables disagree with `manifest.json`.
