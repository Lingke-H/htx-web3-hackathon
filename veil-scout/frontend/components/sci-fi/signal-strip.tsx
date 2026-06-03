import type { StatusTone } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export type SignalStripItem = {
  detail?: string;
  label: string;
  pulse?: boolean;
  tone?: StatusTone;
};

const toneMap: Record<StatusTone, string> = {
  accent: "bg-cyan-300 shadow-[0_0_18px_rgba(66,230,255,0.7)]",
  positive: "bg-emerald-300 shadow-[0_0_18px_rgba(69,255,184,0.7)]",
  caution: "bg-amber-300 shadow-[0_0_18px_rgba(255,204,77,0.7)]",
  critical: "bg-rose-300 shadow-[0_0_18px_rgba(255,101,140,0.7)]",
  neutral: "bg-slate-200 shadow-[0_0_16px_rgba(203,213,225,0.45)]",
};

export function SignalStrip({
  className,
  items,
  size = "md",
}: {
  className?: string;
  items: SignalStripItem[];
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => {
        const tone = item.tone ?? "accent";

        return (
          <div
            key={`${item.label}-${item.detail ?? ""}`}
            className={cn(
              "mission-chip flex items-center gap-2 rounded-full border border-white/10 text-slate-100",
              size === "sm" ? "px-2.5 py-1 text-[0.62rem]" : "px-3 py-1.5 text-[0.66rem]",
            )}
          >
            <span
              className={cn(
                "status-led h-2.5 w-2.5 shrink-0",
                toneMap[tone],
                item.pulse !== false && "animate-[status-pulse_2.4s_ease-in-out_infinite]",
              )}
            />
            <span className="font-mono uppercase tracking-[0.18em] text-slate-100/92">{item.label}</span>
            {item.detail ? <span className="text-slate-400/90">{item.detail}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
