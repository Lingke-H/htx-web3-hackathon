import type { CSSProperties } from "react";

export function PendingLoader({
  color = "#1fc6b2",
}: {
  color?: string;
}) {
  return <span className="signal-spinner" style={{ "--signal-color": color } as CSSProperties} />;
}
