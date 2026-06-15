# Veil Scout Judge Q&A

## Why use a scout market?

Because hackathons already produce opinions, but those opinions are usually informal. The scout market turns that discovery process into a structured credit-based signal before the event ends.

## Why are credits non-transferable?

To keep P0 focused on reputation and discovery instead of speculation, liquidity mining, or token-price behavior. Credits measure scout conviction inside the season; they are not a tradable asset.

## Is this gambling?

Not in the intended P0 design. It is a demo-grade, credit-based evaluation loop using non-transferable accounting units, not a real-money betting product.

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

## How does HTX or a sponsor benefit?

HTX or a sponsor gets a cleaner funnel: discovery signal during the hackathon, then a structured follow-through lane after the hackathon, without committing to full production finance rails on day one.

## What would productionization require?

- explicit sponsor asset flows
- stronger oracle design and audits
- reviewer ops and dispute policies
- richer evidence sources
- production deployment, monitoring, and key management
- legal and compliance review for jurisdiction-specific risk
