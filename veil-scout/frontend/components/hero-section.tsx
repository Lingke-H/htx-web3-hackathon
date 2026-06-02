"use client";

import { ArrowRight } from "lucide-react";
import type { DemoContent } from "@/lib/demo-data";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { useWalletState } from "@/lib/wallet-state";

export function HeroSection({ hero }: { hero: DemoContent["hero"] }) {
  const { isConnected } = useWalletState();

  return (
    <section className="panel relative rounded-[28px] px-5 py-5 sm:px-6 sm:py-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <div>
          <p className="section-kicker">{hero.eyebrow}</p>
          <h3 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-[2.6rem]">
            {hero.title}
          </h3>
          <p className="mt-4 max-w-2xl text-[0.98rem] leading-8 text-slate-300">
            {hero.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {isConnected ? (
              <button
                className="inline-flex items-center gap-2 rounded-[14px] border border-cyan-400/30 bg-cyan-400/12 px-4 py-2.5 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-400/18"
                type="button"
              >
                {hero.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <ConnectWalletButton variant="hero" />
            )}
            <button
              className="rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.06]"
              type="button"
            >
              {hero.secondaryCta}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {hero.highlights.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-slate-900/85 px-3 py-1.5 text-xs text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-white/8 bg-slate-950/78 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{hero.summaryTitle}</p>
          <dl className="mt-4 space-y-3">
            {hero.summary.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 border-b border-white/6 pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="text-sm text-slate-400">{item.label}</dt>
                <dd className="text-right text-sm font-medium text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-[16px] border border-amber-400/15 bg-amber-400/8 px-3 py-2.5 text-sm leading-6 text-amber-50">
            {hero.note}
          </p>
        </div>
      </div>
    </section>
  );
}
