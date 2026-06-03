import type { StatusTone } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const strokeByTone: Record<StatusTone, string> = {
  accent: "#52e6ff",
  positive: "#53f1b4",
  caution: "#ffcc66",
  critical: "#ff7f9f",
  neutral: "#cbd5e1",
};

export function MiniSparkline({
  className,
  points,
  tone = "accent",
}: {
  className?: string;
  points: number[];
  tone?: StatusTone;
}) {
  if (points.length < 2) {
    return null;
  }

  const width = 124;
  const height = 40;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coordinates = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPath = `M 0 ${height} L ${coordinates.replaceAll(" ", " L ")} L ${width} ${height} Z`;
  const stroke = strokeByTone[tone];

  return (
    <svg
      aria-hidden="true"
      className={cn("h-10 w-full overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path d={areaPath} fill={stroke} opacity="0.12" />
      <polyline
        fill="none"
        points={coordinates}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
