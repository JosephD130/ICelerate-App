"use client";

import { X } from "lucide-react";
import { TYPO } from "@/lib/ui/typography";
import { type DrillDown, drillDownLabel } from "@/lib/ui/risk-register-helpers";

interface Props {
  drill: DrillDown;
  matchCount: number;
  onClear: () => void;
}

export default function DrilldownBar({ drill, matchCount, onClear }: Props) {
  if (!drill) return null;

  return (
    <div
      className="flex items-center gap-3 mb-4 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20"
      aria-live="polite"
    >
      <span className={`${TYPO.meta} font-semibold text-[var(--color-accent)]`}>
        {drillDownLabel(drill)}
      </span>
      <span className={`${TYPO.meta} text-[var(--color-text-muted)] font-data`}>
        {matchCount} risk item{matchCount !== 1 ? "s" : ""}
      </span>
      <button
        onClick={onClear}
        className="ml-auto flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        aria-label="Clear drill-down filter"
      >
        <X size={12} />
        Clear
      </button>
    </div>
  );
}
