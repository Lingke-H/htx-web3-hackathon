# P0.5 Mechanism Closure

This document turns the original open questions into explicit P0 policy and P1 roadmap items.

## Core Position

Veil Scout P0 is a **credit-based scout judgment tournament**, not a full prediction market.

P0 intentionally does **not** implement:

- AMM / LMSR pricing
- external liquidity providers
- real-money wagering
- AI-controlled market making
- permissionless dispute resolution

P0 implements:

- non-transferable seasonal Scout Credits
- YES/NO milestone judgments
- winner-takes-loser-credit proportional payout
- on-chain leaderboard score deltas
- trusted oracle settlement with an auditable report

## 1. Credit Liquidity

Concern: if credits are consumable and non-transferable, will market activity dry up mid-season?

P0 answer:

- Credits are not burned when scouts trade; they move from free balance into market escrow.
- After settlement, winners receive their stake plus a proportional share of losing stakes.
- Bad scouts lose influence over the season; good scouts gain more credits and more influence.
- `MAX_STAKE_PER_MARKET` prevents a scout from spending the full season allocation on one market.

P1 option:

- staged credit release
- reserved credits for late-season markets
- higher next-season allocation for high-reputation scouts

## 2. Season Transition

Concern: how do credits and reputation move between seasons?

P0 answer:

- Credits are season-scoped and do not transfer across seasons.
- `freeBalance`, `totalMintedCredits`, `marketLockedCredits`, and `seasonProtocolReserve` are isolated by `seasonId`.
- Leaderboard performance is the durable reputation signal.

P1 option:

- next-season credit boosts based on historical leaderboard rank
- Alpha Scout badges
- season reward claiming

## 3. Reward Pool Funding

Concern: if credits have no cash value, where do token rewards come from?

P0 answer:

- Rewards come from sponsor/ecosystem budget, not from user losses.
- Credits only measure judgment skill; they are not a revenue source.
- The protocol is positioned as project discovery infrastructure for hackathons, DAOs, grants, and launchpads.

Business model:

- project admission / certification fee
- ecosystem due diligence subscription
- launchpad reputation API
- grant-screening tooling for DAO/investor workflows

## 4. AI Prior, No AMM, No LP

Concern: if AI provides initial odds, who supplies AMM liquidity?

P0 answer:

- There is no AMM and no LP.
- AI produces an **AI Prior**: a first analyst probability and reasoning report.
- The AI Prior is off-chain display data and never acts as market price.
- On-chain `Market.getYesOdds()` is only a crowd signal derived from YES/NO stake ratio.
- Payout ignores price and uses proportional distribution of losing credits to winning scouts.

Why this is safer:

- the system never acts as counterparty
- no virtual LP loss or inflation risk
- no need for LMSR complexity in P0
- users can explicitly disagree with AI by taking the opposite side

## 5. Market Criteria Authority

Concern: who writes the settlement standard for each market?

P0 answer:

- Project teams may propose milestones.
- They cannot unilaterally finalize market criteria.
- `MARKET_CREATOR_ROLE` represents the platform/reviewer that approves a binary, verifiable MarketSpec.
- `projectOwner` is prevented from trading in its own market.

Market criteria must include:

- binary question
- deadline
- data source
- PASS/FAIL formula
- force-void path if criteria become invalid

## 6. Project-Submitted Milestones

Concern: can project teams game easy milestones?

P0 answer:

- Project-submitted milestones are proposals, not final market definitions.
- Market admission requires reviewer approval.
- The final spec is anchored by `specHash` and `metadataURI`.
- The frontend should show who proposed the milestone and which reviewer/oracle approved it.

P1 option:

- community challenge period before market opens
- reputation penalties for projects submitting low-quality milestones

## 7. Evidence Score

Concern: who validates evidence, and can evidence be farmed?

P0 answer:

- Evidence Score is not part of on-chain scoring in P0.
- P0 leaderboard score is virtual PnL from settled market positions only.
- Evidence and risk notes may be displayed as qualitative support but do not change credits or leaderboard.

P1 option:

- evidence submission registry
- AI-assisted evidence scoring
- human/community confirmation
- spam and duplicate evidence penalties

## 8. Oracle Operation

Concern: who runs settlement and does that introduce centralization?

P0 answer:

- Track B runs the trusted oracle.
- It collects GitHub/on-chain data, writes a verification report, and calls `Market.settle`.
- The wallet must hold `SETTLEMENT_ROLE`.
- This is centralized by design for P0 demo reliability.

P1 option:

- optimistic oracle
- multi-source quorum
- challenge window
- on-chain commitment to verification reports

## Demo Framing

The honest P0 sentence:

> Veil Scout P0 uses a trusted oracle and non-transferable credits to prove that AI-assisted scout judgment can discover real builders; P1 decentralizes settlement and expands reputation.

