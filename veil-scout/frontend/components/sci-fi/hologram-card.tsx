import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type HologramCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  innerClassName?: string;
};

export function HologramCard({
  children,
  className,
  innerClassName,
  ...props
}: HologramCardProps) {
  return (
    <div
      className={cn(
        "holo-card hologram-panel neon-border scanline-overlay relative overflow-hidden rounded-[28px] border border-white/10",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-4 top-4 h-4 w-4 border-l border-t border-cyan-300/55" />
      <span className="pointer-events-none absolute right-4 top-4 h-4 w-4 border-r border-t border-cyan-300/35" />
      <span className="pointer-events-none absolute bottom-4 left-4 h-4 w-4 border-b border-l border-emerald-300/30" />
      <span className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 border-b border-r border-cyan-300/45" />
      <div className={cn("relative z-10", innerClassName)}>{children}</div>
    </div>
  );
}
