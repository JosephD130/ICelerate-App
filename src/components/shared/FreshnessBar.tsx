"use client";

import { Clock } from "lucide-react";
import type { FreshnessWarning } from "@/lib/freshness";

interface Props {
  warnings: FreshnessWarning[];
}

export default function FreshnessBar({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] mb-3"
      style={{ backgroundColor: "var(--color-semantic-yellow-dim)" }}
    >
      <Clock size={11} className="text-[var(--color-semantic-yellow)] shrink-0" />
      <span className="text-xs font-data text-[var(--color-semantic-yellow)]">
        Data may be outdated:
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {warnings.map((w) => (
          <span
            key={w.sourceLabel}
            className="badge text-[10px]"
            style={{
              backgroundColor:
                w.severity === "stale"
                  ? "var(--color-semantic-red-dim)"
                  : "var(--color-semantic-yellow-dim)",
              color:
                w.severity === "stale"
                  ? "var(--color-semantic-red)"
                  : "var(--color-semantic-yellow)",
              border: `1px solid ${w.severity === "stale" ? "var(--color-semantic-red)" : "var(--color-semantic-yellow)"}`,
            }}
          >
            {w.sourceLabel} ({w.daysSinceSync}d)
          </span>
        ))}
      </div>
    </div>
  );
}
