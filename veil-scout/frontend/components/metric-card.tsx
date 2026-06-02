import type { StatusTone } from "@/lib/demo-data";
import { RiskBadge } from "@/components/risk-badge";

export function MetricCard({
  context,
  decision,
  label,
  tone,
  value,
}: {
  context: string;
  decision: string;
  label: string;
  tone: StatusTone;
  value: string;
}) {
  return (
    <section className="panel rounded-[22px] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <RiskBadge tone={tone}>{tone}</RiskBadge>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{context}</p>
      <p className="mt-4 border-t border-white/6 pt-4 text-sm leading-7 text-slate-400">
        {decision}
      </p>
    </section>
  );
}
