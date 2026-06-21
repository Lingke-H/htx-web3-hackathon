# Veil Scout Judge Q&A

> Current answers align with the [canonical final submission](final-submission.md) and [resource disclosure](ecosystem-resource-disclosure.md).

## What is the single product story?

Most hackathons stop at ranking. Veil Scout turns that ranking signal into continuous builder discovery and milestone-based incubation: AI Prior → Crowd Odds → verification → settlement and reputation → incubation → authorized sponsor-unit release.

## Why use a scout market?

Because hackathons already produce opinions, but those opinions are usually informal. The scout market turns that discovery process into a structured credit-based signal before the event ends.

## Why are credits non-transferable?

To keep P0 focused on reputation and discovery instead of speculation, liquidity mining, or token-price behavior. Credits measure scout conviction inside the season; they are not a tradable asset.

## Is this gambling?

Not in the intended P0 design. It is a demo-grade evaluation loop using non-transferable accounting units, not money or a tradable token. There is no AMM, liquidity provider, deposit, withdrawal, or real-money payout path.

## Are incubation sponsor units real tokens?

No. Sponsor units are fixed demo accounting units inside `IncubationVault`. P0.8 does not custody, transfer, stream, or invest sponsor assets.

## Who authorizes budget release?

An authorized reviewer with the required contract role. The oracle can recommend a release, but it does not submit the transaction automatically.

## What does the AI Oracle actually control?

It controls no autonomous on-chain release path in P0.8. It generates AI Prior and verification artifacts, and it prepares an advisory release recommendation for a human reviewer.

## Why milestone release instead of streaming?

Because milestone release is the smallest safe version of post-hackathon incubation for a demo. It is easy to explain, easy to verify, and does not introduce continuous custody or stream-management complexity.

## How is fake GitHub activity handled?

P0.8 does not claim a complete anti-fraud system. It uses explicit verification rules and keeps the reviewer in the loop. Productionization would need stronger heuristics, source triangulation, and dispute handling.

## What is on-chain today?

- scout credit accounting
- market state and settlement outcomes
- leaderboard score updates
- incubation-vault milestone accounting
- pause and refund state transitions

The repository also includes Base Sepolia seed/finalize scripts and a Public Proof frontend panel. Actual public proof should be judged only after the evidence manifest and explorer links are present; no zero-address or fallback evidence should be treated as deployed proof.

## How does HTX or a sponsor benefit?

HTX or a sponsor gets a cleaner funnel: discovery signal during the hackathon, then a structured follow-through lane after the hackathon, without committing to full production finance rails on day one.

## What is the business buyer?

The first buyer is a program operator: hackathon organizer, grant program, incubator, launchpad, or developer ecosystem team. The product replaces loose judging notes and manual follow-up spreadsheets with a workflow that preserves AI evidence, human correction, settlement, scout reputation, and milestone review. There are no customer-interview or product-market-fit claims yet.

## Which HTX resources are integrated today?

None are claimed. P0.8 does not integrate HTX APIs, B.AI compute, the `$HTX` token, or an HTX-branded network. The interface identifies the hackathon context; local live execution uses Anvil chain ID `31337`. Possible resource integrations are roadmap only.

## Why is the oracle still trusted?

Trusted settlement is the explicit P0 boundary that keeps the demo small and verifiable. Reports expose criteria, observations, rationale, and limitations so reviewers can inspect the decision. P1 proposes report commitments, a challenge period, and an optimistic-oracle path.

## What would productionization require?

- explicit sponsor asset flows
- stronger oracle design and audits
- reviewer ops and dispute policies
- richer evidence sources
- production deployment, monitoring, and key management
- legal and compliance review for jurisdiction-specific risk
