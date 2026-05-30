# Testnet 部署指南

> 支持 Base Sepolia 或 Arbitrum Sepolia。推荐 Base Sepolia（gas 低、水龙头友好）。

---

## 1. 环境准备

### 1.1 获取测试 ETH

**Base Sepolia 水龙头（推荐）**:
- https://www.alchemy.com/faucets/base-sepolia（需要 Alchemy 账号，每天 0.5 ETH）
- https://faucet.quicknode.com/base/sepolia（需要 QuickNode 账号）
- https://basefaucet.org/（简单，但可能限额）

**Arbitrum Sepolia 水龙头**:
- https://faucet.quicknode.com/arbitrum/sepolia

### 1.2 配置 `.env`

在项目根目录创建 `.env`：

```bash
# 部署私钥（必须有测试 ETH）
PRIVATE_KEY=0x...

# Claim 签名私钥（可以和部署私钥相同，或单独一个）
CLAIM_SIGNER_PRIVATE_KEY=0x...

# RPC（推荐 Alchemy 或 Infura）
BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
# 或
ARBITRUM_SEPOLIA_RPC=https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Etherscan API Key（合约验证用）
BASESCAN_API_KEY=...
# 或
ARBISCAN_API_KEY=...
```

**注意**：`.env` 不要提交到 git。已加 `.gitignore`。

---

## 2. 部署

### 2.1 Base Sepolia

```bash
cd veil-scout/contracts

source .env

forge script script/DeployP0.s.sol:DeployP0 \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### 2.2 Arbitrum Sepolia

```bash
forge script script/DeployP0.s.sol:DeployP0 \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ARBISCAN_API_KEY
```

### 2.3 不验证合约（快）

如果不需要 Etherscan 验证，去掉 `--verify`：

```bash
forge script script/DeployP0.s.sol:DeployP0 \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

## 3. Mock 数据说明

当前 `script/MockData.s.sol` 只用于 Anvil 本地链，脚本里有：

```solidity
require(block.chainid == 31_337, "MockData is intended for local Anvil");
```

原因：
- `settle()` 依赖 `evm_increaseTime`，testnet 不能人为推进时间
- mock scout 使用 Anvil 预置私钥，不能直接假设 testnet 上有资金
- demo 主链路推荐本地 Anvil，testnet 只作为“合约已部署到真实网络”的证明

本地填充 mock 数据：

```bash
cd veil-scout/contracts

# Step 1: seed（创建 market + claim + buy + void）
forge script script/MockData.s.sol:MockData \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --sig "seed()"

# Step 2: settle（推进 Anvil 时间并结算 market_0）
forge script script/MockData.s.sol:MockData \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --sig "settle()"
```

如确实要在 testnet 填充演示数据，需要单独做一版 testnet seed：

1. 给 scout 钱包准备测试 ETH
2. 创建短 deadline market
3. 等真实时间到 `resolutionDeadline`
4. 用 `SETTLEMENT_ROLE` 钱包手动调用 `Market.settle(marketId, true)`

---

## 4. 更新 deployment.json

部署后 `broadcast/` 目录会生成运行记录。手动更新 `deployment.json`：

```json
{
  "chainId": 84532,
  "network": "base-sepolia",
  "season": "0x...",
  "creditLedger": "0x...",
  "leaderboard": "0x...",
  "market": "0x...",
  "marketFactory": "0x...",
  "explorer": "https://sepolia.basescan.org/address/0x..."
}
```

---

## 5. Demo Day 建议

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| **主要演示** | Anvil 本地链 | 秒级出块、无 gas、完全可控 |
| **备份演示** | 预录视频 | 链出问题时不尴尬 |
| **真实性证明** | Testnet 部署截图 | 展示合约已上真实链 |

**不要完全依赖 testnet 做 live demo**：
- 网络延迟 3-5 秒
- 需要等真实时间到 deadline
- 可能拥堵或水龙头没水

---

## 6. 常见问题

### Q: `Insufficient funds` 报错
A: 测试 ETH 不够。Base Sepolia 部署一次约需 0.001 ETH，确保钱包有 0.01 ETH 以上。

### Q: 合约验证失败
A: Etherscan API Key 可能过期或限频。去掉 `--verify` 先部署，之后手动在浏览器上验证。

### Q: `nonce too low`
A: 同一私钥在多个地方发送交易，nonce 冲突。等几秒再试，或手动指定 nonce。

### Q: 部署后找不到合约地址
A: 查看 `broadcast/DeployP0.s.sol/<chainId>/run-latest.json`，里面有完整的交易记录和地址。
