import type { Severity } from "@/lib/models/decision-event";

const SEVERITY_CLASSES: Record<Severity, string> = {
  critical: "badge badge-red",
  high: "badge badge-red",
  medium: "badge badge-yellow",
  low: "badge badge-blue",
  info: "badge badge-green",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={SEVERITY_CLASSES[severity]}>{severity}</span>;
}

export function StatusBadge({
  status,
  color = "blue",
}: {
  status: string;
  color?: "red" | "yellow" | "green" | "blue" | "purple";
}) {
  return <span className={`badge badge-${color}`}>{status}</span>;
}
