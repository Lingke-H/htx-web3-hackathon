# Veil Scout Submission Package

## Project Name

Veil Scout

## One-Sentence Pitch

Veil Scout discovers real builders through a credit-based scout market, then guides milestone-based sponsor budget release through verified execution.

## Problem and Solution

### Problem

Hackathon ranking is good at discovering promising teams, but weak at sustaining them. Strong projects often receive one-shot recognition and then lose momentum or sponsor visibility.

### Solution

Veil Scout separates discovery from incubation:

- a scout market surfaces which builders look credible before the event ends
- a proof-of-execution oracle lane reviews what those builders actually ship after the event
- an incubation vault releases fixed sponsor-budget tranches only after verified milestone completion

## Target Users

- hackathon judges
- ecosystem sponsors
- program managers and accelerators
- scout communities evaluating early teams

## Architecture Overview

### Scout Discovery Layer

- `Season.sol`
- `CreditLedger.sol`
- `Market.sol`
- `MarketFactory.sol`
- `Leaderboard.sol`

### Proof-of-Execution Oracle Layer

- Track B AI analysis
- GitHub / on-chain verification checks
- advisory milestone-release report generation

### Incubation Accounting Layer

- `IncubationVault.sol`
- milestone creation
- fixed release tranches
- pause and refund paths

### Frontend Demo Layer

- Next.js judge-facing interface
- read-only RPC path
- injected-wallet fallback path
- labeled built-in demo fallback

## Implemented Features

- non-transferable scout credits
- binary project-outcome markets
- credit-weighted crowd odds
- trusted oracle settlement flow
- on-chain scout leaderboard
- milestone-based incubation vault
- advisory post-hackathon milestone assessment
- automated local incubation E2E smoke test
- one-command live judge demo
- English / Chinese UI

## Technology Stack

- Solidity + Foundry
- Python + Typer + Web3.py + pytest
- Next.js + React + TypeScript
- GitHub Actions CI
- local Anvil for reproducible demo execution

## Trust Boundaries

### Contracts

- scout credits are on-chain accounting units, not money
- sponsor budget is represented as demo sponsor units, not token custody
- `IncubationVault.releaseMilestone` requires an authorized reviewer

### Oracle

- AI Prior is off-chain
- verification reports are off-chain
- `assess-release` is advisory only
- the oracle does not auto-submit milestone-release transactions

## Demo Instructions

From the repository root:

```bash
bash veil-scout/scripts/run-live-demo.sh
```

Expected story:

1. scout discovery market exists
2. selected project is `AgentPay`
3. incubation vault is `ACTIVE`
4. milestone 0 is released
5. milestone 1 is under review
6. sponsor accounting shows `4,000` released and `8,000` remaining

## Repository Structure

```text
docs/
  submission/
  reports/
  p0/specs/
veil-scout/
  track-a-contracts/
  track-b-ai-oracle/
  frontend/
  scripts/
```

## Progress by Phase

### P0

- credit-based scout market
- AI Prior + oracle settlement
- leaderboard reputation

### P0.5

- minimal incubation layer
- `IncubationVault.sol`
- advisory milestone release reporting

### P0.6 to P0.8

- reproducible Anvil E2E
- CI coverage
- wallet-free live read path
- one-command judge demo
- demo runbook and judge-facing materials

## P1 Roadmap

- richer proof-of-execution sources
- stronger anti-spam / anti-fake-activity heuristics
- dispute and review escalation paths
- sponsor and ecosystem program integrations
- production-grade deployment and monitoring

## Known Limitations

- no real-money flows
- no streaming protocol
- no automatic investment
- no governance or dispute layer
- trusted oracle and reviewer remain central
- incubation uses demo sponsor units only
