interface SubscoreBarProps {
  label: string;
  value: number; // 0-1
  size?: "sm" | "md";
}

function scoreColor(value: number): string {
  if (value >= 0.8) return "var(--color-semantic-green)";
  if (value >= 0.5) return "var(--color-semantic-yellow)";
  return "var(--color-semantic-red)";
}

export default function SubscoreBar({ label, value, size = "sm" }: SubscoreBarProps) {
  const pct = Math.min(100, Math.max(0, value * 100));
  const color = scoreColor(value);
  const barHeight = size === "sm" ? "h-[3px]" : "h-1";

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.8px] text-[var(--color-text-muted)]">
          {label}
        </span>
        <span className="text-xs font-data" style={{ color }}>
          {value.toFixed(2)}
        </span>
      </div>
      <div className={`${barHeight} rounded-full bg-[var(--color-border)]`}>
        <div
          className={`${barHeight} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
