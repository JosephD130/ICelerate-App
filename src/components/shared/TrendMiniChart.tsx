"use client";

interface Props {
  data: number[];
  label: string;
  color: string;
  suffix?: string;
}

export default function TrendMiniChart({ data, label, color, suffix = "" }: Props) {
  if (data.length === 0) return null;

  const current = data[data.length - 1];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Build SVG polyline points — 80px wide, 24px tall
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
          {label}
        </div>
        <div className="font-data text-sm font-bold" style={{ color }}>
          {current}{suffix}
        </div>
      </div>
      <svg width={w} height={h} className="shrink-0">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
