import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import type { DemoContent } from "@/lib/demo-data";
import { actionTone, cn } from "@/lib/ui";

const stateIcons = {
  default: null,
  loading: LoaderCircle,
  success: CheckCircle2,
  error: AlertCircle,
};

export function TransactionStatus({ section }: { section: DemoContent["transaction"] }) {
  return (
    <section className="panel relative rounded-[28px] p-5 sm:p-6" id="approvals">
      <p className="section-kicker">{section.eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{section.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{section.summary}</p>

      <div className="mt-5 space-y-3">
        {section.processes.map((item) => {
          const Icon = stateIcons[item.state];

          return (
            <div
              key={item.hash}
              className="rounded-[18px] border border-white/8 bg-slate-950/78 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03]">
                  {Icon ? (
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        item.state === "loading" && "animate-spin text-slate-100",
                        item.state === "success" && "text-emerald-300",
                        item.state === "error" && "text-rose-300",
                      )}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <span className="font-mono text-xs text-slate-400">{item.hash}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{item.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3">
        {section.buttons.map((button) => {
          const Icon = stateIcons[button.state];

          return (
            <div
              key={button.label}
              className="rounded-[18px] border border-white/8 bg-white/[0.02] p-3"
            >
              <button
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-medium transition-colors",
                  actionTone(button.state),
                )}
                disabled={button.state === "loading"}
                type="button"
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      button.state === "loading" && "animate-spin",
                    )}
                  />
                ) : null}
                {button.label}
              </button>
              <p className="mt-2 text-sm leading-6 text-slate-400">{button.helper}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
