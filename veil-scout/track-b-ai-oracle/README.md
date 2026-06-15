# Veil Scout Track B — AI Analyst + Oracle CLI

Track B turns project evidence into two off-chain artifacts:

- an AI analyst report with an **AI Prior** probability and reasoning
- an oracle verification report that can be used to call `Market.settle`
- an advisory milestone-release report that can be reviewed before calling `IncubationVault.releaseMilestone`

The P0 contracts do not expose `seedInitialOdds`, so AI Prior is stored in JSON for the frontend and does not mutate on-chain odds. On-chain Crowd Odds come from `Market.getYesOdds`.

## Setup

```bash
cd veil-scout/track-b-ai-oracle
python3 -m venv .venv
source .venv/bin/activate
python --version
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -e . --no-build-isolation
cp .env.example .env
```

Use Python `3.11+`. Then set `OPENAI_API_KEY`, `RPC_URL`, `PRIVATE_KEY`, and `DEPLOYMENT_JSON` in `.env`.

If your system `python3` is older, install a newer interpreter first, for example on macOS/Homebrew:

```bash
brew install python@3.13
export PATH="/opt/homebrew/opt/python@3.13/libexec/bin:$PATH"
```

## Commands

```bash
python -m track_b.cli analyze --project data/projects/agentpay.json
python -m track_b.cli create-market --project data/projects/agentpay.json --report data/reports/agentpay-ai-report.json
python -m track_b.cli verify --project data/projects/agentpay.json --market-id 0
python -m track_b.cli assess-release --project data/projects/agentpay.json --market-id 0 --vault-id 0 --milestone-id 1
python -m track_b.cli settle --market-id 0 --verification data/settlements/agentpay-verification-market-0.json
python -m track_b.cli demo --project data/projects/agentpay.json
```

For local Anvil, deploy Track A first:

```bash
cd ../track-a-contracts
export PATH="$HOME/.foundry/bin:$PATH"
forge script script/DeployP0.s.sol:DeployP0 --rpc-url http://127.0.0.1:8545 --broadcast
```

## Project Config Shape

See `data/projects/agentpay.json`. The first verifier supports:

- `contract_event_count`: pass when matching logs are at least `target`
- `github_merged_prs`: pass when merged PR count is at least `target`

## Trust Boundary

`assess-release` is advisory only.

- it validates the fixed on-chain milestone amount
- it writes a structured release report
- it prints a reviewer-ready `cast send` preview
- it does **not** submit `releaseMilestone` automatically
