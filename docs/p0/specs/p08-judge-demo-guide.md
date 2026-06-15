# P0.8 Judge Demo Guide

## One-Line Positioning

Veil Scout discovers real builders through a credit-based scout market, then guides milestone-based sponsor budget release through verified execution.

## The Problem

Hackathon projects usually disappear right after ranking. Teams win visibility once, but the prize flow stops before anyone can verify whether the project keeps shipping.

## What Veil Scout Does

### Discovery layer

Veil Scout keeps the original credit-based scout market:

- scouts spend non-transferable credits instead of real money
- AI Prior and crowd odds help surface promising projects
- oracle settlement and leaderboard reputation identify who discovered signal well

### Incubation release layer

After discovery, selected projects move into a separate incubation lane:

- a project gets an incubation vault
- sponsor budget is tracked in demo accounting units
- fixed milestone tranches are released only after proof-of-execution review
- an authorized reviewer still decides whether to submit the release transaction

## What Is Genuinely On-Chain

- Track A contracts
- incubation vault state
- milestone release state
- released and remaining sponsor budget accounting
- authorized reviewer release transaction

## What Remains Advisory or Demo-Grade

- sponsor units are demo accounting units, not token custody
- Track B is an advisory oracle, not an automatic release agent
- no real-money streaming
- no automatic investment
- no decentralized governance
- no permissionless disputes

## Six-Step Live Demo

1. Show the discovery console and explain that scout discovery remains credit-based.
2. Move to the incubation panel and point out the selected project.
3. Show the live data label, ACTIVE vault, and three milestone timeline.
4. Highlight that milestone 0 is already released, while milestone 1 is under review.
5. Explain that 4,000 units are released and 8,000 remain gated behind proof-of-execution.
6. Tie it back to the protocol thesis: ranking discovers builders, incubation governs follow-through.

## Expected Screen States

### Initial live state

- `P0.8 / Live contract data`
- selected project: `AgentPay`
- status: `ACTIVE`
- milestone count: `3`
- milestone 0: `Released`
- milestone 1: `Under review`
- released budget: `4,000`
- remaining budget: `8,000`

### Honest fallback state

- `P0.8 / Demo fallback data`
- fallback note explains the exact reason
- discovery UI still renders
- no fake claim that live contract data is active

## Three-Minute Speaking Script

“Most hackathons stop at ranking. A project wins a prize, gets some attention, and then the protocol loses sight of whether the team keeps shipping.

Veil Scout starts with a credit-based scout market. Scouts use non-transferable credits, not real money, to identify promising builders. AI Prior, oracle settlement, and leaderboard reputation help us discover who is consistently early to real signal.

But discovery is only half of the story. For teams that deserve follow-through, we move them into a separate incubation release lane. Here, sponsor budget is not streamed automatically and it is not handed out all at once. Instead, the budget is tracked on-chain in an incubation vault and released milestone by milestone after verified execution.

On this screen, the project is AgentPay. The vault is ACTIVE. There are three milestones. The first milestone has already been released. The second is under review. So right now 4,000 sponsor units are released, and 8,000 remain gated.

That means Veil Scout is not just ranking hackathon projects. It is turning discovery into a continuous funding engine for post-hackathon teams, while staying honest about what is on-chain, what is advisory, and what is still demo-grade.” 

## Recovery Steps

### Live RPC data fails

1. Confirm the local demo script is still running.
2. Check that the frontend is using the expected `NEXT_PUBLIC_RPC_URL`.
3. Confirm `NEXT_PUBLIC_INCUBATION_CHAIN_ID` matches the actual Anvil chain ID.
4. Reload the page after the frontend comes back.
5. If live reads still fail, continue the demo in the clearly labeled fallback state and explain that the advisory/discovery flow is still visible.

### Wrong network or wrong config

If the configured chain ID does not match the actual RPC or provider chain, the panel should fall back honestly. Use that as a trust signal, not as something to hide.
