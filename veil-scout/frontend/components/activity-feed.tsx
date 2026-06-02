import type { DemoContent } from "@/lib/demo-data";
import { RiskBadge } from "@/components/risk-badge";

export function ActivityFeed({ section }: { section: DemoContent["activity"] }) {
  return (
    <section className="panel relative rounded-[28px] p-5 sm:p-6" id="activity">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">{section.eyebrow}</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">{section.title}</h3>
        </div>
        <p className="max-w-md text-sm leading-7 text-slate-300">
          {section.description}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {section.items.map((item) => (
          <div
            key={`${item.time}-${item.title}`}
            className="rounded-[18px] border border-white/8 bg-slate-950/75 px-4 py-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tracking-[0.16em] text-slate-400">
                    {item.time}
                  </span>
                  <RiskBadge tone={item.tone}>{item.tone}</RiskBadge>
                </div>
                <p className="mt-3 text-sm font-medium text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{item.note}</p>
              </div>
              <span className="font-mono text-xs text-slate-400">{item.hash}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
