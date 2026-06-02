import type { ReactNode } from "react";
import type { StatusTone } from "@/lib/demo-data";
import { cn, toneBadge } from "@/lib/ui";

export function RiskBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: StatusTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
        toneBadge(tone),
      )}
    >
      {children}
    </span>
  );
}
