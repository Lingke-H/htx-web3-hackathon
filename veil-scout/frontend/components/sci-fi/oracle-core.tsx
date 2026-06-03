"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function OracleCore({
  className,
  confidence,
  label,
  status,
}: {
  className?: string;
  confidence: number;
  label: string;
  status: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const orbits = [
    { className: "inset-5 border-cyan-300/30", duration: 18 },
    { className: "inset-12 border-white/10", duration: 24, reverse: true },
    { className: "inset-[22%] border-emerald-300/25", duration: 30 },
  ];
  const nodes = [
    { left: "18%", top: "28%" },
    { left: "70%", top: "22%" },
    { left: "76%", top: "68%" },
    { left: "22%", top: "74%" },
  ];

  return (
    <div className={cn("relative aspect-square min-h-[300px] w-full overflow-hidden rounded-[28px]", className)}>
      <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_center,rgba(82,230,255,0.18),transparent_42%),radial-gradient(circle_at_50%_22%,rgba(84,255,194,0.14),transparent_28%),linear-gradient(180deg,rgba(8,18,34,0.72),rgba(5,10,22,0.92))]" />
      <div className="absolute inset-[10%] rounded-full border border-cyan-300/10" />

      {orbits.map((orbit) => (
        <motion.div
          key={orbit.className}
          animate={prefersReducedMotion ? undefined : { rotate: orbit.reverse ? -360 : 360 }}
          className={cn("absolute rounded-full border radar-ring", orbit.className)}
          transition={prefersReducedMotion ? undefined : { duration: orbit.duration, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
        />
      ))}

      {nodes.map((node) => (
        <motion.span
          key={`${node.left}-${node.top}`}
          animate={prefersReducedMotion ? undefined : { opacity: [0.35, 1, 0.35], scale: [1, 1.18, 1] }}
          className="absolute h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(82,230,255,0.82)]"
          style={{ left: node.left, top: node.top }}
          transition={prefersReducedMotion ? undefined : { duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      ))}

      <div className="absolute inset-[27%] rounded-full border border-cyan-300/14 bg-[radial-gradient(circle_at_center,rgba(82,230,255,0.36),rgba(8,18,34,0.84)_72%)] shadow-[0_0_70px_rgba(33,199,255,0.28)]" />
      <div className="absolute inset-[31%] rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_36%,rgba(255,255,255,0.14),rgba(9,21,37,0.94)_78%)]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <span className="mission-chip rounded-full px-3 py-1 font-mono text-[0.68rem] tracking-[0.22em] text-cyan-100/92">
          {label}
        </span>
        <div className="mt-5 display-font glow-text text-[3.8rem] font-semibold leading-none text-white md:text-[4.6rem]">
          {Math.round(confidence)}%
        </div>
        <p className="mt-4 font-mono text-[0.75rem] uppercase tracking-[0.32em] text-emerald-200/90">{status}</p>
      </div>
    </div>
  );
}
