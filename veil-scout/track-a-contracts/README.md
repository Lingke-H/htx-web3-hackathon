# Veil Scout — P0 Smart Contracts

> On-chain prediction markets for Web3 project milestones. Scouts use non-transferable credits to bet on whether a project will hit its goals. AI sets initial odds; oracles settle based on real-world outcomes.

## Contracts Overview

| Contract | Lines | Purpose |
|----------|-------|---------|
| `Season.sol` | ~75 | Season lifecycle, time-window validation |
| `CreditLedger.sol` | ~200 | Non-transferable credit ledger, signature-based claims, atomic lock/release |
| `MarketFactory.sol` | ~35 | Thin entry point for creating markets |
| `Market.sol` | ~365 | Core market logic: trade, settle, void, claim, sweep, odds calculation |
| `Leaderboard.sol` | ~110 | Score tracking + on-chain `getTopN` ranking |

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Season     │────▶│ CreditLedger │◄────│  Leaderboard │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────┴───────┐
                     │    Market    │
                     └──────┬───────┘
                            │
                     ┌──────┴───────┐
                     │MarketFactory │
                     └──────────────┘
```

- **CreditLedger** is the single source of truth for credits. No contract holds credits except the ledger.
- **Market** holds all market/position state but delegates credit movements to CreditLedger.
- **Leaderboard** receives score deltas from Market and supports on-chain ranked queries.
- **Season** validates time windows; markets can only be created in active seasons.

## Invariants

For each season:

```
sum(freeBalance[scout][season]) +
sum(marketLockedCredits[market] where marketSeason[market] == season) +
seasonProtocolReserve[season]
== totalMintedCredits[season]
```

## Build & Test

Requirements: [Foundry](https://book.getfoundry.sh/)

```bash
forge build
forge test --summary
```

**Current status:** 68 tests, all passing.

### Test Coverage

| Suite | Tests | Focus |
|-------|-------|-------|
| `SeasonTest` | 11 | Create, end, active checks, auth |
| `CreditLedgerTest` | 10 | Claim, bind, lock/release, credit conservation |
| `MarketTest` | 24 | Trade, settle, void, claim, sweep, odds, edge cases |
| `MarketFactoryTest` | 6 | Create market, auth, events |
| `LeaderboardTest` | 13 | Score updates, getTopN sorting, multi-season |
| `IntegrationTest` | 4 | Full lifecycle: season → claim → trade → settle → claim → rank |

## Deploy

### Local (Anvil)

```bash
anvil --accounts 6

forge script script/DeployP0.s.sol:DeployP0 \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

### Testnet

Set environment variables and run:

```bash
export PRIVATE_KEY=0x...
export CLAIM_SIGNER_PRIVATE_KEY=0x...
export RPC_URL=https://sepolia.base.org

forge script script/DeployP0.s.sol:DeployP0 \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify
```

Supported testnets: Base Sepolia, Arbitrum Sepolia.

## Key Parameters

| Parameter | Value |
|-----------|-------|
| `CREDITS_PER_SEASON` | 10,000 |
| `MAX_STAKE_PER_MARKET` | 2,000 |
| `CLAIM_WINDOW` | 7 days |
| `PRICE_BASIS` | 10,000 (bps) |
| `MIN_ODDS_BPS` | 500 (5%) |
| `MAX_ODDS_BPS` | 9,500 (95%) |

## Roles

| Role | Holder | Can |
|------|--------|-----|
| `DEFAULT_ADMIN_ROLE` | Deployer | Grant/revoke roles, void markets |
| `MARKET_CREATOR_ROLE` | Factory + Admin | Create markets via Factory |
| `SETTLEMENT_ROLE` | Oracle/Admin | Settle markets (pass/fail) |
| `MARKET_ROLE` | Market contract | Lock/release/move credits via CreditLedger |

## ABI

ABI files are exported to `abi/` after `forge build`:

```bash
mkdir -p abi
jq '.abi' out/CreditLedger.sol/CreditLedger.json > abi/CreditLedger.json
jq '.abi' out/IncubationVault.sol/IncubationVault.json > abi/IncubationVault.json
jq '.abi' out/Market.sol/Market.json > abi/Market.json
# ... etc
```

## License

MIT
