"use client";

import { HelpCircle } from "lucide-react";
import { TYPO, cx } from "@/lib/ui/typography";
import type { KpiDelta } from "@/lib/risk-metrics/risk-metrics";

interface KpiTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  whatThisMeans: string;
  breakdown: string;
  ctaLabel: string;
  onCtaClick: () => void;
  onWhyClick: () => void;
  isActive?: boolean;
  delta?: KpiDelta;
  lastUpdated?: string;
}

export default function KpiTile({
  icon,
  label,
  value,
  whatThisMeans,
  breakdown,
  ctaLabel,
  onCtaClick,
  onWhyClick,
  isActive = false,
  delta,
  lastUpdated,
}: KpiTileProps) {
  return (
    <div
      className={cx(
        "bg-[var(--color-card)] border shadow-sm rounded-[var(--radius-card)] p-6 transition-all",
        isActive
          ? "border-l-2 border-l-[var(--color-accent)] border-[var(--color-accent)]/30 bg-[var(--color-accent-dim)]"
          : "border-[var(--color-border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
          {label}
        </span>
        <button
          onClick={onWhyClick}
          className="ml-auto text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
          title={`How "${label}" is calculated`}
        >
          <HelpCircle size={13} />
        </button>
      </div>

      {/* Value */}
      <div className={cx(TYPO.kpi, "text-[var(--color-text-primary)] mb-1")}>
        {value}
      </div>

      {/* Risk Momentum delta */}
      {delta && delta.direction !== "unchanged" && (
        <p className={`text-xs font-data mt-0.5 mb-1 ${
          delta.direction === "up" ? "text-[var(--color-semantic-red)]" : "text-[var(--color-semantic-green)]"
        }`}>
          {delta.formatted}{" "}
          <span className="text-[var(--color-text-dim)]">{delta.label}</span>
        </p>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-[10px] font-data text-[var(--color-text-dim)] mb-1">
          Updated {lastUpdated}
        </p>
      )}

      {/* What this means */}
      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-1">
        {whatThisMeans}
      </p>

      {/* Breakdown */}
      <p className="text-xs font-data text-[var(--color-text-dim)] mb-3">
        {breakdown}
      </p>

      {/* CTA */}
      <button
        onClick={onCtaClick}
        className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer"
      >
        {ctaLabel} &rarr;
      </button>
    </div>
  );
}
