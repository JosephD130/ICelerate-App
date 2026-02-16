"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import { TYPO, cx } from "@/lib/ui/typography";
import type { DecisionEvent } from "@/lib/models/decision-event";

interface Props {
  events: DecisionEvent[];
  onViewAll: () => void;
  onOpenEvent: (eventId: string) => void;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--color-semantic-red)",
  high: "var(--color-semantic-yellow)",
  medium: "var(--color-text-muted)",
  low: "var(--color-text-dim)",
};

export default function TopRisksSummary({ events, onViewAll, onOpenEvent }: Props) {
  const topEvents = [...events]
    .filter((e) => e.status !== "resolved")
    .sort((a, b) => {
      const sa = SEVERITY_ORDER[a.severity] ?? 9;
      const sb = SEVERITY_ORDER[b.severity] ?? 9;
      if (sa !== sb) return sa - sb;
      return (b.costImpact?.estimated ?? 0) - (a.costImpact?.estimated ?? 0);
    })
    .slice(0, 3);

  if (topEvents.length === 0) return null;

  return (
    <div className="mb-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} className="text-[var(--color-semantic-yellow)]" />
        <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
          Top Risks
        </span>
        <button
          onClick={onViewAll}
          className="ml-auto text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer flex items-center gap-0.5"
        >
          View all <ChevronRight size={12} />
        </button>
      </div>

      <div className="space-y-2">
        {topEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => onOpenEvent(event.id)}
            className="w-full flex items-center gap-3 text-left hover:bg-[var(--color-surface)] rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors cursor-pointer"
          >
            {/* Severity dot */}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: SEVERITY_COLORS[event.severity] ?? "var(--color-text-dim)" }}
            />

            {/* Title */}
            <span className="text-sm text-[var(--color-text-primary)] truncate flex-1 min-w-0">
              {event.title}
            </span>

            {/* Severity badge */}
            <span className="shrink-0 border border-[var(--color-border)] text-[var(--color-text-muted)] bg-transparent text-xs px-2 py-0.5 rounded-full capitalize">
              {event.severity}
            </span>

            {/* Cost */}
            {event.costImpact && event.costImpact.estimated > 0 && (
              <span className="text-xs font-data text-[var(--color-text-muted)] shrink-0">
                ${event.costImpact.estimated.toLocaleString()}
              </span>
            )}

            {/* Schedule */}
            {event.scheduleImpact && event.scheduleImpact.daysAffected > 0 && (
              <span className="text-xs font-data text-[var(--color-text-muted)] shrink-0">
                {event.scheduleImpact.daysAffected}d
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
