# Veil Scout — P0 接口定义文档

> **基于 v0.5.1 框架 + Codex 5 条补丁**。  
> 本文档定义全部 enum、struct、storage、external/public 接口、event、error。  
> **接口冻结后，Track B/C 可直接基于此文档对接。**

---

## 一、共享类型（`types/`）

### Enums.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

enum Status {
    TRADING,    // 可交易
    SETTLED,    // 已结算
    VOIDED      // 已作废
}

enum Result {
    NONE,       // 未结算
    YES,        // YES 赢
    NO          // NO 赢
}

enum Side {
    NONE,       // 未持仓
    YES,        // 持 YES
    NO          // 持 NO
}
```

### MarketSpec.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

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

### Errors.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Season
error InvalidSeason(uint256 seasonId);
error SeasonNotActive(uint256 seasonId);
error SeasonAlreadyEnded(uint256 seasonId);

// CreditLedger / Identity
error CreditsAlreadyClaimed(bytes32 scoutId, uint256 seasonId);
error InvalidSignature();
error WalletAlreadyBound(address wallet);

// Market / Trading
error MarketNotFound(uint256 marketId);
error TradingClosed(uint256 marketId);
error ProjectOwnerCannotTrade(uint256 marketId, address owner);
error SingleSideOnly(uint256 marketId, bytes32 scoutId);
error ExceedsMaxStake(uint256 marketId, uint256 amount, uint256 maxAllowed);
error InvalidAmount();

// Settlement / Claim
error SettlementTooEarly(uint256 marketId, uint256 current, uint256 deadline);
error VoidTooEarly(uint256 marketId);
error ForceVoidTooEarly(uint256 marketId, uint256 current, uint256 deadline);
error AlreadySettled(uint256 marketId);
error AlreadyVoided(uint256 marketId);

// Position / Claim
error PositionAlreadyFinalized(uint256 marketId, bytes32 scoutId);
error WinningsAlreadyClaimed(uint256 marketId, bytes32 scoutId);
error NotFinalized(uint256 marketId, bytes32 scoutId);
error NoClaimableCredits(uint256 marketId, bytes32 scoutId);
error ClaimWindowExpired(uint256 marketId, uint256 current, uint256 deadline);
error CannotSweepYet(uint256 marketId, uint256 current, uint256 deadline);

// Auth
error Unauthorized();
```

---

## 二、Season.sol

### Storage

```solidity
struct SeasonInfo {
    uint256 startTime;
    uint256 endTime;
    bool isActive;
}

mapping(uint256 => SeasonInfo) public seasons;
uint256 public currentSeasonId;
uint256 public constant CREDITS_PER_SEASON = 10000 * 1e18;
```

### Functions

```solidity
// External ──────────────────────────────────────────

function createSeason(
    uint256 startTime,
    uint256 endTime
) external onlyRole(DEFAULT_ADMIN_ROLE);

function endSeason(uint256 seasonId) external onlyRole(DEFAULT_ADMIN_ROLE);

// View ──────────────────────────────────────────────

function getSeason(uint256 seasonId) 
    external view 
    returns (SeasonInfo memory);

function isSeasonActive(uint256 seasonId) 
    external view 
    returns (bool);
```

### Events

```solidity
event SeasonCreated(
    uint256 indexed seasonId, 
    uint256 startTime, 
    uint256 endTime
);

event SeasonEnded(uint256 indexed seasonId);
```

---

## 三、CreditLedger.sol

### Storage

```solidity
// 身份绑定
mapping(address => bytes32) public scoutIdOf;
mapping(bytes32 => bool) public isRegistered;
mapping(bytes32 => mapping(uint256 => bool)) public hasClaimedSeason;
mapping(bytes32 => uint256) public claimNonce;

// Credits 账本（按 season）
mapping(bytes32 => mapping(uint256 => uint256)) public freeBalance;
mapping(uint256 => uint256) public totalMintedCredits;
mapping(uint256 => uint256) public seasonProtocolReserve;

// 市场层账本
mapping(uint256 => uint256) public marketLockedCredits;
mapping(uint256 => uint256) public marketSeason;

// （MAX_STAKE_PER_MARKET 定义在 Market，CreditLedger 通过接口读取）
```

### Functions

```solidity
// External ──────────────────────────────────────────

function claim(
    uint256 seasonId,
    bytes32 scoutId,
    uint256 deadline,        // 签名过期时间
    bytes calldata signature
) external;

// Only Market ───────────────────────────────────────

function registerMarket(
    uint256 marketId, 
    uint256 seasonId
) external onlyRole(MARKET_ROLE);

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

function getTotalMinted(uint256 seasonId) 
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

---

## 四、Market.sol

### Storage

```solidity
struct Market {
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
    uint256 winningsPerShare;   // 1e18 定点数
    Status status;
    Result result;
}

struct Position {
    Side side;
    uint256 yesStake;
    uint256 noStake;
    bool finalized;
    bool claimed;
    uint256 claimableCredits;
    int256 scoreDelta;
}

// State
uint256 public marketCounter;
mapping(uint256 => Market) public markets;
mapping(uint256 => mapping(bytes32 => Position)) public positions;

// 依赖合约
ICreditLedger public creditLedger;
ILeaderboard public leaderboard;

// 常量
uint256 public constant MAX_STAKE_PER_MARKET = 2000 * 1e18;
uint256 public constant CLAIM_WINDOW = 7 days;
uint256 public constant PRICE_BASIS = 10000;
```

### Functions

```solidity
// Factory 调用 ──────────────────────────────────────

function createMarket(
    MarketSpec calldata spec
) external; // 内部校验 msg.sender == factory

function settle(
    uint256 marketId, 
    bool passed
) external onlyRole(SETTLEMENT_ROLE);

function voidMarket(
    uint256 marketId, 
    string calldata reasonURI
) external onlyRole(DEFAULT_ADMIN_ROLE);

// Public ────────────────────────────────────────────

function takePosition(
    uint256 marketId, 
    Side side, 
    uint256 amount
) external nonReentrant;

function forceVoid(uint256 marketId) external;

function finalizePosition(
    uint256 marketId, 
    bytes32 scoutId
) external;

function claim(uint256 marketId) external nonReentrant;

function sweepExpiredRemainder(uint256 marketId) external;

// Batch ─────────────────────────────────────────────

function claimAll(uint256[] calldata marketIds) external nonReentrant;

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
    returns (Market memory);
```

### Events

```solidity
event MarketCreated(
    uint256 indexed marketId,
    address indexed creator,
    bytes32 specHash,
    string metadataURI,
    uint256 tradingDeadline,
    uint256 resolutionDeadline
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

---

## 五、MarketFactory.sol

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
    // 校验后调 market.createMarket(spec)
}
```

---

## 六、Leaderboard.sol

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

## 七、测试用例清单

### CreditLedger 测试

```
□ claim
  □ 首次 claim 成功，mint credits，绑定 wallet
  □ 重复 claim 同赛季 revert AlreadyClaimed
  □ 无效签名 revert InvalidSignature
  □ 跨赛季可再次 claim

□ lockForTrade
  □ 扣 freeBalance，增 marketLockedCredits
  □ 余额不足 revert
  □ 只有 MARKET_ROLE 可调用

□ releaseToScout
  □ 减 marketLockedCredits，增 freeBalance
  □ 释放金额 > marketLockedCredits revert
  □ 只有 MARKET_ROLE 可调用

□ moveLockedToReserve
  □ 减 marketLockedCredits，增 seasonProtocolReserve
  □ 只有 MARKET_ROLE 可调用

□ 不变量
  □ 总量守恒：sum(free) + sum(locked) + reserve = totalMinted
```

### Market 测试

```
□ createMarket
  □ MARKET_CREATOR_ROLE 成功创建
  □ 无权限 revert Unauthorized
  □ 自动调用 creditLedger.registerMarket

□ takePosition
  □ 买 YES 成功，扣 credits，记录 stake
  □ 买 NO 成功
  □ tradingDeadline 后 revert TradingClosed
  □ projectOwner 买 revert ProjectOwnerCannotTrade
  □ 超过 MAX_STAKE_PER_MARKET revert ExceedsMaxStake
  □ 先买 YES 再买 NO revert SingleSideOnly
  □ 追加同边 stake 成功

□ settle
  □ SETTLEMENT_ROLE 成功结算
  □ resolutionDeadline 前 revert SettlementTooEarly
  □ 已结算 revert AlreadySettled
  □ 设置 claimDeadline
  □ 计算 winningsPerShare 正确
  □ 无赢家时转 reserve

□ voidMarket
  □ DEFAULT_ADMIN_ROLE 成功作废
  □ 设置 claimDeadline
  □ 已结算 revert AlreadySettled

□ forceVoid
  □ forceVoidDeadline 前 revert ForceVoidTooEarly
  □ forceVoidDeadline 后成功作废

□ finalizePosition
  □ SETTLED: 计算 claimableCredits 和 scoreDelta 正确
  □ VOIDED: claimableCredits = stake, scoreDelta = 0
  □ 重复 finalize revert PositionAlreadyFinalized
  □ 任何人可代调用

□ claim
  □ 赢家成功领取
  □ VOIDED 成功退款
  □ 未 finalize revert NotFinalized
  □ 已领取 revert AlreadyClaimed
  □ 无 claimable revert NoClaimableCredits
  □ claimDeadline 后 revert ClaimWindowExpired

□ sweepExpiredRemainder
  □ claimDeadline 前 revert CannotSweepYet
  □ claimDeadline 后成功扫入 reserve
  □ 只有 SETTLED/VOIDED 可 sweep

□ getYesOdds
  □ 开盘 50/50
  □ 买 YES 后上涨
  □ 有上下限 [500, 9500]

□ canTrade / canSettle / canClaim / canSweep
  □ 各时间边界正确
```

### Integration 测试

```
□ 完整链路
  □ claim → buy YES → settle YES → finalize → claim winnings → leaderboard 有正分
  □ claim → buy NO → settle YES → finalize → leaderboard 有负分
  □ claim → buy YES → void → finalize → refund → leaderboard 0 分
  □ 多用户参与同一市场，结算后按 stake 比例分配正确

□ 不变量 fuzz
  □ inv_totalCreditConservation: 总量守恒
  □ inv_marketLockedMonotonic: 终态后只减不增
  □ inv_singleSide: 单边持仓
  □ inv_finalizeOnce: finalize 一次性
  □ inv_claimOnce: claim 一次性
```

---

## 八、部署顺序

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

*文档状态：接口冻结*  
*基于 P0-框架概览-v0.5.1-最终冻结.md*
