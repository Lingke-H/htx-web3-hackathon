# Post-Hackathon Incubation P0.5

## Core Position

Veil Scout P0.5 keeps the current scout market intact and adds a separate post-hackathon incubation layer.

New product sentence:

> Veil Scout is a credit-based scout market that discovers real builders, then uses proof-of-execution to guide post-hackathon sponsor budget release.

## Why Incubation Is Separate From Scout Markets

Scout markets and incubation budgets solve different problems.

- Scout markets discover signal:
  who looks credible before or during the hackathon.
- Incubation vaults release sponsor budget:
  how much post-hackathon support a selected project should receive after verifiable execution.

P0.5 keeps them separate on purpose.

- Scout Credits remain non-transferable and demo-grade.
- Market outcomes do not become direct cash payouts.
- Sponsor budget release is a separate accounting flow with its own state and events.
- The protocol does not become a real-money prediction market.

## What P0.5 Supports

- the existing credit-based scout market remains unchanged
- reviewer-selected projects can receive an incubation vault
- sponsor budget is recorded as a fixed vault budget
- milestones are recorded with fixed release amounts
- Track B can attach milestone verification guidance to a report
- verified milestones can release fixed tranches
- stalled projects can be paused
- remaining unreleased budget can be refunded
- frontend demo can show discovery plus incubation on one screen

## What P0.5 Does Not Support

- per-second streaming finance
- Sablier / Superfluid integration
- full community governance
- permissionless halt voting
- automatic real-token disbursement tied to scout market positions
- dynamic on-chain founder SBTs
- broad offline milestone verification
- multi-source decentralized dispute resolution

## Lifecycle

P0.5 project lifecycle:

1. discovered
   A project gains signal through the Veil Scout scout market.
2. selected
   Reviewers or sponsors choose the project for post-hackathon incubation.
3. milestone verified
   Track B verifies a concrete milestone with GitHub or on-chain evidence.
4. budget released
   A fixed sponsor tranche is released from the incubation vault accounting.
5. paused or refunded
   If execution stalls or manual review is triggered, the vault can pause and the remaining budget can be refunded.

## Contract Shape

P0.5 adds one standalone contract:

- `IncubationVault.sol`

P0.5 contract boundary:

- releases are milestone-based fixed tranches only
- `refundRemainingBudget` requires the vault to be paused first
- no unpause path is included in P0.5
- refund is demo-grade budget accounting, not live token streaming

It is intentionally separate from:

- `Market.sol`
- `CreditLedger.sol`
- `Leaderboard.sol`

This keeps the discovery layer stable while adding a lightweight incubation layer.

## Oracle Shape

Track B verification reports gain a small incubation overlay:

- `milestoneId`
- `recommendedReleaseAmount`
- `pauseRecommendation`
- `executionSummary`

These fields do not replace market settlement. They only help drive demo-grade incubation release decisions.

## Frontend Shape

The existing demo UI adds one new section:

- selected project
- sponsor budget totals
- released vs remaining budget
- milestone timeline
- vault status
- mock execution badge

This is an extension of the current screen, not a new product surface.

## Roadmap

### P0

- credit-based scout markets
- AI Prior + Crowd Odds + trusted oracle settlement
- leaderboard reputation

### P0.5

- separate incubation vault accounting
- milestone-based fixed releases
- pause and refund path
- frontend incubation panel

### P1

- richer proof-of-execution types
- API/IPFS report distribution
- challenge window for incubation release decisions
- founder execution badges

### P2

- decentralized dispute resolution
- streaming primitives if actually needed
- sponsor pool coordination and broader automation
- stronger on-chain reputation and SBT layers

## Honest Demo Framing

The honest sentence for judges is:

> Veil Scout P0.5 still uses credit-based scout markets for builder discovery, while a separate proof-of-execution incubation layer guides fixed sponsor budget release after the hackathon.
