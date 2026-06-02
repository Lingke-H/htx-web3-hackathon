import type { DemoContent } from "@/lib/demo-data";
import { cn, stepTone } from "@/lib/ui";

export function DemoFlowStepper({ section }: { section: DemoContent["flow"] }) {
  return (
    <section className="panel relative rounded-[28px] p-5 sm:p-6" id="settlement">
      <p className="section-kicker">{section.eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{section.title}</h3>
      <div className="mt-5 space-y-4">
        {section.steps.map((step, index) => (
          <div key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                  stepTone(step.state),
                )}
              >
                {index + 1}
              </div>
              {index !== section.steps.length - 1 ? (
                <div className="mt-2 h-full w-px bg-white/8" />
              ) : null}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-white">{step.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
