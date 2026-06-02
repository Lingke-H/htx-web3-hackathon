export type StatusTone = "accent" | "positive" | "caution" | "critical" | "neutral";
export type ActionState = "default" | "loading" | "success" | "error";
export type StepState = "complete" | "current" | "upcoming";
export type Locale = "en" | "zh";

export const localeOptions = [
  { value: "en" as const, shortLabel: "EN", label: "English" },
  { value: "zh" as const, shortLabel: "中", label: "中文" },
];

const englishContent = {
  shell: {
    brandLabel: "HTX Web3 Hackathon",
    brandName: "VEIL SCOUT",
    brandDescription: "Milestone market desk for wallet review, approvals, and settlement.",
    navigation: [
      { label: "Overview", value: "overview", active: true },
      { label: "Markets", value: "markets", active: false },
      { label: "Approvals", value: "approvals", active: false },
      { label: "Settlement", value: "settlement", active: false },
    ],
    scopeLabel: "Demo scope",
    scopeDescription:
      "Live wallet state is real. Market cards below remain labeled as seeded demo data from the local contract flow.",
    overviewLabel: "Control room",
    overviewTitle: "Operator console for wallet-backed market approvals",
    updatedAt: "Updated 00:14 UTC",
    badges: [
      { label: "Seeded demo data", tone: "neutral" as const },
      { label: "ABI ready", tone: "positive" as const },
      { label: "Wallet-aware", tone: "accent" as const },
    ],
  },
  hero: {
    eyebrow: "Milestone market desk",
    title: "Approve market actions only after wallet state, chain lane, and risk controls all line up.",
    description:
      "This screen is built like an approval desk, not a landing page: connect a wallet, inspect agent conviction, check permission rails, and manually release only the actions that should execute onchain.",
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
    headers: ["Market", "Side", "Exposure", "Avg odds", "Settlement", "Close"],
    rows: [
      {
        market: "HTX Agent SDK Integration",
        side: "YES",
        exposure: "900",
        avgOdds: "61%",
        aiView: "Constructive",
        settlement: "Trading",
        close: "06h 18m",
        tone: "accent" as const,
      },
      {
        market: "zkPass Milestone Audit",
        side: "NO",
        exposure: "500",
        avgOdds: "43%",
        aiView: "Schedule risk",
        settlement: "Trading",
        close: "19h 05m",
        tone: "caution" as const,
      },
      {
        market: "VeilPay Wallet Growth Sprint",
        side: "Watch",
        exposure: "0",
        avgOdds: "74%",
        aiView: "Strong YES",
        settlement: "Settlement soon",
        close: "02h 43m",
        tone: "positive" as const,
      },
    ],
  },
  agent: {
    eyebrow: "Agent explanation",
    recommendation: "Release at most 350 SCOUT into YES",
    confidence: "63%",
    title: "Why the agent is asking for manual approval",
    summary:
      "The AI view improved after new merged work landed, but confidence is not high enough to justify a blind full-size order. This panel explains why the suggested action is capped.",
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
      "Transaction hashes, rule checks, and agent refreshes appear in one stream so the demo feels operational.",
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
        title: "AI recomputed odds for market_012",
        hash: "job_014",
        note: "Confidence moved from 59% to 63% after merged milestone work.",
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
        detail: "Confidence is improving, but deadline pressure makes last-minute execution more fragile.",
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
    brandDescription: "一个用于里程碑预测市场、钱包审批和结算追踪的控制台。",
    navigation: [
      { label: "总览", value: "overview", active: true },
      { label: "市场", value: "markets", active: false },
      { label: "审批", value: "approvals", active: false },
      { label: "结算", value: "settlement", active: false },
    ],
    scopeLabel: "演示范围",
    scopeDescription:
      "钱包地址、网络和原生余额是真实读取的；下方市场数据仍明确标注为基于本地合约流程的 demo 数据。",
    overviewLabel: "控制台",
    overviewTitle: "面向钱包审批的市场操作控制台",
    updatedAt: "更新时间 00:14 UTC",
    badges: [
      { label: "种子 demo 数据", tone: "neutral" as const },
      { label: "ABI 已就绪", tone: "positive" as const },
      { label: "支持钱包感知", tone: "accent" as const },
    ],
  },
  hero: {
    eyebrow: "里程碑市场工作台",
    title: "只有当钱包状态、链路和风控条件都对齐时，才放行市场动作。",
    description:
      "这个界面按审批工作台来设计，而不是宣传页：先连接钱包，再核对 agent 判断、权限护栏和结算路径，最后只手动放行那些应该上链的动作。",
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
    headers: ["市场", "方向", "敞口", "平均赔率", "结算状态", "关闭时间"],
    rows: [
      {
        market: "HTX Agent SDK Integration",
        side: "YES",
        exposure: "900",
        avgOdds: "61%",
        aiView: "偏正向",
        settlement: "交易中",
        close: "06h 18m",
        tone: "accent" as const,
      },
      {
        market: "zkPass Milestone Audit",
        side: "NO",
        exposure: "500",
        avgOdds: "43%",
        aiView: "进度风险",
        settlement: "交易中",
        close: "19h 05m",
        tone: "caution" as const,
      },
      {
        market: "VeilPay Wallet Growth Sprint",
        side: "观察",
        exposure: "0",
        avgOdds: "74%",
        aiView: "强 YES",
        settlement: "即将结算",
        close: "02h 43m",
        tone: "positive" as const,
      },
    ],
  },
  agent: {
    eyebrow: "Agent 解释",
    recommendation: "最多只放行 350 SCOUT 到 YES",
    confidence: "63%",
    title: "为什么 agent 仍然要求人工审批",
    summary:
      "新的里程碑代码合并后，AI 判断变得更积极了，但信心还不足以支持“满仓盲批”。这个面板解释了为什么建议额度被限制。",
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
      "当前信心仍低于 70%，所以界面推荐限额下单而不是最大敞口。",
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
    description: "交易哈希、规则检查和 agent 刷新会汇总到同一条时间流里，让 demo 更像真实操作台。",
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
        title: "AI 重新计算 market_012 赔率",
        hash: "job_014",
        note: "里程碑代码合并后，信心从 59% 提升至 63%。",
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
