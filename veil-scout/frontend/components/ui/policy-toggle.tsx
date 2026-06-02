"use client";

import { cn } from "@/lib/utils";

type PolicyToggleProps = {
  checked: boolean;
  description: string;
  label: string;
  offLabel: string;
  onCheckedChange: (checked: boolean) => void;
  onLabel: string;
};

export function PolicyToggle({
  checked,
  description,
  label,
  offLabel,
  onCheckedChange,
  onLabel,
}: PolicyToggleProps) {
  return (
    <button
      aria-pressed={checked}
      className="terminal-strip flex w-full items-center justify-between gap-4 rounded-[16px] px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
      onClick={() => onCheckedChange(!checked)}
      type="button"
    >
      <div className="min-w-0">
        <p className="terminal-label">{label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      </div>

      <div className="shrink-0 text-right">
        <div
          className={cn(
            "relative h-8 w-14 rounded-full border p-1 transition-colors",
            checked
              ? "border-emerald-400/28 bg-emerald-400/10 shadow-[inset_1px_1px_5px_rgba(42,157,143,0.34)]"
              : "border-rose-400/24 bg-rose-400/8 shadow-[inset_1px_1px_5px_rgba(216,79,104,0.28)]",
          )}
        >
          <span
            className={cn(
              "absolute top-[3px] h-[22px] w-[22px] rounded-full transition-all",
              checked
                ? "left-[29px] bg-emerald-400 shadow-[inset_-1px_1px_2px_rgba(163,255,244,0.55)]"
                : "left-[3px] bg-rose-400 shadow-[inset_1px_1px_2px_rgba(255,124,167,0.4)]",
            )}
          />
        </div>
        <p className="mt-2 text-[0.64rem] uppercase tracking-[0.16em] text-slate-500">
          {checked ? onLabel : offLabel}
        </p>
      </div>
    </button>
  );
}
