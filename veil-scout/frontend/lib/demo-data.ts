export type StatusTone = "accent" | "positive" | "caution" | "critical" | "neutral";
export type ActionState = "default" | "loading" | "success" | "error";
export type StepState = "complete" | "current" | "upcoming";
export type Locale = "en" | "zh";

export const localeOptions = [
  { value: "en" as const, shortLabel: "EN", label: "English" },
  { value: "zh" as const, shortLabel: "中", label: "中文" },
];

export type DemoMarket = {
  marketId: number;
  projectSlug: string;
  title: string;
  status: "TRADING" | "SETTLED";
  result: "YES" | "NO" | null;
  trustBoundary: "P0 trusted oracle";
  preferredSide: string;
  exposure: string;
  close: string;
  tone: StatusTone;
  aiReport: {
    aiPriorLabel: "AI Prior";
    aiPriorProbability: number;
    confidence: "low" | "medium" | "high";
    bullish: string[];
    bearish: string[];
    riskFlags: string[];
  };
  crowdOdds: {
    yesProbabilityBps: number;
    source: "Market.getYesOdds";
  };
  verificationCriteria: {
    type: "contract_event_count" | "github_merged_prs";
    target: number;
    dataSource: string;
    formula: string;
  };
  oracleReport: {
    passed: boolean;
    settlementRationale: string;
    observedMetrics: Record<string, string | number | boolean>;
    dataSourceStatus: Record<string, string>;
    limitations: string[];
  } | null;
};

const englishContent = {
  shell: {
    brandLabel: "HTX Web3 Hackathon",
    brandName: "VEIL SCOUT",
    brandDescription:
      "AI-assisted scout discovery console for credit markets, oracle review, and post-hackathon sponsor release.",
    navigation: [
      { label: "Overview", value: "overview", active: true },
      { label: "Markets", value: "markets", active: false },
      { label: "Incubation", value: "incubation", active: false },
      { label: "Approvals", value: "approvals", active: false },
      { label: "Settlement", value: "settlement", active: false },
    ],
    scopeLabel: "Demo scope",
    scopeDescription:
      "Live wallet state is real. Market cards below remain labeled as seeded demo data from the local contract flow.",
    overviewLabel: "Mission control",
    overviewTitle: "Mission control for AI prior, crowd odds, and wallet-backed approvals",
    updatedAt: "Updated 00:14 UTC",
    badges: [
      { label: "Seeded demo data", tone: "neutral" as const },
      { label: "ABI ready", tone: "positive" as const },
      { label: "Wallet-aware", tone: "accent" as const },
    ],
  },
  hero: {
    eyebrow: "AI oracle mission desk",
    title: "Pilot AI prior, crowd odds, oracle settlement, and post-hackathon sponsor release from one mission control deck.",
    description:
      "Veil Scout turns scout discovery into a credit-based prediction loop, then carries selected builders into a separate proof-of-execution incubation lane with milestone-based sponsor budget release.",
    primaryCta: "Open approval review",
    connectCta: "Connect wallet",
    secondaryCta: "View settlement path",
    highlights: [
      "Header language toggle switches the whole console",
      "Wallet address, network, and native balance are live",
      "Market rows stay clearly labeled as demo data",
    ],
    summaryTitle: "Execution snapshot",
    summary: [
      { label: "Current market", value: "HTX Agent SDK Integration" },
      { label: "Market closes", value: "06h 18m" },
      { label: "Suggested order", value: "YES 350 SCOUT" },
      { label: "Permission state", value: "Creator blocked" },
    ],
    note:
      "Demo-only market numbers remain labeled. Wallet address, chain, and native balance come from the connected wallet when available.",
  },
  wallet: {
    eyebrow: "Wallet state",
    title: "Wallet lane and execution guardrails",
    connected: "Connected",
    disconnected: "Not connected",
    waiting: "Waiting for connection",
    disconnectedHint:
      "Connect a wallet to show the address, network, and native balance. Demo season credits stay visible so judges still understand the product flow.",
    addressLabel: "Wallet address",
    scoutIdLabel: "Scout binding",
    networkLabel: "Current network",
    nativeBalanceLabel: "Native balance",
    seasonCreditsLabel: "Season credits",
    exposureLabel: "Exposure",
    season: "Season 0",
    sync: "Last synced 00:14 UTC",
    demoScoutId: "scout_0x72c1",
    demoNetwork: "Expected: Base Sepolia / local Anvil",
    demoCredits: "7,540 SCOUT",
    demoExposure: "1,400 SCOUT",
    exposureNote:
      "Demo season exposure stays separate from the wallet's live native balance so judges do not confuse credits with ETH.",
    checks: [
      {
        label: "Wallet binding",
        positive: "The connected wallet can be bound to the scout profile before claiming credits.",
        neutral: "No wallet connected yet. Bind after the first claim to keep the execution identity stable.",
      },
      {
        label: "Network lane",
        positive: "Supported execution lane detected. You can review and submit wallet actions from this session.",
        caution: "Connected network differs from the expected demo lane. Review chain selection before approving actions.",
        neutral: "Base Sepolia or local Anvil is expected for the full demo flow.",
      },
      {
        label: "Connector mode",
        positive: "An injected browser wallet is available for live address and balance reads.",
        neutral: "No injected browser wallet detected in this browser session.",
      },
    ],
  },
  metricCards: [
    {
      label: "Season credits",
      value: "7,540 SCOUT",
      tone: "positive" as const,
      context: "+1,200 released after market_009 payout",
      decision: "This tells the judge whether the scout can open a new position without breaching season liquidity.",
    },
    {
      label: "Open exposure",
      value: "1,400 SCOUT",
      tone: "accent" as const,
      context: "18.6% of season credits currently locked",
      decision: "Use this before adding size, especially when one market already dominates the scout book.",
    },
    {
      label: "Pending approval",
      value: "350 SCOUT",
      tone: "caution" as const,
      context: "Awaiting wallet signature for the next YES order",
      decision: "The judge should only approve if AI conviction and the deadline still justify execution.",
    },
    {
      label: "Settlement queue",
      value: "1 claim ready",
      tone: "neutral" as const,
      context: "market_009 settled YES; claim remains claimable",
      decision: "This helps decide whether to batch settlement now or wait for the next finalization cycle.",
    },
  ],
  position: {
    eyebrow: "Position book",
    title: "Active market book",
    description:
      "Each row answers an operator question: increase size, hold exposure, or wait for settlement.",
    headers: ["Market", "Side", "Exposure", "Crowd Odds", "Settlement", "Close"],
  },
  demoMarkets: [
    {
      marketId: 0,
      projectSlug: "agentpay",
      title: "Will AgentPay emit at least 10 valid payment events before the deadline?",
      status: "TRADING",
      result: null,
      trustBoundary: "P0 trusted oracle",
      preferredSide: "YES",
      exposure: "900",
      close: "06h 18m",
      tone: "accent" as const,
      aiReport: {
        aiPriorLabel: "AI Prior",
        aiPriorProbability: 0.64,
        confidence: "medium" as const,
        bullish: ["Recent commits and demo contract activity are visible."],
        bearish: ["User diversity is not yet verified."],
        riskFlags: ["possible wash activity"],
      },
      crowdOdds: {
        yesProbabilityBps: 5800,
        source: "Market.getYesOdds" as const,
      },
      verificationCriteria: {
        type: "contract_event_count" as const,
        target: 10,
        dataSource: "AgentPay payment contract logs",
        formula: "PASS if matching event count >= 10 before resolution deadline",
      },
      oracleReport: null,
    },
    {
      marketId: 1,
      projectSlug: "zkdocs",
      title: "Will ZKDocs merge at least 5 qualifying PRs before the deadline?",
      status: "SETTLED",
      result: "YES",
      trustBoundary: "P0 trusted oracle",
      preferredSide: "YES",
      exposure: "500",
      close: "Claim ready",
      tone: "positive" as const,
      aiReport: {
        aiPriorLabel: "AI Prior",
        aiPriorProbability: 0.71,
        confidence: "high" as const,
        bullish: ["Maintainer activity is consistent.", "Multiple contributors are active."],
        bearish: ["Release packaging is still manual."],
        riskFlags: [],
      },
      crowdOdds: {
        yesProbabilityBps: 6900,
        source: "Market.getYesOdds" as const,
      },
      verificationCriteria: {
        type: "github_merged_prs" as const,
        target: 5,
        dataSource: "GitHub merged pull requests",
        formula: "PASS if merged PR count >= 5 before resolution deadline",
      },
      oracleReport: {
        passed: true,
        settlementRationale: "Observed 7 merged pull requests for demo/zkdocs; target is 5. Result is PASS.",
        observedMetrics: { mergedPrs: 7, target: 5 },
        dataSourceStatus: { github: "available" },
        limitations: ["P0 verifier counts merged PRs only; it does not judge PR quality or production deployment."],
      },
    },
    {
      marketId: 2,
      projectSlug: "airdrop-ai",
      title: "Will AirdropAI emit at least 100 valid usage events before the deadline?",
      status: "SETTLED",
      result: "NO",
      trustBoundary: "P0 trusted oracle",
      preferredSide: "NO",
      exposure: "0",
      close: "Failed",
      tone: "caution" as const,
      aiReport: {
        aiPriorLabel: "AI Prior",
        aiPriorProbability: 0.43,
        confidence: "low" as const,
        bullish: ["Contract is deployed."],
        bearish: ["GitHub activity is sparse.", "Usage pattern is concentrated."],
        riskFlags: ["manual review required", "possible wash activity"],
      },
      crowdOdds: {
        yesProbabilityBps: 7200,
        source: "Market.getYesOdds" as const,
      },
      verificationCriteria: {
        type: "contract_event_count" as const,
        target: 100,
        dataSource: "AirdropAI usage contract logs",
        formula: "PASS if matching event count >= 100 before resolution deadline",
      },
      oracleReport: {
        passed: false,
        settlementRationale:
          "Observed 18 matching contract events for 0x0000000000000000000000000000000000000000; target is 100. Result is FAIL.",
        observedMetrics: { eventCount: 18, target: 100 },
        dataSourceStatus: { chain: "available" },
        limitations: ["P0 verifier counts matching logs only; it does not yet filter unique wallets or wash activity."],
      },
    },
  ] satisfies DemoMarket[],
  incubation: {
    eyebrow: "Post-hackathon incubation",
    title: "Keep sponsor budget gated after discovery",
    description:
      "Scout markets discover signal. Incubation vaults stay separate and release fixed sponsor tranches only after proof-of-execution clears review.",
    selectedProjectLabel: "Selected project",
    selectedProject: "AgentPay",
    executionBadge: "Execution badge: Verified follow-through (mock)",
    statusLabel: "ACTIVE",
    statusTone: "positive" as StatusTone,
    totalBudgetLabel: "Total sponsor budget",
    releasedBudgetLabel: "Released budget",
    refundedBudgetLabel: "Refunded budget",
    remainingBudgetLabel: "Remaining budget",
    milestoneCountLabel: "Milestone count",
    liveDataLabel: "P0.6 / Live contract data",
    fallbackDataLabel: "P0.6 / Demo fallback data",
    totalBudget: 12_000,
    releasedBudget: 4_000,
    refundedBudget: 0,
    remainingBudget: 8_000,
    milestoneCount: 3,
    note:
      "P0.6 keeps sponsor budget accounting separate from scout credits. Releases are fixed milestone tranches, not per-second streaming, and still require an authorized reviewer.",
    milestones: [
      {
        id: "M1",
        title: "Contributor PR tranche",
        summary: "Oracle verified 7 merged PRs against a 5 PR target and released the first sponsor tranche.",
        releaseAmount: 4_000,
        state: "complete" as const,
        signal: "Released",
      },
      {
        id: "M2",
        title: "Docs API integration tranche",
        summary: "API integration is now the active review lane. Release remains blocked until the next proof-of-execution check.",
        releaseAmount: 4_000,
        state: "current" as const,
        signal: "Under review",
      },
      {
        id: "M3",
        title: "Post-hackathon usage tranche",
        summary: "The final tranche stays locked until usage and maintenance remain visible after the event.",
        releaseAmount: 4_000,
        state: "upcoming" as const,
        signal: "Queued",
      },
    ],
  },
  agent: {
    eyebrow: "AI Prior explanation",
    recommendation: "Release at most 350 SCOUT into YES",
    confidence: "64%",
    title: "Why the AI Prior still asks for manual scout approval",
    summary:
      "The AI Prior improved after new merged work landed, but confidence is not high enough to justify a blind full-size order. This panel explains why the suggested action is capped.",
    factors: [
      {
        label: "Merged milestone work",
        value: "3 PRs merged in the last 24h",
        tone: "positive" as const,
      },
      {
        label: "Unique wallet growth",
        value: "412 wallets, below the 500 target checkpoint",
        tone: "caution" as const,
      },
      {
        label: "Founder transparency",
        value: "Status updates and the public demo branch remain active",
        tone: "positive" as const,
      },
    ],
    cautionTitle: "What still needs review",
    cautions: [
      "The market closes in 6 hours, so stale reasoning should not survive until the last minute.",
      "Project-owner wallets remain blocked, but adjacent ecosystem wallets still need manual review.",
      "Confidence stays below 70%, so the UI recommends a limited order instead of max exposure.",
    ],
    nextReview: "Recompute after the next release tag or when wallet growth changes materially.",
  },
  transaction: {
    eyebrow: "Transaction status",
    title: "Approval queue and transaction states",
    summary:
      "This queue shows the actual operator states: review, pending signature, confirmed action, and failure handling.",
    processes: [
      {
        title: "Approve 350 SCOUT for market_012",
        hash: "0x8a24...19f2",
        state: "loading" as const,
        detail: "Wallet prompt is open. The UI should block duplicate submissions until the signature resolves.",
      },
      {
        title: "Claim season credits",
        hash: "0xb1fc...09ae",
        state: "success" as const,
        detail: "Confirmed in block 119820 and bound to scout_0x72c1.",
      },
      {
        title: "Claim market_009 payout",
        hash: "0xe0a7...b71c",
        state: "error" as const,
        detail: "Attempted too early. Retry after the next settlement refresh unlocks the claim.",
      },
    ],
    buttons: [
      {
        label: "Review order",
        helper: "Default state before any wallet prompt appears.",
        state: "default" as const,
      },
      {
        label: "Await wallet signature",
        helper: "Loading state while the signer modal is active.",
        state: "loading" as const,
      },
      {
        label: "Approval recorded",
        helper: "Success state after allowance or trade confirmation.",
        state: "success" as const,
      },
      {
        label: "Retry with lower size",
        helper: "Error state when the order fails risk or limit checks.",
        state: "error" as const,
      },
    ],
  },
  activity: {
    eyebrow: "Recent activity",
    title: "Operator and chain activity",
    description:
      "Transaction hashes, rule checks, and AI Prior refreshes appear in one stream so the demo feels operational.",
    items: [
      {
        time: "00:14",
        title: "Market.takePosition(12, YES, 350)",
        hash: "0x8a24...19f2",
        note: "Submitted from wallet 0x72c1...48Ae after AI refresh.",
        tone: "accent" as const,
      },
      {
        time: "00:06",
        title: "AI Prior refreshed for market_012",
        hash: "job_014",
        note: "AI Prior moved from 59% to 64% after merged milestone work.",
        tone: "positive" as const,
      },
      {
        time: "23:58",
        title: "Creator wallet block check passed",
        hash: "rule_271",
        note: "Project-owner wallet remains excluded from trading on this market.",
        tone: "positive" as const,
      },
      {
        time: "23:41",
        title: "Claim window warning armed",
        hash: "market_012",
        note: "Settlement claim remains locked until the finalization step returns ready.",
        tone: "caution" as const,
      },
    ],
  },
  risk: {
    eyebrow: "Risk and permissions",
    title: "Safety rails",
    items: [
      {
        label: "Risk level",
        value: "Medium",
        detail: "AI Prior confidence is improving, but deadline pressure makes last-minute execution more fragile.",
        tone: "caution" as const,
      },
      {
        label: "Permission model",
        value: "Creator blocked",
        detail: "Project-owner and related ops wallet cannot take a position in this market.",
        tone: "positive" as const,
      },
      {
        label: "Approval cap",
        value: "2,000 SCOUT",
        detail: "The proposed 350 SCOUT order remains well inside the per-market credit cap.",
        tone: "positive" as const,
      },
      {
        label: "Settlement rights",
        value: "Oracle only",
        detail: "Only the settlement role can finalize YES / NO results before claims are released.",
        tone: "neutral" as const,
      },
    ],
  },
  flow: {
    eyebrow: "Demo flow",
    title: "Judge demo path",
    steps: [
      {
        title: "Connect wallet",
        detail: "Read the live address, network, and native balance before taking any action.",
        state: "complete" as const,
      },
      {
        title: "Review AI reasoning",
        detail: "Inspect why the order is capped and whether the market still deserves attention.",
        state: "complete" as const,
      },
      {
        title: "Approve credit spend",
        detail: "Open the signer, confirm the order size, and wait for the transaction hash.",
        state: "current" as const,
      },
      {
        title: "Track settlement",
        detail: "Monitor deadlines, permission state, and oracle settlement before claiming.",
        state: "upcoming" as const,
      },
      {
        title: "Claim result",
        detail: "Finalize the winning position and release credits back to free balance.",
        state: "upcoming" as const,
      },
    ],
  },
  controls: {
    language: "Language",
    connectWallet: "Connect wallet",
    switchNetwork: "Switch network",
    walletReady: "Wallet ready",
    preparing: "Preparing wallet",
    noWallet: "No browser wallet",
  },
};

const chineseContent: typeof englishContent = {
  shell: {
    brandLabel: "HTX Web3 Hackathon",
    brandName: "VEIL SCOUT",
    brandDescription: "一个用于 AI 辅助 Scout 发现、信用市场复核和赛后 sponsor 放款的主控台。",
    navigation: [
      { label: "总览", value: "overview", active: true },
      { label: "市场", value: "markets", active: false },
      { label: "孵化", value: "incubation", active: false },
      { label: "审批", value: "approvals", active: false },
      { label: "结算", value: "settlement", active: false },
    ],
    scopeLabel: "演示范围",
    scopeDescription:
      "钱包地址、网络和原生余额是真实读取的；下方市场数据仍明确标注为基于本地合约流程的 demo 数据。",
    overviewLabel: "主控舱",
    overviewTitle: "汇总 AI 先验、群体赔率与钱包审批的 Mission Control",
    updatedAt: "更新时间 00:14 UTC",
    badges: [
      { label: "种子 demo 数据", tone: "neutral" as const },
      { label: "ABI 已就绪", tone: "positive" as const },
      { label: "支持钱包感知", tone: "accent" as const },
    ],
  },
  hero: {
    eyebrow: "AI 预言机任务台",
    title: "把 AI 先验、群体赔率、预言机结算和赛后 sponsor 放款收进同一个主控舱。",
    description:
      "Veil Scout 先把 Scout 发现做成一个基于积分的预测闭环，再把被发现的强项目送入独立的 proof-of-execution 孵化通道，用里程碑方式逐步释放 sponsor 预算。",
    primaryCta: "进入审批复核",
    connectCta: "连接钱包",
    secondaryCta: "查看结算路径",
    highlights: [
      "顶部语言开关会切换整个控制台文案",
      "钱包地址、网络和原生余额为实时状态",
      "市场行仍明确标注为 demo 数据",
    ],
    summaryTitle: "执行快照",
    summary: [
      { label: "当前市场", value: "HTX Agent SDK Integration" },
      { label: "市场关闭", value: "06h 18m" },
      { label: "建议下单", value: "YES 350 SCOUT" },
      { label: "权限状态", value: "创建者受限" },
    ],
    note:
      "市场数值仍是 demo 数据并已明确标注；钱包地址、网络和原生余额会在连接后实时显示。",
  },
  wallet: {
    eyebrow: "钱包状态",
    title: "钱包链路与执行护栏",
    connected: "已连接",
    disconnected: "未连接",
    waiting: "等待连接",
    disconnectedHint:
      "连接钱包后，这里会显示地址、网络和原生余额。为了让评委仍能看懂产品流程，Season 积分等 demo 数据会继续展示。",
    addressLabel: "钱包地址",
    scoutIdLabel: "Scout 绑定",
    networkLabel: "当前网络",
    nativeBalanceLabel: "原生余额",
    seasonCreditsLabel: "Season 积分",
    exposureLabel: "已暴露仓位",
    season: "Season 0",
    sync: "最近同步 00:14 UTC",
    demoScoutId: "scout_0x72c1",
    demoNetwork: "期望网络：Base Sepolia / 本地 Anvil",
    demoCredits: "7,540 SCOUT",
    demoExposure: "1,400 SCOUT",
    exposureNote:
      "Demo 中的 Season 敞口会与钱包原生余额分开展示，避免评委把积分和 ETH 混在一起理解。",
    checks: [
      {
        label: "钱包绑定",
        positive: "当前连接的钱包可以在首次 claim 前绑定到 scout 身份上。",
        neutral: "尚未连接钱包。首次 claim 后再绑定，可保持执行身份稳定。",
      },
      {
        label: "执行网络",
        positive: "检测到支持的执行网络，可以在当前会话里继续审查和提交钱包动作。",
        caution: "当前连接网络与 demo 预期链路不一致，审批前请先确认链选择。",
        neutral: "完整演示流程建议使用 Base Sepolia 或本地 Anvil。",
      },
      {
        label: "连接器模式",
        positive: "检测到浏览器注入钱包，可以实时读取地址和余额。",
        neutral: "当前浏览器会话里没有检测到注入式钱包。",
      },
    ],
  },
  metricCards: [
    {
      label: "Season 积分",
      value: "7,540 SCOUT",
      tone: "positive" as const,
      context: "market_009 结算后释放了 +1,200",
      decision: "这个数字回答的是：Scout 现在还能不能在不突破流动性约束的前提下继续开仓。",
    },
    {
      label: "当前敞口",
      value: "1,400 SCOUT",
      tone: "accent" as const,
      context: "18.6% 的 Season 积分仍被锁定",
      decision: "加仓前先看这个，尤其当单一市场已经占据主要仓位时。",
    },
    {
      label: "待审批额度",
      value: "350 SCOUT",
      tone: "caution" as const,
      context: "下一笔 YES 订单正在等待钱包签名",
      decision: "只有当 AI 判断和截止时间仍支持执行时，评委才应该继续批准。",
    },
    {
      label: "待结算队列",
      value: "1 笔可 claim",
      tone: "neutral" as const,
      context: "market_009 已结算 YES，但 claim 还没执行",
      decision: "它帮助判断现在要不要立刻结算，还是等下一轮统一处理。",
    },
  ],
  position: {
    eyebrow: "持仓簿",
    title: "活跃市场仓位簿",
    description: "每一行都在回答一个操作问题：继续加仓、维持仓位，还是等待结算。",
    headers: ["市场", "方向", "敞口", "群体赔率", "结算状态", "关闭时间"],
  },
  demoMarkets: [
    {
      marketId: 0,
      projectSlug: "agentpay",
      title: "AgentPay 会在截止日前发出至少 10 个有效支付事件吗？",
      status: "TRADING",
      result: null,
      trustBoundary: "P0 trusted oracle",
      preferredSide: "YES",
      exposure: "900",
      close: "06h 18m",
      tone: "accent" as const,
      aiReport: {
        aiPriorLabel: "AI Prior",
        aiPriorProbability: 0.64,
        confidence: "medium" as const,
        bullish: ["近期提交和 demo 合约活动可见。"],
        bearish: ["独立用户分布尚未验证。"],
        riskFlags: ["possible wash activity"],
      },
      crowdOdds: {
        yesProbabilityBps: 5800,
        source: "Market.getYesOdds" as const,
      },
      verificationCriteria: {
        type: "contract_event_count" as const,
        target: 10,
        dataSource: "AgentPay 支付合约日志",
        formula: "若 resolution deadline 前匹配事件数 >= 10，则 PASS",
      },
      oracleReport: null,
    },
    {
      marketId: 1,
      projectSlug: "zkdocs",
      title: "ZKDocs 会在截止日前合并至少 5 个合格 PR 吗？",
      status: "SETTLED",
      result: "YES",
      trustBoundary: "P0 trusted oracle",
      preferredSide: "YES",
      exposure: "500",
      close: "可领取",
      tone: "positive" as const,
      aiReport: {
        aiPriorLabel: "AI Prior",
        aiPriorProbability: 0.71,
        confidence: "high" as const,
        bullish: ["维护者活动稳定。", "多个贡献者保持活跃。"],
        bearish: ["发布打包流程仍偏手动。"],
        riskFlags: [],
      },
      crowdOdds: {
        yesProbabilityBps: 6900,
        source: "Market.getYesOdds" as const,
      },
      verificationCriteria: {
        type: "github_merged_prs" as const,
        target: 5,
        dataSource: "GitHub merged pull requests",
        formula: "若 resolution deadline 前 merged PR 数 >= 5，则 PASS",
      },
      oracleReport: {
        passed: true,
        settlementRationale: "Observed 7 merged pull requests for demo/zkdocs; target is 5. Result is PASS.",
        observedMetrics: { mergedPrs: 7, target: 5 },
        dataSourceStatus: { github: "available" },
        limitations: ["P0 verifier counts merged PRs only; it does not judge PR quality or production deployment."],
      },
    },
    {
      marketId: 2,
      projectSlug: "airdrop-ai",
      title: "AirdropAI 会在截止日前发出至少 100 个有效使用事件吗？",
      status: "SETTLED",
      result: "NO",
      trustBoundary: "P0 trusted oracle",
      preferredSide: "NO",
      exposure: "0",
      close: "未通过",
      tone: "caution" as const,
      aiReport: {
        aiPriorLabel: "AI Prior",
        aiPriorProbability: 0.43,
        confidence: "low" as const,
        bullish: ["合约已部署。"],
        bearish: ["GitHub 活动偏少。", "使用模式集中。"],
        riskFlags: ["manual review required", "possible wash activity"],
      },
      crowdOdds: {
        yesProbabilityBps: 7200,
        source: "Market.getYesOdds" as const,
      },
      verificationCriteria: {
        type: "contract_event_count" as const,
        target: 100,
        dataSource: "AirdropAI 使用合约日志",
        formula: "若 resolution deadline 前匹配事件数 >= 100，则 PASS",
      },
      oracleReport: {
        passed: false,
        settlementRationale:
          "Observed 18 matching contract events for 0x0000000000000000000000000000000000000000; target is 100. Result is FAIL.",
        observedMetrics: { eventCount: 18, target: 100 },
        dataSourceStatus: { chain: "available" },
        limitations: ["P0 verifier counts matching logs only; it does not yet filter unique wallets or wash activity."],
      },
    },
  ] satisfies DemoMarket[],
  incubation: {
    eyebrow: "赛后孵化",
    title: "发现强项目之后，sponsor 预算继续受控释放",
    description:
      "Scout 市场负责发现信号。孵化金库与市场分离，只会在 proof-of-execution 通过后按固定 tranche 释放 sponsor 预算。",
    selectedProjectLabel: "入选项目",
    selectedProject: "AgentPay",
    executionBadge: "执行徽章：持续交付已验证（mock）",
    statusLabel: "ACTIVE",
    statusTone: "positive" as StatusTone,
    totalBudgetLabel: "Sponsor 总预算",
    releasedBudgetLabel: "已释放预算",
    refundedBudgetLabel: "已退款预算",
    remainingBudgetLabel: "剩余预算",
    milestoneCountLabel: "里程碑数量",
    liveDataLabel: "P0.6 / 实时合约数据",
    fallbackDataLabel: "P0.6 / Demo 回退数据",
    totalBudget: 12_000,
    releasedBudget: 4_000,
    refundedBudget: 0,
    remainingBudget: 8_000,
    milestoneCount: 3,
    note:
      "P0.6 会把 sponsor 预算记账与 scout credits 分开。预算释放走固定里程碑 tranche，不做按秒 streaming，并且仍需授权 reviewer 决定是否提交释放。",
    milestones: [
      {
        id: "M1",
        title: "贡献者 PR tranche",
        summary: "Oracle 已验证 7 个 merged PR，高于 5 个目标，因此释放第一笔 sponsor tranche。",
        releaseAmount: 4_000,
        state: "complete" as const,
        signal: "已释放",
      },
      {
        id: "M2",
        title: "Docs API 集成 tranche",
        summary: "API 集成现在处于活跃复核阶段；下一次 proof-of-execution 通过前不会释放预算。",
        releaseAmount: 4_000,
        state: "current" as const,
        signal: "复核中",
      },
      {
        id: "M3",
        title: "赛后使用量 tranche",
        summary: "最后一笔 tranche 会继续锁定，直到赛后使用和维护活跃度都保持可见。",
        releaseAmount: 4_000,
        state: "upcoming" as const,
        signal: "排队中",
      },
    ],
  },
  agent: {
    eyebrow: "AI Prior 解释",
    recommendation: "最多只放行 350 SCOUT 到 YES",
    confidence: "64%",
    title: "为什么 AI Prior 仍然要求人工审批",
    summary:
      "新的里程碑代码合并后，AI Prior 变得更积极了，但信心还不足以支持“满仓盲批”。这个面板解释了为什么建议额度被限制。",
    factors: [
      {
        label: "里程碑代码已合并",
        value: "过去 24 小时内已有 3 个 PR 合并",
        tone: "positive" as const,
      },
      {
        label: "独立钱包增长",
        value: "当前为 412 个，低于 500 的目标检查点",
        tone: "caution" as const,
      },
      {
        label: "团队透明度",
        value: "状态更新持续发布，公开 demo 分支仍在活跃维护",
        tone: "positive" as const,
      },
    ],
    cautionTitle: "仍需复核的点",
    cautions: [
      "市场只剩 6 小时关闭，过期判断不应该被保留到最后一刻。",
      "项目方钱包仍被限制，但生态关联钱包还需要人工继续审查。",
      "当前 AI Prior confidence 仍低于 70%，所以界面推荐限额下单而不是最大敞口。",
    ],
    nextReview: "建议在下一个 release tag 出现后，或钱包增长显著变化时重新计算。",
  },
  transaction: {
    eyebrow: "交易状态",
    title: "审批队列与交易状态",
    summary:
      "这里展示的是真实操作状态：待复核、等待钱包签名、确认完成，以及失败后的回退处理。",
    processes: [
      {
        title: "批准 market_012 的 350 SCOUT",
        hash: "0x8a24...19f2",
        state: "loading" as const,
        detail: "钱包签名弹窗已打开。在签名完成前，界面应阻止重复提交。",
      },
      {
        title: "领取 season 积分",
        hash: "0xb1fc...09ae",
        state: "success" as const,
        detail: "已在区块 119820 确认，并绑定到 scout_0x72c1。",
      },
      {
        title: "领取 market_009 收益",
        hash: "0xe0a7...b71c",
        state: "error" as const,
        detail: "尝试过早，需等待下一次结算刷新解锁 claim。",
      },
    ],
    buttons: [
      {
        label: "审查订单",
        helper: "默认态，表示钱包弹窗尚未出现。",
        state: "default" as const,
      },
      {
        label: "等待钱包签名",
        helper: "加载态，表示签名器当前处于打开状态。",
        state: "loading" as const,
      },
      {
        label: "审批已记录",
        helper: "成功态，表示 allowance 或交易确认完成。",
        state: "success" as const,
      },
      {
        label: "降低额度后重试",
        helper: "错误态，表示订单未通过风控或额度限制。",
        state: "error" as const,
      },
    ],
  },
  activity: {
    eyebrow: "最近活动",
    title: "操作与链上活动流",
    description: "交易哈希、规则检查和 AI Prior 刷新会汇总到同一条时间流里，让 demo 更像真实操作台。",
    items: [
      {
        time: "00:14",
        title: "Market.takePosition(12, YES, 350)",
        hash: "0x8a24...19f2",
        note: "在 AI 刷新后由钱包 0x72c1...48Ae 提交。",
        tone: "accent" as const,
      },
      {
        time: "00:06",
        title: "AI Prior 刷新 market_012",
        hash: "job_014",
        note: "里程碑代码合并后，AI Prior 从 59% 提升至 64%。",
        tone: "positive" as const,
      },
      {
        time: "23:58",
        title: "创建者钱包阻断检查通过",
        hash: "rule_271",
        note: "项目方钱包仍被排除在该市场交易之外。",
        tone: "positive" as const,
      },
      {
        time: "23:41",
        title: "Claim 窗口预警已触发",
        hash: "market_012",
        note: "在最终结算步骤返回 ready 之前，claim 仍保持锁定。",
        tone: "caution" as const,
      },
    ],
  },
  risk: {
    eyebrow: "风险与权限",
    title: "安全护栏",
    items: [
      {
        label: "风险等级",
        value: "中等",
        detail: "信心在上升，但截止时间压力让临近关闭时的执行更脆弱。",
        tone: "caution" as const,
      },
      {
        label: "权限模型",
        value: "创建者受限",
        detail: "项目方钱包及关联运维钱包不能在该市场下注。",
        tone: "positive" as const,
      },
      {
        label: "审批上限",
        value: "2,000 SCOUT",
        detail: "提议中的 350 SCOUT 远低于单市场积分上限。",
        tone: "positive" as const,
      },
      {
        label: "结算权限",
        value: "仅 Oracle",
        detail: "只有拥有 settlement role 的地址能最终确认 YES / NO 结果并释放 claim。",
        tone: "neutral" as const,
      },
    ],
  },
  flow: {
    eyebrow: "演示流程",
    title: "评委演示路径",
    steps: [
      {
        title: "连接钱包",
        detail: "在执行任何动作前先读取真实地址、网络和原生余额。",
        state: "complete" as const,
      },
      {
        title: "审查 AI 判断",
        detail: "确认为什么订单额度被限制，以及这个市场是否仍值得关注。",
        state: "complete" as const,
      },
      {
        title: "批准积分支出",
        detail: "打开签名器、确认订单额度，并等待交易哈希返回。",
        state: "current" as const,
      },
      {
        title: "追踪结算",
        detail: "在 claim 前持续观察截止时间、权限状态和 oracle 结算进度。",
        state: "upcoming" as const,
      },
      {
        title: "领取结果",
        detail: "完成胜出仓位的 claim，把积分释放回可用余额。",
        state: "upcoming" as const,
      },
    ],
  },
  controls: {
    language: "语言",
    connectWallet: "连接钱包",
    switchNetwork: "切换网络",
    walletReady: "钱包就绪",
    preparing: "正在准备钱包",
    noWallet: "未检测到钱包扩展",
  },
};

export type DemoContent = typeof englishContent;

const localizedContent = {
  en: englishContent,
  zh: chineseContent,
} satisfies Record<Locale, DemoContent>;

export function getDemoContent(locale: Locale) {
  return localizedContent[locale];
}
