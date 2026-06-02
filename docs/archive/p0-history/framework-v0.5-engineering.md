# Veil Scout — P0 框架概览 v0.5（工程定稿）

> **Codex 最终审查后的工程版**。v0.4 产品机制 + Codex 账本模型精确化 + 接口原子化。
> 
> **状态：工程定稿，可写代码。**

---

## 一、5 个合约的职责（工程精确版）

| 合约 | 职责 | 不做什么 |
|------|------|---------|
| **Season** | 赛季生命周期、deadline 合法性校验 | 不碰 credits、不碰市场 |
| **CreditLedger** | **唯一 credits 账本**。原子锁仓/释放/转储备。管理 `freeBalance`、`marketLockedCredits`、`reserve` | 不记录市场状态、不计算收益 |
| **MarketFactory** | **薄入口**。校验 `MARKET_CREATOR_ROLE`，调用 `Market.createMarket()` | 不持有 storage |
| **Market** | **核心聚合**。持有所有 market/position state。下注、结算、finalize、claim、void、sweep | 不直接改任何 credits 数字 |
| **Leaderboard** | 被动接收 `updateScore`，记录 `score[scoutId][seasonId]` | 不排序、不计算 |

---

## 二、核心对象状态

### Market
```solidity
struct Market {
    bytes32 specHash;
    string metadataURI;
    uint256 seasonId;
    uint256 tradingDeadline;
    uint256 resolutionDeadline;
    uint256 forceVoidDeadline;
    address projectOwner;
    uint256 yesStake;
    uint256 noStake;
    uint256 winningsPerShare;   // 1e18 定点数
    Status status;              // TRADING | SETTLED | VOIDED
    Result result;              // NONE | YES | NO
}
```

### Position（按 scoutId）
```solidity
struct Position {
    Side side;              // NONE | YES | NO
    uint256 yesStake;
    uint256 noStake;
    bool finalized;
    bool claimed;
    uint256 claimableCredits; // SETTLED= winnings, VOIDED= refund
    int256 scoreDelta;       // SETTLED= PnL, VOIDED= 0
}
```

**注意**：不存 `TRADING_CLOSED`。时间派生状态：
- `canTrade = status == TRADING && block.timestamp < tradingDeadline`
- `canSettle = status == TRADING && block.timestamp >= resolutionDeadline`
- `canForceVoid = status == TRADING && block.timestamp >= forceVoidDeadline`

---

## 三、账本模型（精确版）

### 三层数据

```solidity
// 1. 用户层（CreditLedger）
mapping(bytes32 scoutId => mapping(uint256 seasonId => uint256)) public freeBalance;

// 2. 市场层（CreditLedger）
mapping(uint256 marketId => uint256) public marketLockedCredits;
mapping(uint256 seasonId => uint256) public seasonProtocolReserve;
mapping(uint256 seasonId => uint256) public totalMintedCredits;

// 3. 索引层（可选，用于前端展示）
mapping(uint256 marketId => mapping(bytes32 scoutId => uint256)) public userMarketLocked;
```

### 总量不变量

```
sum(freeBalance[*][season]) + sum(marketLockedCredits[*]) + seasonProtocolReserve[season]
== totalMintedCredits[season]
```

### 索引不变量

```
for each marketId:
    sum(userMarketLocked[marketId][*]) == marketLockedCredits[marketId]
```

---

## 四、CreditLedger 原子接口

```solidity
// 1. 下注锁仓（原子：扣 free + 锁市场 + 写索引）
function lockForTrade(
    bytes32 scoutId,
    uint256 seasonId,
    uint256 marketId,
    uint256 amount
) external onlyMarket;

// 2. 结算释放（原子：解锁市场 + 还 free）
function releaseToScout(
    bytes32 scoutId,
    uint256 seasonId,
    uint256 marketId,
    uint256 amount
) external onlyMarket;

// 3. 转储备金（原子：解锁市场 + 增 reserve）
function moveLockedToReserve(
    uint256 seasonId,
    uint256 marketId,
    uint256 amount
) external onlyMarket;

// 4. 领取积分
function claim(
    uint256 seasonId,
    bytes32 scoutId,
    bytes calldata signature
) external;

// 5. 查询
function freeBalanceOf(bytes32 scoutId, uint256 seasonId) external view returns (uint256);
```

**关键**：Market 不直接改任何 credits 数字，只调 CreditLedger 的原子接口。

---

## 五、用户操作完整链路

```
1. claim credits
   User ──► CreditLedger.claim(seasonId, scoutId, signature)
   └── 首次 claim 时绑定 wallet → scoutId

2. buy YES/NO
   User ──► Market.takePosition(marketId, YES, 1000)
   ├── CreditLedger.lockForTrade(scoutId, seasonId, marketId, 1000)
   │      ├── freeBalance -= 1000
   │      ├── marketLockedCredits += 1000
   │      └── userMarketLocked += 1000
   └── Market 记录 position

3. settle（admin）
   Admin ──► Market.settle(marketId, passed)
   └── 计算 winningsPerShare，emit 事件

4. finalize（任何人）
   Anyone ──► Market.finalizePosition(marketId, scoutId)
   ├── SETTLED: claimableCredits = stake + proportional winnings
   │            scoreDelta = claimableCredits - stake
   ├── VOIDED:  claimableCredits = stake
   │            scoreDelta = 0
   ├── Leaderboard.updateScore(scoutId, scoreDelta)
   └── emit 事件

5. claim（赢家/退款者自己）
   User ──► Market.claim(marketId)
   ├── check finalized=true, claimed=false
   ├── CreditLedger.releaseToScout(scoutId, seasonId, marketId, claimableCredits)
   │      ├── marketLockedCredits -= amount
   │      ├── freeBalance += amount
   │      └── userMarketLocked -= amount
   └── claimed = true

6. sweep dust（任何人）
   Anyone ──► Market.sweepDust(marketId)
   ├── require status is SETTLED or VOIDED
   ├── dust = marketLockedCredits[marketId]
   ├── CreditLedger.moveLockedToReserve(seasonId, marketId, dust)
   └── emit 事件
```

---

## 六、关键设计决策（v0.5 最终版）

| 决策 | 内容 |
|------|------|
| **账本唯一** | `CreditLedger` 独家管理所有 credits 流动，`Market` 只调原子接口 |
| **原子接口** | `lockForTrade` / `releaseToScout` / `moveLockedToReserve` 不可拆分 |
| **finalize ≠ claim** | finalize 只算 `claimableCredits` 和 `scoreDelta`，claim 才调用 `releaseToScout` |
| **void 不计分** | void 时 `scoreDelta = 0`，`claimableCredits = stake` |
| **统一 claim** | SETTLED 和 VOIDED 用同一套 `claim()` 逻辑 |
| **不存 TRADING_CLOSED** | 用 `block.timestamp < tradingDeadline` 派生 |
| **单边持仓** | `Side.NONE / YES / NO`，同一 scoutId 同一市场只能持一边 |
| **价格脱钩** | `getYesOdds()` 只展示，不影响任何收益计算 |
| **收益公式** | `winnings = stake + (stake * losingStakes / winningStakes)` |
| **MarketFactory 做薄** | 只校验角色 + 调 `Market.createMarket()`，不持 storage |

---

## 七、状态机（简化版）

```
NOT_CREATED ──► TRADING ──► SETTLED
                     │
                     └──► VOIDED
```

时间检查：
- `canTrade`: `status == TRADING && block.timestamp < tradingDeadline`
- `canSettle`: `status == TRADING && block.timestamp >= resolutionDeadline`
- `canForceVoid`: `status == TRADING && block.timestamp >= forceVoidDeadline`
- `canSweep`: `status == SETTLED || status == VOIDED`

---

## 八、不变量（fuzz 测试验证）

```
1. 总量守恒：
   sum(freeBalance[*][s]) + sum(marketLockedCredits[*]) + reserve[s] == totalMinted[s]

2. 索引一致：
   for each m: sum(userMarketLocked[m][*]) == marketLockedCredits[m]

3. 终态锁定额递减：
   SETTLED/VOIDED 后 marketLockedCredits[m] 只减不增

4. 单边持仓：
   同一 scoutId 同一市场不能同时 yesStake>0 和 noStake>0

5. finalize 一次性：
   position.finalized 只能 false → true

6. claim 一次性：
   position.claimed 只能 false → true，且 claimableCredits 不变

7. Market 不直接改 credits：
   Market 合约的 storage 中没有 uint256 credits 字段
```

---

## 九、权限矩阵

| 功能 | 角色 | 说明 |
|------|------|------|
| 创建赛季 | `DEFAULT_ADMIN_ROLE` | |
| 创建市场 | `MARKET_CREATOR_ROLE` | MarketFactory 校验后调 Market |
| 领取积分 | 公开 | `signedClaim` / whitelist mock |
| 买 YES/NO | 公开 | `canTrade` + 非 projectOwner |
| 结算市场 | `SETTLEMENT_ROLE` | admin 手动 settle |
| 作废市场 | `DEFAULT_ADMIN_ROLE` | |
| forceVoid | 公开 | 超过 `forceVoidDeadline` 后 |
| finalize | 公开 | 任何人可代调用 |
| claim | 公开 | 本人领取 |
| sweepDust | 公开 | 任何人可触发 |
| 暂停功能 | `PAUSER_ROLE` | 细粒度 |

---

## 十、文件结构

```
veil-scout/
├── contracts/
│   ├── src/
│   │   ├── Season.sol
│   │   ├── CreditLedger.sol
│   │   ├── MarketFactory.sol
│   │   ├── Market.sol
│   │   ├── Leaderboard.sol
│   │   ├── types/
│   │   │   ├── MarketSpec.sol
│   │   │   ├── Enums.sol
│   │   │   └── Errors.sol
│   │   └── interfaces/
│   │       ├── ICreditLedger.sol
│   │       ├── IMarket.sol
│   │       └── ISeason.sol
│   ├── test/
│   │   ├── CreditLedger.t.sol
│   │   ├── Market.t.sol
│   │   └── Integration.t.sol
│   ├── script/
│   │   ├── DeployP0.s.sol
│   │   └── MockData.s.sol
│   ├── abi/
│   └── foundry.toml
├── docs/
│   ├── P0-框架概览-v0.5-工程定稿.md
│   └── MarketSpec-模板.json
└── README.md
```

---

## 变更日志

### v0.4 → v0.5（Codex 工程修正）

| # | 修正 | 原因 |
|---|------|------|
| 1 | `CreditLedger` 接口原子化：`lockForTrade` / `releaseToScout` / `moveLockedToReserve` | 避免拆成两个外部调用导致中间状态不一致 |
| 2 | 账本三层模型：`freeBalance` / `marketLockedCredits` / `userMarketLocked` 索引 | 总量不变量不重复计算 |
| 3 | `Position.claimableCredits` 统一替代 `winningsOwed` | SETTLED 和 VOIDED 同一套 claim 逻辑 |
| 4 | 不存 `TRADING_CLOSED` | 时间派生状态比存状态更可靠 |
| 5 | `MarketFactory` 明确为薄入口 | 真实 storage 归 `Market`，Factory 不持数据 |

---

*文档生成时间：2026-05-04*  
*参与方：Track A（合约）、GPT 5.5、Kimi CLI、Codex*  
*状态：v0.5 工程定稿，可写代码*
