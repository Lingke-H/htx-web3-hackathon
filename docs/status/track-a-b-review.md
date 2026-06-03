# Track A/B Status Review

## Current State

- **Track A**: P0 contracts are implemented under `veil-scout/track-a-contracts`.
- **Track B**: AI analyst + oracle CLI is implemented under `veil-scout/track-b-ai-oracle`.
- **Track C**: Sci-fi demo frontend is implemented under `veil-scout/frontend`, currently consuming static demo JSON shaped like the Track B / Track C handoff.

## What Is Closed

- Contract P0 lifecycle: season, claim credits, create market, take position, settle/void, finalize, claim, leaderboard.
- Credit accounting: ledger-centered free/locked/reserve model with market-season binding.
- Track B off-chain AI report: structured JSON with fallback behavior.
- Track B oracle path: verification report can drive `Market.settle`.
- Basic data adapters: GitHub repo activity and JSON-RPC log counting.
- Track C judge-facing demo: one screen shows AI Prior, Crowd Odds, scout action, oracle report, trusted-oracle boundary, settlement status, and wallet state.

## Remaining Mechanism Gaps

- **AI Prior is not on-chain**: P0 has no `seedInitialOdds`; frontend must show AI Prior as analysis, not as market price.
- **Settlement trust is centralized**: `SETTLEMENT_ROLE` still controls result. This is acceptable for P0 demo but should be framed as trusted oracle.
- **Verification is demo-grade**: event count and merged PR count exist; unique wallets, wash filtering, multi-source quorum, and challenge windows are P1/P2.
- **Claim signature service is missing**: mock scripts can generate demo claim data, but a frontend-friendly signing endpoint is not implemented.
- **Report distribution is local/static**: Track B writes JSON files and Track C consumes static demo JSON; no API/IPFS layer yet.
- **Local settlement needs time travel**: Track B provides `advance-time`, and `demo` advances Anvil to the market's resolution deadline automatically.

## Recommended Final Refinements Before Demo

1. Run one full local Anvil loop and save a known-good `deployment.json`, AI report, and verification report for demo backup.
2. Keep Track C on static demo JSON for P0 judging; P1 can replace the same schema with API/IPFS/live reads.
3. Prepare a claim-signature handoff for frontend wallets, even if it is only a mock script output for demo.
4. Keep the three frontend demo market states aligned with `docs/integration/demo-market-states.md`:
   - one `TRADING` market for buy YES/NO flow
   - one `SETTLED YES` market for successful oracle settlement
   - one suspicious/failed market for AI/crowd disagreement and oracle transparency
5. Keep contract ABI frozen for frontend; if Track A changes ABI, regenerate ABI and update `docs/integration/track-c-handoff.md`.
