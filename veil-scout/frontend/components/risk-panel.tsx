import type { DemoContent } from "@/lib/demo-data";
import { RiskBadge } from "@/components/risk-badge";

export function RiskPanel({ section }: { section: DemoContent["risk"] }) {
  return (
    <section className="panel relative rounded-[28px] p-5 sm:p-6">
      <p className="section-kicker">{section.eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{section.title}</h3>
      <div className="mt-5 space-y-3">
        {section.items.map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-white/8 bg-slate-950/78 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <RiskBadge tone={item.tone}>{item.value}</RiskBadge>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-300">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
