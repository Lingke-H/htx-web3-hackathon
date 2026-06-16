"use client";

import type { ReactNode } from "react";
import { Activity, ChevronRight, LayoutDashboard, Menu, ShieldCheck, Wallet } from "lucide-react";
import { HologramCard } from "@/components/sci-fi/hologram-card";
import { SignalStrip } from "@/components/sci-fi/signal-strip";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAppState } from "@/lib/app-state";
import type { DemoContent, StatusTone } from "@/lib/demo-data";
import { useWalletState } from "@/lib/wallet-state";
import { cn } from "@/lib/utils";

const navIcons = [LayoutDashboard, Wallet, ShieldCheck, Activity];

function toneClass(tone: StatusTone) {
  return {
    accent: "border-cyan-300/35 bg-cyan-400/14 text-cyan-50",
    positive: "border-emerald-300/35 bg-emerald-400/14 text-emerald-50",
    caution: "border-amber-300/35 bg-amber-400/14 text-amber-50",
    critical: "border-rose-300/35 bg-rose-400/14 text-rose-50",
    neutral: "border-slate-300/18 bg-slate-400/10 text-slate-100",
  }[tone];
}

export function AppShell({
  children,
  shell,
}: {
  children: ReactNode;
  shell: DemoContent["shell"];
}) {
  const { locale } = useAppState();
  const { chainName, hasProvider, isConnected } = useWalletState();

  const copy =
    locale === "zh"
      ? {
          controlPlane: "Season 0 Mission Control",
          deskMode: "评委演示模式",
          navLabel: "任务导航",
          nodeStatus: "节点状态",
          routeHealth: "执行链路",
          routeHealthBody:
            "实时钱包状态会同步进入审批链路，种子市场与 mock 数据会持续标识，避免评委误把 demo 数值当成真实盘口。",
          oracleOnline: "预言机在线",
          marketSeeded: "MARKET_012 已注种",
          manualLane: "人工审批通道",
          walletAware: hasProvider ? "钱包感知" : "未检测到浏览器钱包",
          walletState: isConnected ? "钱包已连接" : "等待钱包连接",
          routeState: chainName ?? "HTX Demo Net",
          routeNote: "Risk rails armed",
          readiness: "Oracle 在线",
          credits: "Scout 积分活跃",
          demoNet: "HTX Demo Net",
          manualReview: "人工复核常开",
          mobileNavTitle: "Mission Control",
          mobileNavBody: "切换分区时保留同一套钱包、审批和双语状态。",
        }
      : {
          controlPlane: "Season 0 Mission Control",
          deskMode: "Judge-facing desk mode",
          navLabel: "Mission lanes",
          nodeStatus: "Node status",
          routeHealth: "Route health",
          routeHealthBody:
            "Live wallet state stays stitched into approvals, while seeded market numbers remain visibly labeled so judges can separate mock data from execution-ready rails.",
          oracleOnline: "Oracle online",
          marketSeeded: "MARKET_012 seeded",
          manualLane: "Manual approval lane",
          walletAware: hasProvider ? "Wallet aware" : "No browser wallet",
          walletState: isConnected ? "Wallet connected" : "Awaiting wallet link",
          routeState: chainName ?? "HTX Demo Net",
          routeNote: "Risk rails armed",
          readiness: "Oracle online",
          credits: "Scout credits active",
          demoNet: "HTX Demo Net",
          manualReview: "Manual review armed",
          mobileNavTitle: "Mission Control",
          mobileNavBody: "Navigation preserves the same wallet, approval, and locale state across sections.",
        };

  const topStrip = [
    { label: copy.oracleOnline, tone: "positive" as const },
    { label: copy.marketSeeded, tone: "accent" as const },
    { label: copy.walletAware, tone: hasProvider ? ("accent" as const) : ("neutral" as const) },
    { label: copy.manualLane, tone: "caution" as const },
  ];

  const sidebarStatus = [
    { label: copy.readiness, value: "AI Oracle Node", tone: "positive" as const },
    { label: copy.credits, value: "7,540 SCOUT", tone: "accent" as const },
    { label: copy.demoNet, value: copy.routeState, tone: "neutral" as const },
    { label: copy.manualReview, value: copy.routeNote, tone: "caution" as const },
  ];

  return (
    <div className="cyber-grid mx-auto grid min-h-screen max-w-[1700px] overflow-x-hidden gap-4 px-3 py-3 xl:grid-cols-[280px_minmax(0,1fr)] xl:px-5 xl:py-5">
      <aside className="hidden xl:block">
        <div className="sticky top-4 space-y-4">
          <HologramCard className="rounded-[30px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="terminal-label text-cyan-100/78">{shell.brandLabel}</p>
                <div className="mt-4 display-font glow-text text-[1.55rem] leading-[1.05] text-white">
                  VEIL
                  <br />
                  SCOUT
                </div>
              </div>
              <span className="status-led h-3 w-3 bg-emerald-300 shadow-[0_0_22px_rgba(69,255,184,0.78)]" />
            </div>

            <div className="mt-5 space-y-3">
              <div className="mission-chip inline-flex rounded-full px-3 py-1">AI ORACLE NODE</div>
              <div className="mission-chip inline-flex rounded-full px-3 py-1">SEASON 0 CONTROL</div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-300">{shell.brandDescription}</p>
            <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">{shell.updatedAt}</p>
          </HologramCard>

          <HologramCard className="rounded-[28px] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="terminal-label text-slate-300">{copy.navLabel}</p>
              <Badge className="border-cyan-300/28 bg-cyan-400/10 text-cyan-50" variant="outline">
                {copy.deskMode}
              </Badge>
            </div>

            <nav className="mt-4 space-y-2">
              {shell.navigation.map((item, index) => {
                const Icon = navIcons[index] ?? ChevronRight;

                return (
                  <a
                    key={item.value}
                    className={cn(
                      "group relative flex items-center gap-3 overflow-hidden rounded-[20px] border px-4 py-3 transition-all duration-200",
                      item.active
                        ? "border-cyan-300/40 bg-cyan-400/[0.12] shadow-[inset_0_0_0_1px_rgba(82,230,255,0.08),0_0_24px_rgba(82,230,255,0.08)]"
                        : "border-white/6 bg-slate-950/28 hover:border-cyan-300/26 hover:bg-cyan-400/[0.07]",
                    )}
                    href={`#${item.value}`}
                  >
                    <span className="absolute inset-x-3 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(82,230,255,0.6),transparent)] opacity-65" />
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-[14px] border bg-slate-950/60",
                        item.active ? "border-cyan-300/45 text-cyan-100" : "border-white/8 text-slate-300",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 font-mono text-[0.64rem] uppercase tracking-[0.2em] text-slate-500">
                        lane_{index + 1}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-cyan-100" />
                  </a>
                );
              })}
            </nav>
          </HologramCard>

          <HologramCard className="rounded-[28px] p-4">
            <p className="terminal-label text-slate-300">{copy.nodeStatus}</p>
            <div className="mt-4 space-y-3">
              {sidebarStatus.map((item) => (
                <div key={item.label} className="data-row rounded-[18px] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="terminal-label">{item.label}</p>
                    <Badge className={cn("px-2 py-0.5", toneClass(item.tone))} variant="outline">
                      {item.value}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </HologramCard>

          <HologramCard className="rounded-[28px] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="terminal-label text-slate-300">{copy.routeHealth}</p>
              <Badge className="border-emerald-300/32 bg-emerald-400/12 text-emerald-50" variant="outline">
                live
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{copy.routeHealthBody}</p>
            <SignalStrip
              className="mt-4"
              items={[
                { label: copy.walletState, tone: isConnected ? "positive" : "neutral" },
                { label: copy.routeState, tone: "accent", pulse: false },
              ]}
              size="sm"
            />
          </HologramCard>
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        <header className="surface rounded-[30px] px-4 py-4 md:px-5">
          <SignalStrip items={topStrip} size="sm" />

          <div className="mt-4 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <div className="xl:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        aria-label="Open navigation menu"
                        className="border-cyan-300/24 bg-slate-950/55 text-cyan-50"
                        size="icon-lg"
                        variant="outline"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="border-white/8 bg-[rgba(5,10,22,0.94)] text-white sm:max-w-[360px]" side="left">
                      <SheetHeader className="px-0 pt-8">
                        <SheetTitle className="display-font text-lg text-white">{copy.mobileNavTitle}</SheetTitle>
                        <SheetDescription className="text-slate-300">{copy.mobileNavBody}</SheetDescription>
                      </SheetHeader>

                      <div className="mt-6 space-y-3 px-4">
                        {shell.navigation.map((item, index) => {
                          const Icon = navIcons[index] ?? ChevronRight;

                          return (
                            <a
                              key={item.value}
                              className="terminal-strip flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm text-slate-100"
                              href={`#${item.value}`}
                            >
                              <Icon className="h-4 w-4 text-cyan-200" />
                              {item.label}
                            </a>
                          );
                        })}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="min-w-0">
                  <div className="mission-chip inline-flex rounded-full px-3 py-1">{copy.controlPlane}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="terminal-label text-slate-300">{shell.brandLabel}</span>
                    <Badge className="border-white/12 bg-white/[0.04] text-slate-100" variant="outline">
                      {shell.updatedAt}
                    </Badge>
                  </div>

                  <div className="mt-4 display-font glow-text text-[1.26rem] leading-none text-white md:text-[1.55rem]">
                    {shell.brandName}
                  </div>
                  <h1 className="finance-heading mt-3 max-w-4xl text-[1.35rem] font-semibold leading-[1.06] text-slate-50 md:text-[1.82rem]">
                    {shell.overviewTitle}
                  </h1>
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">{shell.scopeDescription}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 2xl:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {shell.badges.map((badge) => (
                  <Badge key={badge.label} className={cn("px-2.5 py-1", toneClass(badge.tone))} variant="outline">
                    {badge.label}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <LanguageSwitcher />
                <ConnectWalletButton />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="terminal-strip flex flex-wrap items-center gap-2 rounded-[18px] px-4 py-3">
              <span className="terminal-label">{copy.deskMode}</span>
              <Badge className="border-cyan-300/28 bg-cyan-400/10 text-cyan-50" variant="outline">
                {copy.marketSeeded}
              </Badge>
              <Badge className="border-amber-300/30 bg-amber-400/10 text-amber-50" variant="outline">
                {copy.manualLane}
              </Badge>
              <Badge className="border-emerald-300/28 bg-emerald-400/10 text-emerald-50" variant="outline">
                {copy.walletState}
              </Badge>
            </div>

            <div className="data-row flex flex-wrap items-center gap-3 rounded-[18px] px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-slate-300">
              <span>{shell.scopeLabel}</span>
              <span className="status-led h-2.5 w-2.5 bg-cyan-300 shadow-[0_0_16px_rgba(82,230,255,0.72)]" />
              <span>{copy.routeState}</span>
              <span className="status-led h-2.5 w-2.5 bg-amber-300 shadow-[0_0_16px_rgba(255,204,77,0.72)]" />
              <span>{copy.routeNote}</span>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
