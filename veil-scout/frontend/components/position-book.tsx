import type { DemoContent } from "@/lib/demo-data";
import { RiskBadge } from "@/components/risk-badge";

export function PositionBook({ section }: { section: DemoContent["position"] }) {
  return (
    <section className="panel relative rounded-[28px] p-5 sm:p-6" id="markets">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">{section.eyebrow}</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">{section.title}</h3>
        </div>
        <p className="max-w-md text-sm leading-7 text-slate-300">
          {section.description}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-[20px] border border-white/8">
        <div className="grid grid-cols-[1.5fr_repeat(5,minmax(0,0.7fr))] gap-3 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-slate-400">
          {section.headers.map((header) => (
            <span key={header}>{header}</span>
          ))}
        </div>

        {section.rows.map((row) => (
          <div
            key={row.market}
            className="grid grid-cols-[1.5fr_repeat(5,minmax(0,0.7fr))] gap-3 border-b border-white/6 px-4 py-4 text-sm text-slate-200 last:border-b-0"
          >
            <div>
              <p className="font-medium text-white">{row.market}</p>
              <p className="mt-1 text-xs text-slate-400">{row.aiView}</p>
            </div>
            <span>{row.side}</span>
            <span className="font-mono">{row.exposure}</span>
            <span>{row.avgOdds}</span>
            <div>
              <RiskBadge tone={row.tone}>{row.settlement}</RiskBadge>
            </div>
            <span className="font-mono">{row.close}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
