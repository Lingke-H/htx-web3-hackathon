"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronRight, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { CommandLog } from "@/components/sci-fi/command-log";
import { HologramCard } from "@/components/sci-fi/hologram-card";
import { MarketConstellation } from "@/components/sci-fi/market-constellation";
import { MiniSparkline } from "@/components/sci-fi/mini-sparkline";
import { OracleCore } from "@/components/sci-fi/oracle-core";
import { SignalStrip } from "@/components/sci-fi/signal-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PolicyToggle } from "@/components/ui/policy-toggle";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TextField } from "@/components/ui/text-field";
import { useAppState } from "@/lib/app-state";
import type { ActionState, StatusTone } from "@/lib/demo-data";
import { useWalletState } from "@/lib/wallet-state";
import { cn } from "@/lib/utils";

function toneClass(tone: StatusTone) {
  return {
    accent: "border-cyan-300/35 bg-cyan-400/14 text-cyan-50",
    positive: "border-emerald-300/35 bg-emerald-400/14 text-emerald-50",
    caution: "border-amber-300/35 bg-amber-400/14 text-amber-50",
    critical: "border-rose-300/35 bg-rose-400/14 text-rose-50",
    neutral: "border-slate-300/18 bg-slate-400/12 text-slate-100",
  }[tone];
}

function toneDotClass(tone: StatusTone) {
  return {
    accent: "bg-cyan-300 shadow-[0_0_18px_rgba(82,230,255,0.7)]",
    positive: "bg-emerald-300 shadow-[0_0_18px_rgba(69,255,184,0.7)]",
    caution: "bg-amber-300 shadow-[0_0_18px_rgba(255,204,77,0.7)]",
    critical: "bg-rose-300 shadow-[0_0_18px_rgba(255,101,140,0.7)]",
    neutral: "bg-slate-300 shadow-[0_0_14px_rgba(203,213,225,0.42)]",
  }[tone];
}

function actionTone(state: ActionState) {
  return {
    default: "border-cyan-300/35 bg-cyan-400/14 text-cyan-50",
    loading: "border-sky-300/30 bg-sky-400/12 text-sky-50",
    success: "border-emerald-300/35 bg-emerald-400/14 text-emerald-50",
    error: "border-rose-300/35 bg-rose-400/14 text-rose-50",
  }[state];
}

function parsePercent(value: string) {
  return Number.parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
}

const seededWallet = "0x72c14b0a6f884ef564ab91dc1f928c09b7d9f11e";

export function DemoPreview() {
  const { content, locale } = useAppState();
  const { address, balance, chainName, error, isConnected, isConnecting } = useWalletState();
  const prefersReducedMotion = useReducedMotion();
  const [orderSize, setOrderSize] = useState("350");
  const [reviewWallet, setReviewWallet] = useState<string | null>(null);
  const [ruleSet, setRuleSet] = useState("cap_2k / creator_block");
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(false);

  const copy =
    locale === "zh"
      ? {
          discoveryConsole: "AI 辅助 Scout 发现控制台",
          demoMarker: "P0 Demo / Mock Data",
          aiPrior: "AI 先验",
          crowdOdds: "群体赔率",
          oracleSettlement: "预言机结算",
          nonTransferableCredits: "非转让积分",
          creatorBlock: "创建者屏蔽",
          manualLane: "人工审批通道",
          approvalBrief: "审批简报",
          operatorSnapshot: "协议快照",
          convictionDelta: "信心差分",
          exposureSplit: "敞口分布",
          missionTags: "任务信号",
          riskRailConsole: "Risk Rail Console",
          txSimulation: "Transaction Simulation / Oracle Execution",
          commandLog: "链上命令日志",
          seededRows: "市场表仍为种子 demo 数据",
          liveWallet: "钱包与链路状态保持实时",
          creditsLoop: "Credit-based prediction loop",
          oracleOnline: "预言机在线",
          discoveryMap: "Scout Discovery Map",
          riskReview: "风险复核",
          systemBrief: "主控舱",
          metricsBoard: "信用与赔率面板",
          noExecution: "只追踪结算，不立即执行",
          activityFeed: "活动命令流",
          flowTitle: "评委演示路径",
          aiPriorConfidence: "AI Prior 信心",
          oracleReport: "Oracle Report",
          verificationCriteria: "验证标准",
          settlementRationale: "结算理由",
          observedMetrics: "观测指标",
          dataSourceStatus: "数据源状态",
          limitations: "限制说明",
          noOracleReport: "该市场仍在交易中，oracle report 会在 resolution deadline 后生成。",
        }
      : {
          discoveryConsole: "AI-assisted scout discovery console",
          demoMarker: "P0 Demo / Mock Data",
          aiPrior: "AI Prior",
          crowdOdds: "Crowd odds",
          oracleSettlement: "Oracle settlement",
          nonTransferableCredits: "Non-transferable credits",
          creatorBlock: "Creator block",
          manualLane: "Manual approval lane",
          approvalBrief: "Approval brief",
          operatorSnapshot: "Protocol snapshot",
          convictionDelta: "Conviction delta",
          exposureSplit: "Exposure split",
          missionTags: "Mission tags",
          riskRailConsole: "Risk Rail Console",
          txSimulation: "Transaction Simulation / Oracle Execution",
          commandLog: "Command log",
          seededRows: "Market table remains seeded demo data",
          liveWallet: "Wallet and chain state stay live",
          creditsLoop: "Credit-based prediction loop",
          oracleOnline: "Oracle online",
          discoveryMap: "Scout discovery map",
          riskReview: "Risk review",
          systemBrief: "Main bridge",
          metricsBoard: "Credits and odds board",
          noExecution: "Track settlement without executing",
          activityFeed: "Activity command stream",
          flowTitle: "Judge demo path",
          aiPriorConfidence: "AI Prior confidence",
          oracleReport: "Oracle Report",
          verificationCriteria: "Verification Criteria",
          settlementRationale: "Settlement Rationale",
          observedMetrics: "Observed Metrics",
          dataSourceStatus: "Data Source Status",
          limitations: "Limitations",
          noOracleReport: "This market is still trading; the oracle report appears after the resolution deadline.",
        };

  const primaryMarket = content.demoMarkets[0];
  const settledMarket = content.demoMarkets.find((market) => market.oracleReport) ?? primaryMarket;
  const primaryAiPrior = Math.round(primaryMarket.aiReport.aiPriorProbability * 100);
  const primaryCrowdOdds = Math.round(primaryMarket.crowdOdds.yesProbabilityBps / 100);
  const confidenceValue = primaryAiPrior;
  const approvalUtilization = 18;
  const orderAmount = Number.parseInt(orderSize, 10);
  const reviewWalletValue = reviewWallet ?? address ?? seededWallet;
  const supportedLane = chainName ? /Base Sepolia|Anvil/i.test(chainName) : true;
  const convictionSeries = [
    { label: "T-24", ai: 54, crowd: 47 },
    { label: "T-18", ai: 56, crowd: 51 },
    { label: "T-12", ai: 59, crowd: 55 },
    { label: "T-06", ai: 61, crowd: 59 },
    { label: "Now", ai: primaryAiPrior, crowd: primaryCrowdOdds },
  ];
  const exposureSeries = content.demoMarkets.map((market) => ({
    label: market.preferredSide,
    value: Number.parseInt(market.exposure, 10) || 0,
    tone: market.tone,
  }));
  const metricTraces = [
    [46, 50, 56, 61, 66, 70],
    [20, 26, 31, 29, 34, 37],
    [16, 24, 21, 33, 38, 44],
    [32, 30, 28, 36, 39, 43],
  ];
  const totalExposure = exposureSeries.reduce((sum, item) => sum + item.value, 0) || 1;

  const amountHelper =
    locale === "zh"
      ? "工单额度会和单市场上限、AI 建议和钱包状态一起核对。"
      : "The ticket amount is checked against the per-market cap, AI recommendation, and wallet state.";
  const walletHelper =
    locale === "zh"
      ? "这里应当是发起审批的钱包或已绑定的 scout 执行地址。"
      : "This should be the approval wallet or the bound scout execution address.";
  const ruleHelper =
    locale === "zh"
      ? "规则集定义了 creator block、额度上限和 claim 流程。"
      : "The rule set defines creator blocking, approval caps, and the claim path.";
  const orderError = (() => {
    if (!orderSize) {
      return locale === "zh" ? "请输入审批额度。" : "Enter an approval amount.";
    }
    if (Number.isNaN(orderAmount)) {
      return locale === "zh" ? "审批额度必须是数字。" : "The approval amount must be numeric.";
    }
    if (orderAmount > 350) {
      return locale === "zh"
        ? "当前工单不能超过 AI Prior 建议的 350 SCOUT。"
        : "This ticket cannot exceed the AI Prior's 350 SCOUT recommendation.";
    }
    if (orderAmount < 25) {
      return locale === "zh"
        ? "额度太小，不足以触发有效的演示动作。"
        : "The amount is too small to show a meaningful demo action.";
    }
    return undefined;
  })();
  const walletError =
    !reviewWalletValue
      ? locale === "zh"
        ? "请输入审批钱包地址。"
        : "Enter an approval wallet."
      : !reviewWalletValue.startsWith("0x") || reviewWalletValue.length < 10
        ? locale === "zh"
          ? "请输入有效的 EVM 钱包地址。"
          : "Enter a valid EVM wallet address."
        : undefined;

  const approvalLane: { detail: string; label: string; tone: StatusTone } = !isConnected
    ? {
        label: locale === "zh" ? "等待连接钱包" : "Wallet connection required",
        detail:
          locale === "zh"
            ? "连接钱包后，这个工单才能真正提交到审批队列。"
            : "Connect a wallet before this ticket can move into the live approval queue.",
        tone: "neutral",
      }
    : orderError || walletError
      ? {
          label: locale === "zh" ? "工单需要修正" : "Ticket needs changes",
          detail:
            locale === "zh"
              ? "先修正额度或钱包地址，再记录人工审批。"
              : "Fix the amount or approval wallet before recording manual approval.",
          tone: "critical",
        }
      : {
          label: locale === "zh" ? "可记录人工审批" : "Ready for manual approval",
          detail:
            locale === "zh"
              ? "额度、地址和规则集都已对齐，可以打开签名步骤。"
              : "Amount, wallet, and rule set are aligned. You can open the signature step.",
          tone: "positive",
        };

  const heroSignals = [
    { label: copy.aiPrior, detail: `${primaryAiPrior}%`, tone: "accent" as const },
    { label: copy.crowdOdds, detail: `${primaryCrowdOdds}%`, tone: "positive" as const },
    { label: copy.oracleSettlement, detail: primaryMarket.trustBoundary, tone: "neutral" as const },
    { label: copy.nonTransferableCredits, detail: content.wallet.demoCredits, tone: "positive" as const },
    { label: copy.manualLane, detail: approvalLane.label, tone: approvalLane.tone },
  ];

  const marketRows = content.demoMarkets.map((market) => ({
    market: market.title,
    side: market.result ?? market.preferredSide,
    exposure: market.exposure,
    crowdOdds: `${Math.round(market.crowdOdds.yesProbabilityBps / 100)}%`,
    aiView: `${market.aiReport.aiPriorLabel} ${Math.round(market.aiReport.aiPriorProbability * 100)}%`,
    settlement: market.status === "SETTLED" ? `SETTLED ${market.result}` : market.status,
    close: market.close,
    tone: market.tone,
  }));

  const constellationItems = content.demoMarkets.map((market) => ({
    label: market.title,
    sublabel: market.result ?? market.preferredSide,
    tone: market.tone,
    value: `${Math.round(market.crowdOdds.yesProbabilityBps / 100)}% / ${market.status}`,
  }));
  const oracleReport = settledMarket.oracleReport;

  const transactionLog = content.transaction.processes.map((process) => ({
    id: process.hash,
    title: process.title,
    detail: process.detail,
    hash: process.hash,
    state: process.state,
    badgeLabel:
      process.state === "loading"
        ? locale === "zh"
          ? "处理中"
          : "pending"
        : process.state === "success"
          ? locale === "zh"
            ? "已确认"
            : "confirmed"
          : process.state === "error"
            ? locale === "zh"
              ? "异常"
              : "retry"
            : locale === "zh"
              ? "待审"
              : "review",
  }));

  const activityLog = content.activity.items.map((item) => ({
    id: `${item.time}-${item.hash}`,
    title: item.title,
    detail: item.note,
    hash: item.hash,
    timestamp: item.time,
    tone: item.tone,
    badgeLabel: item.tone,
  }));

  return (
    <AppShell shell={content.shell}>
      <div className="space-y-5 pb-8">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_380px]"
          id="overview"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.28, ease: "easeOut" }}
        >
          <div className="space-y-5">
            <HologramCard className="rounded-[34px] p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/12 bg-white/[0.04] text-slate-100" variant="outline">
                  {content.hero.eyebrow}
                </Badge>
                <Badge className="border-cyan-300/30 bg-cyan-400/12 text-cyan-50" variant="outline">
                  {copy.demoMarker}
                </Badge>
                <Badge className="border-amber-300/30 bg-amber-400/12 text-amber-50" variant="outline">
                  {copy.creatorBlock}
                </Badge>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_420px]">
                <div className="space-y-5">
                  <div>
                    <div className="mission-chip inline-flex rounded-full px-3 py-1">{copy.discoveryConsole}</div>
                    <h2 className="finance-heading mt-4 max-w-4xl text-[1.92rem] font-semibold leading-[1.02] text-white md:text-[2.48rem]">
                      <span className="glow-text">{content.hero.title}</span>
                    </h2>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{content.hero.description}</p>
                  </div>

                  <SignalStrip items={heroSignals} />

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {content.hero.summary.map((item) => (
                      <div key={item.label} className="data-row rounded-[22px] px-4 py-4">
                        <p className="terminal-label">{item.label}</p>
                        <p className="mt-3 font-mono text-sm tracking-[0.08em] text-cyan-100">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="terminal-console rounded-[28px] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="terminal-label">{copy.approvalBrief}</p>
                        <p className="mt-3 text-[1.08rem] font-semibold leading-7 text-white">
                          {content.agent.recommendation}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{content.metricCards[2].decision}</p>
                      </div>

                      <div className="grid min-w-[220px] gap-2 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="data-row rounded-[18px] px-4 py-3">
                          <p className="terminal-label">{copy.manualLane}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-50">{approvalLane.label}</p>
                        </div>
                        <div className="data-row rounded-[18px] px-4 py-3">
                          <p className="terminal-label">{copy.systemBrief}</p>
                          <p className="mt-2 font-mono text-sm text-cyan-100">{chainName ?? content.wallet.demoNetwork}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="lg">
                            {content.hero.primaryCta}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl border-cyan-300/16 bg-[rgba(5,10,22,0.96)] p-0 text-popover-foreground shadow-[0_28px_80px_rgba(0,0,0,0.6)]">
                          <div className="scanline-overlay rounded-[22px]">
                            <DialogHeader className="border-b border-white/8 px-6 py-5">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="border-cyan-300/30 bg-cyan-400/12 text-cyan-50" variant="outline">
                                  {copy.txSimulation}
                                </Badge>
                                <Badge className={cn("px-2 py-0.5", toneClass(approvalLane.tone))} variant="outline">
                                  {approvalLane.label}
                                </Badge>
                              </div>
                              <DialogTitle className="mt-4 text-xl text-white">{content.transaction.title}</DialogTitle>
                              <DialogDescription className="text-slate-300">{content.transaction.summary}</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-5 px-6 py-6 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                              <div className="space-y-4">
                                <div className="terminal-console rounded-[24px] p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="terminal-label">{copy.aiPrior}</p>
                                    <Badge className="border-cyan-300/30 bg-cyan-400/12 text-cyan-50" variant="outline">
                                      {primaryAiPrior}%
                                    </Badge>
                                  </div>
                                  <p className="mt-4 text-lg font-semibold text-white">{content.agent.recommendation}</p>
                                  <p className="mt-3 text-sm leading-7 text-slate-300">{content.agent.summary}</p>
                                  <Progress
                                    className="mt-4 h-2 bg-white/[0.06] [&_[data-slot=progress-indicator]]:bg-cyan-400"
                                    value={confidenceValue}
                                  />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  {content.transaction.buttons.map((button) => (
                                    <div key={button.label} className={cn("rounded-[18px] border px-4 py-4", actionTone(button.state))}>
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold">{button.label}</p>
                                        <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-current/78">
                                          {button.state}
                                        </span>
                                      </div>
                                      <p className="mt-3 text-sm leading-6 text-current/80">{button.helper}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <CommandLog items={transactionLog} />
                              </div>
                            </div>

                            <DialogFooter className="border-t border-white/8 bg-slate-950/55 px-6 py-4">
                              <Button>{content.transaction.buttons[2].label}</Button>
                              <Button variant="outline">{content.transaction.buttons[3].label}</Button>
                            </DialogFooter>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button asChild size="lg" variant="outline">
                        <a href="#settlement">
                          {content.hero.secondaryCta}
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </Button>

                      {!isConnected ? <ConnectWalletButton variant="hero" /> : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                    {content.metricCards.map((card, index) => (
                      <motion.div
                        key={card.label}
                        animate={{ opacity: 1, y: 0 }}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                        transition={prefersReducedMotion ? undefined : { delay: 0.05 * index, duration: 0.22, ease: "easeOut" }}
                      >
                        <HologramCard className="surface-interactive rounded-[24px] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className={cn("status-led h-2.5 w-2.5", toneDotClass(card.tone))} />
                              <p className="terminal-label">{card.label}</p>
                            </div>
                            <Badge className={cn("px-2 py-0.5", toneClass(card.tone))} variant="outline">
                              {card.tone}
                            </Badge>
                          </div>

                          <p className="mt-4 font-mono text-[1.42rem] font-semibold tracking-[0.04em] text-cyan-100">
                            {card.value}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-300">{card.context}</p>
                          <MiniSparkline className="mt-4" points={metricTraces[index]} tone={card.tone} />
                          <p className="mt-3 text-xs leading-5 text-slate-400">{card.decision}</p>
                        </HologramCard>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <HologramCard className="rounded-[30px] p-4">
                    <OracleCore confidence={confidenceValue} label={copy.aiPrior} status={copy.oracleOnline} />
                  </HologramCard>

                  <HologramCard className="rounded-[30px] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="terminal-label">{copy.discoveryMap}</p>
                      <Badge className="border-white/12 bg-white/[0.04] text-slate-100" variant="outline">
                        {copy.operatorSnapshot}
                      </Badge>
                    </div>
                    <MarketConstellation className="mt-4" items={constellationItems} />
                    <p className="mt-4 text-sm leading-7 text-slate-300">{content.hero.note}</p>
                  </HologramCard>

                  <HologramCard className="rounded-[30px] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="terminal-label">{copy.convictionDelta}</p>
                      <Badge className="border-cyan-300/30 bg-cyan-400/12 text-cyan-50" variant="outline">
                        {primaryAiPrior}%
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      {convictionSeries.map((item) => (
                        <div key={item.label} className="grid grid-cols-[48px_minmax(0,1fr)_52px] items-center gap-3">
                          <span className="font-mono text-xs text-slate-400">{item.label}</span>
                          <div className="space-y-2">
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                              <div className="h-full rounded-full bg-cyan-400" style={{ width: `${item.ai}%` }} />
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                              <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${item.crowd}%` }} />
                            </div>
                          </div>
                          <span className="text-right font-mono text-xs text-slate-200">{item.ai}%</span>
                        </div>
                      ))}
                    </div>
                  </HologramCard>
                </div>
              </div>
            </HologramCard>
          </div>

          <div className="sticky top-4 self-start">
            <HologramCard className="rounded-[32px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="terminal-label">{copy.riskRailConsole}</p>
                  <h3 className="mt-3 text-[1.08rem] font-semibold text-white">
                    {locale === "zh" ? "在签名前先锁定额度、地址和规则集" : "Lock amount, wallet, and rules before signature"}
                  </h3>
                </div>
                <Badge className={cn("px-2 py-0.5", toneClass(approvalLane.tone))} variant="outline">
                  {approvalLane.label}
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-300">{approvalLane.detail}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="data-row rounded-[18px] px-4 py-3 sm:col-span-2">
                  <p className="terminal-label">{content.wallet.addressLabel}</p>
                  <p className="mt-2 break-all font-mono text-sm text-cyan-100" translate="no">
                    {address ?? content.wallet.waiting}
                  </p>
                </div>
                <div className="data-row rounded-[18px] px-4 py-3">
                  <p className="terminal-label">{content.wallet.networkLabel}</p>
                  <p className="mt-2 font-mono text-sm text-cyan-100">{chainName ?? content.wallet.demoNetwork}</p>
                </div>
                <div className="data-row rounded-[18px] px-4 py-3">
                  <p className="terminal-label">{content.wallet.nativeBalanceLabel}</p>
                  {isConnecting ? (
                    <div className="mt-2 space-y-2">
                      <Skeleton className="h-4 w-24 rounded bg-white/[0.08]" />
                      <Skeleton className="h-3 w-16 rounded bg-white/[0.06]" />
                    </div>
                  ) : (
                    <p className="mt-2 font-mono text-sm text-cyan-100">{balance ?? "--"}</p>
                  )}
                </div>
              </div>

              {!isConnected ? <ConnectWalletButton className="mt-4 w-full" variant="hero" /> : null}

              <div className="mt-4 space-y-4">
                <TextField
                  error={orderError}
                  helper={amountHelper}
                  inputMode="numeric"
                  label={locale === "zh" ? "审批额度" : "Approval amount"}
                  onChange={(event) => setOrderSize(event.target.value.replace(/[^0-9]/g, ""))}
                  suffix="SCOUT"
                  value={orderSize}
                />
                <TextField
                  error={walletError}
                  helper={walletHelper}
                  label={locale === "zh" ? "审批钱包" : "Approval wallet"}
                  onChange={(event) => setReviewWallet(event.target.value)}
                  value={reviewWalletValue}
                />
                <TextField
                  helper={ruleHelper}
                  label={locale === "zh" ? "规则集合" : "Rule set"}
                  onChange={(event) => setRuleSet(event.target.value)}
                  value={ruleSet}
                />
              </div>

              <div className="mt-4">
                <PolicyToggle
                  checked={autoApproveLowRisk}
                  description={
                    locale === "zh"
                      ? "低风险动作可以自动放行，但超过额度或碰到 creator block 仍然强制人工复核。"
                      : "Low-risk actions may pass automatically, but anything above the cap or touching creator blocking still requires manual review."
                  }
                  label={locale === "zh" ? "低风险自动放行" : "Auto-approve low risk"}
                  offLabel={locale === "zh" ? "手动优先" : "Manual first"}
                  onCheckedChange={setAutoApproveLowRisk}
                  onLabel={locale === "zh" ? "自动补充" : "Auto top-up"}
                />
              </div>

              <div className="mt-4 space-y-2">
                {content.transaction.buttons.map((button) => (
                  <div key={button.label} className={cn("rounded-[18px] border px-4 py-4", actionTone(button.state))}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{button.label}</p>
                      <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-current/78">{button.state}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-current/80">{button.helper}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                <Button className="w-full justify-between" disabled={!isConnected || Boolean(orderError || walletError)} size="lg">
                  {locale === "zh" ? "记录人工审批" : "Record manual approval"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button className="w-full justify-between" size="lg" variant="outline">
                  {copy.noExecution}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </HologramCard>
          </div>
        </motion.section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_360px]" id="markets">
          <div className="space-y-5">
            <HologramCard className="rounded-[32px] p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="terminal-label">{content.position.eyebrow}</p>
                  <h3 className="mt-3 text-[1.14rem] font-semibold text-white">{content.position.title}</h3>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate-300">{content.position.description}</p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="terminal-console rounded-[24px] p-4">
                    <SignalStrip
                      items={[
                        { label: copy.seededRows, tone: "neutral" },
                        { label: copy.liveWallet, tone: "accent" },
                        { label: copy.creditsLoop, tone: "positive" },
                      ]}
                      size="sm"
                    />
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {locale === "zh"
                        ? "市场簿展示的是种子数据，但审批额度、链路和钱包状态依旧来自当前会话。"
                        : "The book uses seeded market data, while approval amount, chain lane, and wallet session stay tied to the current browser session."}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-white/8 bg-slate-950/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/8 hover:bg-transparent">
                          {content.position.headers.map((header) => (
                            <TableHead
                              key={header}
                              className="px-4 py-3 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-slate-500"
                            >
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketRows.map((row) => (
                          <TableRow
                            key={row.market}
                            className="border-white/6 transition-colors hover:bg-cyan-400/[0.06]"
                          >
                            <TableCell className="px-4 py-4">
                              <p className="font-semibold text-slate-50">{row.market}</p>
                              <p className="mt-1 text-xs text-slate-400">{row.aiView}</p>
                            </TableCell>
                            <TableCell className="px-4 py-4 font-mono text-slate-100">{row.side}</TableCell>
                            <TableCell className="px-4 py-4 font-mono text-cyan-100">{row.exposure}</TableCell>
                            <TableCell className="px-4 py-4 font-mono text-slate-100">{row.crowdOdds}</TableCell>
                            <TableCell className="px-4 py-4">
                              <Badge className={cn("px-2 py-0.5", toneClass(row.tone))} variant="outline">
                                {row.settlement}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-4 font-mono text-slate-300">{row.close}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="data-row rounded-[24px] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="terminal-label">{copy.exposureSplit}</p>
                      <Badge className="border-white/12 bg-white/[0.04] text-slate-100" variant="outline">
                        {content.wallet.demoExposure}
                      </Badge>
                    </div>

                    <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/[0.05]">
                      {exposureSeries.map((item) => (
                        <div
                          key={item.label}
                          className={cn(
                            item.tone === "accent" && "bg-cyan-400",
                            item.tone === "neutral" && "bg-blue-400/70",
                            item.tone === "caution" && "bg-amber-400/80",
                          )}
                          style={{ width: `${(item.value / totalExposure) * 100}%` }}
                        />
                      ))}
                    </div>

                    <div className="mt-4 space-y-2">
                      {exposureSeries.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3 border-b border-white/6 pb-2 last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("status-led h-2.5 w-2.5", toneDotClass(item.tone))} />
                            <span className="text-sm text-slate-300">{item.label}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm text-cyan-100">{item.value} SCOUT</p>
                            <p className="font-mono text-xs text-slate-400">{Math.round((item.value / totalExposure) * 100)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="data-row rounded-[24px] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="terminal-label">{copy.missionTags}</p>
                      <Badge className="border-cyan-300/30 bg-cyan-400/12 text-cyan-50" variant="outline">
                        {copy.metricsBoard}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-3">
                      {content.hero.highlights.map((item) => (
                        <div key={item} className="flex gap-3">
                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                          <p className="text-sm leading-6 text-slate-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </HologramCard>
          </div>

          <div className="space-y-5">
            <HologramCard className="rounded-[32px] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="terminal-label">{content.wallet.eyebrow}</p>
                  <h3 className="mt-3 text-[1.08rem] font-semibold text-white">{content.wallet.title}</h3>
                </div>
                <Badge className={cn("px-2 py-0.5", isConnected ? toneClass("positive") : toneClass("neutral"))} variant="outline">
                  {isConnected ? content.wallet.connected : content.wallet.disconnected}
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-300">{content.wallet.disconnectedHint}</p>

              <div className="mt-4 space-y-3">
                <div className="data-row rounded-[18px] px-4 py-3">
                  <p className="terminal-label">{content.wallet.addressLabel}</p>
                  <p className="mt-2 break-all font-mono text-sm text-cyan-100" translate="no">
                    {address ?? content.wallet.waiting}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="data-row rounded-[18px] px-4 py-3">
                    <p className="terminal-label">{content.wallet.networkLabel}</p>
                    <p className="mt-2 font-mono text-sm text-cyan-100">{chainName ?? content.wallet.demoNetwork}</p>
                  </div>
                  <div className="data-row rounded-[18px] px-4 py-3">
                    <p className="terminal-label">{content.wallet.nativeBalanceLabel}</p>
                    {isConnecting ? (
                      <div className="mt-2 space-y-2">
                        <Skeleton className="h-4 w-24 rounded bg-white/[0.08]" />
                        <Skeleton className="h-3 w-16 rounded bg-white/[0.06]" />
                      </div>
                    ) : (
                      <p className="mt-2 font-mono text-sm text-cyan-100">{balance ?? "--"}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="data-row rounded-[18px] px-4 py-3">
                    <p className="terminal-label">{content.wallet.scoutIdLabel}</p>
                    <p className="mt-2 font-mono text-sm text-cyan-100">{content.wallet.demoScoutId}</p>
                  </div>
                  <div className="data-row rounded-[18px] px-4 py-3">
                    <p className="terminal-label">{content.wallet.seasonCreditsLabel}</p>
                    <p className="mt-2 font-mono text-sm text-cyan-100">{content.wallet.demoCredits}</p>
                  </div>
                </div>

                <div className="terminal-console rounded-[20px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="terminal-label">{content.wallet.exposureLabel}</p>
                    <p className="font-mono text-sm text-cyan-100">{content.wallet.demoExposure}</p>
                  </div>
                  <Progress
                    className="mt-4 h-2 bg-white/[0.06] [&_[data-slot=progress-indicator]]:bg-emerald-400"
                    value={approvalUtilization}
                  />
                  <p className="mt-3 text-sm leading-6 text-slate-300">{content.wallet.exposureNote}</p>
                </div>

                {content.wallet.checks.map((item, index) => {
                  let tone: StatusTone = "neutral";
                  let body = item.neutral;

                  if (isConnected) {
                    if (index === 1 && !supportedLane && "caution" in item && item.caution) {
                      tone = "caution";
                      body = item.caution;
                    } else {
                      tone = "positive";
                      body = item.positive;
                    }
                  }

                  return (
                    <div key={item.label} className="data-row rounded-[18px] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("status-led h-2.5 w-2.5", toneDotClass(tone))} />
                        <p className="terminal-label">{item.label}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
                    </div>
                  );
                })}

                {error ? (
                  <p className="rounded-[18px] border border-amber-300/35 bg-amber-400/14 px-4 py-3 text-sm text-amber-50">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 border-t border-white/8 pt-4">
                <ConnectWalletButton className="w-full justify-center" />
              </div>
            </HologramCard>

            <HologramCard className="rounded-[32px] p-5">
              <p className="terminal-label">{content.risk.eyebrow}</p>
              <h3 className="mt-3 text-[1.08rem] font-semibold text-white">{content.risk.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {locale === "zh"
                  ? "风险预算、权限模型和执行上限必须一起判断。"
                  : "Risk budget, permission model, and execution caps need to be read together."}
              </p>

              <div className="mt-4 space-y-3">
                {content.risk.items.map((item) => (
                  <div key={item.label} className="data-row rounded-[18px] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="terminal-label">{item.label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
                      </div>
                      <Badge className={cn("px-2 py-0.5", toneClass(item.tone))} variant="outline">
                        {item.value}
                      </Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-[18px] border border-amber-300/35 bg-amber-400/14 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                    <p className="text-sm leading-7 text-amber-50">{content.metricCards[1].decision}</p>
                  </div>
                </div>
              </div>
            </HologramCard>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_360px]" id="approvals">
          <div className="space-y-5">
            <HologramCard className="rounded-[32px] p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="terminal-label">{content.transaction.eyebrow}</p>
                  <h3 className="mt-3 text-[1.1rem] font-semibold text-white">{content.transaction.title}</h3>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate-300">{content.transaction.summary}</p>
              </div>
              <CommandLog className="mt-5" items={transactionLog} />
            </HologramCard>

            <HologramCard className="rounded-[32px] p-5" id="activity">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="terminal-label">{content.activity.eyebrow}</p>
                  <h3 className="mt-3 text-[1.08rem] font-semibold text-white">{content.activity.title}</h3>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate-300">{content.activity.description}</p>
              </div>
              <CommandLog className="mt-5" items={activityLog} />
            </HologramCard>
          </div>

          <div className="space-y-5">
            <HologramCard className="rounded-[32px] p-5">
              <p className="terminal-label">{content.agent.eyebrow}</p>
              <h3 className="mt-3 text-[1.08rem] font-semibold text-white">{content.agent.recommendation}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{content.agent.title}</p>

              <div className="mt-4 space-y-4">
                <div className="terminal-console rounded-[20px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="terminal-label">{copy.aiPriorConfidence}</span>
                    <Badge className="border-cyan-300/30 bg-cyan-400/12 text-cyan-50" variant="outline">
                      {primaryAiPrior}%
                    </Badge>
                  </div>
                  <Progress
                    className="mt-4 h-2 bg-white/[0.06] [&_[data-slot=progress-indicator]]:bg-cyan-400"
                    value={confidenceValue}
                  />
                  <p className="mt-4 text-sm leading-7 text-slate-300">{content.agent.summary}</p>
                </div>

                {content.agent.factors.map((factor) => (
                  <div key={factor.label} className="data-row rounded-[18px] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="terminal-label">{factor.label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{factor.value}</p>
                      </div>
                      <Badge className={cn("px-2 py-0.5", toneClass(factor.tone))} variant="outline">
                        {factor.tone}
                      </Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-[18px] border border-amber-300/35 bg-amber-400/14 p-4">
                  <p className="terminal-label text-amber-100">{content.agent.cautionTitle}</p>
                  <div className="mt-3 space-y-2">
                    {content.agent.cautions.map((item) => (
                      <div key={item} className="flex gap-2 text-sm leading-7 text-amber-50">
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </HologramCard>

            <HologramCard className="rounded-[32px] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="terminal-label">{copy.oracleReport}</p>
                  <h3 className="mt-3 text-[1.08rem] font-semibold text-white">{settledMarket.title}</h3>
                </div>
                <Badge className="border-cyan-300/30 bg-cyan-400/12 text-cyan-50" variant="outline">
                  {settledMarket.trustBoundary}
                </Badge>
              </div>

              <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.025] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("px-2 py-0.5", toneClass(settledMarket.tone))} variant="outline">
                    {oracleReport ? (oracleReport.passed ? "PASS" : "FAIL") : "PENDING"}
                  </Badge>
                  <Badge className="border-slate-300/18 bg-slate-400/12 text-slate-100" variant="outline">
                    {settledMarket.verificationCriteria.type}
                  </Badge>
                  <Badge className="border-emerald-300/30 bg-emerald-400/12 text-emerald-50" variant="outline">
                    {settledMarket.verificationCriteria.dataSource}
                  </Badge>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {oracleReport?.settlementRationale ?? copy.noOracleReport}
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="data-row rounded-[18px] px-4 py-3">
                  <p className="terminal-label">{copy.verificationCriteria}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{settledMarket.verificationCriteria.formula}</p>
                </div>
                <div className="data-row rounded-[18px] px-4 py-3">
                  <p className="terminal-label">{copy.observedMetrics}</p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(oracleReport?.observedMetrics ?? { status: "pending" }).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3 font-mono text-xs text-slate-300">
                        <span>{key}</span>
                        <span className="text-cyan-100">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="data-row rounded-[18px] px-4 py-3">
                  <p className="terminal-label">{copy.dataSourceStatus}</p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(oracleReport?.dataSourceStatus ?? { oracle: "pending" }).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3 font-mono text-xs text-slate-300">
                        <span>{key}</span>
                        <span className="text-cyan-100">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="data-row rounded-[18px] px-4 py-3">
                  <p className="terminal-label">{copy.limitations}</p>
                  <div className="mt-2 space-y-2">
                    {(oracleReport?.limitations ?? [copy.noOracleReport]).map((item) => (
                      <p key={item} className="text-sm leading-6 text-slate-300">{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </HologramCard>

            <HologramCard className="rounded-[32px] p-5" id="settlement">
              <p className="terminal-label">{content.flow.eyebrow}</p>
              <h3 className="mt-3 text-[1.08rem] font-semibold text-white">{content.flow.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{content.agent.nextReview}</p>

              <div className="mt-4 space-y-3">
                {content.flow.steps.map((step, index) => (
                  <div key={step.title} className="data-row rounded-[18px] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border font-mono text-xs",
                          step.state === "complete"
                            ? toneClass("positive")
                            : step.state === "current"
                              ? toneClass("accent")
                              : toneClass("neutral"),
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{step.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </HologramCard>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
