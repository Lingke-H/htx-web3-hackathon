# Veil Scout P0 — 资深技术工程师代码审计

> 审计范围：全部 5 个合约 + 2 个工具合约 + 34 个测试  
> 审计维度：安全、Gas、工程实践、Spec 一致性  
> 结论：代码架构正确，资金安全，3 处建议优化，1 处命名问题。

---

## 一、安全审计

### 1.1 重入攻击面

| 函数 | 外部调用 | 防护 | 评估 |
|------|---------|------|------|
| `takePosition` | `CreditLedger.lockForTrade` | `nonReentrant` ✅ | 安全 |
| `claim` | `CreditLedger.releaseToScout` + `Leaderboard.updateScore` | `nonReentrant` ✅ | 安全 |
| `finalizePosition` | `Leaderboard.updateScore` | 无（public） | 低风险* |

*finalizePosition 调用 Leaderboard，但 Leaderboard 不持有资金且不会回调，实际风险极低。

**建议**：`finalizePosition` 虽不直接涉及资金转移，但外部调用仍建议加 `nonReentrant`，统一防护标准。

### 1.2 签名安全

```solidity
// CreditLedger.sol:182-192
function _recover(bytes32 digest, bytes calldata signature) internal pure returns (address) {
    // ...
    if (uint256(s) > SECP256K1N_HALF_ORDER) return address(0);  // ✅ low-s 检查
    return ecrecover(digest, v, r, s);
}
```

**已修复**：Codex 已加入 `SECP256K1N_HALF_ORDER` 检查，防止签名 malleability。

**剩余问题**：`_readBytes32` 手动逐字节读取，效率低（见 Gas 审计）。

### 1.3 整数溢出

Solidity 0.8.x 内置溢出检查，所有算术操作都有自动保护。

唯一显式类型转换：
```solidity
// Market.sol:232
position.scoreDelta = int256(position.claimableCredits) - int256(totalStake);
```

注释说明 `MAX_STAKE_PER_MARKET = 2000` 确保不会接近 `int256` 上限。正确。

### 1.4 权限模型

| 角色 | 持有者 | 权限 | 风险 |
|------|--------|------|------|
| DEFAULT_ADMIN_ROLE | 部署者 | 所有角色管理 | 中心化信任假设 |
| SETTLEMENT_ROLE | 运营地址 | settle | 错误结算风险 |
| MARKET_CREATOR_ROLE | Factory | createMarket | 低 |

**评估**：P0 中心化设计是可接受的信任假设。`setClaimSigner` 允许 admin 更换 signer，若 admin 私钥泄露，攻击者可伪造 claim。建议 P1 引入多签或 Timelock。

---

## 二、Gas 审计

### 2.1 🔴 `_readBytes32` 严重低效

```solidity
// CreditLedger.sol:195-199
function _readBytes32(bytes memory data, uint256 offset) internal pure returns (bytes32 value) {
    for (uint256 i = 0; i < 32; i++) {
        value |= bytes32(uint256(uint8(data[offset + i])) << (8 * (31 - i)));
    }
}
```

**问题**：每次 `claim` 调用都要执行 32 次循环 + 32 次位运算。

**优化**（内联汇编）：
```solidity
function _readBytes32(bytes memory data, uint256 offset) internal pure returns (bytes32 value) {
    assembly {
        value := mload(add(data, add(offset, 32)))
    }
}
```

**收益**：从 ~1000+ gas 降到 ~6 gas。

### 2.2 🟡 `_validateMarketSpec` 冗余调用

```solidity
// Market.sol:335-350
function _validateMarketSpec(MarketSpec calldata spec) internal view {
    if (!season.isSeasonActive(spec.seasonId)) revert InvalidMarketSpec();  // ❌ 冗余
    (, uint256 seasonEnd, bool isActive) = season.getSeason(spec.seasonId);
    if (!isActive) revert InvalidMarketSpec();                               // 已覆盖
    // ...
}
```

**问题**：先调 `isSeasonActive()`，再调 `getSeason()` 检查 `isActive`。`isSeasonActive` 已包含 `isActive` 检查。

**优化**：
```solidity
(, uint256 seasonEnd, bool isActive) = season.getSeason(spec.seasonId);
if (!isActive || block.timestamp > seasonEnd) revert InvalidMarketSpec();
```

**收益**：省 1 次外部调用（~2600 gas）。

### 2.3 🟢 view 函数使用 storage 引用

```solidity
function getYesOdds(uint256 marketId) external view returns (uint256) {
    MarketData storage market = _market(marketId);  // SLOAD
```

view 函数由 RPC 节点执行，不消耗用户 gas。但频繁调用可能触发 RPC 限频。

**建议**：前端缓存 `getYesOdds` 结果，或批量查询。

---

## 三、工程实践审计

### 3.1 🔴 Error 命名不当

```solidity
// CreditLedger.sol:69
if (!season.isSeasonActive(seasonId)) revert InvalidSignature();

// CreditLedger.sol:107
if (!season.isSeasonActive(seasonId)) revert InvalidSignature();
```

**问题**：用 `InvalidSignature` 表示"赛季不活跃"，严重误导调试。

**建议**：
```solidity
if (!season.isSeasonActive(seasonId)) revert SeasonNotActive(seasonId);
```

### 3.2 🟡 构造函数缺少零地址检查

```solidity
// MarketFactory.sol:16
constructor(address market_) {
    market = market_;  // ❌ 不检查 address(0)
}
```

**建议**：
```solidity
constructor(address market_) {
    if (market_ == address(0)) revert InvalidMarketSpec();
    market = market_;
}
```

### 3.3 🟡 `ReentrancyGuard` 使用字符串 revert

```solidity
// ReentrancyGuard.sol:11
require(_status != _ENTERED, "REENTRANT");
```

**建议**：换 custom error：
```solidity
error ReentrantCall();
// ...
if (_status == _ENTERED) revert ReentrantCall();
```

### 3.4 🟢 缺少 NatSpec 注释

合约函数缺少 `@notice`、`@param`、`@return`。P0 可接受，但长期维护需要补充。

### 3.5 🟢 未使用 OpenZeppelin

自定义 `AccessManaged` 和 `ReentrancyGuard` 减少了依赖，但缺少：
- `renounceRole`
- `getRoleAdmin`
- EIP-165 `supportsInterface`

**P0 判断**：可接受，P1 迁移到 OpenZeppelin。

---

## 四、Spec 一致性审计

| Spec 要求 | 实现状态 | 备注 |
|-----------|---------|------|
| `finalize ≠ claim` | ✅ | 分离正确 |
| `claimDeadline` 保护 | ✅ | 7 天 window |
| `sweepExpiredRemainder` | ✅ | claimDeadline 后 |
| `Side.NONE` | ✅ | enum 定义正确 |
| `getYesOdds` 公式 | ⚠️ | Spec 是 50/50 偏移，实现是直接比例 |
| `MarketCreated` event | ✅ | 已补全字段 |
| `CreditsClaimed` wallet | ✅ | 已加 indexed |

**getYesOdds 差异说明**：
- Spec：5000 + (yesStake * 5000 / total) - (noStake * 5000 / total)
- 实现：yesStake * 10000 / totalStake

两者在数学上等价（都是 yesStake 占比），差异只在 5%/95% clamp。实现更简洁，已确认接受。

---

## 五、测试审计

### 5.1 覆盖度

34 个测试覆盖：
- ✅ 资金守恒（CreditLedger invariant）
- ✅ 比例分配（多赢家 1:2）
- ✅ 所有 revert 路径
- ✅ 时间边界（deadline / claim window）
- ✅ no-winner / void / sweep

### 5.2 建议补充

| 测试 | 优先级 | 说明 |
|------|--------|------|
| `testLockForTradeAmountZero` | 低 | amount=0 revert |
| `testClaimSignerUpdate` | 低 | admin 更换 signer |
| `testSeasonEndThenCreateMarket` | 低 | 赛季结束后创建市场 revert |
| invariant fuzz | P1 | 总量守恒 + 单边持仓 fuzz |

---

## 六、审计总结

### 安全评分：A-
- 资金安全 ✅
- 重入防护 ✅
- 签名安全 ✅（malleability 已修）
- 扣分：`_readBytes32` 低效、`InvalidSignature` 命名误导

### Gas 评分：B+
- 核心逻辑 gas 合理 ✅
- 扣分：`_readBytes32` 严重低效、`_validateMarketSpec` 冗余调用

### 工程实践评分：B+
- 架构清晰 ✅
- 模块化良好 ✅
- 扣分：缺少 NatSpec、Error 命名不当、未用 OpenZeppelin

### 总体评分：A-（P0 合格，3 处建议优化）

---

## 七、建议修改清单（按优先级）

### P0 建议修（影响安全/质量）

1. **`_readBytes32` 用内联汇编优化**（Gas 从 1000+ → 6）
2. **`InvalidSignature` 改成 `SeasonNotActive`**（调试友好性）
3. **`_validateMarketSpec` 去掉冗余 `isSeasonActive` 调用**（省 2600 gas）

### P0 可选修

4. **`MarketFactory` 构造函数加零地址检查**
5. **`ReentrancyGuard` 用 custom error**
6. **`finalizePosition` 加 `nonReentrant`**（统一防护标准）

### P1 再修

7. 补充 NatSpec 注释
8. 迁移到 OpenZeppelin `AccessControl` + `ReentrancyGuard`
9. invariant fuzz 测试
10. 引入多签 / Timelock

---

*审计完成时间：2026-05-05*  
*审计人：Kimi（资深技术工程师视角）*  
*代码版本：Codex 第二版（34 测试 + low-s 修复）*
