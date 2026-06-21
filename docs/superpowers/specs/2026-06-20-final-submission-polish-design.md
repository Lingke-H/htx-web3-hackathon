# Veil Scout Final Submission Polish Design

## Objective

Prepare Veil Scout for the current HTX hackathon submission and judging flow by making the existing product easier to understand, verify, run, and evaluate. The polish must improve all five judging dimensions without adding risky late-stage protocol scope or claiming integrations that do not exist.

## Product Positioning

Canonical one-line positioning:

> Most hackathons stop at ranking. Veil Scout turns ranking into continuous builder discovery and milestone-based incubation.

Veil Scout is one builder lifecycle, not two unrelated products:

1. AI produces an evidence-based AI Prior.
2. Human scouts allocate non-transferable credits and form Crowd Odds.
3. A trusted P0 oracle verifies GitHub and on-chain execution evidence.
4. Smart contracts settle the market and update scout reputation.
5. Selected builders enter a separate milestone-based incubation accounting lane.
6. An authorized reviewer releases a fixed sponsor-unit tranche after reviewing execution evidence.

The discovery market is the signal-generation mechanism. The incubation vault is the follow-through mechanism.

## Judging Strategy

### Technical Innovation

The submission will emphasize the combination of:

- AI Prior as a falsifiable first analysis rather than an autonomous judge;
- human correction through non-transferable scout credits;
- on-chain settlement and persistent scout reputation;
- proof-of-execution review that connects discovery to post-hackathon follow-through.

The repository will provide a concise architecture diagram, trust-boundary explanation, implementation evidence, and comparison against ordinary prediction markets, grant voting, and AI-only evaluation.

### Product Completeness

The canonical demo flow will show AI Prior, Crowd Odds, scout action, oracle evidence, settlement, leaderboard outcome, and incubation milestone state. Three fallback levels will be documented:

1. local Anvil-backed live demo;
2. prerecorded demo video;
3. labeled public Vercel presentation data.

The public fallback must never be described as live chain data.

### Commercial And Ecosystem Potential

The commercial customer is an ecosystem program operator: hackathons, DAOs, grant programs, incubators, and launchpads. Potential offerings include program software, verification and admission services, sponsor analytics, and builder-reputation APIs.

HTX alignment will be framed as a concrete builder-discovery and milestone-incubation use case. Unless the team confirms otherwise, P0 will explicitly disclose that it does not integrate HTX APIs, B.AI compute, or the `$HTX` token. Future integration ideas will be labeled as roadmap only.

### AI And Web3 Application

The demo and submission materials must show the real Track B workflow: source ingestion, structured AI report, AI Prior versus Crowd Odds, verification criteria and evidence, limitations, and the authorized settlement or release boundary.

AI does not set an on-chain market price, settle autonomously, or control funds. Web3 supplies transparent accounting, role separation, settlement, and persistent reputation.

### Presentation Skills

All judge-facing assets will use the same problem, mechanism, demo flow, trust boundaries, and roadmap. The three-minute presentation will lead with the ecosystem problem, demonstrate the product, then explain technical boundaries and future decentralization.

## Submission Deliverables

### Canonical Repository Entry Points

- `README.md`: fast judge orientation, project facts, demo links, architecture, evidence, and limitations.
- `docs/submission/final-submission.md`: canonical copy source for the submission form.
- `docs/submission/demo-evidence.md`: demo URLs, commands, user flow, screenshots, chain/deployment status, CI, and releases.
- `docs/submission/ecosystem-resource-disclosure.md`: exact organizer-resource usage disclosure.
- `docs/submission/final-submission-checklist.md`: pre-submit verification checklist.
- `LICENSE`: repository-level open-source license.

Existing P0.8 documents remain historical and supporting references. They must point to the canonical final submission rather than compete with it.

### Information Requiring Team Input

The final documents will use explicit status values for facts that cannot be inferred safely:

- team member names and roles;
- final public demo-video URL;
- confirmed organizer-provided resource usage, if any;
- optional testnet contract addresses, if deployed.

Until supplied, these fields must read `Not supplied`, `Not deployed`, or `No organizer resource integration claimed`, as applicable. They must be visibly marked as submission blockers in the checklist and must not be guessed.

## Repository Presentation

The README first viewport will include:

- Veil Scout name and one-sentence positioning;
- selected track: AI x Web3;
- public demo URL;
- demo status: public labeled fallback plus local live path;
- canonical one-command demo;
- links to final submission, evidence, and architecture.

The repository will distinguish three states consistently:

- **Implemented**: present in code and verifiable;
- **Demo-grade**: working with explicit trust or accounting limitations;
- **Roadmap**: not implemented and never phrased as current functionality.

## Demo Evidence

The evidence package will document:

- public Vercel presentation URL;
- release URLs and current release baseline;
- local one-command live demo;
- Track A, Track B, frontend, and E2E verification commands;
- AI-to-oracle-to-chain data flow;
- local chain ID and generated contract-address behavior;
- absence of a public testnet deployment unless one is later supplied;
- screenshot slots for overview, AI Prior versus Crowd Odds, oracle report, settlement and leaderboard, and incubation vault;
- demo-video slot and recording requirements.

## Trust And Safety Boundaries

The submission will state plainly:

- credits are non-transferable accounting units, not money;
- incubation sponsor units do not custody or transfer tokens;
- Track B reports are advisory;
- settlement and milestone release use trusted authorized roles in P0;
- there is no AMM, LP exposure, automatic investment, governance, or permissionless dispute system;
- optimistic oracle, challenge periods, report commitments, and production custody are roadmap items.

## Testing And Acceptance

Before finalizing the submission:

1. Verify repository links and relative document paths.
2. Run secret and generated-artifact scans.
3. Run Foundry formatting and tests.
4. Run Track B compile and pytest checks.
5. Run frontend lint and production build.
6. Run the incubation E2E smoke test.
7. Start the one-command demo and verify its ready banner.
8. Inspect desktop and mobile presentation states.
9. Confirm every scoring claim has a repository, demo, or test artifact.
10. Confirm all unimplemented features are labeled as roadmap.

## Out Of Scope

This polish will not:

- redesign core Solidity contracts;
- add real-money custody or token transfers;
- introduce AMM or liquidity-provider mechanics;
- add a production backend, database, IPFS pipeline, or optimistic oracle;
- fabricate HTX API, B.AI compute, or `$HTX` usage;
- force-upgrade dependencies;
- make broad visual or architectural refactors unrelated to submission readiness.

## Definition Of Done

A judge can determine within five minutes:

- the real problem Veil Scout solves;
- how AI, humans, and smart contracts divide responsibility;
- how to access or run a working demonstration;
- which behavior is live, fallback, trusted, or roadmap;
- why the product matters to HTX and similar ecosystem programs;
- that the public repository is organized, open-source, tested, and reproducible.
