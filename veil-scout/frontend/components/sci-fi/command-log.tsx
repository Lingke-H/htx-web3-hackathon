"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { PendingLoader } from "@/components/ui/pending-loader";
import type { ActionState, StatusTone } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export type CommandLogItem = {
  badgeLabel?: string;
  detail: string;
  hash?: string;
  id: string;
  state?: ActionState;
  timestamp?: string;
  title: string;
  tone?: StatusTone;
};

function toneClass(tone: StatusTone) {
  return {
    accent: "border-cyan-300/30 bg-cyan-400/12 text-cyan-50",
    positive: "border-emerald-300/30 bg-emerald-400/12 text-emerald-50",
    caution: "border-amber-300/34 bg-amber-400/12 text-amber-50",
    critical: "border-rose-300/34 bg-rose-400/12 text-rose-50",
    neutral: "border-slate-300/20 bg-slate-300/10 text-slate-100",
  }[tone];
}

function stateTone(state: ActionState): StatusTone {
  return ({
    default: "accent",
    loading: "accent",
    success: "positive",
    error: "critical",
  } as const)[state];
}

export function CommandLog({
  className,
  items,
}: {
  className?: string;
  items: CommandLogItem[];
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const tone = item.state ? stateTone(item.state) : item.tone ?? "neutral";
        const badgeLabel = item.badgeLabel ?? item.state ?? item.tone ?? "log";

        return (
          <motion.div
            key={item.id}
            animate={{ opacity: 1, y: 0 }}
            className="terminal-console data-row rounded-[20px] p-4"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            transition={prefersReducedMotion ? undefined : { delay: index * 0.05, duration: 0.24, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {item.state === "loading" ? (
                    <PendingLoader color="#52e6ff" />
                  ) : (
                    <span
                      className={cn(
                        "status-led h-2.5 w-2.5",
                        tone === "positive" && "bg-emerald-300 shadow-[0_0_18px_rgba(69,255,184,0.7)]",
                        tone === "accent" && "bg-cyan-300 shadow-[0_0_18px_rgba(82,230,255,0.75)]",
                        tone === "caution" && "bg-amber-300 shadow-[0_0_18px_rgba(255,204,77,0.7)]",
                        tone === "critical" && "bg-rose-300 shadow-[0_0_18px_rgba(255,101,140,0.7)]",
                        tone === "neutral" && "bg-slate-300 shadow-[0_0_14px_rgba(203,213,225,0.42)]",
                      )}
                    />
                  )}
                  {item.timestamp ? (
                    <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-slate-500">{item.timestamp}</span>
                  ) : null}
                  <p className="text-sm font-semibold text-slate-50">{item.title}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.detail}</p>
                {item.hash ? (
                  <p
                    className="mt-3 inline-flex max-w-full rounded-full border border-white/10 bg-slate-950/55 px-3 py-1 font-mono text-[0.7rem] tracking-[0.14em] text-cyan-100/88"
                    translate="no"
                  >
                    {item.hash}
                  </p>
                ) : null}
              </div>

              <Badge className={cn("self-start px-2.5 py-1", toneClass(tone))} variant="outline">
                {badgeLabel}
              </Badge>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
