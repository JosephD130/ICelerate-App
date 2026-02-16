import { TYPO, cx } from "@/lib/ui/typography";

interface ScoreBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export default function ScoreBar({
  value,
  max = 100,
  color = "var(--color-accent)",
  label,
  showValue = true,
}: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="space-y-1">
      {(label || showValue) && (
        <div className={cx("flex items-center justify-between", TYPO.meta)}>
          {label && (
            <span className="text-[var(--color-text-muted)]">{label}</span>
          )}
          {showValue && (
            <span className="font-data" style={{ color }}>
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className="h-1 rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full transition-all duration-600 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
