# Track C Handoff — Contracts + AI/Oracle

This is the frontend integration source of truth for the current P0 demo.

## Directory Map

```text
veil-scout/
├── track-a-contracts/       # Foundry contracts, ABI, deployment scripts
└── track-b-ai-oracle/       # Python AI analyst + oracle CLI
```

## Contract Inputs For Frontend

Use these files after Track A deployment/build:

- ABI: `veil-scout/track-a-contracts/abi/*.json`
- Addresses: `veil-scout/track-a-contracts/deployment.json`
- Mock demo data: `veil-scout/track-a-contracts/mock-data.json` after running the mock seed scripts

Core reads:

- `Market.getMarket(marketId)`
- `Market.getPosition(marketId, scoutId)`
- `Market.getYesOdds(marketId)`
- `Market.canTrade(marketId)`
- `Market.canSettle(marketId)`
- `Market.canClaim(marketId)`
- `CreditLedger.scoutIdOf(wallet)`
- `CreditLedger.freeBalance(scoutId, seasonId)`
- `Leaderboard.getTopN(seasonId, topN)`

Core writes:

- `CreditLedger.claim(seasonId, scoutId, deadline, signature)`
- `Market.takePosition(marketId, side, amount)`
- `Market.claim(marketId)`

Admin/oracle writes, not normal frontend user flows:

- `MarketFactory.createMarket(spec)`
- `Market.settle(marketId, passed)`
- `Market.voidMarket(marketId, reasonURI)`

## Track B Outputs For Frontend

Track B writes generated JSON under:

```text
veil-scout/track-b-ai-oracle/data/reports/
veil-scout/track-b-ai-oracle/data/settlements/
```

Generated files are git-ignored. For a frontend demo, copy selected JSON files into the frontend public/mock data folder, or serve them from a tiny local static server.

AI report shape:

```json
{
  "projectSlug": "agentpay",
  "generatedAt": "2026-06-02T00:00:00+00:00",
  "probability": 0.64,
  "aiPriorProbability": 0.64,
  "aiPriorLabel": "AI Prior",
  "confidence": "medium",
  "bullish": ["Demo is live"],
  "bearish": ["Low active users"],
  "riskFlags": ["possible wash activity"],
  "settleable": true,
  "dataSourcesUsed": ["github", "chain"],
  "suggestedQuestion": "Will AgentPay complete ...?",
  "fallbackUsed": false,
  "error": null,
  "evidence": {}
}
```

Frontend compatibility note: `probability` remains in the JSON for older mocks, but the UI label must be **AI Prior**, not “AI odds,” “initial odds,” or “market price.”

Verification report shape:

```json
{
  "projectSlug": "agentpay",
  "marketId": 0,
  "milestoneId": "m1",
  "passed": true,
  "recommendedReleaseAmount": 2500,
  "pauseRecommendation": false,
  "executionSummary": "Observed 3 matching contract events against a target of 1; recommend releasing the next fixed sponsor tranche.",
  "rule": {},
  "observedMetrics": {},
  "evidence": {},
  "checkedAt": "2026-06-02T00:00:00+00:00",
  "dataSourcesUsed": ["chain"],
  "dataSourceStatus": {"chain": "available"},
  "settlementRationale": "Observed 3 matching contract events; target is 1. Result is PASS.",
  "limitations": ["P0 verifier counts matching logs only; it does not yet filter unique wallets or wash activity."],
  "error": null
}
```

## Important Semantics

- There is no `seedInitialOdds()` in P0 contracts. AI Prior is off-chain display data only.
- On-chain odds come from `Market.getYesOdds(marketId)`, based on YES/NO stake.
- `Market.status`: `0 = TRADING`, `1 = SETTLED`, `2 = VOIDED`.
- `Side`: `0 = NONE`, `1 = YES`, `2 = NO`.
- `Result`: `0 = NONE`, `1 = YES`, `2 = NO`.
- One scout can only hold one side per market.
- Claiming winnings/refunds requires the position to be finalized; `Market.claim` auto-finalizes if needed.
- `Trust Boundary`: P0 uses a trusted oracle. Show this openly as “P0 trusted oracle.”

## Required P0 UI Elements

Each market detail view should show:

- **AI Prior** from Track B JSON: `aiPriorProbability` if present, otherwise `probability`.
- **Crowd Odds** from `Market.getYesOdds(marketId)`.
- **Verification Criteria** from local market metadata / project config: binary question, deadline, data source, PASS/FAIL formula.
- **Oracle Report** from Track B settlement JSON when available: `passed`, `settlementRationale`, `observedMetrics`, `dataSourceStatus`, and `limitations`.
- **Incubation Report Fields** when post-hackathon support is shown: `milestoneId`, `recommendedReleaseAmount`, `pauseRecommendation`, and `executionSummary`.
- **Trust Boundary badge**: “P0 trusted oracle.”

Avoid frontend labels that imply AI controls the market:

- do not label AI output as “market price”
- do not label AI output as “initial odds”
- do not imply AI result settles the market

## Recommended Frontend Data Flow

1. Load `deployment.json` and ABI files.
2. Connect wallet and read `CreditLedger.scoutIdOf(wallet)`.
3. If unbound, use mock claim data or ask backend for `scoutId/deadline/signature`.
4. Read market cards from on-chain `MarketCreated` events or local `mock-data.json`.
5. For each market, merge:
   - on-chain state from `Market.getMarket`
   - odds from `Market.getYesOdds`
   - AI report JSON from Track B
   - verification report JSON if settled by oracle
6. Use `takePosition` for YES/NO purchase and refresh market state after tx confirmation.
7. Use `Leaderboard.getTopN` for ranking.

## Contract + Oracle Demo Sequence

```bash
cd veil-scout/track-a-contracts
anvil --accounts 6
forge script script/DeployP0.s.sol:DeployP0 --rpc-url http://127.0.0.1:8545 --broadcast

cd ../track-b-ai-oracle
python -m track_b.cli analyze --project data/projects/agentpay.json
python -m track_b.cli create-market --project data/projects/agentpay.json --report data/reports/agentpay-ai-report.json
python -m track_b.cli advance-time --seconds 86401
python -m track_b.cli verify --project data/projects/agentpay.json --market-id 0
python -m track_b.cli settle --market-id 0 --verification data/settlements/agentpay-verification-market-0.json
```

The `demo` command performs the local Anvil time advance automatically.

## Demo Market States

Use `docs/integration/demo-market-states.md` as the static mock source for three judge-facing states:

- trading market
- settled YES market
- suspicious/failed market

## Open Integration Gaps

- Claim signatures still need either `mock-data.json` or a small backend endpoint for frontend-generated wallets.
- Track B reports are local files, not an API yet.
- Track B verification currently supports `contract_event_count` and `github_merged_prs`; unique-wallet filtering and anti-wash logic are not implemented.
- Local Anvil settlement needs time travel; Track B provides `advance-time`, and `demo` advances to the created market's resolution deadline automatically.
- The demo needs one settled market and one trading market prepared before Track C final UI polish.
