# Continuous Hackathon Protocol Fit

## Merged Position

Project Veil now lives inside Veil Scout as the post-hackathon incubation layer.

The merged sentence is:

> Veil Scout is a credit-based scout market that discovers real builders, then uses proof-of-execution to guide post-hackathon sponsor budget release.

## Why The Merge Works

Veil Scout already solves builder discovery.

- AI Prior gives the first analyst view
- scouts express conviction with non-transferable credits
- the oracle verifies milestones and updates reputation

The Continuous Hackathon Protocol solves the next problem:

- what happens after strong projects are discovered
- how sponsor budget can be released gradually instead of all at once
- how execution evidence can pause or continue support

Together, discovery and incubation form a cleaner product arc than either idea alone.

## P0.5 Scope

P0.5 keeps the current Veil Scout market loop intact and adds a small incubation vault layer.

- no real-money prediction market
- no per-second streaming
- no full governance
- no dynamic on-chain SBT

Instead, P0.5 supports:

- reviewer-selected projects
- fixed sponsor budget accounting
- milestone-based releases
- pause and refund logic
- proof-of-execution guidance from Track B reports

## Legitimacy Boundary

P0.5 remains digital-native only.

- GitHub commits
- merged PRs
- contract deployments
- on-chain activity
- other clearly verifiable software milestones

The system still avoids offline businesses and unverifiable real-world milestones.

## Architectural Boundary

The incubation layer stays separate from the scout market layer.

- `Market.sol`, `CreditLedger.sol`, and `Leaderboard.sol` remain the builder discovery core
- `IncubationVault.sol` handles post-hackathon budget accounting
- Track B reports can inform both settlement and incubation decisions
- the frontend can show both layers in one demo without mixing their accounting

## Near-Term Goal

P0.5 is not trying to prove generalized on-chain venture finance.

It is trying to prove something narrower and more honest:

> a hackathon should not stop at ranking projects; the best discovered builders should move into a transparent, milestone-based incubation lane.
