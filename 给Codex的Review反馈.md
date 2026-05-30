# 给 Codex 的 Review 反馈

## 总体评价

代码质量高，架构实现忠实于 Spec。核心设计全部正确落地，编译通过，主链路测试通过。

**评分**：架构 A / 资金安全 A / 测试 C / 代码质量 B+

---

## 🔴 Blocker（必须修/补）

### 1. 测试严重不足

当前 8 个测试远远不够。P0 合约涉及资金流动，**所有 revert 路径和边界情况都必须有测试覆盖**。

**必须补的测试清单**：

**CreditLedger**（至少补 6 个）：
- `lockForTrade` 余额不足 revert
- `releaseToScout` 超过 locked revert
- `moveLockedToReserve` 超过 locked revert
- `registerMarket` 重复注册 revert
- `registerMarket` 非活跃赛季 revert
- 总量不变量简单验证

**Market**（至少补 15 个）：
- `takePosition`: tradingDeadline 后 / projectOwner / 单边 / 超 cap / 未绑定 scoutId
- `settle`: resolutionDeadline 前 / 已结算 / 已作废
- `voidMarket`: 已结算 revert
- `forceVoid`: forceVoidDeadline 前
- `finalizePosition`: 未结算未作废 / 重复 finalize / 无 position
- `claim`: 已 claim / claimDeadline 后 / 无 claimableCredits
- `sweepExpiredRemainder`: claimDeadline 前 / 无余款 / 非终态
- **多用户比例分配**：Alice 1000 YES + Bob 2000 YES，结算后检查 1:2 分配

### 2. `TestBase` 换 `forge-std/Test.sol`

自定义 `TestBase` 缺少丰富断言和 `console.log`，补测试时调试会很痛苦。

建议：
```solidity
import "forge-std/Test.sol";
contract CreditLedgerTest is Test { ... }
```

---

## 🟡 建议（最好修）

### 3. `CreditsClaimed` event 加 wallet indexed

当前：
```solidity
event CreditsClaimed(bytes32 indexed scoutId, uint256 indexed seasonId, uint256 amount);
```

前端可能需要通过 wallet 地址查 scoutId。建议：
```solidity
event CreditsClaimed(
    bytes32 indexed scoutId,
    address indexed wallet,      // ← 新增
    uint256 indexed seasonId,
    uint256 amount
);
```

### 4. 签名 malleability

`_recover` 不检查 `s` 值是否在低半区。风险低（nonce 防重放），但 P1 建议换 OpenZeppelin `ECDSA`。

---

## 🟢 产品决策需要确认

### 5. `sweepExpiredRemainder` 扫走赢家未领 winnings

当前逻辑：claim window（7 天）后，任何人可 sweep，未领取 credits（包括赢家 winnings）进 reserve。

**这不是 bug，是设计选择。** 但需要前端明确提示用户 claim deadline，否则用户会以为钱丢了。

**确认**：这个设计你们接受吗？如果接受，我把它写进产品文档。

### 6. `getYesOdds` 实现和 Spec 不一致

**Spec 版本**：`yesPrice = 5000 + (yesStake * 5000 / total) - (noStake * 5000 / total)`
**你的版本**：`yesPrice = yesStake * 10000 / totalStake`

两种都可以，你的更简单。但如果接受这个变更，需要更新 Spec 文档保持一致。

**确认**：用哪个版本？

---

## 下一步行动

```
1. 换 TestBase → forge-std/Test.sol
2. 补边界测试（优先资金相关 revert 路径）
3. 补多用户比例分配测试
4. 确认 getYesOdds 版本 + sweep 产品决策
5. 可选：补 CreditsClaimed wallet indexed
```

测试补完后，P0 合约就可以进入 ABI 导出 + Track B/C 对接阶段。

---

*Review by Kimi*  
*基于 TrackA-Storage-API-Spec.md + Codex 第一版实现*
