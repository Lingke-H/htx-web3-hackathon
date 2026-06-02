"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  helper?: string;
  label: string;
  prefix?: string;
  suffix?: string;
};

export function TextField({
  className,
  error,
  helper,
  label,
  prefix,
  suffix,
  ...props
}: TextFieldProps) {
  const hasValue =
    typeof props.value === "string"
      ? props.value.length > 0
      : props.defaultValue !== undefined && `${props.defaultValue}`.length > 0;

  return (
    <label className="block">
      <div
        className={cn(
          "group/field relative rounded-[16px] border bg-slate-900/28 px-3 pb-3 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition-all",
          error
            ? "border-rose-300/32 focus-within:border-rose-300/44 focus-within:ring-2 focus-within:ring-rose-400/16"
            : "border-slate-300/14 focus-within:border-cyan-300/40 focus-within:ring-2 focus-within:ring-cyan-400/14",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute left-3 transition-all",
            hasValue
              ? "top-2.5 text-[0.64rem] uppercase tracking-[0.18em]"
              : "top-[1.15rem] text-sm group-focus-within/field:top-2.5 group-focus-within/field:text-[0.64rem] group-focus-within/field:uppercase group-focus-within/field:tracking-[0.18em]",
            error
              ? "text-rose-100"
              : hasValue
                ? "text-slate-300"
                : "text-slate-400 group-focus-within/field:text-cyan-100",
          )}
        >
          {label}
        </span>

        <div className="mt-2 flex items-center gap-2">
          {prefix ? (
            <span className="rounded-[10px] border border-slate-300/12 bg-white/[0.045] px-2 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-300">
              {prefix}
            </span>
          ) : null}

          <input
            className={cn(
              "min-w-0 flex-1 bg-transparent font-mono text-sm text-cyan-50 outline-none placeholder:text-transparent",
              className,
            )}
            placeholder=" "
            {...props}
          />

          {suffix ? (
            <span className="rounded-[10px] border border-slate-300/12 bg-white/[0.045] px-2 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-200">
              {suffix}
            </span>
          ) : null}
        </div>
      </div>

      <p className={cn("mt-2 px-1 text-xs leading-5", error ? "text-rose-100" : "text-slate-400")}>
        {error ?? helper}
      </p>
    </label>
  );
}
