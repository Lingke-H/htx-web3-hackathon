import type { ReactNode } from "react";
import { Activity, LayoutDashboard, Menu, ShieldCheck, Wallet } from "lucide-react";
import type { DemoContent, StatusTone } from "@/lib/demo-data";
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
import { cn } from "@/lib/utils";

const navIcons = [LayoutDashboard, Wallet, ShieldCheck, Activity];

function toneClass(tone: StatusTone) {
  return {
    accent: "border-sky-200/42 bg-sky-300/18 text-sky-50",
    positive: "border-emerald-200/42 bg-emerald-300/18 text-emerald-50",
    caution: "border-amber-200/46 bg-amber-300/18 text-amber-50",
    critical: "border-red-300/42 bg-red-400/18 text-red-50",
    neutral: "border-slate-100/20 bg-slate-100/10 text-slate-100",
  }[tone];
}

export function AppShell({
  children,
  shell,
}: {
  children: ReactNode;
  shell: DemoContent["shell"];
}) {
  return (
    <div className="mx-auto grid min-h-screen max-w-[1680px] gap-4 px-3 py-3 xl:grid-cols-[250px_minmax(0,1fr)] xl:px-4 xl:py-4">
      <aside className="surface hidden rounded-[18px] p-4 xl:flex xl:flex-col">
        <div className="rounded-[15px] border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="status-label text-slate-300">
              {shell.brandLabel}
            </span>
            <span className="status-led bg-emerald-300" />
          </div>

          <div className="mt-4 rounded-[14px] border border-sky-200/16 bg-[linear-gradient(180deg,rgba(45,75,105,0.74),rgba(25,45,70,0.82))] p-4">
            <p className="text-[1rem] font-bold tracking-[0.12em] text-slate-50">{shell.brandName}</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{shell.brandDescription}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="terminal-label px-1">Workspaces</p>
          <nav className="mt-3 space-y-2">
            {shell.navigation.map((item, index) => {
              const Icon = navIcons[index];

              return (
                <a
                  key={item.value}
                  className={cn(
                    "group/nav flex items-center gap-3 rounded-[13px] border px-3 py-3 transition-colors",
                    item.active
                      ? "border-sky-200/34 bg-sky-300/[0.14] text-white"
                      : "border-transparent text-slate-200 hover:border-slate-100/16 hover:bg-white/[0.055] hover:text-slate-50",
                  )}
                  href={`#${item.value}`}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-[11px] border text-xs font-medium",
                      item.active
                        ? "border-sky-200/34 bg-sky-300/[0.18] text-sky-50"
                        : "border-slate-100/14 bg-white/[0.04] text-slate-300",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-[0.68rem] uppercase tracking-[0.1em] text-current/65">
                      Section {index + 1}
                    </p>
                  </div>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="mt-4 grid gap-2">
          <div className="terminal-strip rounded-[14px] px-3 py-3">
            <p className="terminal-label">{shell.scopeLabel}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{shell.scopeDescription}</p>
          </div>

          <div className="data-row rounded-[14px] px-3 py-3">
            <p className="terminal-label">Session</p>
            <p className="mt-2 text-sm font-semibold text-slate-50">{shell.overviewLabel}</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.1em] text-slate-300">{shell.updatedAt}</p>
          </div>
        </div>

        <div className="terminal-strip mt-auto rounded-[16px] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="terminal-label">Route health</p>
            <Badge className="border-emerald-200/42 bg-emerald-300/18 text-emerald-50" variant="outline">
              live
            </Badge>
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
            <p>Wallet session active checks appear inline with approvals.</p>
            <p>Seeded market rows remain labeled so judges can separate mock data from live wallet reads.</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-3">
        <header className="surface rounded-[18px] px-4 py-4 md:px-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <div className="xl:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button aria-label="Open navigation menu" className="border-slate-100/18 bg-white/[0.055] text-sky-50" size="icon-lg" variant="outline">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="surface border-white/8 sm:max-w-[340px]" side="left">
                      <SheetHeader className="px-0 pt-8">
                        <SheetTitle className="font-bold tracking-[0.12em] text-slate-50">{shell.brandName}</SheetTitle>
                        <SheetDescription className="text-slate-300">{shell.brandDescription}</SheetDescription>
                      </SheetHeader>

                      <div className="space-y-2 px-4">
                        {shell.navigation.map((item, index) => {
                          const Icon = navIcons[index];

                          return (
                            <a
                              key={item.value}
                              className="terminal-strip flex items-center gap-3 rounded-[13px] px-3 py-3 text-sm text-slate-100"
                              href={`#${item.value}`}
                            >
                              <Icon className="h-4 w-4 text-sky-200" />
                              {item.label}
                            </a>
                          );
                        })}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="terminal-label">{shell.brandLabel}</span>
	                    <Badge className="border-slate-100/20 bg-slate-100/10 text-slate-100" variant="outline">
                      {shell.updatedAt}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <h1 className="text-[1rem] font-bold tracking-[0.14em] text-slate-50">{shell.brandName}</h1>
                    <span className="text-sm text-slate-300">{shell.brandDescription}</span>
                  </div>

                  <h2 className="finance-heading mt-4 max-w-4xl text-[1.34rem] font-bold leading-[1.12] text-slate-50 md:text-[1.72rem]">
                    {shell.overviewTitle}
                  </h2>
                  <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200">{shell.scopeDescription}</p>
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
              <div className="terminal-strip flex flex-wrap items-center gap-2 rounded-[13px] px-3 py-3">
                <span className="terminal-label">Desk mode</span>
              <Badge className="border-sky-200/42 bg-sky-300/18 text-sky-50" variant="outline">
                Approval lane active
              </Badge>
              <Badge className="border-amber-200/46 bg-amber-300/18 text-amber-50" variant="outline">
                Manual review required
              </Badge>
              <Badge className="border-slate-100/20 bg-slate-100/10 text-slate-100" variant="outline">
                {shell.overviewLabel}
              </Badge>
            </div>

            <div className="data-row flex flex-wrap items-center gap-3 rounded-[13px] px-3 py-3 font-mono text-[0.69rem] uppercase tracking-[0.1em] text-slate-200">
              <span>{shell.scopeLabel}</span>
              <span className="status-led bg-cyan-300" />
              <span>Wallet aware</span>
              <span className="status-led bg-amber-300" />
              <span>Seeded markets</span>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
