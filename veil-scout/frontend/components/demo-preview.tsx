"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ChevronRight, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PendingLoader } from "@/components/ui/pending-loader";
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
    accent: "bg-cyan-300",
    positive: "bg-emerald-300",
    caution: "bg-amber-300",
    critical: "bg-rose-300",
    neutral: "bg-slate-300",
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
  const [orderSize, setOrderSize] = useState("350");
  const [reviewWallet, setReviewWallet] = useState(seededWallet);
  const [ruleSet, setRuleSet] = useState("cap_2k / creator_block");
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(false);

  useEffect(() => {
    if (address) {
      setReviewWallet(address);
    }
  }, [address]);

  const confidenceValue = parsePercent(content.agent.confidence);
  const approvalUtilization = 18;
  const orderAmount = Number.parseInt(orderSize, 10);
  const convictionSeries = [
    { label: "T-24", ai: 54, crowd: 47 },
    { label: "T-18", ai: 56, crowd: 51 },
    { label: "T-12", ai: 59, crowd: 55 },
    { label: "T-06", ai: 61, crowd: 59 },
    { label: "Now", ai: 63, crowd: 61 },
  ];
  const exposureSeries = [
    { label: "YES", value: 900, tone: "accent" as const },
    { label: "NO", value: 500, tone: "neutral" as const },
    { label: locale === "zh" ? "观察" : "Watch", value: 0, tone: "caution" as const },
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
  const orderError =
    !orderSize
      ? locale === "zh"
        ? "请输入审批额度。"
        : "Enter an approval amount."
      : Number.isNaN(orderAmount)
        ? locale === "zh"
          ? "审批额度必须是数字。"
          : "The approval amount must be numeric."
        : orderAmount > 350
          ? locale === "zh"
            ? "当前工单不能超过 agent 建议的 350 SCOUT。"
            : "This ticket cannot exceed the agent's 350 SCOUT recommendation."
          : orderAmount < 25
            ? locale === "zh"
              ? "额度太小，不足以触发有效的演示动作。"
              : "The amount is too small to show a meaningful demo action."
            : undefined;
  const walletError =
    !reviewWallet
      ? locale === "zh"
        ? "请输入审批钱包地址。"
        : "Enter an approval wallet."
      : !reviewWallet.startsWith("0x") || reviewWallet.length < 10
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

  return (
    <AppShell shell={content.shell}>
      <div className="space-y-4">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 2xl:grid-cols-[minmax(0,1.45fr)_370px]"
          id="overview"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <Card className="surface rounded-[20px] border-0">
            <CardHeader className="px-5 pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-slate-300/18 bg-slate-400/12 text-slate-100" variant="outline">
                  {content.hero.eyebrow}
                </Badge>
                <Badge className="border-cyan-300/35 bg-cyan-400/14 text-cyan-50" variant="outline">
                  market_012 seeded
                </Badge>
                <Badge className="border-amber-300/35 bg-amber-400/14 text-amber-50" variant="outline">
                  Manual approval lane
                </Badge>
              </div>
              <CardTitle className="mt-4 max-w-5xl text-[1.7rem] font-bold leading-[1.08] tracking-[-0.02em] text-slate-50 md:text-[2.04rem]">
                {content.hero.title}
              </CardTitle>
              <CardDescription className="max-w-4xl text-slate-300">{content.hero.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-5 pb-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.06fr)_360px]">
                <div className="space-y-4">
                  <div className="terminal-strip rounded-[18px] p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="terminal-label">{locale === "zh" ? "审批简报" : "Approval brief"}</p>
                        <p className="mt-3 text-[1.02rem] font-bold leading-7 text-slate-50">
                          {content.agent.recommendation}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{content.metricCards[2].decision}</p>
                      </div>

                      <div className="grid min-w-[220px] gap-2 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="data-row rounded-[14px] px-3 py-3">
                          <p className="terminal-label">{locale === "zh" ? "人工审批" : "Manual lane"}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-50">{approvalLane.label}</p>
                        </div>
                        <div className="data-row rounded-[14px] px-3 py-3">
                          <p className="terminal-label">{locale === "zh" ? "链路状态" : "Chain lane"}</p>
                          <p className="mt-2 font-mono text-sm font-semibold text-cyan-50">{chainName ?? content.wallet.demoNetwork}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="lg">
                            {content.hero.primaryCta}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="surface max-w-3xl border-slate-300/14 bg-popover/98 text-popover-foreground">
                          <DialogHeader>
                            <DialogTitle>{content.transaction.title}</DialogTitle>
                            <DialogDescription>{content.transaction.summary}</DialogDescription>
                          </DialogHeader>

                          <div className="grid gap-4 md:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
                            <div className="terminal-strip rounded-[16px] p-4">
                              <p className="terminal-label">{content.agent.title}</p>
                              <p className="mt-3 text-lg font-bold text-slate-50">{content.agent.recommendation}</p>
                              <p className="mt-3 text-sm leading-7 text-slate-300">{content.agent.summary}</p>

                              <div className="mt-4 rounded-[14px] border border-white/8 bg-white/[0.02] p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="terminal-label">{locale === "zh" ? "信心" : "Confidence"}</p>
                                  <Badge className="border-cyan-300/35 bg-cyan-400/14 text-cyan-50" variant="outline">
                                    {content.agent.confidence}
                                  </Badge>
                                </div>
                                <Progress
                                  className="mt-4 h-2 bg-white/[0.06] [&_[data-slot=progress-indicator]]:bg-cyan-400"
                                  value={confidenceValue}
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              {content.transaction.processes.map((process) => (
                                <div key={process.hash} className="data-row rounded-[16px] px-4 py-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {process.state === "loading" ? (
                                          <PendingLoader />
                                        ) : (
                                          <span
                                            className={cn(
                                              "status-led",
                                              toneDotClass(
                                                process.state === "success"
                                                  ? "positive"
                                                  : process.state === "error"
                                                    ? "critical"
                                                    : "accent",
                                              ),
                                            )}
                                          />
                                        )}
                                        <p className="text-sm font-semibold text-slate-50">{process.title}</p>
                                      </div>
                                      <p className="mt-2 break-all font-mono text-xs tracking-[0.01em] text-slate-400" translate="no">
                                        {process.hash}
                                      </p>
                                      <p className="mt-3 text-sm leading-6 text-slate-300">{process.detail}</p>
                                    </div>
                                    <Badge className={cn("px-2 py-0.5", actionTone(process.state))} variant="outline">
                                      {process.state}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <DialogFooter className="border-white/8 bg-white/[0.02]">
                            <Button>{content.transaction.buttons[2].label}</Button>
                            <Button variant="outline">{content.transaction.buttons[3].label}</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button size="lg" variant="outline">
                        {content.hero.secondaryCta}
                      </Button>

                      {!isConnected ? <ConnectWalletButton variant="hero" /> : null}
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {content.metricCards.map((card) => (
                      <div key={card.label} className="metric-chip rounded-[16px] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="terminal-label">{card.label}</p>
                          <Badge className={cn("px-2 py-0.5", toneClass(card.tone))} variant="outline">
                            {card.tone}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <p className="font-mono text-[1.24rem] font-bold tracking-tight text-cyan-50 tabular-nums">{card.value}</p>
                          <p className="max-w-[150px] text-right text-xs leading-5 text-slate-400">{card.context}</p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{card.decision}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="data-row rounded-[18px] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="terminal-label">{content.hero.summaryTitle}</p>
                      <Badge className="border-slate-300/18 bg-slate-400/12 text-slate-100" variant="outline">
                        crowd vs agent
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      {content.hero.summary.map((item) => (
                        <div key={item.label} className="flex items-start justify-between gap-3 border-b border-white/6 pb-3 last:border-b-0 last:pb-0">
                          <p className="text-sm text-slate-300">{item.label}</p>
                          <p className="max-w-[56%] text-right font-mono text-sm font-semibold text-slate-50">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="terminal-strip rounded-[18px] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="terminal-label">{locale === "zh" ? "Conviction delta" : "Conviction delta"}</p>
                      <Badge className="border-cyan-300/35 bg-cyan-400/14 text-cyan-50" variant="outline">
                        {content.agent.confidence}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      {convictionSeries.map((item) => (
                        <div key={item.label} className="grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-3">
                          <span className="font-mono text-xs text-slate-400">{item.label}</span>
                          <div className="space-y-2">
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                              <div className="h-full rounded-full bg-cyan-400" style={{ width: `${item.ai}%` }} />
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                              <div className="h-full rounded-full bg-blue-400/70" style={{ width: `${item.crowd}%` }} />
                            </div>
                          </div>
                          <span className="text-right font-mono text-xs text-slate-300">{item.ai}%</span>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-300">{content.hero.note}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="sticky top-4 space-y-4 self-start">
            <Card className="surface rounded-[20px] border-0">
              <CardHeader className="px-5 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="terminal-label">{locale === "zh" ? "审批工单" : "Approval ticket"}</p>
                    <CardTitle className="mt-3 text-[1.08rem] font-semibold text-slate-50">
                      {locale === "zh" ? "在签名前先锁定额度、地址和规则集" : "Lock amount, wallet, and rules before signature"}
                    </CardTitle>
                  </div>
                  <Badge className={cn("px-2 py-0.5", toneClass(approvalLane.tone))} variant="outline">
                    {approvalLane.label}
                  </Badge>
                </div>
                <CardDescription className="text-slate-300">{approvalLane.detail}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 px-5 pb-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="data-row rounded-[14px] px-3 py-3 sm:col-span-2">
                    <p className="terminal-label">{content.wallet.addressLabel}</p>
                    <p className="mt-2 break-all font-mono text-sm text-cyan-50" translate="no">
                      {address ?? content.wallet.waiting}
                    </p>
                  </div>
                  <div className="data-row rounded-[14px] px-3 py-3">
                    <p className="terminal-label">{content.wallet.networkLabel}</p>
                    <p className="mt-2 font-mono text-sm font-semibold text-cyan-50">{chainName ?? content.wallet.demoNetwork}</p>
                  </div>
                  <div className="data-row rounded-[14px] px-3 py-3">
                    <p className="terminal-label">{content.wallet.nativeBalanceLabel}</p>
                    {isConnecting ? (
                      <div className="mt-2 space-y-2">
                        <Skeleton className="h-4 w-24 rounded bg-white/[0.08]" />
                        <Skeleton className="h-3 w-16 rounded bg-white/[0.06]" />
                      </div>
                    ) : (
                      <p className="mt-2 font-mono text-sm text-cyan-50 tabular-nums">{balance ?? "--"}</p>
                    )}
                  </div>
                </div>

                {!isConnected ? <ConnectWalletButton className="w-full" variant="hero" /> : null}

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
                  value={reviewWallet}
                />
                <TextField
                  helper={ruleHelper}
                  label={locale === "zh" ? "规则集合" : "Rule set"}
                  onChange={(event) => setRuleSet(event.target.value)}
                  value={ruleSet}
                />

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

                <div className="space-y-2">
                  {content.transaction.buttons.map((button) => (
                    <div key={button.label} className={cn("rounded-[14px] border px-3 py-3", actionTone(button.state))}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{button.label}</p>
                        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-current/75">{button.state}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-current/80">{button.helper}</p>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-3 border-white/8 px-5 pb-5">
                <Button className="w-full justify-between" disabled={!isConnected || Boolean(orderError || walletError)} size="lg">
                  {locale === "zh" ? "记录人工审批" : "Record manual approval"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button className="w-full justify-between" size="lg" variant="outline">
                  {locale === "zh" ? "只追踪结算，不立即执行" : "Track settlement without executing"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </motion.section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_360px]" id="markets">
          <Card className="surface rounded-[20px] border-0">
            <CardHeader className="px-5 pt-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="terminal-label">{content.position.eyebrow}</p>
                  <CardTitle className="mt-3 text-[1.1rem] text-slate-50">{content.position.title}</CardTitle>
                </div>
                <CardDescription className="max-w-lg text-slate-400">{content.position.description}</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-5 pb-5">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="terminal-strip rounded-[16px] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-slate-300/18 bg-slate-400/12 text-slate-100" variant="outline">
                      {locale === "zh" ? "市场行使用 demo 数据" : "Seeded market rows"}
                    </Badge>
                    <Badge className="border-cyan-300/35 bg-cyan-400/14 text-cyan-50" variant="outline">
                      {locale === "zh" ? "钱包与链路状态为实时" : "Wallet and chain state live"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {locale === "zh"
                      ? "市场簿展示的是种子数据，但审批额度、链路和钱包状态依旧来自当前会话。"
                      : "The book uses seeded market data, while approval amount, chain lane, and wallet session stay tied to the current browser session."}
                  </p>
                </div>

                <div className="data-row rounded-[16px] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="terminal-label">{locale === "zh" ? "敞口分布" : "Exposure split"}</p>
                    <Badge className="border-slate-300/18 bg-slate-400/12 text-slate-100" variant="outline">
                      {content.wallet.demoExposure}
                    </Badge>
                  </div>

                  <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/[0.04]">
                    {exposureSeries.map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          item.tone === "accent" && "bg-cyan-400",
                          item.tone === "neutral" && "bg-blue-400/75",
                          item.tone === "caution" && "bg-amber-400/75",
                        )}
                        style={{ width: `${(item.value / totalExposure) * 100}%` }}
                      />
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    {exposureSeries.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 border-b border-white/6 pb-2 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("status-led", toneDotClass(item.tone))} />
                          <span className="text-sm text-slate-300">{item.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-cyan-50 tabular-nums">{item.value} SCOUT</p>
                          <p className="font-mono text-xs text-slate-400 tabular-nums">{Math.round((item.value / totalExposure) * 100)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[16px] border border-white/8 bg-background/55">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/8 hover:bg-transparent">
                      {content.position.headers.map((header) => (
                        <TableHead key={header} className="px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {content.position.rows.map((row) => (
                      <TableRow key={row.market} className="border-white/6 hover:bg-white/[0.02]">
                        <TableCell className="px-4 py-4">
                          <p className="font-semibold text-slate-50">{row.market}</p>
                          <p className="mt-1 text-xs text-slate-400">{row.aiView}</p>
                        </TableCell>
                        <TableCell className="px-4 py-4 font-mono text-slate-100">{row.side}</TableCell>
                        <TableCell className="px-4 py-4 font-mono text-cyan-50 tabular-nums">{row.exposure}</TableCell>
                        <TableCell className="px-4 py-4 font-mono text-slate-100 tabular-nums">{row.avgOdds}</TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge className={cn("px-2 py-0.5", toneClass(row.tone))} variant="outline">
                            {row.settlement}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 font-mono text-slate-200 tabular-nums">{row.close}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="surface rounded-[20px] border-0">
              <CardHeader className="px-5 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="terminal-label">{content.wallet.eyebrow}</p>
                    <CardTitle className="mt-3 text-[1.08rem] text-slate-50">{content.wallet.title}</CardTitle>
                  </div>
                  <Badge className={cn("px-2 py-0.5", isConnected ? toneClass("positive") : toneClass("neutral"))} variant="outline">
                    {isConnected ? content.wallet.connected : content.wallet.disconnected}
                  </Badge>
                </div>
                <CardDescription className="text-slate-400">{content.wallet.disconnectedHint}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 px-5 pb-5">
                <div className="grid gap-2">
                  <div className="data-row rounded-[14px] px-3 py-3">
                    <p className="terminal-label">{content.wallet.addressLabel}</p>
                    <p className="mt-2 break-all font-mono text-sm text-cyan-50" translate="no">
                      {address ?? content.wallet.waiting}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="data-row rounded-[14px] px-3 py-3">
                      <p className="terminal-label">{content.wallet.networkLabel}</p>
                      <p className="mt-2 font-mono text-sm font-semibold text-cyan-50">{chainName ?? content.wallet.demoNetwork}</p>
                    </div>
                    <div className="data-row rounded-[14px] px-3 py-3">
                      <p className="terminal-label">{content.wallet.nativeBalanceLabel}</p>
                      {isConnecting ? (
                        <div className="mt-2 space-y-2">
                          <Skeleton className="h-4 w-24 rounded bg-white/[0.08]" />
                          <Skeleton className="h-3 w-16 rounded bg-white/[0.06]" />
                        </div>
                      ) : (
                        <p className="mt-2 font-mono text-sm text-cyan-50 tabular-nums">{balance ?? "--"}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="data-row rounded-[14px] px-3 py-3">
                      <p className="terminal-label">{content.wallet.scoutIdLabel}</p>
                      <p className="mt-2 font-mono text-sm text-cyan-50">{content.wallet.demoScoutId}</p>
                    </div>
                    <div className="data-row rounded-[14px] px-3 py-3">
                      <p className="terminal-label">{content.wallet.seasonCreditsLabel}</p>
                      <p className="mt-2 font-mono text-sm text-cyan-50 tabular-nums">{content.wallet.demoCredits}</p>
                    </div>
                  </div>
                </div>

                <div className="terminal-strip rounded-[14px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="terminal-label">{content.wallet.exposureLabel}</p>
                    <p className="font-mono text-sm text-cyan-50 tabular-nums">{content.wallet.demoExposure}</p>
                  </div>
                  <Progress
                    className="mt-4 h-2 bg-white/[0.06] [&_[data-slot=progress-indicator]]:bg-emerald-400"
                    value={approvalUtilization}
                  />
                  <p className="mt-3 text-sm leading-6 text-slate-300">{content.wallet.exposureNote}</p>
                </div>

                <div className="space-y-2">
                  {content.wallet.checks.map((item) => {
                    const tone: StatusTone = isConnected ? "positive" : "neutral";
                    const body = tone === "positive" ? item.positive : item.neutral;

                    return (
                      <div key={item.label} className="data-row rounded-[14px] px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("status-led", toneDotClass(tone))} />
                          <p className="terminal-label">{item.label}</p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
                      </div>
                    );
                  })}
                </div>

                {error ? (
                  <p className="rounded-[14px] border border-amber-300/35 bg-amber-400/14 px-4 py-3 text-sm text-amber-50">
                    {error}
                  </p>
                ) : null}
              </CardContent>

              <CardFooter className="border-white/8 px-5 pb-5">
                <ConnectWalletButton className="w-full justify-center" />
              </CardFooter>
            </Card>

            <Card className="surface rounded-[20px] border-0">
              <CardHeader className="px-5 pt-5">
                <p className="terminal-label">{content.risk.eyebrow}</p>
                <CardTitle className="mt-3 text-[1.08rem] text-slate-50">{content.risk.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {locale === "zh"
                    ? "风险预算、权限模型和执行上限必须一起判断。"
                    : "Risk budget, permission model, and execution caps need to be read together."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 px-5 pb-5">
                {content.risk.items.map((item) => (
                  <div key={item.label} className="data-row rounded-[14px] px-4 py-3">
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

                <div className="rounded-[14px] border border-amber-300/35 bg-amber-400/14 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                    <p className="text-sm leading-7 text-amber-50">{content.metricCards[1].decision}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_360px]" id="approvals">
          <div className="space-y-4">
            <Card className="surface rounded-[20px] border-0">
              <CardHeader className="px-5 pt-5">
                <p className="terminal-label">{content.transaction.eyebrow}</p>
                <CardTitle className="mt-3 text-[1.1rem] text-slate-50">{content.transaction.title}</CardTitle>
                <CardDescription className="text-slate-400">{content.transaction.summary}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 px-5 pb-5">
                {content.transaction.processes.map((process) => (
                  <div key={process.hash} className="data-row rounded-[16px] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {process.state === "loading" ? (
                            <PendingLoader />
                          ) : (
                            <span
                              className={cn(
                                "status-led",
                                toneDotClass(
                                  process.state === "success"
                                    ? "positive"
                                    : process.state === "error"
                                      ? "critical"
                                      : "accent",
                                ),
                              )}
                            />
                          )}
                          <p className="text-sm font-semibold text-slate-50">{process.title}</p>
                        </div>
                        <p className="mt-2 break-all font-mono text-xs tracking-[0.01em] text-slate-400" translate="no">
                          {process.hash}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{process.detail}</p>
                      </div>
                      <Badge className={cn("px-2 py-0.5", actionTone(process.state))} variant="outline">
                        {process.state}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="surface rounded-[20px] border-0" id="activity">
              <CardHeader className="px-5 pt-5">
                <p className="terminal-label">{content.activity.eyebrow}</p>
                <CardTitle className="mt-3 text-[1.08rem] text-slate-50">{content.activity.title}</CardTitle>
                <CardDescription className="text-slate-400">{content.activity.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 px-5 pb-5">
                {content.activity.items.map((item) => (
                  <div key={`${item.time}-${item.hash}`} className="data-row rounded-[16px] px-4 py-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs tracking-[0.14em] text-slate-400 tabular-nums">{item.time}</span>
                          <Badge className={cn("px-2 py-0.5", toneClass(item.tone))} variant="outline">
                            {item.tone}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-50">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.note}</p>
                      </div>
                      <p className="break-all font-mono text-xs tracking-[0.01em] text-slate-400" translate="no">
                        {item.hash}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="surface rounded-[20px] border-0">
              <CardHeader className="px-5 pt-5">
                <p className="terminal-label">{content.agent.eyebrow}</p>
                <CardTitle className="mt-3 text-[1.08rem] text-slate-50">{content.agent.recommendation}</CardTitle>
                <CardDescription className="text-slate-400">{content.agent.title}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 px-5 pb-5">
                <div className="terminal-strip rounded-[14px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="terminal-label">{locale === "zh" ? "Agent 信心" : "Agent confidence"}</span>
                    <Badge className="border-cyan-300/35 bg-cyan-400/14 text-cyan-50" variant="outline">
                      {content.agent.confidence}
                    </Badge>
                  </div>
                  <Progress
                    className="mt-4 h-2 bg-white/[0.06] [&_[data-slot=progress-indicator]]:bg-cyan-400"
                    value={confidenceValue}
                  />
                  <p className="mt-4 text-sm leading-7 text-slate-300">{content.agent.summary}</p>
                </div>

                {content.agent.factors.map((factor) => (
                  <div key={factor.label} className="data-row rounded-[14px] px-4 py-3">
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

                <div className="rounded-[14px] border border-amber-300/35 bg-amber-400/14 p-4">
                  <p className="terminal-label text-amber-100">{content.agent.cautionTitle}</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-50">
                    {content.agent.cautions.map((item) => (
                      <li key={item} className="flex gap-2">
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="surface rounded-[20px] border-0" id="settlement">
              <CardHeader className="px-5 pt-5">
                <p className="terminal-label">{content.flow.eyebrow}</p>
                <CardTitle className="mt-3 text-[1.08rem] text-slate-50">{content.flow.title}</CardTitle>
                <CardDescription className="text-slate-400">{content.agent.nextReview}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 px-5 pb-5">
                {content.flow.steps.map((step, index) => (
                  <div key={step.title} className="data-row rounded-[14px] px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border text-xs font-semibold text-white",
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
                        <p className="text-sm font-semibold text-slate-50">{step.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
