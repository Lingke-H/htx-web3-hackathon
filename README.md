# HTX Web3 Hackathon

# Veil Scout

Veil Scout discovers real builders through a credit-based scout market, then guides milestone-based sponsor budget release through verified execution.

## The Problem

Hackathon projects usually stop at ranking. Judges can identify strong teams, but prize distribution is still mostly one-shot, and promising projects often disappear before sponsors see real follow-through.

## The Product

Veil Scout keeps the hackathon discovery loop intact, then adds a separate post-hackathon incubation lane:

- a **credit-based scout market** discovers which teams look real
- a **proof-of-execution oracle flow** reviews whether those teams keep shipping
- a **milestone-based incubation vault** releases fixed sponsor budget tranches only after verified execution

This release stays explicitly demo-grade:

- no real-money prediction market
- no token custody
- no automatic investment
- no per-second streaming
- no governance or dispute layer

## Two-Layer Architecture

### 1. Scout Discovery Layer

- `Season.sol`: season windows and admin lifecycle
- `CreditLedger.sol`: non-transferable scout credits
- `Market.sol` + `MarketFactory.sol`: binary milestone markets and odds
- `Leaderboard.sol`: scout reputation and ranking

This layer answers: *who looks like a real builder before the hackathon ends?*

### 2. Post-Hackathon Incubation Layer

- Track B AI + Oracle: proof-of-execution reports and milestone release assessment
- `IncubationVault.sol`: fixed-tranche sponsor accounting, pause, and refund
- frontend incubation panel: live read from configured RPC, or honest labeled fallback

This layer answers: *should sponsor budget keep moving after the hackathon?*

## Six-Step Lifecycle

1. **Discover**: scouts use non-transferable credits to back or reject project outcomes.
2. **Select**: judges or sponsors choose a project after scout-market signal appears.
3. **Verify**: Track B checks proof-of-execution evidence such as merged PRs or contract activity.
4. **Release**: an authorized reviewer releases the next fixed milestone tranche from `IncubationVault`.
5. **Pause or Refund**: if execution stalls or evidence fails review, the vault can pause and remaining sponsor units can be refunded.
6. **Show the Story**: the frontend presents live or clearly labeled fallback incubation state for judges.

## One-Command Demo

After installing the prerequisites below, start the local judge demo from the repository root:

```bash
bash veil-scout/scripts/run-live-demo.sh
```

Expected ready banner:

- Frontend URL
- chain ID `31337`
- seeded `IncubationVault` address
- vault ID `0`
- initial state: `ACTIVE`, 3 milestones, `4,000` released, `8,000` remaining

## What Is Implemented

- credit-based scout markets with non-transferable season credits
- on-chain odds derived from scout exposure
- Track B AI Prior and trusted settlement verification flow
- post-hackathon `IncubationVault` with milestone release, pause, and refund
- automated local incubation E2E smoke test
- read-only incubation live reads without requiring a browser wallet
- English / Chinese judge-facing demo UI

## What Is Still Demo-Grade

- sponsor accounting uses demo sponsor units, not real funds
- AI reports and milestone assessments are advisory
- an authorized reviewer still submits release transactions manually
- built-in fallback data remains part of the judge demo story
- no permissionless dispute resolution, governance, streaming, or custody

## Fresh-Clone Setup

Release baseline:

- Node `24.16.0`
- Python `3.11+`
- Foundry installed through `foundryup`

Suggested setup from a clean clone:

```bash
# Node 24
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install
nvm use

# Foundry
curl -L https://foundry.paradigm.xyz | bash
export PATH="$HOME/.foundry/bin:$PATH"
foundryup

# Python 3.11+
brew install python@3.13
export PATH="/opt/homebrew/opt/python@3.13/libexec/bin:$PATH"
python3 --version

# Frontend
cd veil-scout/frontend
npm ci
cd ../..

# Track B
cd veil-scout/track-b-ai-oracle
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -e . --no-build-isolation
cd ../..
```

Verification commands:

```bash
cd veil-scout/track-a-contracts
forge fmt --check
forge test
cd ../..

cd veil-scout/track-b-ai-oracle
source .venv/bin/activate
python -m py_compile src/track_b/*.py scripts/incubation_e2e.py
pytest
cd ../..

cd veil-scout/frontend
npm run lint
npm run build
cd ../..

bash veil-scout/scripts/run-incubation-e2e.sh
bash veil-scout/scripts/run-live-demo.sh
```

## Repository Layout

```text
.
├── docs/
│   ├── p0/specs/                  # P0 through P0.8 mechanism and demo docs
│   ├── submission/                # submission package, judge Q&A, rehearsal checklist
│   └── reports/                   # final completion report
└── veil-scout/
    ├── track-a-contracts/         # contracts, scripts, ABI, tests
    ├── track-b-ai-oracle/         # AI + oracle CLI, verifier logic, tests
    ├── frontend/                  # judge-facing Next.js demo
    └── scripts/                   # local E2E and one-command live demo
```

## Documentation

- [P0.8 Judge Demo Guide](docs/p0/specs/p08-judge-demo-guide.md)
- [Incubation Demo Runbook](docs/p0/specs/post-hackathon-incubation-demo-runbook.md)
- [Submission Package](docs/submission/p08-submission-package.md)
- [Judge Q&A](docs/submission/p08-judge-qa.md)
- [Demo Rehearsal Checklist](docs/submission/p08-demo-rehearsal-checklist.md)
- [Final Completion Report](docs/reports/p08-final-completion-report.md)

## Local State Notes

Ignored local state includes:

- `.env` files
- virtual environments
- frontend dependency caches and build outputs
- generated deployment and seed files
- temporary screenshots, logs, and machine-specific files
