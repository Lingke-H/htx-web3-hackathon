import type { ActionState, StatusTone, StepState } from "@/lib/demo-data";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function toneBadge(tone: StatusTone) {
  return {
    accent: "border-sky-200/42 bg-sky-300/18 text-sky-50",
    positive: "border-emerald-200/42 bg-emerald-300/18 text-emerald-50",
    caution: "border-amber-200/46 bg-amber-300/18 text-amber-50",
    critical: "border-red-300/42 bg-red-400/18 text-red-50",
    neutral: "border-slate-100/20 bg-slate-100/10 text-slate-100",
  }[tone];
}

export function actionTone(state: ActionState) {
  return {
    default:
      "border-sky-200/44 bg-sky-300/18 text-sky-50 hover:bg-sky-300/24",
    loading:
      "border-blue-200/38 bg-blue-300/16 text-blue-50 cursor-progress",
    success:
      "border-emerald-200/44 bg-emerald-300/18 text-emerald-50 hover:bg-emerald-300/24",
    error: "border-red-300/42 bg-red-400/18 text-red-50 hover:bg-red-400/24",
  }[state];
}

export function stepTone(state: StepState) {
  return {
    complete: "border-emerald-200/40 bg-emerald-300/18 text-emerald-50",
    current: "border-sky-200/40 bg-sky-300/18 text-sky-50",
    upcoming: "border-slate-100/20 bg-slate-100/10 text-slate-100",
  }[state];
}
