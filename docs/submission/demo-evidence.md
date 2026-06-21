# Demo and Verification Evidence

## Demo Modes

| Mode | URL or command | What it proves | Status |
| --- | --- | --- | --- |
| Public presentation | [Vercel](https://frontend-six-sigma-mw8xaa81il.vercel.app) | judge-facing product flow and bilingual UI | Demo-grade seeded fallback |
| Local live demo | `bash veil-scout/scripts/run-live-demo.sh` | deploys and seeds contracts on local Anvil, then reads incubation state | Implemented |
| Incubation E2E | `bash veil-scout/scripts/run-incubation-e2e.sh` | deploy → assess evidence → release milestone → assert state | Implemented |

The public deployment must not be described as live chain data. Wallet fields are live only after a user connects a wallet. Market rows remain seeded demonstration data. A configured local Anvil session supplies the live incubation contract read.

## Expected Local Demo State

- chain ID: `31337`
- generated `IncubationVault` address: printed by the ready banner
- vault ID: `0`
- vault status: `ACTIVE`
- milestone count: `3`
- milestone 0: released
- milestone 1: under review
- released sponsor units: `4,000`
- remaining sponsor units: `8,000`

Generated deployment JSON is local state and is intentionally ignored by Git.

## Verification Commands

```bash
bash veil-scout/scripts/check-submission-package.sh

cd veil-scout/track-a-contracts
forge fmt --check
forge test

cd ../track-b-ai-oracle
python -m py_compile src/track_b/*.py scripts/incubation_e2e.py
pytest

cd ../frontend
npm run test:copy
npm run lint
npm run build

cd ../..
bash veil-scout/scripts/run-incubation-e2e.sh
```

CI runs the submission package, Foundry, Python, frontend, and incubation E2E lanes in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

## Release and Deployment Facts

- reproducible demo release baseline: [`v0.8.2-demo`](https://github.com/Lingke-H/HTX-Web3-Hackathon/releases/tag/v0.8.2-demo)
- release commit: `22fc9ea`
- current public presentation URL: [frontend-six-sigma-mw8xaa81il.vercel.app](https://frontend-six-sigma-mw8xaa81il.vercel.app)
- public testnet contracts: **Not deployed**
- public demo video: **Not supplied**

## Evidence Map

| Claim | Repository evidence |
| --- | --- |
| non-transferable credits | `CreditLedger.sol` and Foundry tests |
| Crowd Odds | `Market.getYesOdds` and market tests |
| AI Prior | Track B analyst, JSON report, and pytest coverage |
| trusted verification | Track B verifier, criteria/report models, and CLI |
| settlement and reputation | `Market.sol`, `Leaderboard.sol`, integration tests |
| milestone accounting | `IncubationVault.sol` and Foundry tests |
| post-hackathon E2E | `scripts/incubation_e2e.py` and `run-incubation-e2e.sh` |
| bilingual judge UI | frontend localized content, copy check, lint, and build |

## Suggested Screenshots

Capture these five states after the final build:

1. canonical positioning plus Implemented / Demo-grade / Roadmap legend
2. AI Prior versus Crowd Odds
3. verification criteria, observed metrics, rationale, and limitations
4. settled market plus scout reputation outcome
5. incubation milestones with explicit local-live or seeded-fallback label
