# Veil Scout — P0 共识文档 v0.4（最终定稿 + Engineering Notes）

> **一句话定义**：Veil Scout P0 是一个赛季制积分判断竞赛。用户用不可转让 credits 对真实 MarketSpec 做 YES/NO 判断；结算后正确方按 stake 比例分配错误方 credits，形成可审计排行榜。**价格只用于展示市场倾向，不决定收益。**
>
> **v0.4 = v0.3 产品机制定稿 + 6 条工程实现规则**

---

## 必读：本文档之后不再改大结构

v0.4 是 **P0 的冻结版本**。Track A 可以直接按此文档写合约，Track B/C 可以直接按此文档对接 ABI 和 Events。

如果发现实现级小问题（如参数名、gas 优化），在代码层面修，不改本文档。

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

## P0 合约清单（5 + 2）

**注意：v0.4 将 Settlement 逻辑并入 Market，不再单独设 Settlement 合约。**

| 合约 | 职责 |
|------|------|
| `Season.sol` | 赛季生命周期 |
| `CreditLedger.sol` | 积分记账（非 ERC20）+ 市场托管账本 |
| `MarketFactory.sol` | 审核后创建市场 |
| `Market.sol` | 下注、持仓、结算、领取、退款、分数更新 |
| `Leaderboard.sol` | 分数记录（不排序） |
| `types/MarketSpec.sol` | 核心数据结构 |
| `interfaces/*.sol` | 接口定义 |

**为什么把 Settlement 并入 Market**：跨合约无法直接访问 storage。`Market` 持有 `markets` / `positions` / `stakes` 等核心 storage，`settle / claim / void / refund / finalize` 都需要读写这些 storage，放在同一合约避免 `delegatecall` 或复杂代理模式。

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
3. 同一地址只能绑定一次（P0 mock 阶段）

**签名防 replay（必须包含）**：
```solidity
keccak256(abi.encodePacked(
    scoutId,
    seasonId,
    msg.sender,      // wallet address
    block.chainid,   // chainId
    address(this),   // contract address
    nonce,           // 防重放
    deadline         // 签名过期时间
))
```

**P0 mock**：签名由平台私钥签发，或直接用 whitelist。接口保留 `scoutId`，P1 接入 zkID 时替换验证逻辑即可。

### 2. Credits 不是 ERC20 → `CreditLedger.sol`

**不暴露**：`transfer`、`approve`、`transferFrom`

**暴露**：
```solidity
function claim(uint256 seasonId, bytes32 scoutId, bytes calldata proof) external;
function debitForTrade(bytes32 scoutId, uint256 seasonId, uint256 amount) external onlyMarket;
function creditFromSettlement(bytes32 scoutId, uint256 seasonId, uint256 amount) external onlyMarket;
function balanceOf(bytes32 scoutId, uint256 seasonId) external view returns (uint256);
function lockedOf(bytes32 scoutId, uint256 seasonId) external view returns (uint256);
```

**市场托管账本**：
```solidity
mapping(uint256 marketId => uint256) public marketLockedCredits;
```

- `buy()` 时：`debitForTrade` 扣用户 credits，`marketLockedCredits[marketId] += amount`
- `claimWinnings()` 时：`marketLockedCredits[marketId] -= payout`，`creditFromSettlement` 返给用户
- `claimRefund()` 时：`marketLockedCredits[marketId] -= refund`，`creditFromSettlement` 返给用户
- `no winner` 时：`marketLockedCredits[marketId] -= reserveAmount`，转入 `seasonProtocolReserve`

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

### 5. 单边持仓规则（P0 必须实现）

```solidity
function takePosition(uint256 marketId, Side side, uint256 amount) external {
    bytes32 scoutId = scoutIdOf[msg.sender];
    Position storage pos = positions[marketId][scoutId];
    
    require(
        pos.side == Side.NONE || pos.side == side,
        "Single side only"
    );
    
    pos.side = side;
    if (side == Side.YES) pos.yesStake += amount;
    else pos.noStake += amount;
    
    // ...
}
```

同一 `scoutId` 在同一市场只能持有一边。

### 6. 收益计算与结算

```solidity
// Market.sol
function settle(uint256 marketId, bool passed) external onlyRole(SETTLEMENT_ROLE) {
    Market storage m = markets[marketId];
    require(block.timestamp >= m.resolutionDeadline, "Too early");
    require(m.status == Status.TRADING, "Invalid status");
    
    m.status = Status.SETTLED;
    m.result = passed ? Result.YES : Result.NO;
    
    uint256 losingStakes = passed ? m.noStake : m.yesStake;
    uint256 winningStakes = passed ? m.yesStake : m.noStake;
    
    if (winningStakes == 0) {
        seasonProtocolReserve[m.seasonId] += losingStakes;
        marketLockedCredits[marketId] -= losingStakes;
        emit NoWinnerReserve(marketId, losingStakes);
    } else {
        m.winningsPerShare = losingStakes * 1e18 / winningStakes;
    }
    
    emit MarketSettled(marketId, passed, losingStakes, winningStakes);
}
```

### 7. 赢家领取：`claimWinnings` + `finalizePosition`

```solidity
function claimWinnings(uint256 marketId) external {
    bytes32 scoutId = scoutIdOf[msg.sender];
    _finalizePosition(marketId, scoutId);
    
    Position storage pos = positions[marketId][scoutId];
    require(pos.winnings > 0, "No winnings");
    
    creditLedger.creditFromSettlement(scoutId, markets[marketId].seasonId, pos.winnings);
    emit WinningsClaimed(marketId, scoutId, pos.winnings);
}

function finalizePosition(uint256 marketId, bytes32 scoutId) public {
    Position storage pos = positions[marketId][scoutId];
    require(!pos.finalized, "Already finalized");
    
    Market storage m = markets[marketId];
    require(m.status == Status.SETTLED || m.status == Status.VOIDED, "Not settled/voided");
    
    if (m.status == Status.SETTLED) {
        bool isWinner = (m.result == Result.YES && pos.yesStake > 0) || 
                        (m.result == Result.NO && pos.noStake > 0);
        
        if (isWinner) {
            uint256 winningStake = m.result == Result.YES ? pos.yesStake : pos.noStake;
            pos.winnings = winningStake + (winningStake * m.winningsPerShare / 1e18);
            
            // dust 保护
            uint256 available = creditLedger.marketLockedCredits(marketId);
            if (pos.winnings > available) pos.winnings = available;
            
            marketLockedCredits[marketId] -= pos.winnings;
        }
        
        int256 delta = int256(pos.winnings) - int256(pos.yesStake + pos.noStake);
        leaderboard.updateScore(scoutId, m.seasonId, delta, marketId);
        
    } else if (m.status == Status.VOIDED) {
        pos.refund = pos.yesStake + pos.noStake;
        marketLockedCredits[marketId] -= pos.refund;
        creditLedger.creditFromSettlement(scoutId, m.seasonId, pos.refund);
        
        emit Refunded(marketId, scoutId, pos.refund);
    }
    
    pos.finalized = true;
    emit PositionFinalized(marketId, scoutId, pos.winnings, int256(pos.winnings) - int256(pos.yesStake + pos.noStake));
}
```

**关键**：
- `finalizePosition` 是 public 的，任何人可以帮别人 finalize
- 赢家 claim 时内部调用 `_finalizePosition`
- 输家不会主动 claim，所以 **任何人可以调用 `finalizePosition(marketId, scoutId)` 帮输家 finalize**，确保排行榜完整

### 8. 无效市场：`voidMarket` / `forceVoid`

```solidity
function voidMarket(uint256 marketId, string calldata reasonURI) external onlyRole(DEFAULT_ADMIN_ROLE);
function forceVoid(uint256 marketId) external; // 超过 forceVoidDeadline 后任何人可调用
```

**效果**：
- 状态变为 `VOIDED`
- 任何人调用 `finalizePosition(marketId, scoutId)` 触发退款
- 不计入 Scout Score（delta = 0）

### 9. MarketSpec：链上存 `specHash + metadataURI`

```solidity
struct MarketSpec {
    bytes32 specHash;           // keccak256(canonical JSON bytes)
    string metadataURI;         // IPFS / Arweave 链接（推荐）
    uint256 tradingDeadline;
    uint256 resolutionDeadline;
    uint256 forceVoidDeadline;
    address projectOwner;
}
```

**Canonical JSON 标准（必须写死）**：
```json
{
  "version": "1.0",
  "question": "AgentPay 能在 2026-06-30 前完成 1,000 笔经验证的 AI Agent 支付吗？",
  "yesCondition": "链上事件显示 >= 1,000 笔有效支付，唯一钱包 >= 100",
  "noCondition": "未达成上述条件",
  "dataSource": "智能合约 0x... 的事件日志",
  "milestone": "30 天内完成 1,000 笔验证支付",
  "initialProbability": 0.62
}
```

**校验规则**：
- `specHash = keccak256(raw JSON bytes)`（UTF-8 编码的 bytes，不是字符串 hash）
- `metadataURI` 推荐 `ipfs://...` 或 `ar://...`
- 前端下载原文 bytes 后，必须验证 `keccak256(bytes) == specHash`

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

### 13. Score 只记虚拟 PnL（P0）

```solidity
// finalizePosition 中
int256 delta = int256(pos.winnings) - int256(pos.yesStake + pos.noStake);
leaderboard.updateScore(scoutId, m.seasonId, delta, marketId);
```

复杂 Scout Score 公式（准确率权重、早期发现奖励、evidence 分）全部 P1。

### 14. 细粒度暂停

```solidity
bool public claimsPaused;
bool public marketCreationPaused;
bool public globalTradingPaused;
bool public settlementPaused;
mapping(uint256 => bool) public marketTradingPaused;
mapping(uint256 => bool) public marketSettlementPaused;
```

### 15. 审计友好结构

- 不用 Diamond Pattern
- 继承链 ≤ 3 层
- 每合约文件 < 300 行
- 不用内联汇编
- OpenZeppelin `AccessControl` / `Ownable2Step` / `ReentrancyGuard`
- `forge fmt` 强制格式化

---

## Events（v0.4 最终版）

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
| finalizePosition | 公开 | 任何人可代调用 |
| 暂停功能 | `PAUSER_ROLE` | 细粒度 |

---

## 核心不变量（Fuzz 测试用）

```solidity
// CreditLedger
inv_1: sum(all user balances) + sum(all marketLockedCredits) + seasonProtocolReserve == totalMintedCredits
inv_2: 用户间无 transfer

// Market
inv_3: marketLockedCredits[marketId] == sum(all positions' stakes in market) - sum(claimed) - sum(refunded)
inv_4: 结算后 marketLockedCredits 只减不增
inv_5: 同一 scoutId 在同一市场不能同时有 yesStake > 0 和 noStake > 0
inv_6: finalize 后的 position 不可再次 finalize
inv_7: settle 后 winningsPerShare * winningStakes <= losingStakes * 1e18（考虑精度）
```

---

## 建议文件结构

```
veil-scout/
├── contracts/
│   ├── src/
│   │   ├── Season.sol
│   │   ├── CreditLedger.sol
│   │   ├── MarketFactory.sol
│   │   ├── Market.sol              # 含 settle / claim / void / finalize
│   │   ├── Leaderboard.sol
│   │   ├── types/
│   │   │   ├── MarketSpec.sol
│   │   │   └── Enums.sol
│   │   └── interfaces/
│   │       ├── ICreditLedger.sol
│   │       ├── IMarket.sol
│   │       └── ISeason.sol
│   ├── test/
│   │   ├── Season.t.sol
│   │   ├── CreditLedger.t.sol
│   │   ├── Market.t.sol
│   │   └── Integration.t.sol       # 完整链路 + 不变量 fuzz
│   ├── script/
│   │   ├── DeployP0.s.sol
│   │   └── MockData.s.sol
│   ├── abi/
│   └── foundry.toml
├── docs/
│   ├── P0-共识文档-v0.4-最终定稿.md
│   ├── 机制审查-补充问题.md
│   └── MarketSpec-模板.json
└── README.md
```

---

## Day 0 对齐 Checklist

Track A / B / C 确认后打勾：

- [ ] **统一身份**：`scoutIdOf[address]` 绑定方案确认
- [ ] **下注模型**：`amount = spentCredits`，不做 shares，price 只展示
- [ ] **结算模型**：`settle()` 判定 + `claimWinnings()` 自助领取 + `finalizePosition` 输家也更新
- [ ] **托管账本**：`marketLockedCredits` 增减闭环确认
- [ ] **MarketSpec**：`specHash + metadataURI`，canonical JSON 标准，链下 IPFS/Arweave
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
- 身份绑定：`mapping(address => bytes32) public scoutIdOf`
- 市场托管账本：`marketLockedCredits`
- 输家 finalize：`claimWinnings()` 中无论输赢都更新 score
- 无赢家处理：`NoWinnerReserve` + `seasonProtocolReserve`
- specHash 校验：前端必须验证 `keccak256(JSON bytes) == specHash`
- forceVoid：超过宽限期后任何人可强制 void

### v0.3 → v0.4（Engineering Notes）
- **Settlement 并入 Market**：跨合约无法访问 storage，不再单独设 Settlement 合约
- **独立 `finalizePosition`**：public 函数，任何人可代调用，确保输家 score 更新
- **`marketLockedCredits` 增减闭环**：buy +=, claim -=, refund -=, no-winner -=
- **签名防 replay**：必须包含 `chainId + contract address + nonce + deadline`
- **单边持仓写死**：`require(pos.side == NONE || pos.side == side)`
- **canonical JSON 标准**：定义 raw bytes hash，推荐 IPFS/Arweave

---

*文档生成时间：2026-05-04*  
*参与方：Track A（合约）、GPT 5.5、Kimi CLI、Codex*  
*状态：v0.4 最终定稿，冻结。开始写合约。*
