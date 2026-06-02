# Demo Market States

These examples are frontend mocks for Track C. They intentionally separate AI Prior, Crowd Odds, and oracle settlement.

## 1. Trading Market

```json
{
  "marketId": 0,
  "projectSlug": "agentpay",
  "title": "Will AgentPay emit at least 10 valid payment events before the deadline?",
  "status": "TRADING",
  "trustBoundary": "P0 trusted oracle",
  "aiReport": {
    "aiPriorLabel": "AI Prior",
    "aiPriorProbability": 0.64,
    "confidence": "medium",
    "bullish": ["Recent commits and demo contract activity are visible."],
    "bearish": ["User diversity is not yet verified."],
    "riskFlags": ["possible wash activity"]
  },
  "crowdOdds": {
    "yesProbabilityBps": 5800,
    "source": "Market.getYesOdds"
  },
  "verificationCriteria": {
    "type": "contract_event_count",
    "target": 10,
    "dataSource": "AgentPay payment contract logs",
    "formula": "PASS if matching event count >= 10 before resolution deadline"
  },
  "oracleReport": null
}
```

## 2. Settled YES Market

```json
{
  "marketId": 1,
  "projectSlug": "zkdocs",
  "title": "Will ZKDocs merge at least 5 qualifying PRs before the deadline?",
  "status": "SETTLED",
  "result": "YES",
  "trustBoundary": "P0 trusted oracle",
  "aiReport": {
    "aiPriorLabel": "AI Prior",
    "aiPriorProbability": 0.71,
    "confidence": "high",
    "bullish": ["Maintainer activity is consistent.", "Multiple contributors are active."],
    "bearish": ["Release packaging is still manual."],
    "riskFlags": []
  },
  "crowdOdds": {
    "yesProbabilityBps": 6900,
    "source": "Market.getYesOdds"
  },
  "verificationCriteria": {
    "type": "github_merged_prs",
    "target": 5,
    "dataSource": "GitHub merged pull requests",
    "formula": "PASS if merged PR count >= 5 before resolution deadline"
  },
  "oracleReport": {
    "passed": true,
    "settlementRationale": "Observed 7 merged pull requests for demo/zkdocs; target is 5. Result is PASS.",
    "observedMetrics": {"mergedPrs": 7, "target": 5},
    "dataSourceStatus": {"github": "available"},
    "limitations": ["P0 verifier counts merged PRs only; it does not judge PR quality or production deployment."]
  }
}
```

## 3. Suspicious / Failed Market

```json
{
  "marketId": 2,
  "projectSlug": "airdrop-ai",
  "title": "Will AirdropAI emit at least 100 valid usage events before the deadline?",
  "status": "SETTLED",
  "result": "NO",
  "trustBoundary": "P0 trusted oracle",
  "aiReport": {
    "aiPriorLabel": "AI Prior",
    "aiPriorProbability": 0.43,
    "confidence": "low",
    "bullish": ["Contract is deployed."],
    "bearish": ["GitHub activity is sparse.", "Usage pattern is concentrated."],
    "riskFlags": ["manual review required", "possible wash activity"]
  },
  "crowdOdds": {
    "yesProbabilityBps": 7200,
    "source": "Market.getYesOdds"
  },
  "verificationCriteria": {
    "type": "contract_event_count",
    "target": 100,
    "dataSource": "AirdropAI usage contract logs",
    "formula": "PASS if matching event count >= 100 before resolution deadline"
  },
  "oracleReport": {
    "passed": false,
    "settlementRationale": "Observed 18 matching contract events for 0x0000000000000000000000000000000000000000; target is 100. Result is FAIL.",
    "observedMetrics": {"eventCount": 18, "target": 100},
    "dataSourceStatus": {"chain": "available"},
    "limitations": ["P0 verifier counts matching logs only; it does not yet filter unique wallets or wash activity."]
  }
}
```
