# Veil Scout — P0 共识文档 v0.2

> **一句话定义**：Veil Scout P0 是一个赛季制积分判断竞赛。用户用不可转让 credits 对真实 MarketSpec 做 YES/NO 判断；结算后正确方按 stake 比例分配错误方 credits，形成可审计排行榜。**价格只用于展示市场倾向，不决定收益。**

---

## P0 产品边界

### 是什么
- 赛季制（Season-based）
- 积分判断竞赛（Credit-based judgment competition）
- 真实项目里程碑判断（Real project milestones）
- 结算后形成可审计排行榜（Auditable leaderboard）

### 不是什么
- ❌ 不是完整预测市场（no secondary market / no sell）
- ❌ 不是 AMM / LMSR（price 只展示，不参与 payout）
- ❌ 不是投注产品（credits 无现金价值，不可转让）
- ❌ 不是 dispute 平台（P0 无争议机制）
- ❌ 不是 SBT / token 发放平台（P1+）

### P0 主链路
```
claim credits → buy YES/NO → settle → claim winnings → score update → leaderboard
```

---

## P0 合约清单（6 + 2）

| 合约 | 职责 |
|------|------|
| `Season.sol` | 赛季生命周期 |
| `CreditLedger.sol` | 积分记账（非 ERC20） |
| `MarketFactory.sol` | 审核后创建市场 |
| `Market.sol` | 下注、持仓、价格展示 |
| `Settlement.sol` | 结算判定、赢家分配 |
| `Leaderboard.sol` | 分数记录（不排序） |
| `types/MarketSpec.sol` | 核心数据结构 |
| `interfaces/*.sol` | 接口定义 |

---

## 核心决策（v0.2 升级点）

### 1. 统一身份：`bytes32 scoutId`

**所有核心状态统一用 `bytes32 scoutId`（由 nullifierHash 派生），不混用 address。**

```solidity
// 唯一身份标识
mapping(bytes32 scoutId => mapping(uint256 seasonId => uint256)) public balances;

// 持仓
mapping(uint256 marketId => mapping(bytes32 scoutId => Position)) public positions;

// 分数
mapping(bytes32 scoutId => mapping(uint256 seasonId => int256)) public scores;
```

**P0 mock**：zkID 验证先不做，用 `signedClaim(scoutId, signature)` 或 whitelist 模拟。但接口必须保留 `scoutId`，P1 接入真实 zkID 时无需改数据结构。

### 2. 下注单位：`amount = spentCredits`，不做 shares

**P0 不做 shares 概念。** 用户直接花费 credits 买 YES 或 NO：

```solidity
function takePosition(uint256 marketId, Side side, uint256 amount) external
```

- `amount` = 用户愿意花费的 credits 数量
- 合约扣除 credits，记录 stake
- **price 只作为展示用的 odds signal**，不影响最终收益
- 结算时：赢家按 `stake / totalWinningStakes` 比例分输家的总 credits

**为什么简化**：P0 要证明的是"判断竞赛能跑通"，不是"AMM 定价优雅"。shares 和复杂 payout 计算会拖慢主链路。

### 3. 结算方式：`claimWinnings` 而非批量发钱

**Settlement 只做判定，不做批量转账。**

```solidity
// Settlement.sol：只记录结果和分配比例
function settle(uint256 marketId, bool passed) external onlyRole(SETTLEMENT_ROLE);

// Market.sol：赢家自己 claim
function claimWinnings(uint256 marketId) external;
```

**优势**：
- `settle()` 不遍历赢家列表，gas 固定
- 赢家随时可 claim，不受 gas limit 限制
- 无人 claim 的 winnings 留在市场合约中，最终进入 protocol reserve

### 4. 无效市场：`voidMarket`

```solidity
function voidMarket(uint256 marketId, string calldata reasonURI) external onlyRole(DEFAULT_ADMIN_ROLE);
```

**触发条件**：
- MarketSpec 被发现无法结算（数据源失效、条件模糊）
- 项目方 rug / 作弊被证实
- 平台紧急暂停

**效果**：
- 市场状态变为 `VOIDED`
- 所有参与者可 `refundLockedCredits(marketId)` 全额退回 stake
- 不计入 Scout Score

### 5. MarketSpec：链上存 `specHash + metadataURI`

```solidity
struct MarketSpec {
    bytes32 specHash;           // keccak256(完整问题、YES条件、NO条件、数据源)
    string metadataURI;         // IPFS / Arweave / HTTPS 链接，存完整 JSON
    uint256 tradingDeadline;
    uint256 resolutionDeadline;
    address projectOwner;
}
```

**链下 JSON 格式**：
```json
{
  "question": "AgentPay 能在 2026-06-30 前完成 1,000 笔经验证的 AI Agent 支付吗？",
  "yesCondition": "链上事件显示 >= 1,000 笔有效支付，唯一钱包 >= 100",
  "noCondition": "未达成上述条件",
  "dataSource": "智能合约 0x... 的事件日志",
  "milestone": "30 天内完成 1,000 笔验证支付",
  "initialProbability": 0.62
}
```

**为什么**：完整问题文本上链 gas 高，存 hash + URI 既保证不可篡改又省成本。

### 6. 项目方禁买

```solidity
function takePosition(uint256 marketId, Side side, uint256 amount) external {
    require(msg.sender != markets[marketId].projectOwner, "Project owner cannot trade");
    // ...
}
```

P0 在合约层硬编码禁止。P1 可扩展为禁止关联地址（通过链下分析 + 前端屏蔽）。

### 7. `initialProbability` 只展示，不参与结算

- `initialProbability` 由 AI / 人工配置，存于 MarketSpec JSON 中
- 前端展示为"AI 初始倾向"
- **不影响任何收益计算**
- 如果 AI 错了，只影响前端展示，不伤害用户利益

### 8. 价格曲线：线性展示，不参与 payout

```solidity
// 只用于前端展示市场倾向
function getYesOdds(uint256 marketId) external view returns (uint256) {
    Market storage m = markets[marketId];
    uint256 total = m.yesStake + m.noStake + 1;
    uint256 yesPrice = 5000 + (m.yesStake * 5000 / total) - (m.noStake * 5000 / total);
    if (yesPrice < 500) yesPrice = 500;
    if (yesPrice > 9500) yesPrice = 9500;
    return yesPrice; // 基点
}
```

**收益计算与 price 完全脱钩**：
```
winnings = totalLosingStakes * myWinningStake / totalWinningStakes
```

### 9. Evidence P0 不上链

- 前端保留 evidence 提交 UI（占位）
- 链上只保留 `EvidenceSubmitted` event（可选）
- 评分、采纳、奖励全部 P1

### 10. 细粒度暂停

```solidity
bool public claimsPaused;
bool public marketCreationPaused;
bool public globalTradingPaused;
bool public settlementPaused;
mapping(uint256 => bool) public marketTradingPaused;
mapping(uint256 => bool) public marketSettlementPaused;
```

---

## Events（v0.2 最终版）

```solidity
event CreditsClaimed(
    bytes32 indexed scoutId,
    uint256 indexed seasonId,
    uint256 amount
);

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
    uint256 amount           // 花费的 credits
);

event MarketSettled(
    uint256 indexed marketId,
    bool passed,
    uint256 totalLosingStakes,
    uint256 totalWinningStakes
);

event WinningsClaimed(
    uint256 indexed marketId,
    bytes32 indexed scoutId,
    uint256 amount
);

event MarketVoided(
    uint256 indexed marketId,
    string reasonURI
);

event Refunded(
    uint256 indexed marketId,
    bytes32 indexed scoutId,
    uint256 amount
);

event ScoreUpdated(
    bytes32 indexed scoutId,
    uint256 indexed seasonId,
    int256 newScore,
    uint256 indexed marketId
);

event EvidenceSubmitted(
    uint256 indexed marketId,
    bytes32 indexed scoutId,
    string contentURI        // IPFS / 链接
);
```

---

## 权限矩阵（v0.2）

| 功能 | 角色 | 说明 |
|------|------|------|
| 创建赛季 | `DEFAULT_ADMIN_ROLE` | 团队多签 |
| 创建市场 | `MARKET_CREATOR_ROLE` | 平台审核后 |
| 领取积分 | 公开 | `signedClaim` / whitelist mock |
| 买 YES/NO | 公开 | 非 projectOwner、tradingDeadline 前 |
| 结算市场 | `SETTLEMENT_ROLE` | admin 手动 settle |
| 作废市场 | `DEFAULT_ADMIN_ROLE` | 紧急操作 |
| claim winnings | 公开 | 赢家自助领取 |
| 暂停功能 | `PAUSER_ROLE` | 细粒度 |

---

## 收益计算（P0 精确公式）

```solidity
// Settlement.sol：记录结果
function settle(uint256 marketId, bool passed) external onlyRole(SETTLEMENT_ROLE) {
    Market storage m = markets[marketId];
    require(block.timestamp >= m.resolutionDeadline, "Too early");
    require(m.status == Status.TRADING, "Invalid status");
    
    m.status = Status.SETTLED;
    m.result = passed ? Result.YES : Result.NO;
    
    uint256 losingStakes = passed ? m.noStake : m.yesStake;
    uint256 winningStakes = passed ? m.yesStake : m.noStake;
    
    m.winningsPerShare = winningStakes > 0 ? (losingStakes * 1e18 / winningStakes) : 0;
    // 用 1e18 定点数避免精度丢失
    
    emit MarketSettled(marketId, passed, losingStakes, winningStakes);
}

// Market.sol：赢家自助领取
function claimWinnings(uint256 marketId) external {
    Market storage m = markets[marketId];
    require(m.status == Status.SETTLED, "Not settled");
    
    Position storage pos = positions[marketId][scoutId];
    require(pos.claimed == false, "Already claimed");
    
    bool isWinner = (m.result == Result.YES && pos.yesStake > 0) || 
                    (m.result == Result.NO && pos.noStake > 0);
    require(isWinner, "Not winner");
    
    uint256 winningStake = m.result == Result.YES ? pos.yesStake : pos.noStake;
    uint256 winnings = winningStake + (winningStake * m.winningsPerShare / 1e18);
    
    // dust 处理：如果 winnings > market 余额，给剩余全部
    uint256 available = creditLedger.balanceOf(address(this), m.seasonId);
    if (winnings > available) winnings = available;
    
    pos.claimed = true;
    creditLedger.creditFromSettlement(msg.sender, m.seasonId, winnings);
    
    emit WinningsClaimed(marketId, scoutId, winnings);
}
```

**Dust**：未领取的 winnings + 精度余数留在市场合约，赛季结束后 sweep 进 `seasonProtocolReserve`。

---

## 建议文件结构

```
veil-scout/
├── contracts/
│   ├── src/
│   │   ├── Season.sol
│   │   ├── CreditLedger.sol
│   │   ├── MarketFactory.sol
│   │   ├── Market.sol
│   │   ├── Settlement.sol
│   │   ├── Leaderboard.sol
│   │   ├── types/
│   │   │   ├── MarketSpec.sol
│   │   │   └── Enums.sol
│   │   └── interfaces/
│   │       ├── ICreditLedger.sol
│   │       ├── IMarket.sol
│   │       ├── ISettlement.sol
│   │       └── ISeason.sol
│   ├── test/
│   │   ├── Season.t.sol
│   │   ├── CreditLedger.t.sol
│   │   ├── Market.t.sol
│   │   └── Integration.t.sol
│   ├── script/
│   │   ├── DeployP0.s.sol
│   │   └── MockData.s.sol
│   ├── abi/
│   └── foundry.toml
├── docs/
│   ├── P0-共识文档-v0.2.md
│   ├── 机制审查-补充问题.md
│   └── MarketSpec-模板.json
└── README.md
```

---

## Day 0 对齐 Checklist

Track A / B / C 确认后打勾：

- [ ] **统一身份**：所有状态用 `bytes32 scoutId`（非 address）
- [ ] **下注模型**：`amount = spentCredits`，不做 shares，price 只展示
- [ ] **结算模型**：`settle()` 判定 + `claimWinnings()` 自助领取
- [ ] **MarketSpec**：链上 `specHash + metadataURI`，链下 JSON 存完整内容
- [ ] **Events 列表**：前端订阅 + TheGraph 索引确认
- [ ] **共享常量**：`CREDITS_PER_SEASON`、`MAX_CREDIT_PER_MARKET`、`PRICE_BASIS = 10000`
- [ ] **AI 输出**：JSON 格式（`initialProbability` 只展示）
- [ ] **Mock 方案**：Anvil 本地链 + 预设 scoutId / 市场数据
- [ ] **测试网目标**：Arbitrum Sepolia 或 Base Sepolia

---

## 变更日志（v0.1 → v0.2）

| 变更 | v0.1 | v0.2 | 原因 |
|------|------|------|------|
| 统一身份 | address + nullifier 混用 | 全部 `bytes32 scoutId` | 避免 P1 数据结构大改 |
| 下注模型 | 线性价格曲线影响 payout | `amount = stake`，price 只展示 | 简化收益计算，保主链路 |
| 结算方式 | settle() 批量转账 | settle() 判定 + claimWinnings() 自助 | 避免 gas 爆炸 |
| 无效市场 | 无 | 增加 `voidMarket` + `refund` | 必须有的紧急出口 |
| MarketSpec | 链上存全部文本 | `specHash + metadataURI` | 省 gas，链下放 JSON |
| 项目方禁买 | 建议 | 合约层硬编码 | 防内幕交易 |
| initialProbability | 参与定价 | 只展示 | 降低复杂度 |
| Evidence | 可上链占位 | P0 不上链，只留 event | 控制 scope |

---

*文档生成时间：2026-05-04*  
*参与方：Track A（合约）、GPT 5.5、Kimi CLI、Codex*  
*状态：待 Track B/C 确认*
