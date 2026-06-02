# Track A/B Status Review

## Current State

- **Track A**: P0 contracts are implemented under `veil-scout/track-a-contracts`.
- **Track B**: AI analyst + oracle CLI is implemented under `veil-scout/track-b-ai-oracle`.
- **Track C**: Not implemented yet; use `docs/integration/track-c-handoff.md` before starting.

## What Is Closed

- Contract P0 lifecycle: season, claim credits, create market, take position, settle/void, finalize, claim, leaderboard.
- Credit accounting: ledger-centered free/locked/reserve model with market-season binding.
- Track B off-chain AI report: structured JSON with fallback behavior.
- Track B oracle path: verification report can drive `Market.settle`.
- Basic data adapters: GitHub repo activity and JSON-RPC log counting.

## Remaining Mechanism Gaps

- **AI Prior is not on-chain**: P0 has no `seedInitialOdds`; frontend must show AI Prior as analysis, not as market price.
- **Settlement trust is centralized**: `SETTLEMENT_ROLE` still controls result. This is acceptable for P0 demo but should be framed as trusted oracle.
- **Verification is demo-grade**: event count and merged PR count exist; unique wallets, wash filtering, multi-source quorum, and challenge windows are P1/P2.
- **Claim signature service is missing**: mock scripts can generate demo claim data, but a frontend-friendly signing endpoint is not implemented.
- **Report distribution is local**: Track B writes JSON files; no API/IPFS layer yet.
- **Local settlement needs time travel**: Track B provides `advance-time`, and `demo` advances Anvil to the market's resolution deadline automatically.

## Recommended Next Refinements Before Track C

1. Run one full local Anvil loop and save a known-good `deployment.json`, `mock-data.json`, AI report, and verification report for frontend mock integration.
2. Decide whether Track C reads Track B reports from copied static JSON or a tiny local API.
3. Prepare a claim-signature handoff for frontend wallets, even if it is only a mock script output for demo.
4. Add two demo markets:
   - one `TRADING` market for buy YES/NO flow
   - one `SETTLED` market for claim/leaderboard flow
5. Add one suspicious/failed market so the demo can show AI/crowd disagreement and oracle transparency.
6. Keep contract ABI frozen for frontend; if Track A changes ABI, regenerate ABI and update `docs/integration/track-c-handoff.md`.
