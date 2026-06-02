import type { DemoContent } from "@/lib/demo-data";
import { RiskBadge } from "@/components/risk-badge";

export function AgentExplanationPanel({ section }: { section: DemoContent["agent"] }) {
  return (
    <section className="panel relative rounded-[28px] p-5 sm:p-6">
      <p className="section-kicker">{section.eyebrow}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">{section.recommendation}</h3>
          <p className="mt-2 text-sm text-slate-400">{section.title}</p>
        </div>
        <RiskBadge tone="accent">{section.confidence}</RiskBadge>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">{section.summary}</p>

      <div className="mt-5 space-y-3">
        {section.factors.map((factor) => (
          <div
            key={factor.label}
            className="rounded-[18px] border border-white/8 bg-slate-950/75 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{factor.label}</p>
              <RiskBadge tone={factor.tone}>{factor.tone}</RiskBadge>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-300">{factor.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[18px] border border-amber-400/15 bg-amber-400/8 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-100">{section.cautionTitle}</p>
        <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-50">
          {section.cautions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-sm text-slate-400">{section.nextReview}</p>
    </section>
  );
}
