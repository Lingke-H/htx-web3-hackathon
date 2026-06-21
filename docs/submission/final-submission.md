# Veil Scout — Final Submission

> Most hackathons stop at ranking. Veil Scout turns ranking into continuous builder discovery and milestone-based incubation.

**Track:** AI x Web3  
**Public demo:** [Vercel presentation build](https://frontend-six-sigma-mw8xaa81il.vercel.app)  
**Local live demo:** `bash veil-scout/scripts/run-live-demo.sh`

## Problem

Hackathons are good at producing rankings, but weak at answering the question that matters after demo day: which teams keep shipping? Sponsors see polished snapshots, builders lose visibility after the event, and one-shot judging creates little persistent signal about either builder execution or scout accuracy.

## Solution

Veil Scout turns judging into one accountable builder lifecycle:

1. **Discover:** AI converts public project evidence into a structured AI Prior.
2. **Compare:** human scouts allocate non-transferable credits, forming Crowd Odds.
3. **Verify:** a trusted P0 oracle checks explicit GitHub or on-chain criteria.
4. **Settle:** smart contracts settle the market and update scout reputation.
5. **Incubate:** selected builders enter a separate milestone lane.
6. **Release:** an authorized reviewer releases a fixed sponsor-unit tranche after reviewing execution evidence.

The discovery market generates signal. The incubation vault creates follow-through. They are connected by evidence, not by a real-money market.

## Why AI and Web3 Both Matter

AI is the first analyst, not the judge. It produces a falsifiable report with probability, confidence, positive factors, negative factors, risk flags, and limitations. Scouts can disagree with it. The oracle then produces a separate verification report against a predefined rule.

Web3 provides transparent credit accounting, explicit roles, reproducible settlement, and persistent scout reputation. AI does not autonomously set an on-chain price, settle a market, or control funds.

## Technical Innovation

- AI Prior and Crowd Odds are displayed side by side, making disagreement visible.
- Non-transferable seasonal credits reward accurate discovery without creating a tradable betting asset.
- Settlement produces a human-readable evidence artifact before an authorized on-chain action.
- The same execution evidence can admit a builder into a separate milestone-incubation lane.
- Scout reputation persists on-chain, turning individual hackathon opinions into a reusable discovery signal.

## What Is Implemented

- Solidity contracts for seasons, credits, binary milestone markets, settlement, leaderboard reputation, and incubation accounting
- Python AI analysis, GitHub/on-chain verification, advisory milestone assessment, and report storage
- bilingual Next.js judge console with AI Prior, Crowd Odds, oracle evidence, settlement, wallet state, and incubation state
- Foundry, pytest, frontend lint/build, CI, and local Anvil E2E paths
- one-command local judge demo and labeled public presentation fallback

## Demo-Grade Boundaries

- credits are non-transferable accounting units, not money
- sponsor units model a budget; they do not custody or transfer tokens
- public market rows are seeded demonstration data
- oracle settlement and milestone release use trusted authorized roles
- AI and verification reports are advisory
- the public Vercel deployment is a read-only presentation build, not live chain state

## Commercial Model

The initial customer is an ecosystem program operator: a hackathon, DAO, grant program, incubator, launchpad, or developer-relations team. Potential offerings are program workflow software, verification and admission services, sponsor analytics, and builder/scout reputation APIs. None of these revenue lines is claimed as launched.

## HTX Ecosystem Fit

Veil Scout gives HTX a concrete post-event funnel: discover credible builders during a hackathon, preserve evidence and scout signal, then monitor milestone execution after the event. This can improve sponsor attention, program accountability, and long-term builder retention.

Current P0 does **not** integrate HTX APIs, B.AI compute, or the `$HTX` token. Potential organizer-resource connections are roadmap only and are documented in the [ecosystem resource disclosure](ecosystem-resource-disclosure.md).

## Roadmap

- **P1:** optimistic oracle, report commitments, challenge period, and reviewer escalation
- **P1:** stronger Sybil/wash-activity heuristics and multi-source proof of execution
- **P2:** production custody design, monitoring, legal review, and audited deployments
- **P2:** opt-in HTX ecosystem resource integrations after technical and program validation

## Team

Team members and roles: **Not supplied**.

## Evidence

- [Demo and verification evidence](demo-evidence.md)
- [Resource disclosure](ecosystem-resource-disclosure.md)
- [Final checklist](final-submission-checklist.md)
- [Architecture diagrams](../pitch/demo-diagrams.md)
- [Judge Q&A](p08-judge-qa.md)
