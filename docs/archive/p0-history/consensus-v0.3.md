# Veil Scout — P0 共识文档 v0.3（最终定稿）

> **一句话定义**：Veil Scout P0 是一个赛季制积分判断竞赛。用户用不可转让 credits 对真实 MarketSpec 做 YES/NO 判断；结算后正确方按 stake 比例分配错误方 credits，形成可审计排行榜。**价格只用于展示市场倾向，不决定收益。**
>
> **v0.3 核心原则**：不是加功能，是补账本闭环和审计闭环。

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
claim credits → bind wallet to scoutId → buy YES/NO 
→ lock credits in market escrow → admin settle / void 
→ winners claim winnings → all positions finalize score 
→ leaderboard reads finalized scores
```

---

## P0 合约清单（6 + 2）

| 合约 | 职责 |
|------|------|
| `Season.sol` | 赛季生命周期 |
| `CreditLedger.sol` | 积分记账（非 ERC20）+ 市场托管账本 |
| `MarketFactory.sol` | 审核后创建市场 |
| `Market.sol` | 下注、持仓、价格展示、结算领取 |
| `Settlement.sol` | 结算判定、赢家分配、分数更新 |
| `Leaderboard.sol` | 分数记录（不排序） |
| `types/MarketSpec.sol` | 核心数据结构 |
| `interfaces/*.sol` | 接口定义 |

---

## 核心决策

### 1. 身份绑定：`scoutIdOf`

```solidity
mapping(address => bytes32) public scoutIdOf;
mapping(bytes32 => bool) public isRegistered;
```

**绑定流程**：
1. 用户首次领取 credits 时提供 `scoutId + signature`
2. 合约验证签名后，`scoutIdOf[msg.sender] = scoutId`
3. 同一地址后续调用直接读取 `scoutIdOf[msg.sender]`
4. 一个地址只能绑定一个 `scoutId`（P0 mock 阶段）

**P0 mock**：签名由平台私钥签发，或直接用 whitelist。接口保留 `scoutId`，P1 接入 zkID 时替换验证逻辑即可。

### 2. Credits 不是 ERC20 → `CreditLedger.sol`

**不暴露**：`transfer`、`approve`、`transferFrom`

**暴露**：
```solidity
function claim(uint256 seasonId, bytes32 scoutId, bytes calldata proof) external;
function debitForTrade(address user, uint256 seasonId, uint256 amount) external onlyMarket;
function creditFromSettlement(address user, uint256 seasonId, uint256 amount) external onlyMarket;
function balanceOf(bytes32 scoutId, uint256 seasonId) external view returns (uint256);
function lockedOf(bytes32 scoutId, uint256 seasonId) external view returns (uint256);
```

**市场托管账本**：
```solidity
mapping(uint256 marketId => uint256) public marketLockedCredits;
```

- `buy()` 时：`debitForTrade` 扣用户 credits，`marketLockedCredits[marketId] += amount`
- `claimWinnings()` 时：从 `marketLockedCredits` 扣，`creditFromSettlement` 返给用户
- `refund()` 时：同理

**核心原则**：用户之间不能转 credits，系统合约间通过 `CreditLedger` 记账转移。

### 3. 双时间门控

```solidity
struct Market {
    uint256 tradingDeadline;    // 交易截止（建议 = resolutionDeadline - 24h）
    uint256 resolutionDeadline; // 最早可结算时间
    uint256 forceVoidDeadline;  // 超过此时间未结算，任何人可强制 void（建议 = resolutionDeadline + 7 days）
    // ...
}
```

- `tradingDeadline` 后禁止 buy
- `resolutionDeadline` 后 `SETTLEMENT_ROLE` 可 settle
- `forceVoidDeadline` 后任何人可触发 `forceVoid(marketId)`，全额退款

### 4. 下注单位：`amount = spentCredits`，不做 shares

```solidity
function takePosition(uint256 marketId, Side side, uint256 amount) external
```

- `amount` = 用户愿意花费的 credits 数量
- 记录 `yesStake` 或 `noStake`
- **price 只作为展示用的 odds signal**，不影响最终收益
- 结算时：赢家按 `stake / totalWinningStakes` 比例分输家的总 credits

### 5. 收益计算

```solidity
// Settlement.sol
function settle(uint256 marketId, bool passed) external onlyRole(SETTLEMENT_ROLE) {
    Market storage m = markets[marketId];
    require(block.timestamp >= m.resolutionDeadline, "Too early");
    require(m.status == Status.TRADING, "Invalid status");
    
    m.status = Status.SETTLED;
    m.result = passed ? Result.YES : Result.NO;
    
    uint256 losingStakes = passed ? m.noStake : m.yesStake;
    uint256 winningStakes = passed ? m.yesStake : m.noStake;
    
    if (winningStakes == 0) {
        // 没有赢家，全部进入 reserve
        seasonProtocolReserve[m.seasonId] += losingStakes;
        emit NoWinnerReserve(marketId, losingStakes);
    } else {
        m.winningsPerShare = losingStakes * 1e18 / winningStakes;
    }
    
    emit MarketSettled(marketId, passed, losingStakes, winningStakes);
}
```

```solidity
// Market.sol
function claimWinnings(uint256 marketId) external {
    bytes32 scoutId = scoutIdOf[msg.sender];
    Position storage pos = positions[marketId][scoutId];
    require(!pos.finalized, "Already finalized");
    
    Market storage m = markets[marketId];
    require(m.status == Status.SETTLED, "Not settled");
    
    bool isWinner = (m.result == Result.YES && pos.yesStake > 0) || 
                    (m.result == Result.NO && pos.noStake > 0);
    
    uint256 winnings;
    if (isWinner) {
        uint256 winningStake = m.result == Result.YES ? pos.yesStake : pos.noStake;
        winnings = winningStake + (winningStake * m.winningsPerShare / 1e18);
        
        // dust 保护
        uint256 available = creditLedger.marketLockedCredits(marketId);
        if (winnings > available) winnings = available;
        
        creditLedger.creditFromSettlement(msg.sender, m.seasonId, winnings);
    }
    
    pos.finalized = true;
    pos.winnings = winnings;
    
    // 更新 score（赢家和输家都要）
    int256 delta = int256(winnings) - int256(pos.yesStake + pos.noStake);
    leaderboard.updateScore(scoutId, m.seasonId, delta, marketId);
    
    emit PositionFinalized(marketId, scoutId, winnings, delta);
}
```

### 6. 输家也要 finalize score

`claimWinnings()` 中，无论输赢，`pos.finalized = true` 且都会调用 `leaderboard.updateScore()`。

- 赢家：`delta = 正数`（ winnings - stake ）
- 输家：`delta = 负数`（ 0 - stake ）
- 所有 position 必须 finalize，否则排行榜不完整

### 7. 没有赢家的市场

如果 `winningStakes == 0`，全部 losing stakes 进入 `seasonProtocolReserve`，emit `NoWinnerReserve`。

### 8. 无效市场：`voidMarket`

```solidity
function voidMarket(uint256 marketId, string calldata reasonURI) external onlyRole(DEFAULT_ADMIN_ROLE);
function forceVoid(uint256 marketId) external; // 超过 forceVoidDeadline 后任何人可调用
```

**效果**：
- 状态变为 `VOIDED`
- 参与者调用 `claimRefund(marketId)` 全额退回 stake
- 不计入 Scout Score

```solidity
function claimRefund(uint256 marketId) external {
    bytes32 scoutId = scoutIdOf[msg.sender];
    Position storage pos = positions[marketId][scoutId];
    require(!pos.finalized, "Already finalized");
    require(markets[marketId].status == Status.VOIDED, "Not voided");
    
    uint256 refund = pos.yesStake + pos.noStake;
    pos.finalized = true;
    creditLedger.creditFromSettlement(msg.sender, markets[marketId].seasonId, refund);
    
    emit Refunded(marketId, scoutId, refund);
}
```

### 9. MarketSpec：链上存 `specHash + metadataURI`

```solidity
struct MarketSpec {
    bytes32 specHash;           // keccak256(canonical JSON)
    string metadataURI;         // IPFS / Arweave 链接
    uint256 tradingDeadline;
    uint256 resolutionDeadline;
    uint256 forceVoidDeadline;
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

**校验规则**：前端 / backend 读取 `metadataURI` 后，必须验证 `keccak256(canonical JSON) == specHash`。

### 10. 项目方禁买

```solidity
function takePosition(uint256 marketId, Side side, uint256 amount) external {
    require(msg.sender != markets[marketId].projectOwner, "Project owner cannot trade");
    // ...
}
```

### 11. `initialProbability` 只展示，不参与结算

- 存于 MarketSpec JSON 中
- 前端展示为"AI 初始倾向"
- **不影响任何收益计算**

### 12. 价格曲线：线性展示，不参与 payout

```solidity
function getYesOdds(uint256 marketId) external view returns (uint256) {
    Market storage m = markets[marketId];
    uint256 total = m.yesStake + m.noStake + 1;
    uint256 yesPrice = 5000 + (m.yesStake * 5000 / total) - (m.noStake * 5000 / total);
    if (yesPrice < 500) yesPrice = 500;
    if (yesPrice > 9500) yesPrice = 9500;
    return yesPrice;
}
```

### 13. 细粒度暂停

```solidity
bool public claimsPaused;
bool public marketCreationPaused;
bool public globalTradingPaused;
bool public settlementPaused;
mapping(uint256 => bool) public marketTradingPaused;
mapping(uint256 => bool) public marketSettlementPaused;
```

### 14. Score 只记虚拟 PnL（P0）

```solidity
// Settlement / Market 中
int256 delta = int256(winnings) - int256(originalStake);
leaderboard.updateScore(scoutId, seasonId, delta, marketId);
```

复杂 Scout Score 公式（准确率权重、早期发现奖励、evidence 分）全部 P1。

### 15. 审计友好结构

- 不用 Diamond Pattern
- 继承链 ≤ 3 层
- 每合约文件 < 300 行
- 不用内联汇编
- OpenZeppelin `AccessControl` / `Ownable2Step` / `ReentrancyGuard`
- `forge fmt` 强制格式化

---

## Events（v0.3 最终版）

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
    uint256 totalWinningStakes
);

event PositionFinalized(
    uint256 indexed marketId,
    bytes32 indexed scoutId,
    uint256 winnings,
    int256 scoreDelta
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

event NoWinnerReserve(
    uint256 indexed marketId,
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
    string contentURI
);
```

---

## 权限矩阵

| 功能 | 角色 | 说明 |
|------|------|------|
| 创建赛季 | `DEFAULT_ADMIN_ROLE` | 团队多签 |
| 创建市场 | `MARKET_CREATOR_ROLE` | 平台审核后 |
| 领取积分 | 公开 | `signedClaim` / whitelist mock |
| 买 YES/NO | 公开 | 非 projectOwner、tradingDeadline 前 |
| 结算市场 | `SETTLEMENT_ROLE` | admin 手动 settle |
| 作废市场 | `DEFAULT_ADMIN_ROLE` | 紧急操作 |
| forceVoid | 公开 | 超过 forceVoidDeadline 后 |
| claim winnings / refund | 公开 | 自助领取 |
| 暂停功能 | `PAUSER_ROLE` | 细粒度 |

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
│   ├── P0-共识文档-v0.3.md
│   ├── 机制审查-补充问题.md
│   └── MarketSpec-模板.json
└── README.md
```

---

## Day 0 对齐 Checklist

Track A / B / C 确认后打勾：

- [ ] **统一身份**：`scoutIdOf[address]` 绑定方案确认
- [ ] **下注模型**：`amount = spentCredits`，不做 shares，price 只展示
- [ ] **结算模型**：`settle()` 判定 + `claimWinnings()` 自助领取 + 输家自动 finalize
- [ ] **托管账本**：`marketLockedCredits` 方案确认
- [ ] **MarketSpec**：`specHash + metadataURI`，链下 JSON 存完整内容
- [ ] **Events 列表**：前端订阅 + TheGraph 索引确认
- [ ] **共享常量**：`CREDITS_PER_SEASON`、`MAX_CREDIT_PER_MARKET`、`PRICE_BASIS = 10000`
- [ ] **AI 输出**：JSON 格式（`initialProbability` 只展示）
- [ ] **Mock 方案**：Anvil 本地链 + 预设 scoutId / 市场数据
- [ ] **测试网目标**：Arbitrum Sepolia 或 Base Sepolia

---

## 变更日志

### v0.1 → v0.2
- 统一身份：全部用 `bytes32 scoutId`
- 下注模型：`amount = stake`，price 只展示不决定收益
- 结算方式：`settle()` 判定 + `claimWinnings()` 自助领取
- 无效市场：增加 `voidMarket` + `refund`
- MarketSpec：`specHash + metadataURI`
- 项目方禁买：合约层硬编码
- initialProbability：只展示
- Evidence P0 不上链

### v0.2 → v0.3
- **身份绑定**：`mapping(address => bytes32) public scoutIdOf`
- **市场托管账本**：`marketLockedCredits`
- **输家 finalize**：`claimWinnings()` 中无论输赢都更新 score
- **无赢家处理**：`NoWinnerReserve` + `seasonProtocolReserve`
- **specHash 校验**：前端必须验证 `keccak256(JSON) == specHash`
- **forceVoid**：超过宽限期后任何人可强制 void

---

*文档生成时间：2026-05-04*  
*参与方：Track A（合约）、GPT 5.5、Kimi CLI、Codex*  
*状态：v0.3 最终定稿，待 Track B/C 确认后开始写合约*
