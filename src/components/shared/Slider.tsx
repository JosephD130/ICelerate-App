"use client";

import { TYPO } from "@/lib/ui/typography";

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  leftLabel?: string;
  rightLabel?: string;
  color?: string;
}

export default function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  leftLabel,
  rightLabel,
  color = "var(--color-accent)",
}: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`${TYPO.meta} text-[var(--color-text-muted)]`}>
          {label}
        </span>
        <span className={`${TYPO.meta} font-data`} style={{ color }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${((value - min) / (max - min)) * 100}%, var(--color-border) ${((value - min) / (max - min)) * 100}%)`,
          accentColor: color,
        }}
      />
      {(leftLabel || rightLabel) && (
        <div className="flex items-center justify-between text-[10px] text-[var(--color-text-dim)]">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
