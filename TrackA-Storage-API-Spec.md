# Track A — Storage / API Spec（最终冻结）

> **P0 合约的完整存储布局和接口定义。**  
> 基于 v0.5.1 架构 + Codex 实现细节。  
> **本文档冻结后，Track A 按此写代码，Track B/C 按此对接。**

---

## 一、合约分层

```text
Season
  管 season 生命周期和 deadline 校验

CreditLedger
  唯一 credits 账本 + scoutId 身份绑定

Market
  市场状态、position、下注、结算、finalize、claim、void、sweep

MarketFactory
  薄入口，只负责 MARKET_CREATOR_ROLE，调用 Market.createMarket()

Leaderboard
  只记录 score，不排序
```

核心原则：`CreditLedger` 管钱，`Market` 管市场，`Leaderboard` 管分，`Factory` 管入口，`Season` 管时间。

---

## 二、Enums

```solidity
enum Side {
    NONE,   // 0
    YES,    // 1
    NO      // 2
}

enum Status {
    TRADING,   // 可交易
    SETTLED,   // 已结算
    VOIDED     // 已作废
}

enum Result {
    NONE,   // 未结算
    YES,    // YES 赢
    NO      // NO 赢
}
```

---

## 三、Structs

### MarketSpec

```solidity
struct MarketSpec {
    bytes32 specHash;           // keccak256(canonical JSON bytes)
    string metadataURI;         // IPFS / Arweave 链接
    uint256 seasonId;
    uint256 tradingDeadline;    // 交易截止时间
    uint256 resolutionDeadline; // 最早可结算时间
    uint256 forceVoidDeadline;  // 强制作废截止时间
    address projectOwner;       // 项目方地址（禁买）
}
```

### MarketData

```solidity
struct MarketData {
    bytes32 specHash;
    string metadataURI;
    uint256 seasonId;
    uint256 tradingDeadline;
    uint256 resolutionDeadline;
    uint256 forceVoidDeadline;
    uint256 claimDeadline;      // settle/void/forceVoid 时设置
    address projectOwner;
    uint256 yesStake;
    uint256 noStake;
    uint256 winningsPerShare;   // PAYOUT_SCALE 定点数
    Status status;
    Result result;
}
```

### Position

```solidity
struct Position {
    Side side;
    uint256 yesStake;
    uint256 noStake;
    bool finalized;
    bool claimed;
    uint256 claimableCredits;   // SETTLED=winnings, VOIDED=refund
    int256 scoreDelta;          // SETTLED=PnL, VOIDED=0
}
```

### SeasonInfo

```solidity
struct SeasonInfo {
    uint256 startTime;
    uint256 endTime;
    bool isActive;
}
```

---

## 四、Season.sol

### Storage

```solidity
mapping(uint256 => SeasonInfo) public seasons;
uint256 public currentSeasonId;
```

### Functions

```solidity
function createSeason(uint256 startTime, uint256 endTime)
    external
    onlyRole(DEFAULT_ADMIN_ROLE);

function endSeason(uint256 seasonId)
    external
    onlyRole(DEFAULT_ADMIN_ROLE);

function isSeasonActive(uint256 seasonId)
    external view
    returns (bool);
```

### Events

```solidity
event SeasonCreated(uint256 indexed seasonId, uint256 startTime, uint256 endTime);
event SeasonEnded(uint256 indexed seasonId);
```

### Errors

```solidity
error InvalidSeason(uint256 seasonId);
error SeasonAlreadyEnded(uint256 seasonId);
```

---

## 五、CreditLedger.sol

### Storage

```solidity
// 身份绑定
mapping(address => bytes32) public scoutIdOf;
mapping(bytes32 => address) public walletOfScoutId;
mapping(uint256 => mapping(bytes32 => bool)) public hasClaimedSeason;
mapping(address => uint256) public claimNonce;

// Credits 账本（按 season）
mapping(bytes32 => mapping(uint256 => uint256)) public freeBalance;
mapping(uint256 => uint256) public totalMintedCredits;
mapping(uint256 => uint256) public seasonProtocolReserve;

// 市场层账本
mapping(uint256 => uint256) public marketLockedCredits;
mapping(uint256 => uint256) public marketSeason;
```

### Constants

```solidity
uint256 public constant CREDITS_PER_SEASON = 10_000;
uint256 public constant PAYOUT_SCALE = 1e18;
```

### Functions

```solidity
// External ──────────────────────────────────────────

function claim(
    uint256 seasonId,
    bytes32 scoutId,
    uint256 deadline,
    bytes calldata signature
) external;

// Only Market ───────────────────────────────────────

function registerMarket(uint256 marketId, uint256 seasonId)
    external
    onlyRole(MARKET_ROLE);

function lockForTrade(
    bytes32 scoutId,
    uint256 seasonId,
    uint256 marketId,
    uint256 amount
) external onlyRole(MARKET_ROLE);

function releaseToScout(
    bytes32 scoutId,
    uint256 seasonId,
    uint256 marketId,
    uint256 amount
) external onlyRole(MARKET_ROLE);

function moveLockedToReserve(
    uint256 seasonId,
    uint256 marketId,
    uint256 amount
) external onlyRole(MARKET_ROLE);

// View ──────────────────────────────────────────────

function freeBalanceOf(bytes32 scoutId, uint256 seasonId)
    external view
    returns (uint256);
```

### Events

```solidity
event CreditsClaimed(
    bytes32 indexed scoutId,
    uint256 indexed seasonId,
    uint256 amount
);

event WalletBound(
    address indexed wallet,
    bytes32 indexed scoutId
);

event MarketRegistered(
    uint256 indexed marketId,
    uint256 indexed seasonId
);
```

### Errors

```solidity
error CreditsAlreadyClaimed(bytes32 scoutId, uint256 seasonId);
error InvalidSignature();
error WalletAlreadyBound(address wallet);
error ScoutIdAlreadyBound(bytes32 scoutId);
error InvalidAmount();
```

### 签名内容

```
keccak256(abi.encodePacked(
    scoutId,
    seasonId,
    msg.sender,       // wallet
    block.chainid,
    address(this),    // CreditLedger address
    nonce,
    deadline
))
```

---

## 六、Market.sol

### Storage

```solidity
// State
uint256 public nextMarketId;
mapping(uint256 => MarketData) public markets;
mapping(uint256 => mapping(bytes32 => Position)) public positions;

// 依赖合约
ICreditLedger public creditLedger;
ILeaderboard public leaderboard;

// 常量
uint256 public constant MAX_STAKE_PER_MARKET = 2_000;
uint256 public constant PRICE_BASIS = 10_000;
uint256 public constant PAYOUT_SCALE = 1e18;
uint256 public constant CLAIM_WINDOW = 7 days;
```

### Functions

```solidity
// Factory 调用 ──────────────────────────────────────

function createMarket(MarketSpec calldata spec, address creator)
    external
    onlyRole(MARKET_CREATOR_ROLE)
    returns (uint256 marketId);

// Admin / Settlement ────────────────────────────────

function settle(uint256 marketId, bool passed)
    external
    onlyRole(SETTLEMENT_ROLE);

function voidMarket(uint256 marketId, string calldata reasonURI)
    external
    onlyRole(DEFAULT_ADMIN_ROLE);

// Public ────────────────────────────────────────────

function takePosition(uint256 marketId, Side side, uint256 amount)
    external
    nonReentrant;

function forceVoid(uint256 marketId)
    external;

function finalizePosition(uint256 marketId, bytes32 scoutId)
    public;

function claim(uint256 marketId)
    external
    nonReentrant;

function sweepExpiredRemainder(uint256 marketId)
    external;

// Batch ─────────────────────────────────────────────

// P0 暂不做 claimAll，批量 claim 容易整笔 revert
// function claimAll(uint256[] calldata marketIds)
//     external
//     nonReentrant;

// View ──────────────────────────────────────────────

function getYesOdds(uint256 marketId)
    external view
    returns (uint256 yesPriceBps);

function canTrade(uint256 marketId)
    external view
    returns (bool);

function canSettle(uint256 marketId)
    external view
    returns (bool);

function canClaim(uint256 marketId)
    external view
    returns (bool);

function canSweep(uint256 marketId)
    external view
    returns (bool);

function getPosition(uint256 marketId, bytes32 scoutId)
    external view
    returns (Position memory);

function getMarket(uint256 marketId)
    external view
    returns (MarketData memory);
```

### Events

```solidity
event MarketCreated(
    uint256 indexed marketId,
    uint256 indexed seasonId,
    address indexed creator,
    address projectOwner,
    bytes32 specHash,
    string metadataURI,
    uint256 tradingDeadline,
    uint256 resolutionDeadline,
    uint256 forceVoidDeadline
);

event PositionTaken(
    uint256 indexed marketId,
    bytes32 indexed scoutId,
    Side side,
    uint256 amount
);

event MarketSettled(
    uint256 indexed marketId,
    bool passed,
    uint256 totalLosingStakes,
    uint256 totalWinningStakes,
    uint256 claimDeadline
);

event PositionFinalized(
    uint256 indexed marketId,
    bytes32 indexed scoutId,
    uint256 claimableCredits,
    int256 scoreDelta
);

event WinningsClaimed(
    uint256 indexed marketId,
    bytes32 indexed scoutId,
    uint256 amount
);

event MarketVoided(
    uint256 indexed marketId,
    string reasonURI,
    uint256 claimDeadline
);

event Refunded(
    uint256 indexed marketId,
    bytes32 indexed scoutId,
    uint256 amount
);

event NoWinnerReserve(
    uint256 indexed marketId,
    uint256 amount
);

event ExpiredRemainderSwept(
    uint256 indexed marketId,
    uint256 amount
);
```

### Errors

```solidity
error MarketNotFound(uint256 marketId);
error TradingClosed(uint256 marketId);
error ProjectOwnerCannotTrade(uint256 marketId, address owner);
error SingleSideOnly(uint256 marketId, bytes32 scoutId);
error ExceedsMaxStake(uint256 marketId, uint256 amount, uint256 maxAllowed);
error SettlementTooEarly(uint256 marketId, uint256 current, uint256 deadline);
error ForceVoidTooEarly(uint256 marketId, uint256 current, uint256 deadline);
error AlreadySettled(uint256 marketId);
error AlreadyVoided(uint256 marketId);
error PositionAlreadyFinalized(uint256 marketId, bytes32 scoutId);
error WinningsAlreadyClaimed(uint256 marketId, bytes32 scoutId);
error NotFinalized(uint256 marketId, bytes32 scoutId);
error NoClaimableCredits(uint256 marketId, bytes32 scoutId);
error ClaimWindowExpired(uint256 marketId, uint256 current, uint256 deadline);
error CannotSweepYet(uint256 marketId, uint256 current, uint256 deadline);
error Unauthorized();
```

---

## 七、MarketFactory.sol

### Storage

```solidity
address public market;
```

### Functions

```solidity
// Admin ─────────────────────────────────────────────

function setMarket(address _market)
    external
    onlyRole(DEFAULT_ADMIN_ROLE);

// External ──────────────────────────────────────────

function createMarket(MarketSpec calldata spec)
    external
    onlyRole(MARKET_CREATOR_ROLE)
{
    uint256 marketId = IMarket(market).createMarket(spec, msg.sender);
    // 可选：emit FactoryMarketCreated
}
```

---

## 八、Leaderboard.sol

### Storage

```solidity
mapping(bytes32 => mapping(uint256 => int256)) public scores;
```

### Functions

```solidity
// Only Market ───────────────────────────────────────

function updateScore(
    bytes32 scoutId,
    uint256 seasonId,
    int256 delta,
    uint256 marketId
) external onlyRole(MARKET_ROLE);

// View ──────────────────────────────────────────────

function getScore(bytes32 scoutId, uint256 seasonId)
    external view
    returns (int256);
```

### Events

```solidity
event ScoreUpdated(
    bytes32 indexed scoutId,
    uint256 indexed seasonId,
    int256 newScore,
    uint256 indexed marketId
);
```

---

## 九、关键行为流程

### createMarket

```text
Factory.createMarket(spec)
  → 校验 MARKET_CREATOR_ROLE
  → Market.createMarket(spec, msg.sender)
    → 校验 season/deadlines
    → 写 markets[nextMarketId]
    → creditLedger.registerMarket(marketId, seasonId)
    → emit MarketCreated
```

### takePosition

```text
校验：
  - status == TRADING
  - block.timestamp < tradingDeadline
  - msg.sender != projectOwner
  - scoutId 已绑定
  - side == NONE || side == 同边
  - stake + amount <= MAX_STAKE_PER_MARKET

执行：
  - 更新 Position
  - creditLedger.lockForTrade(scoutId, seasonId, marketId, amount)
  - emit PositionTaken
```

### settle

```text
校验：
  - SETTLEMENT_ROLE
  - status == TRADING
  - block.timestamp >= resolutionDeadline

执行：
  - status = SETTLED
  - result = passed ? YES : NO
  - claimDeadline = block.timestamp + CLAIM_WINDOW
  - losingStakes = passed ? noStake : yesStake
  - winningStakes = passed ? yesStake : noStake
  - if winningStakes == 0:
      creditLedger.moveLockedToReserve(seasonId, marketId, losingStakes)
    else:
      winningsPerShare = losingStakes * PAYOUT_SCALE / winningStakes
  - emit MarketSettled
```

### voidMarket / forceVoid

```text
校验：
  - voidMarket: DEFAULT_ADMIN_ROLE
  - forceVoid: block.timestamp >= forceVoidDeadline
  - status == TRADING

执行：
  - status = VOIDED
  - claimDeadline = block.timestamp + CLAIM_WINDOW
  - emit MarketVoided
```

### finalizePosition

```text
校验：
  - !position.finalized
  - status == SETTLED || status == VOIDED

执行：
  SETTLED:
    - isWinner = (result==YES && yesStake>0) || (result==NO && noStake>0)
    - if isWinner:
        winningStake = result==YES ? yesStake : noStake
        claimableCredits = winningStake + (winningStake * winningsPerShare / PAYOUT_SCALE)
      else:
        claimableCredits = 0
    - scoreDelta = int256(claimableCredits) - int256(yesStake + noStake)

  VOIDED:
    - claimableCredits = yesStake + noStake
    - scoreDelta = 0

  - finalized = true
  - leaderboard.updateScore(scoutId, seasonId, scoreDelta, marketId)
  - emit PositionFinalized
```

### claim

```text
校验：
  - position.finalized（否则内部先 finalize）
  - !position.claimed
  - claimableCredits > 0
  - block.timestamp <= claimDeadline

执行：
  - claimed = true
  - creditLedger.releaseToScout(scoutId, seasonId, marketId, claimableCredits)
  - emit WinningsClaimed
```

### sweepExpiredRemainder

```text
校验：
  - status == SETTLED || status == VOIDED
  - block.timestamp > claimDeadline

执行：
  - remainder = creditLedger.marketLockedCredits(marketId)
  - creditLedger.moveLockedToReserve(seasonId, marketId, remainder)
  - emit ExpiredRemainderSwept
```

---

## 十、不变量清单

```text
1. 总量守恒（按 season）：
   sum(freeBalance[*][s]) + sum(marketLockedCredits[m] where marketSeason[m]==s) + reserve[s]
   == totalMinted[s]

2. 索引一致：
   for each m: sum(positions[m][*].yesStake + positions[m][*].noStake) == marketLockedCredits[m]（结算前）

3. Market 不直接修改 CreditLedger 账本字段

4. 同一 scoutId 同一 market 只能 YES 或 NO

5. position.finalized 只能一次

6. position.claimed 只能一次，且 claimableCredits 不变

7. claimDeadline 前可 claim，claimDeadline 后不可 claim

8. sweepExpiredRemainder 只能在 claimDeadline 后执行

9. marketSeason[marketId] 必须和 MarketData.seasonId 一致

10. no winner 时 locked credits 进入 reserve，所有 position 都是输家，finalize 更新负分，claim revert NoClaimableCredits
```

---

## 十一、部署顺序

```
Step 1: 部署 Season
Step 2: 部署 CreditLedger
Step 3: 部署 Leaderboard
Step 4: 部署 Market (传入 CreditLedger + Leaderboard 地址)
Step 5: 部署 MarketFactory (传入 Market 地址)
Step 6: CreditLedger.grantRole(MARKET_ROLE, Market)
Step 7: Leaderboard.grantRole(MARKET_ROLE, Market)
Step 8: Market.grantRole(MARKET_CREATOR_ROLE, MarketFactory)
Step 9: 创建 Season 0
```

---

*文档状态：最终冻结*  
*基于 P0-框架概览-v0.5.1-最终冻结.md + Codex Storage/API Spec*  
*下一步：按此写 Foundry 代码*
