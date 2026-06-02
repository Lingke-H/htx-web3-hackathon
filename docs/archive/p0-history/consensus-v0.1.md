# Veil Scout — P0 共识文档 v0.1

> **产品原则**：MVP 不是做一个完整预测市场，而是证明 scout 用 credits 判断项目、结算后形成排行榜这条主链路成立。

---

## P0 必须实现的合约（6 个）

| 合约 | 职责 | 核心功能 |
|------|------|---------|
| `Season.sol` | 赛季生命周期 | 创建赛季、记录赛季起止时间、赛季状态管理 |
| `CreditLedger.sol` | 积分记账 | 领取、扣除、返还、查询余额；**不是 ERC20** |
| `MarketFactory.sol` | 市场创建 | 审核后创建市场，强制写入完整 `MarketSpec` |
| `Market.sol` | 市场交易 | 简化线性定价 buy YES/NO，单边持仓，tradingDeadline 门控 |
| `Settlement.sol` | 结算与分配 | 手动 settle、积分重分配、dust 处理、emit 事件 |
| `Leaderboard.sol` | 分数记录 | 链上存分 + emit `ScoreUpdated`；**不排序** |

---

## P0 明确不做

- ❌ sell / cancel / reduce position（只做 buy）
- ❌ LMSR 或复杂 AMM（简化线性定价）
- ❌ Evidence 提交与评分上链
- ❌ SBT mint（前端展示即可）
- ❌ Dispute 机制（前端提示争议窗口概念）
- ❌ 赛季 token 奖励分配（只算分，不发 token）
- ❌ 真实 zkID（用 whitelist / signed claim / invite code mock）
- ❌ AI 报告流水线（人工配置 `initialProbability`）
- ❌ 多数据源预言机（admin 手动 `settle`）

---

## 核心决策

### 1. 市场创建：不开放 public create

```solidity
function createMarket(MarketSpec calldata spec) external onlyRole(MARKET_CREATOR_ROLE)
```

- 项目方只能提交申请，平台审核后创建
- 使用 `AccessControl` 而非 `onlyOwner`，方便未来交给运营后台或多签
- P0 设一个 `MARKET_CREATOR_ROLE`，团队持有

### 2. Credits 不是 ERC20 → `CreditLedger.sol`

**命名**：叫 `CreditLedger`，不叫 `ScoutCredits`，避免用户误以为是资产。

**不暴露**：
- `transfer`
- `approve`
- `transferFrom`

**只暴露**：
```solidity
function claim(uint256 seasonId, bytes calldata proof) external;
function debitForTrade(address user, uint256 seasonId, uint256 amount) external onlyMarket;
function creditFromSettlement(address user, uint256 seasonId, uint256 amount) external onlySettlement;
function balanceOf(address user, uint256 seasonId) external view returns (uint256);
function lockedOf(address user, uint256 seasonId) external view returns (uint256); // 已下注未结算
```

**核心原则**：用户之间不能转 credits，只能通过市场结算改变余额。

### 3. 双时间门控：tradingDeadline + resolutionDeadline

```solidity
struct Market {
    uint256 tradingDeadline;    // 交易截止时间（建议 = resolutionDeadline - 24h）
    uint256 resolutionDeadline; // 结算截止时间
    // ...
}
```

- `tradingDeadline` 后禁止一切 buy
- `resolutionDeadline` 后 oracle 可结算
- 防止到期前明牌结果被无风险套利

### 4. Dust 显式处理

结算时整数除法余数进入 `seasonProtocolReserve`，不留在市场合约中：

```solidity
uint256 dust = totalLosingCredits - distributedToWinners;
seasonProtocolReserve[seasonId] += dust;
emit SettlementDust(marketId, dust);
```

用途：下季补贴、无效市场退款补偿、运营奖励池。

### 5. Score 不实时链上更新

- **Trade 时**：只 emit 事件，不写 score
- **Settlement 时**：统一批量写最终 score
- **前端**：链下估算实时排名（基于 trade 事件）

合约只负责可审计结果，不负责昂贵的展示体验。

### 6. 细粒度暂停

不全局 pause，分功能：

```solidity
bool public claimsPaused;
bool public marketCreationPaused;
bool public globalTradingPaused;
bool public settlementPaused;
mapping(uint256 => bool) public marketTradingPaused; // 单个市场
```

### 7. 审计友好结构

- 不用 Diamond Pattern
- 继承链 ≤ 3 层
- 每合约文件 < 300 行
- 不用内联汇编
- 权限用 OpenZeppelin `AccessControl` / `Ownable2Step` / `ReentrancyGuard`
- `forge fmt` 强制格式化

### 8. MarketSpec：P0 的产品安全边界

创建市场时必须提供完整 `MarketSpec`，否则拒绝创建：

```solidity
struct MarketSpec {
    string question;            // 人可读问题
    string milestone;           // 具体里程碑
    uint256 tradingDeadline;    // 交易截止时间
    uint256 resolutionDeadline; // 结算截止时间
    string dataSource;          // 外部数据源标识
    string yesCondition;        // YES 判定条件（明确、可验证）
    string noCondition;         // NO 判定条件
    uint256 initialProbability; // AI/人工配置的初始概率 [500, 9500]（基点）
    address projectOwner;       // 项目方地址（用于黑名单）
}
```

**准入规则（产品文档写明，合约校验部分）**：
- [ ] 结果必须二元可判定
- [ ] 必须有外部数据源
- [ ] 项目方不能单方面决定结果
- [ ] 必须有 `tradingDeadline` 和 `resolutionDeadline`
- [ ] 必须有 YES / NO 判定条件
- [ ] `tradingDeadline` < `resolutionDeadline`
- [ ] `resolutionDeadline` ≤ seasonEnd

**Oracle 可以 mock，AI 可以 mock，zkID 可以 mock，但 MarketSpec 不能糊弄。**

---

## Events（Day 0 对齐版）

```solidity
event CreditsClaimed(
    bytes32 indexed nullifierHash,
    uint256 indexed seasonId,
    uint256 amount
);

event MarketCreated(
    uint256 indexed marketId,
    address indexed creator,
    string question,
    uint256 tradingDeadline,
    uint256 resolutionDeadline
);

event PositionTaken(
    uint256 indexed marketId,
    bytes32 indexed nullifierHash,
    Side side,
    uint256 amount,
    uint256 price          // 成交价格（基点）
);

event MarketSettled(
    uint256 indexed marketId,
    bool passed,
    uint256 winningPool,
    uint256 totalDust
);

event ScoreUpdated(
    bytes32 indexed nullifierHash,
    uint256 indexed seasonId,
    int256 newScore,
    uint256 marketId        // 由哪个市场结算触发
);

event EvidenceSubmitted(
    uint256 indexed marketId,
    bytes32 indexed nullifierHash,
    bytes32 contentHash,
    string metadataURI
);

event SettlementDust(
    uint256 indexed marketId,
    uint256 amount
);
```

---

## 权限矩阵

| 功能 | 权限 | 说明 |
|------|------|------|
| 创建赛季 | `DEFAULT_ADMIN_ROLE` | 团队多签 |
| 创建市场 | `MARKET_CREATOR_ROLE` | 平台审核后创建 |
| 领取积分 | 公开（+ zkProof mock） | |
| 买 YES/NO | 公开 | 需满足 tradingDeadline、非黑名单 |
| 结算市场 | `SETTLEMENT_ROLE` | admin 手动触发 / 未来 oracle |
| 设置初始概率 | `SETTLEMENT_ROLE` 或 `MARKET_CREATOR_ROLE` | 创建时或开盘后人工配置 |
| 暂停功能 | `DEFAULT_ADMIN_ROLE` / `PAUSER_ROLE` | 细粒度控制 |
| 更新 evidence 分数 | `EVIDENCE_VALIDATOR_ROLE` | P1 启用 |

---

## 定价策略（P0 简化版）

不用 LMSR。采用简化线性价格曲线：

```solidity
// 开盘 50/50
// 每次买入推动价格，有上下限 [5%, 95%]
// price 用基点表示：500 = 5%, 5000 = 50%, 9500 = 95%

function getPrice(uint256 marketId) public view returns (uint256 yesPrice) {
    Market storage m = markets[marketId];
    uint256 total = m.yesPool + m.noPool + 1; // +1 防除零
    
    // 基础 5000 + 偏移
    yesPrice = 5000 + (m.yesPool * 5000 / total) - (m.noPool * 5000 / total);
    
    if (yesPrice < 500) yesPrice = 500;
    if (yesPrice > 9500) yesPrice = 9500;
}
```

**不变量**：价格始终在 [500, 9500] 基点（5% ~ 95%）。

---

## 建议文件结构

```
veil-scout/
├── contracts/                  # Foundry 项目
│   ├── src/
│   │   ├── Season.sol
│   │   ├── CreditLedger.sol
│   │   ├── MarketFactory.sol
│   │   ├── Market.sol
│   │   ├── Settlement.sol
│   │   ├── Leaderboard.sol
│   │   ├── types/
│   │   │   ├── MarketSpec.sol    # struct 定义
│   │   │   └── Enums.sol         # Side, Status
│   │   └── interfaces/
│   │       ├── ICreditLedger.sol
│   │       ├── IMarket.sol
│   │       └── ISettlement.sol
│   ├── test/
│   │   ├── Season.t.sol
│   │   ├── CreditLedger.t.sol
│   │   ├── Market.t.sol
│   │   └── Integration.t.sol     # 完整链路测试
│   ├── script/
│   │   ├── DeployP0.s.sol        # P0 部署脚本
│   │   └── MockData.s.sol        # 填充 mock 数据
│   ├── abi/                      # 自动导出 ABI（Track B/C 引用）
│   └── foundry.toml
├── docs/
│   ├── P0-共识文档-v0.1.md       # 本文件
│   ├── 机制审查-补充问题.md
│   └── MarketSpec-准入规则.md    # 产品文档
└── README.md
```

---

## Day 0 对齐 Checklist

Track A / B / C 三方确认：

- [ ] ABI 版本锁定（本文档为准）
- [ ] Events 列表确认（前端订阅 + TheGraph 索引）
- [ ] 共享常量确认：`CREDITS_PER_SEASON`、`MAX_CREDIT_PER_MARKET`、`MIN_PRICE`、`MAX_PRICE`
- [ ] AI 输出 JSON 格式确认（Track B → Track C）
- [ ] Mock 数据方案确认（Anvil 本地链 + 预设账户）
- [ ] 测试网目标确认（Arbitrum Sepolia / Base Sepolia）

---

*文档生成时间：2026-05-04*  
*参与方：Track A（合约）、GPT 5.5、Kimi CLI*  
*状态：待 Track B/C 确认*
