# Veil Scout — P0 框架概览 v0.4.1

> **Codex 修正后的完整框架**。v0.4 产品机制定稿 + 5 条工程实现修正后的全貌。

---

## 一、5 个合约的职责

| 合约 | 职责 | 不做什么 |
|------|------|---------|
| **Season** | 创建赛季、记录起止时间 | 不碰 credits、不碰市场 |
| **CreditLedger** | **唯一 credits 账本**。管理用户余额、锁定额、`marketLockedCredits`、赛季储备金 | 不记录市场状态、不计算收益 |
| **MarketFactory** | 审核后创建市场，写入 `MarketSpec` | 不交易、不结算 |
| **Market** | **核心聚合**。下注、结算、finalize、claim、void。持有所有 market/position state | 不直接改 `marketLockedCredits`（通过 CreditLedger 接口） |
| **Leaderboard** | 被动接收 `updateScore`，记录分数 | 不排序、不计算 |

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
    Status status;              // TRADING | TRADING_CLOSED | SETTLED | VOIDED
    Result result;              // NONE | YES | NO
}
```

### Position（按 scoutId）
```solidity
struct Position {
    Side side;           // NONE | YES | NO
    uint256 yesStake;
    uint256 noStake;
    bool finalized;
    bool claimed;
    uint256 winningsOwed; // finalize 时计算
    int256 scoreDelta;    // finalize 时计算
}
```

---

## 三、用户操作完整链路

```
1. claim credits
   User ──► CreditLedger.claim(seasonId, scoutId, signature)
   └── 首次 claim 时绑定 wallet → scoutId

2. buy YES/NO
   User ──► Market.takePosition(marketId, YES, 1000)
   ├── CreditLedger.debitForTrade(scoutId, 1000)
   ├── CreditLedger.lockForMarket(marketId, 1000)
   └── Market 记录 position

3. settle（admin）
   Admin ──► Market.settle(marketId, passed)
   └── 计算 winningsPerShare，emit 事件

4. finalize（任何人）
   Anyone ──► Market.finalizePosition(marketId, scoutId)
   ├── 计算 winningsOwed（SETTLED）或 0（VOIDED）
   ├── scoreDelta = winningsOwed - stake（VOIDED 时 = 0）
   ├── Leaderboard.updateScore(scoutId, scoreDelta)
   └── emit 事件

5. claim winnings（赢家自己）
   User ──► Market.claimWinnings(marketId)
   ├── check finalized=true, claimed=false
   ├── CreditLedger.unlockForMarket(marketId, owed)
   ├── CreditLedger.creditFromSettlement(scoutId, owed)
   └── claimed = true
```

---

## 四、关键设计决策（已修正）

| 决策 | 内容 |
|------|------|
| **账本唯一** | `CreditLedger` 独家管理所有 credits 流动，`Market` 通过接口调用 |
| **finalize ≠ claim** | finalize 只算 owed 和 score，claim 才发钱，有独立 `claimed` 标记 |
| **void 不计分** | void 时 `scoreDelta = 0`，全额退款 |
| **dust sweep** | 终态市场剩余 credits 通过 `sweepMarketDust` 转 reserve |
| **单边持仓** | `Side.NONE / YES / NO`，同一 scoutId 同一市场只能持一边 |
| **价格脱钩** | `getYesOdds()` 只展示，不影响任何收益计算 |
| **收益公式** | `winnings = stake + (stake * losingStakes / winningStakes)` |

---

## 五、状态机

```
                    ┌─────────────────┐
         ┌─────────│   NOT_CREATED   │
         │         └────────┬────────┘
         │                  │ createMarket()
         │                  ▼
         │         ┌─────────────────┐
         │    ┌────│     TRADING     │◄────┐
         │    │    │  (可买/不可结算) │     │
         │    │    └────────┬────────┘     │
         │    │             │              │
         │    │    tradingDeadline 到      │
         │    │             │              │
         │    │             ▼              │
         │    │    ┌─────────────────┐     │
         │    └────│  TRADING_CLOSED │     │
         │         │  (不可买/等结算)  │     │
         │         └────────┬────────┘     │
         │                  │              │
         │    settle()      │      void()  │
         │         ┌────────┴────────┐     │
         │         ▼                 ▼     │
         │  ┌──────────┐      ┌──────────┐ │
         │  │ SETTLED  │      │  VOIDED  │ │
         └─►│(可claim)  │      │(可refund)│─┘
            └──────────┘      └──────────┘
                   │                │
                   └────┬───────────┘
                        │ forceVoid() (超过 forceVoidDeadline)
                        ▼
                   ┌──────────┐
                   │  VOIDED  │
                   └──────────┘
```

---

## 六、不变量（fuzz 测试验证）

```
1. 全系统 credits 守恒：
   sum(用户余额) + sum(用户锁定) + sum(marketLocked) + reserve = totalMinted

2. marketLockedCredits 准确：
   marketLockedCredits[m] = sum(该市场所有 position 的 stake) - sum(已领取/退款)

3. 单边持仓：
   同一 scoutId 同一市场不能同时 yesStake>0 和 noStake>0

4. 终态不变：
   SETTLED/VOIDED 后 marketLockedCredits 只减不增

5. finalize 一次性：
   position.finalized 只能 false → true，不可回退

6. claim 防重入：
   position.claimed 只能 false → true，且 winningsOwed 不变
```

---

## 七、Codex 5 条修正记录

| # | 修正 | 原因 |
|---|------|------|
| 1 | `marketLockedCredits` 归 `CreditLedger` 独家管理 | 避免 `Market` 直接改账本，破坏唯一性 |
| 2 | `finalize` 只算 owed，`claim` 才发钱，加 `claimed` 标记 | 第三方代 finalize 后赢家仍能 claim |
| 3 | void 时 `scoreDelta = 0` | 和"不计入 Scout Score"一致 |
| 4 | 补 `sweepMarketDust()` | v0.1 提了 dust 处理，后面版本弱化 |
| 5 | `Side.NONE` 写进 enum | 单边持仓规则依赖 |

---

*基于 P0-共识文档-v0.4-最终定稿.md + Codex 工程修正*  
*状态：框架冻结，可开始写合约*
