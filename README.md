# HTX Web3 Hackathon

This repository contains the Veil Scout hackathon project.

Veil Scout is a credit-based project-discovery prediction protocol. Scouts use non-transferable credits to judge whether Web3 projects will hit clear milestones; AI provides the first analyst report, and an oracle settles markets from verifiable data.

## Repository Layout

```text
.
├── docs/                  # Product, roadmap, P0 specs, reviews, notes
└── veil-scout/
    ├── track-a-contracts/         # Track A: Foundry smart contracts, ABI, deploy scripts
    ├── track-b-ai-oracle/         # Track B: AI analyst + oracle Python CLI
    └── frontend/                  # Track C: Next.js demo frontend
```

## Tracks

- **Track A: Contracts** lives in `veil-scout/track-a-contracts`.
  - P0 Solidity contracts are implemented with Foundry.
  - ABI files are exported under `veil-scout/track-a-contracts/abi`.
  - Deployment and demo instructions are in `veil-scout/track-a-contracts/README.md`.

- **Track B: AI + Oracle** lives in `veil-scout/track-b-ai-oracle`.
  - Python CLI for AI reports, GitHub/on-chain verification, market creation, and settlement.
  - Setup and command usage are in `veil-scout/track-b-ai-oracle/README.md`.

- **Track C: Frontend** lives in `veil-scout/frontend`.
  - Next.js demo app for the judge-facing Veil Scout experience.
  - Setup and command usage are in `veil-scout/frontend/README.md`.

## What P0 Is / Is Not

Veil Scout P0 is a demo-grade, credit-based scout judgment loop:

- Scouts use non-transferable seasonal credits to predict binary project milestones.
- AI produces an off-chain **AI Prior** report, used as an analyst anchor.
- Crowd Odds come from on-chain YES/NO credit stake via `Market.getYesOdds`.
- Track B runs a trusted oracle, writes a verification report, and calls `Market.settle`.
- Leaderboard reputation updates from settled market outcomes.

Veil Scout P0 is not:

- a real-money betting product
- an AMM/LMSR market
- a liquidity-provider system
- an AI market maker
- a fully decentralized oracle protocol

Those constraints are intentional. P0 proves the AI-assisted scout discovery loop first; P1 can add optimistic oracle disputes, API/IPFS report distribution, and HTX DAO / ecosystem reward integration.

## Documentation

Start with:

- `docs/vision/` for project narrative and product direction.
- `docs/mechanism/` for P0.5 mechanism closure, market admission, and season/reward policy.
- `docs/roadmap/` for the 60-day technical roadmap.
- `docs/p0/specs/` for frozen P0 mechanism/interface specs.
- `docs/p0/reviews/` for architecture, audit, and review notes.
- `docs/integration/` for Track C frontend handoff.
- `docs/pitch/` for demo and judge-facing narrative.
- `docs/archive/` for superseded historical drafts.
- `docs/notes/` for exploratory questions and concept notes.

## Local State Notes

Generated files are ignored where possible:

- `.DS_Store`
- `veil-scout/track-b-ai-oracle/.env`
- `veil-scout/track-b-ai-oracle/.venv`
- Track B generated reports/settlement JSON
