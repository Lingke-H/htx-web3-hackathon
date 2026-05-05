# Demo Day 检查清单

> Track A 合约部分赛前准备。确保 demo 时每个环节都能跑通。

---

## 一、环境检查

```bash
cd /Users/wangjiayi/Documents/New\ project\ 7/HTX-Web3-Hackathon/veil-scout/contracts

# 1. 编译
forge build
# 预期：编译通过，只有 block.timestamp warning

# 2. 测试
forge test --summary
# 预期：34 passed, 0 failed

# 3. ABI 完整
ls abi/
# 预期：CreditLedger.json, Market.json, Season.json, Leaderboard.json, MarketFactory.json

# 4. Git 状态
git status
# 预期：所有文件已 tracked，工作区 clean
```

---

## 二、Anvil 本地演示流程（主要方案）

### 步骤 1：启动本地链

```bash
anvil --accounts 6
```

**检查点**：
- [ ] Anvil 启动成功，显示 6 个预置地址和私钥
- [ ] RPC: `http://127.0.0.1:8545`
- [ ] Chain ID: 31337

### 步骤 2：部署合约

```bash
forge script script/DeployP0.s.sol:DeployP0 \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

**检查点**：
- [ ] 部署成功，输出 5 个合约地址
- [ ] `deployment.json` 已更新

### 步骤 3：填充 Mock 数据

```bash
# Step 1: seed
forge script script/MockData.s.sol:MockData \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --sig "seed()"

# Step 2: settle（需要等时间到 resolutionDeadline 后）
forge script script/MockData.s.sol:MockData \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --sig "settle()"
```

**检查点**：
- [ ] scout_1 到 scout_4 已 claim credits；scout_5 保持未 claim，用于评委体验
- [ ] 3 个 market 已创建
- [ ] market_0 已结算（SETTLED / YES）
- [ ] market_1 交易中（TRADING）
- [ ] market_2 已作废（VOIDED）

### 步骤 4：验证链上状态

```bash
# 用 cast 查询

cast call <MARKET_ADDRESS> "getMarket(uint256)" 0 \
  --rpc-url http://127.0.0.1:8545

# 预期：status = 1 (SETTLED), result = 1 (YES)

cast call <CREDIT_LEDGER_ADDRESS> "freeBalance(bytes32,uint256)" \
  <SCOUT_ID> 0 \
  --rpc-url http://127.0.0.1:8545

# 预期：seed/settle 后 scout_1 = 10000, scout_2 = 8500
# scout_2 claim market_0 后变为 10500；再 claim market_2 refund 后变为 11000
```

---

## 三、Demo 演示脚本（5 分钟）

### 场景 1：用户入场 + Claim Credits（30 秒）

```
展示：用户连接钱包 → 首次 claim
操作：用 scout_5 的钱包调用 CreditLedger.claim()
验证：freeBalance 从 0 → 10000
说明：scoutId 绑定完成
```

### 场景 2：浏览市场 + Buy YES（45 秒）

```
展示：market_1（TRADING 中）
操作：用 scout_5 调用 Market.takePosition(market_1, YES, 500)
验证：PositionTaken 事件触发
说明：用户投入 500 credits 买 YES
```

### 场景 3：AI 分析报告（15 秒）

```
展示：market_1 的 AI 初始概率（前端 mock 展示）
说明：这只是展示信号，不影响收益
```

### 场景 4：结算 + Claim Winnings（60 秒）

```
展示：market_0（已 SETTLED / YES）
操作：scout_2 调用 Market.claim(market_0)
验证：freeBalance 增加（8500 → 10500）
说明：赢家按 stake 比例分配输家 credits
```

### 场景 5：排行榜（30 秒）

```
展示：Leaderboard score 更新
说明：scout_2 得分 +1000，scout_3 得分 -1000
```

### 场景 6：Void 市场 + Refund（30 秒）

```
展示：market_2（VOIDED）
操作：scout_2 调用 Market.claim(market_2)
验证：freeBalance 增加（10500 → 11000，全额退回 void 市场的 500 credits）
说明：void 市场不计分
```

### 场景 7：Sweep Expired（15 秒）

```
展示：claim window 过期后 sweep
说明：未领取 credits 进入 protocol reserve
```

---

## 四、边界情况演示（可选，如果评委问）

### Q: 怎么防止项目方自己买？

```
操作：用 projectOwner 地址调用 takePosition
验证：revert ProjectOwnerCannotTrade
```

### Q: 怎么防止用户两边都买？

```
操作：先买 YES，再买 NO
验证：revert SingleSideOnly
```

### Q: 结算错误怎么办？

```
说明：P0 是信任式结算，由 SETTLEMENT_ROLE 执行。
P1 引入 UMA 乐观预言机 + 挑战期。
```

### Q: 积分从哪来？

```
说明：零和分配。赢家拿输家的 credits，系统只收手续费（P1）。
```

---

## 五、备用方案

| 风险 | 概率 | 备用方案 |
|------|------|---------|
| Anvil 启动失败 | 低 | 用 `anvil --fork-url` fork testnet |
| 部署脚本失败 | 低 | 预录部署视频 |
| 合约调用失败 | 低 | 预录完整操作视频 |
| 网络问题 | 中 | 完全离线演示（Anvil + 本地前端）|
| 电脑死机 | 低 | 第二台电脑备用 |

**预录视频建议**：
- 1080p 录屏
- 配字幕说明每个步骤
- 时长 3-5 分钟

---

## 六、赛前 24 小时检查

- [ ] `forge test` 34 个测试全部通过
- [ ] `forge build` 编译通过
- [ ] Anvil 本地链路完整跑通 3 次
- [ ] 预录视频已制作并备份到 U 盘 / 云盘
- [ ] 部署脚本在 testnet 跑通至少 1 次（可选）
- [ ] `deployment.json` 和 `mock-data.json` 已同步给 Track B/C
- [ ] git commit / push 完成
- [ ] Pitch Deck 已准备好合约架构页

---

## 七、常见问答准备

**Q: 这和 Polymarket 有什么区别？**
A: 我们不预测新闻/政治，预测项目执行力。用 credits 不是真钱，zkID 防女巫。

**Q: AI 判断错了怎么办？**
A: AI 只给初始概率，不影响收益计算。最终由链上数据结算。

**Q: 怎么防止刷分？**
A: zkID 保证 1 人 1 身份，单边持仓防止对冲，单市场 cap 防止 whale。

**Q: Credits 有价值吗？**
A: 不可转让，不可提现，只在赛季内有效。排行榜前 N 名获得代币奖励。

**Q: 合约升级吗？**
A: P0 直接部署，P1 考虑 UUPS 代理模式。
