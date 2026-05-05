# Veil Scout — P0 框架概览 v0.5.1（最终冻结）

> **Codex 资金账本审计后的最终版**。v0.5 + 4 条资金安全修正。
> 
> **状态：最终冻结。开写合约。**

---

## 资金安全修正记录（v0.5 → v0.5.1）

| # | 修正 | 原因 | 影响 |
|---|------|------|------|
| 1 | **删除 `CreditLedger.userMarketLocked`** | `releaseToScout` 释放 winnings 可能 > 原始 stake，按索引扣会 underflow | 避免账本不一致 |
| 2 | **`sweepDust` → `sweepExpiredRemainder`** | 结算后 `marketLockedCredits` 里大部分是未领取 winnings，不能立刻扫 | 防止资金挪用 |
| 3 | **增加 `marketSeason` 绑定** | `CreditLedger` 需要知道每个 market 属于哪个 season 才能校验总量 | 跨赛季账目清晰 |
| 4 | **修正不变量 7 表述** | `Market` 确实存了 stake（本质就是 credits 数量），不能说"没有 credits 字段" | 表述准确 |

---

## 一、5 个合约的职责（v0.5.1 精确版）

| 合约 | 职责 | 不做什么 |
|------|------|---------|
| **Season** | 赛季生命周期、deadline 合法性校验 | 不碰 credits、不碰市场 |
| **CreditLedger** | **唯一 credits 账本**。原子锁仓/释放/转储备。管理 `freeBalance`、`marketLockedCredits`、`reserve`、`totalMinted` | 不记录市场状态、不计算收益、不存用户级锁仓索引 |
| **MarketFactory** | **薄入口**。校验 `MARKET_CREATOR_ROLE`，调用 `Market.createMarket()` | 不持有 storage |
| **Market** | **核心聚合**。持有所有 market/position state。下注、结算、finalize、claim、void、sweep | 不直接改任何 credits 数字、不存全局账本 |
| **Leaderboard** | 被动接收 `updateScore`，记录 `score[scoutId][seasonId]` | 不排序、不计算 |

---

## 二、CreditLedger 账本模型（三层 → 两层）

### v0.5 的错误设计

```solidity
// ❌ 已删除
mapping(uint256 marketId => mapping(bytes32 scoutId => uint256)) public userMarketLocked;
```

问题：`releaseToScout` 释放 winnings（可能 > 原始 stake），`userMarketLocked -= amount` 会 underflow。

### v0.5.1 正确设计

```solidity
// 1. 用户层
mapping(bytes32 scoutId => mapping(uint256 seasonId => uint256)) public freeBalance;

// 2. 市场层（唯一账本）
mapping(uint256 marketId => uint256) public marketLockedCredits;
mapping(uint256 marketId => uint256) public marketSeason;  // ← 新增
mapping(uint256 seasonId => uint256) public seasonProtocolReserve;
mapping(uint256 seasonId => uint256) public totalMintedCredits;
```

**用户在某市场的 stake 从 `Market.positions` 读取，不进 `CreditLedger`。**

### 总量不变量

```
for each seasonId:
    sum(freeBalance[*][seasonId]) + sum(marketLockedCredits[m] where marketSeason[m] == seasonId) + seasonProtocolReserve[seasonId]
    == totalMintedCredits[seasonId]
```

### 新增：marketSeason 绑定

```solidity
function registerMarket(uint256 marketId, uint256 seasonId) external onlyMarket;
```

- `MarketFactory.createMarket()` 时调用 `creditLedger.registerMarket(marketId, seasonId)`
- `lockForTrade` / `releaseToScout` / `moveLockedToReserve` 都校验 `marketSeason[marketId] == seasonId`

---

## 三、CreditLedger 原子接口（v0.5.1）

```solidity
// 1. 注册市场（创建时调用一次）
function registerMarket(uint256 marketId, uint256 seasonId) external onlyMarket;

// 2. 下注锁仓（原子：扣 free + 增 marketLocked）
function lockForTrade(
    bytes32 scoutId,
    uint256 seasonId,
    uint256 marketId,
    uint256 amount
) external onlyMarket;

// 3. 结算释放（原子：减 marketLocked + 增 free）
function releaseToScout(
    bytes32 scoutId,
    uint256 seasonId,
    uint256 marketId,
    uint256 amount
) external onlyMarket;

// 4. 转储备金（原子：减 marketLocked + 增 reserve）
function moveLockedToReserve(
    uint256 seasonId,
    uint256 marketId,
    uint256 amount
) external onlyMarket;

// 5. 领取积分
function claim(
    uint256 seasonId,
    bytes32 scoutId,
    bytes calldata signature
) external;

// 6. 查询
function freeBalanceOf(bytes32 scoutId, uint256 seasonId) external view returns (uint256);
```

**关键**：没有 `userMarketLocked`。用户在某个市场的 stake 从 `Market.positions` 读。

---

## 四、Market 核心对象状态

### Market

```solidity
struct Market {
    bytes32 specHash;
    string metadataURI;
    uint256 seasonId;
    uint256 tradingDeadline;
    uint256 resolutionDeadline;
    uint256 forceVoidDeadline;
    uint256 claimDeadline;      // ← 新增：settledAt + CLAIM_WINDOW
    address projectOwner;
    uint256 yesStake;
    uint256 noStake;
    uint256 winningsPerShare;   // 1e18 定点数
    Status status;              // TRADING | SETTLED | VOIDED
    Result result;              // NONE | YES | NO
}
```

**`CLAIM_WINDOW` 建议 7 天。**

### Position

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

---

## 五、用户操作完整链路（v0.5.1）

```
1. claim credits
   User ──► CreditLedger.claim(seasonId, scoutId, signature)
   └── 首次 claim 时绑定 wallet → scoutId

2. buy YES/NO
   User ──► Market.takePosition(marketId, YES, 1000)
   ├── CreditLedger.lockForTrade(scoutId, seasonId, marketId, 1000)
   │      ├── freeBalance -= 1000
   │      └── marketLockedCredits += 1000
   └── Market 记录 position

3. settle（admin）
   Admin ──► Market.settle(marketId, passed)
   ├── 计算 winningsPerShare
   ├── claimDeadline = block.timestamp + CLAIM_WINDOW
   └── emit 事件

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
   │      └── freeBalance += amount
   └── claimed = true

6. sweep expired remainder（claim window 后）
   Anyone ──► Market.sweepExpiredRemainder(marketId)
   ├── require status is SETTLED or VOIDED
   ├── require block.timestamp > claimDeadline
   ├── remainder = marketLockedCredits[marketId]
   ├── CreditLedger.moveLockedToReserve(seasonId, marketId, remainder)
   └── emit 事件
```

---

## 六、关键设计决策（v0.5.1 最终版）

| 决策 | 内容 |
|------|------|
| **账本唯一** | `CreditLedger` 只存 `freeBalance` / `marketLockedCredits` / `reserve` / `totalMinted`，不存用户级索引 |
| **原子接口** | `lockForTrade` / `releaseToScout` / `moveLockedToReserve` / `registerMarket` |
| **marketSeason 绑定** | 每个 marketId 创建时注册到 season，总量不变量按 season 隔离 |
| **finalize ≠ claim** | finalize 只算 `claimableCredits` 和 `scoreDelta`，claim 才调用 `releaseToScout` |
| **统一 claim** | SETTLED 和 VOIDED 用同一套 `claim()` 逻辑 |
| **claim window** | 结算后 7 天内可 claim，过期后才可 sweep |
| **不存 TRADING_CLOSED** | 用 `block.timestamp < tradingDeadline` 派生 |
| **单边持仓** | `Side.NONE / YES / NO`，同一 scoutId 同一市场只能持一边 |
| **价格脱钩** | `getYesOdds()` 只展示，不影响任何收益计算 |
| **MarketFactory 做薄** | 只校验角色 + 调 `Market.createMarket()`，不持 storage |

---

## 七、状态机

```
NOT_CREATED ──► TRADING ──► SETTLED
                     │
                     └──► VOIDED
```

时间检查：
- `canTrade`: `status == TRADING && block.timestamp < tradingDeadline`
- `canSettle`: `status == TRADING && block.timestamp >= resolutionDeadline`
- `canForceVoid`: `status == TRADING && block.timestamp >= forceVoidDeadline`
- `canClaim`: `status == SETTLED || status == VOIDED`
- `canSweep`: `(status == SETTLED || status == VOIDED) && block.timestamp > claimDeadline`

---

## 八、不变量（fuzz 测试验证）

```
1. 总量守恒（按 season）：
   sum(freeBalance[*][s]) + sum(marketLockedCredits[m] where marketSeason[m]==s) + reserve[s]
   == totalMinted[s]

2. 终态锁定额递减：
   SETTLED/VOIDED 后 marketLockedCredits[m] 只减不增，
   直到 claimDeadline 后 sweep 归零

3. 单边持仓：
   同一 scoutId 同一市场不能同时 yesStake>0 和 noStake>0

4. finalize 一次性：
   position.finalized 只能 false → true

5. claim 一次性：
   position.claimed 只能 false → true，且 claimableCredits 不变

6. Market 不存全局账本：
   Market 的 storage 中没有 freeBalance / marketLockedCredits / reserve / totalMinted
   （ Market 只存 stake / claimableCredits / status 等局部状态）

7. release 不超锁仓：
   releaseToScout 的 amount <= marketLockedCredits[marketId]

8. sweep 不抢活钱：
   sweepExpiredRemainder 只能在 claimDeadline 后调用
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
| sweepExpiredRemainder | 公开 | claimDeadline 后任何人可触发 |
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
│   ├── P0-框架概览-v0.5.1-最终冻结.md
│   └── MarketSpec-模板.json
└── README.md
```

---

## 变更日志

### v0.5 → v0.5.1（Codex 资金安全审计）

| # | 修正 | 原因 |
|---|------|------|
| 1 | 删除 `CreditLedger.userMarketLocked` | `releaseToScout` 释放 winnings > 原始 stake，按索引扣会 underflow |
| 2 | `sweepDust` → `sweepExpiredRemainder` + `claimDeadline` | 结算后 marketLockedCredits 里是未领取 winnings，不能立刻扫 |
| 3 | 增加 `marketSeason` 绑定 | CreditLedger 需要知道 market 属于哪个 season 才能校验总量 |
| 4 | 修正不变量 7 | Market 存了 stake（本质是 credits），不能说"没有 credits 字段" |

---

*文档生成时间：2026-05-04*  
*参与方：Track A（合约）、GPT 5.5、Kimi CLI、Codex*  
*状态：v0.5.1 最终冻结，可写合约*
