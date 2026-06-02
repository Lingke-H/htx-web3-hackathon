# Veil Scout P0 — Code Review v1

> 基于 TrackA-Storage-API-Spec 对 Codex 第一版实现的审查。

---

## 总体评价

**代码质量高，架构实现忠实于 Spec。**

核心设计全部落地：
- ✅ CreditLedger 是唯一账本，Market 不直接改 credits
- ✅ finalize ≠ claim 分离
- ✅ claimDeadline 保护 claim / sweep 时序
- ✅ no-winner 进 reserve
- ✅ void 不计分
- ✅ 单边持仓、单市场 cap
- ✅ claimSigner mock zkID

编译通过（Codex 报告），8 个测试通过。

---

## Review 1: CreditLedger 资金守恒

### 结论：✅ 正确，没有遗漏

**守恒公式**：
```
sum(freeBalance[*][s]) + sum(marketLockedCredits[m] where marketSeason[m]==s) + reserve[s]
== totalMinted[s]
```

**各操作验证**：

| 操作 | freeBalance | marketLocked | reserve | totalMinted | 守恒？ |
|------|-------------|--------------|---------|-------------|--------|
| `claim` | +10,000 | 0 | 0 | +10,000 | ✅ |
| `lockForTrade` | -amount | +amount | 0 | 0 | ✅ |
| `releaseToScout` | +amount | -amount | 0 | 0 | ✅ |
| `moveLockedToReserve` | 0 | -amount | +amount | 0 | ✅ |

**边界检查**：
- `lockForTrade`: `balance < amount` revert ✅
- `releaseToScout`: `locked < amount` revert ✅
- `moveLockedToReserve`: `locked < amount` revert ✅
- 三者都有 `amount == 0` revert ✅

**潜在问题（非 bug）**：
- `registerMarket` 不修改 credits，只是注册 season 绑定
- 没有 fuzz 测试验证总量守恒（测试覆盖见 Review 5）

---

## Review 2: no-winner / sweepExpiredRemainder

### 结论：⚠️ 机制正确，但需要明确产品决策

**no-winner 场景（测试 `testNoWinnerMovesLockedCreditsToReserve` 验证）**：

```
Bob 买 NO 1000
settle(YES) → 无人买 YES → winningStakes = 0
→ moveLockedToReserve(1000) → reserve += 1000
→ Bob finalize → scoreDelta = -1000
→ Bob claim → revert NoClaimableCredits
```

✅ 行为正确。

**sweepExpiredRemainder 的关键行为**：

```solidity
function sweepExpiredRemainder(uint256 marketId) external {
    require(status == SETTLED || VOIDED);
    require(block.timestamp > claimDeadline);
    
    uint256 remainder = creditLedger.marketLockedCredits(marketId);
    creditLedger.moveLockedToReserve(seasonId, marketId, remainder);
}
```

**问题**：`sweepExpiredRemainder` 扫走的是 **所有未领取的 credits**，包括：
1. 赢家的 winnings（如果赢家没 claim）
2. 输家的 stakes（输家不会 claim，因为 claimableCredits = 0）
3. rounding dust

**这意味着：如果赢家在 7 天 claim window 内没有 claim，她的 winnings 会被转入 protocol reserve。**

这不是 bug，是设计选择。但必须在产品文档中明确告知用户：
> "Claim window 为 7 天，过期后未领取的 credits 将转入赛季储备金，无法再领取。"

**建议**：前端在结算后显式提示用户 claim deadline 时间。

---

## Review 3: claimSigner mock zkID

### 结论：✅ 满足 P0，建议优化签名 malleability

**当前实现**：
```solidity
address public claimSigner;

// 签名内容
keccak256(abi.encodePacked(
    scoutId, seasonId, msg.sender, block.chainid, address(this), nonce, deadline
))
```

**验证**：
- `_isValidSignature` 支持两种格式：raw digest 和 Ethereum Signed Message ✅
- nonce 防重放 ✅
- deadline 防过期 ✅
- 双向绑定检查（wallet ↔ scoutId）✅

**潜在问题**：`_recover` 函数不检查 `s` 值的 malleability。

```solidity
// 当前代码
function _recover(bytes32 digest, bytes calldata signature) internal pure returns (address) {
    // ... 不检查 s <= 0x7F...
    return ecrecover(digest, v, r, s);
}
```

**影响**：对于同一个 digest，可能存在两个有效签名（r, s, v）和（r, n-s, 27/28-v）。但由于 nonce 防重放，实际风险很低。

**建议**：P1 阶段替换为标准 `ECDSA.recover`（OpenZeppelin），或手动加 `s` 值检查：
```solidity
uint256 halfCurveOrder = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;
require(uint256(s) <= halfCurveOrder, "Invalid s");
```

**P0 判断**：不影响功能，可以不改。

---

## Review 4: Events 是否够 B/C 对接

### 结论：✅ 基本够用，建议补 1 个 event

**当前 Events**：

| Event | indexed 字段 | 前端用途 | 是否足够 |
|-------|-------------|---------|---------|
| `MarketCreated` | marketId, seasonId, creator | 展示市场列表 | ✅ |
| `PositionTaken` | marketId, scoutId | 更新持仓/odds | ✅ |
| `MarketSettled` | marketId | 展示结果、触发 claim | ✅ |
| `PositionFinalized` | marketId, scoutId | 更新 claimable/score | ✅ |
| `WinningsClaimed` | marketId, scoutId | 更新余额 | ✅ |
| `Refunded` | marketId, scoutId | 更新余额（void） | ✅ |
| `ScoreUpdated` | scoutId, seasonId, marketId | 排行榜排序 | ✅ |
| `MarketVoided` | marketId | 展示作废状态 | ✅ |
| `NoWinnerReserve` | marketId | 展示 reserve 来源 | ✅ |
| `ExpiredRemainderSwept` | marketId | 展示 sweep | ✅ |

**缺少**：`CreditsClaimed` 没有 indexed `wallet`。

当前：
```solidity
event CreditsClaimed(bytes32 indexed scoutId, uint256 indexed seasonId, uint256 amount);
```

前端可能需要通过 wallet 地址查 scoutId。建议：
```solidity
event CreditsClaimed(
    bytes32 indexed scoutId, 
    address indexed wallet,  // ← 新增
    uint256 indexed seasonId, 
    uint256 amount
);
```

或者前端用 `WalletBound` 事件建立映射。两种方案都可以，不是 blocker。

---

## Review 5: 边界测试补充

### 结论：❌ 严重不足，当前 8 个测试远远不够

**当前测试覆盖**：

| 合约 | 测试数 | 覆盖场景 |
|------|--------|---------|
| CreditLedger | 4 | claim绑定、重复claim、双向绑定检查 |
| Market | 4 | 赢家分配、void退款、no-winner、claim window |

**缺少的关键测试**（按优先级）：

### 🔴 P0 必须补（资金安全相关）

**CreditLedger**：
- [ ] `lockForTrade` 余额不足 revert
- [ ] `releaseToScout` 超过 locked revert
- [ ] `moveLockedToReserve` 超过 locked revert
- [ ] `registerMarket` 重复注册 revert
- [ ] `registerMarket` 非活跃赛季 revert
- [ ] 总量不变量验证（简单版本）

**Market**：
- [ ] `takePosition` tradingDeadline 后 revert
- [ ] `takePosition` projectOwner 禁买 revert
- [ ] `takePosition` 单边持仓（先YES后NO）revert
- [ ] `takePosition` 超过 MAX_STAKE revert
- [ ] `takePosition` 未绑定 scoutId revert
- [ ] `settle` resolutionDeadline 前 revert
- [ ] `settle` 已结算 revert
- [ ] `voidMarket` 已结算 revert
- [ ] `forceVoid` forceVoidDeadline 前 revert
- [ ] `finalizePosition` 未结算/未作废 revert
- [ ] `finalizePosition` 重复 finalize revert
- [ ] `finalizePosition` 无 position revert
- [ ] `claim` 已 claim revert
- [ ] `claim` claimDeadline 后 revert
- [ ] `claim` 无 claimableCredits revert
- [ ] `sweepExpiredRemainder` claimDeadline 前 revert
- [ ] `sweepExpiredRemainder` 无余款 revert
- [ ] `sweepExpiredRemainder` 非终态市场 revert
- [ ] 多用户比例分配（Alice 1000, Bob 2000, YES赢，检查 2:1 分配）

### 🟡 P0 建议补（功能完整）

- [ ] `getYesOdds` 各种 stake 比例
- [ ] `canTrade` / `canSettle` / `canClaim` / `canSweep` 时间边界
- [ ] Season `endSeason` 后 `isSeasonActive` 返回 false
- [ ] `setClaimSigner` 权限检查
- [ ] Factory `setMarket` 权限检查

### 🟢 P1 再补（不变量 fuzz）

- [ ] 总量守恒 fuzz
- [ ] 单边持仓 fuzz
- [ ] finalize 一次性 fuzz
- [ ] claim 一次性 fuzz

---

## 其他发现

### 1. `getYesOdds` 实现和 Spec 不一致（设计选择，非 bug）

**Spec 定义**：
```solidity
yesPrice = 5000 + (yesStake * 5000 / total) - (noStake * 5000 / total)
```

**Codex 实现**：
```solidity
yesPriceBps = market.yesStake * PRICE_BASIS / totalStake;
```

Codex 的版本是直接比例（yesStake 占比），Spec 的版本是 50/50 起步 + 偏移。

**判断**：两种都可以，Codex 的版本更简单。如果接受这个变更，需要更新 Spec 文档。不影响资金安全。

### 2. `TestBase` 自定义（建议优化）

Codex 自定义了 `TestBase`，没有继承 Foundry 的 `Test`。

**问题**：
- `assertEq` 只有简单字符串错误，没有详细 diff
- 缺少 `assertApproxEqAbs` 等高级断言
- 缺少 `console.log` 调试支持

**建议**：继承 `forge-std/Test.sol`：
```solidity
import "forge-std/Test.sol";

contract CreditLedgerTest is Test {
    // 自动获得 vm, console, 丰富断言
}
```

### 3. `AccessManaged` 缺少 `renounceRole`

自定义权限管理缺少 `renounceRole`。P0 不影响，P1 需要。

---

## 总结

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构实现 | ✅ A | 忠实于 Spec，核心设计全部落地 |
| 资金安全 | ✅ A | 账本守恒正确，边界检查完整 |
| 测试覆盖 | ❌ C | 8 个测试远远不够，至少补 20+ 个 |
| 代码质量 | ✅ B+ | 清晰、模块化，自定义 TestBase 可优化 |
| B/C 对接 | ✅ B+ | Events 基本够用，建议补 CreditsClaimed 的 wallet indexed |

**下一步建议**：
1. **最高优先级**：补边界测试（特别是资金相关 revert 路径）
2. **中优先级**：`TestBase` 换 `forge-std/Test.sol`
3. **低优先级**：签名 malleability 检查、`renounceRole`
