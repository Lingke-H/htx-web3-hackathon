import type { StatusTone } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type ConstellationItem = {
  label: string;
  sublabel: string;
  tone: StatusTone;
  value: string;
};

const placements = [
  { x: 58, y: 54 },
  { x: 208, y: 32 },
  { x: 252, y: 152 },
  { x: 106, y: 182 },
] as const;

const toneClass: Record<StatusTone, string> = {
  accent: "bg-cyan-300 text-cyan-50 shadow-[0_0_18px_rgba(82,230,255,0.72)]",
  positive: "bg-emerald-300 text-emerald-50 shadow-[0_0_18px_rgba(69,255,184,0.62)]",
  caution: "bg-amber-300 text-amber-50 shadow-[0_0_18px_rgba(255,204,77,0.62)]",
  critical: "bg-rose-300 text-rose-50 shadow-[0_0_18px_rgba(255,101,140,0.62)]",
  neutral: "bg-slate-300 text-slate-50 shadow-[0_0_16px_rgba(203,213,225,0.48)]",
};

export function MarketConstellation({
  className,
  items,
}: {
  className?: string;
  items: ConstellationItem[];
}) {
  return (
    <div className={cn("relative min-h-[240px] overflow-hidden rounded-[26px]", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(82,230,255,0.12),transparent_24%),radial-gradient(circle_at_80%_12%,rgba(84,255,194,0.1),transparent_22%),linear-gradient(180deg,rgba(4,10,22,0.64),rgba(5,10,22,0.88))]" />
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 320 240">
        <defs>
          <linearGradient id="constellation-link" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(82,230,255,0.18)" />
            <stop offset="100%" stopColor="rgba(84,255,194,0.28)" />
          </linearGradient>
        </defs>
        {placements.slice(0, Math.max(items.length - 1, 0)).map((point, index) => {
          const next = placements[index + 1];
          return (
            <line
              key={`${point.x}-${point.y}`}
              stroke="url(#constellation-link)"
              strokeDasharray="6 8"
              strokeWidth="1"
              x1={point.x}
              x2={next.x}
              y1={point.y}
              y2={next.y}
            />
          );
        })}
        <circle cx="160" cy="120" fill="rgba(82,230,255,0.2)" r="48" />
        <circle cx="160" cy="120" fill="none" r="74" stroke="rgba(82,230,255,0.18)" strokeDasharray="5 8" />
      </svg>

      <div className="relative z-10 flex min-h-[240px] items-center justify-center">
        <div className="pointer-events-none absolute inset-0">
          {items.slice(0, placements.length).map((item, index) => {
            const placement = placements[index];

            return (
              <div
                key={item.label}
                className="absolute w-[122px] rounded-[18px] border border-white/8 bg-slate-950/55 px-3 py-2"
                style={{ left: placement.x - 28, top: placement.y - 12 }}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", toneClass[item.tone])} />
                  <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-slate-300">{item.sublabel}</span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-5 text-slate-50">{item.label}</p>
                <p className="mt-1 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-cyan-100/84">{item.value}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-full border border-cyan-300/18 bg-slate-950/65 px-7 py-5 text-center shadow-[0_0_45px_rgba(29,174,255,0.18)]">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-400">Discovery Map</p>
          <p className="display-font mt-3 text-xl text-white">SCOUT VECTOR</p>
        </div>
      </div>
    </div>
  );
}
