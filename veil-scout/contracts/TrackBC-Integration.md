# Track B/C Integration Notes

Track A contracts live under:

`veil-scout/contracts`

## ABI Files

- `abi/CreditLedger.json`
- `abi/Market.json`
- `abi/Season.json`
- `abi/Leaderboard.json`
- `abi/MarketFactory.json`

Regenerate ABI after contract changes:

```bash
cd veil-scout/contracts
forge build
mkdir -p abi
jq '.abi' out/CreditLedger.sol/CreditLedger.json > abi/CreditLedger.json
jq '.abi' out/Market.sol/Market.json > abi/Market.json
jq '.abi' out/Season.sol/Season.json > abi/Season.json
jq '.abi' out/Leaderboard.sol/Leaderboard.json > abi/Leaderboard.json
jq '.abi' out/MarketFactory.sol/MarketFactory.json > abi/MarketFactory.json
```

## Local Anvil Deployment

RPC:

`http://127.0.0.1:8545`

Chain ID:

`31337`

Current local addresses are also written to `deployment.json`.

```json
{
  "season": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "creditLedger": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  "leaderboard": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "market": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  "marketFactory": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
}
```

Testnet is not deployed yet. Use the same `DeployP0` script with `PRIVATE_KEY`, `CLAIM_SIGNER_PRIVATE_KEY`, and `--rpc-url`.

## Shared Constants

- `CREDITS_PER_SEASON = 10000`
- `MAX_STAKE_PER_MARKET = 2000`
- `CLAIM_WINDOW = 604800` seconds
- `PRICE_BASIS = 10000`
- `MIN_ODDS_BPS = 500`
- `MAX_ODDS_BPS = 9500`
- `PAYOUT_SCALE = 1e18`

Enums:

- `Side.NONE = 0`, `Side.YES = 1`, `Side.NO = 2`
- `Status.TRADING = 0`, `Status.SETTLED = 1`, `Status.VOIDED = 2`
- `Result.NONE = 0`, `Result.YES = 1`, `Result.NO = 2`

## Deployment Scripts

Start Anvil:

```bash
anvil --accounts 6
```

Deploy contracts and create season `0`:

```bash
forge script script/DeployP0.s.sol:DeployP0 \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Seed mock data. This is two-step because contracts require `resolutionDeadline` to pass before settlement:

```bash
forge script script/MockData.s.sol:MockData \
  --sig 'seed()' \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast

forge script script/MockData.s.sol:MockData \
  --sig 'settle()' \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

The scripts write:

- `deployment.json`: contract addresses and role hashes
- `mock-data.json`: demo scout wallets, private keys, scoutIds, and market IDs

Default claim signer private key:

`0x00000000000000000000000000000000000000000000000000000000000a11ce`

## Mock Data

After `seed()` and `settle()`:

- `scout_1`: claimed and bound, no market action
- `scout_2`: claimed, bought YES in market `0`, bought YES in voided market `2`
- `scout_3`: claimed, bought NO in market `0`
- `scout_4`: claimed and bound, no market action
- `scout_5`: unclaimed judge account

Markets:

- `market_0`: `SETTLED`, result `YES`, scout_2 can call `Market.claim(0)`
- `market_1`: `TRADING`, available for buy flow
- `market_2`: `VOIDED`, scout_2 can call `Market.claim(2)` for refund

## Core Frontend Calls

Claim season credits:

```solidity
CreditLedger.claim(seasonId, scoutId, deadline, signature)
```

Signature format:

```solidity
bytes32 digest = keccak256(
    abi.encodePacked(scoutId, seasonId, wallet, chainId, creditLedgerAddress, nonce, deadline)
);
```

Fields, all `abi.encodePacked` in this order:

1. `scoutId`: `bytes32`
2. `seasonId`: `uint256`
3. `wallet`: `address`, the caller's address
4. `chainId`: `uint256`
5. `creditLedgerAddress`: `address`
6. `nonce`: `uint256`, from `CreditLedger.claimNonce(wallet)`
7. `deadline`: `uint256`

The contract accepts both raw ECDSA signatures and EIP-191 Ethereum Signed Message signatures.
Pre-generated `scout_5` claim data is written to `mock-data.json` under `scout_5_claim`.

Create a market:

```solidity
MarketFactory.createMarket(MarketSpec spec)
```

Buy position:

```solidity
Market.takePosition(marketId, Side.YES, amount)
Market.takePosition(marketId, Side.NO, amount)
```

Claim winnings or refund:

```solidity
Market.claim(marketId)
```

Read market:

```solidity
Market.getMarket(marketId)
Market.getPosition(marketId, scoutId)
Market.getYesOdds(marketId)
CreditLedger.freeBalance(scoutId, seasonId)
Leaderboard.scores(scoutId, seasonId)
Leaderboard.getScore(scoutId, seasonId)
Leaderboard.getTopN(seasonId, topN)        // returns (scoutIds[], scores[])
Leaderboard.getSeasonParticipantCount(seasonId)
```

**Leaderboard ranking example:**

```solidity
// Get top 10 scouts for season 0
(bytes32[] memory scouts, int256[] memory scores) = leaderboard.getTopN(0, 10);
// scouts[0] is rank #1, scores[0] is their total score
```

## Events For Indexing

CreditLedger:

- `CreditsClaimed(bytes32 indexed scoutId, address indexed wallet, uint256 indexed seasonId, uint256 amount)`
- `WalletBound(address indexed wallet, bytes32 indexed scoutId)`
- `MarketRegistered(uint256 indexed marketId, uint256 indexed seasonId)`
- `ClaimSignerUpdated(address indexed signer)`

Season:

- `SeasonCreated(uint256 indexed seasonId, uint256 startTime, uint256 endTime)`
- `SeasonEnded(uint256 indexed seasonId)`

Market:

- `MarketCreated(uint256 indexed marketId, uint256 indexed seasonId, address indexed creator, address projectOwner, bytes32 specHash, string metadataURI, uint256 tradingDeadline, uint256 resolutionDeadline, uint256 forceVoidDeadline)`
- `PositionTaken(uint256 indexed marketId, bytes32 indexed scoutId, Side side, uint256 amount)`
- `MarketSettled(uint256 indexed marketId, bool passed, uint256 totalLosingStakes, uint256 totalWinningStakes, uint256 claimDeadline)`
- `PositionFinalized(uint256 indexed marketId, bytes32 indexed scoutId, uint256 claimableCredits, int256 scoreDelta)`
- `WinningsClaimed(uint256 indexed marketId, bytes32 indexed scoutId, uint256 amount)`
- `MarketVoided(uint256 indexed marketId, string reasonURI, uint256 claimDeadline)`
- `Refunded(uint256 indexed marketId, bytes32 indexed scoutId, uint256 amount)`
- `NoWinnerReserve(uint256 indexed marketId, uint256 amount)`
- `ExpiredRemainderSwept(uint256 indexed marketId, uint256 amount)`

Leaderboard:

- `ScoreUpdated(bytes32 indexed scoutId, uint256 indexed seasonId, int256 newScore, uint256 indexed marketId)`

MarketFactory:

- `MarketAddressUpdated(address indexed market)`
- `FactoryMarketCreated(uint256 indexed marketId, address indexed creator)`

AccessManaged, inherited by deployable contracts:

- `RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)`
- `RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)`
