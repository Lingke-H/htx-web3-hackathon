# 机制设计闭环疑问

Status: answered for P0.5. The raw questions below are preserved as design context; the current policy answers live in:

- `docs/mechanism/p0-mechanism-closure.md`
- `docs/mechanism/market-admission-policy.md`
- `docs/mechanism/season-reward-policy.md`
- `docs/integration/track-c-handoff.md`

## 1. 积分制与赛季中后期活力

Original question: scout credits 是消耗性资源、没有市场流动性，会不会导致赛季中后期市场活力下降？

P0 answer: credits are non-transferable but not simply burned. They move from free balance into market escrow, then redistribute from wrong scouts to correct scouts after settlement. This makes the game a judgment tournament rather than a cash market. `MAX_STAKE_PER_MARKET` limits one-market exhaustion.

P1 roadmap: staged credit release, late-season reserved credits, and higher next-season allocation for high-reputation scouts.

## 2. 赛季过渡

Original question: credits 在赛季末如何处理？“未来赛季更高积分分配额度”是否已定义？

P0 answer: credits are season-scoped and do not transfer. Leaderboard reputation is the durable record. “Higher future allocation” is not a P0 contract promise.

P1 roadmap: reputation-based next-season allocation, badges, and reward claiming.

## 3. 代币奖励池资金来源

Original question: token reward pool 是否只能依靠外部注资？平台是否有收入模型？

P0 answer: rewards come from sponsor/ecosystem budget, not losing users. Credits measure scout skill; they are not the funding source.

Business framing: Veil Scout sells or enables project discovery infrastructure for HTX DAO, hackathons, grant committees, incubators, launchpads, and investor research.

## 4. AI 是分析师，不是裁判

Original question: if AI provides initial odds, who provides AMM liquidity? Would LMSR be necessary?

P0 answer: no AMM, no LMSR, no LP, no AI market maker. AI output is renamed **AI Prior**. It is off-chain display data and never acts as on-chain price. On-chain Crowd Odds come only from YES/NO stake ratio via `Market.getYesOdds`.

P1 roadmap: richer AI analyst methods are possible, but not price-setting or counterparty-taking.

## 5. 市场结算标准由谁制定

Original question: each project can have different binary settlement criteria; who defines them, and how do we prevent criteria/evidence/bonus arbitrage?

P0 answer: project teams can propose milestones, but only the platform/reviewer with `MARKET_CREATOR_ROLE` finalizes the MarketSpec. Criteria must be binary, verifiable, deadline-bound, and formula-based.

Reference: `docs/mechanism/market-admission-policy.md`.

## 6. 项目方提交 milestones 的可操作空间

Original question: if project teams set milestones themselves, can they choose easy or manipulable milestones?

P0 answer: milestones are proposals, not final market definitions. Reviewer/platform approval is required before market creation. `projectOwner` is blocked from trading in its own market.

P1 roadmap: community challenge period before market opens and penalties for low-quality milestones.

## 7. Evidence Score 的验证与刷分风险

Original question: who verifies evidence, and can evidence bonuses become a farming vector?

P0 answer: Evidence Score is not part of on-chain scoring in P0. Evidence/risk notes may be shown qualitatively, but leaderboard updates come only from settled market performance.

P1 roadmap: evidence registry, AI-assisted evidence scoring, human/community review, duplicate/spam penalties.

## 8. Oracle / sandbox 由谁运行

Original question: who runs the oracle and settlement process? Is this centralized?

P0 answer: Track B is a trusted oracle. It gathers GitHub/on-chain data, writes a verification report, and calls `Market.settle` from a wallet with `SETTLEMENT_ROLE`. This is centralized and intentionally disclosed for demo reliability.

P1 roadmap: optimistic oracle, challenge window, multi-source quorum, and report commitments.

## Remaining External Linkage

The internal mechanism loop is closed for P0.5. External linkage still needs demo/pitch framing:

- HTX DAO / ecosystem budget as a sponsor reward pool
- hackathon and incubator project discovery use case
- optional P1 HTX ecosystem reward integration
