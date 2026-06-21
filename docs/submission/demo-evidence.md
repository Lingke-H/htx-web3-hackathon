# Demo and Verification Evidence

## Demo Modes

| Mode | URL or command | What it proves | Status |
| --- | --- | --- | --- |
| Public presentation | [Vercel](https://frontend-six-sigma-mw8xaa81il.vercel.app) | judge-facing product flow and bilingual UI | Demo-grade seeded fallback |
| Base Sepolia public proof | `docs/submission/base-sepolia-runbook.md` | AI Prior → two Scout Crowd Odds → verification → settlement → leaderboard → milestone release with explorer links | Not deployed |
| Local live demo | `bash veil-scout/scripts/run-live-demo.sh` | deploys and seeds contracts on local Anvil, then reads incubation state | Implemented |
| Incubation E2E | `bash veil-scout/scripts/run-incubation-e2e.sh` | deploy → assess evidence → release milestone → assert state | Implemented |

The public deployment must not be described as live chain data until `frontend/public/evidence/manifest.json` verifies against real Base Sepolia addresses and artifact hashes. Wallet fields are live only after a user connects a wallet. Market rows remain seeded demonstration data unless the Public Proof panel verifies Base Sepolia state.

## Public Proof Acceptance Target

Final public evidence should show:

- chain ID `84532`;
- non-zero Season, CreditLedger, MarketFactory, Market, Leaderboard, and IncubationVault addresses;
- Veil Scout repo `Lingke-H/htx-web3-hackathon` as the evaluated builder;
- GitHub rule: at least 1 merged PR in the 30-day window ending at the resolution deadline;
- real OpenAI AI Prior with `provider`, `model`, `promptVersion`, `inputDigest`, and `evidenceDigest`;
- Scout A YES `350 SCOUT`, Scout B NO `250 SCOUT`, Crowd Odds approximately `58.33% YES`;
- settlement, finalization, leaderboard, and milestone 0 release transaction URLs;
- `manifest.json` that passes `python -m track_b.cli verify-evidence --evidence-dir ../frontend/public/evidence`.

Public Proof panel guards: wrong chain, missing `ORACLE_ROLE`, failed verification, manifest mismatch, already-released milestone, RPC failure, revert, and rejected signature must each show an explicit reason and must not show a false success state.

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
- public Base Sepolia contracts and evidence manifest: **Not deployed**
- public demo video: **Deferred until semi-finals / Top 40**

## Evidence Map

| Claim | Repository evidence |
| --- | --- |
| non-transferable credits | `CreditLedger.sol` and Foundry tests |
| Crowd Odds | `Market.getYesOdds` and market tests |
| AI Prior | Track B analyst, JSON report, and pytest coverage |
| AI provenance and digest gates | `track_b.evidence`, `AIReport`, frontend `public-proof` unit tests |
| trusted verification | Track B verifier, criteria/report models, and CLI |
| settlement and reputation | `Market.sol`, `Leaderboard.sol`, integration tests |
| milestone accounting | `IncubationVault.sol` and Foundry tests |
| Base Sepolia public proof path | `SeedPublicDemo.s.sol`, `FinalizePublicDemo.s.sol`, `PublicProofPanel` |
| post-hackathon E2E | `scripts/incubation_e2e.py` and `run-incubation-e2e.sh` |
| bilingual judge UI | frontend localized content, copy check, lint, and build |

## Suggested Screenshots

Capture these five states after the final build:

1. canonical positioning plus Implemented / Demo-grade / Roadmap legend
2. AI Prior versus Crowd Odds
3. verification criteria, observed metrics, rationale, and limitations
4. settled market plus scout reputation outcome
5. incubation milestones with explicit local-live or seeded-fallback label
6. Public Proof panel showing either verified Base Sepolia state or a clear fallback/unavailable reason
