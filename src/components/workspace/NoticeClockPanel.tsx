"use client";

import { Bell, ExternalLink } from "lucide-react";
import { TYPO, cx } from "@/lib/ui/typography";
import type { NoticeClockItem } from "@/lib/ui/risk-register-helpers";

interface Props {
  items: NoticeClockItem[];
  onOpenEvent: (eventId: string) => void;
}

export default function NoticeClockPanel({ items, onOpenEvent }: Props) {
  if (items.length === 0) return null;

  const overdueCount = items.filter((i) => i.isOverdue).length;

  return (
    <div className="mb-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Bell size={14} className="text-[var(--color-semantic-yellow)]" />
        <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
          Notice Clocks
        </span>
        <span className="text-xs font-data text-[var(--color-text-dim)]">
          {items.length} active{overdueCount > 0 ? ` \u00b7 ${overdueCount} overdue` : ""}
        </span>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.eventId}
            className="flex items-center gap-3 text-sm"
          >
            {/* Status indicator */}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: item.isOverdue
                  ? "var(--color-semantic-red)"
                  : item.daysRemaining <= 3
                    ? "var(--color-semantic-yellow)"
                    : "var(--color-semantic-green)",
              }}
            />

            {/* Title */}
            <span className="text-sm text-[var(--color-text-primary)] truncate flex-1 min-w-0">
              {item.title}
            </span>

            {/* Clause ref */}
            {item.clauseRef && (
              <span className="text-xs font-data text-[var(--color-semantic-purple)] shrink-0">
                {item.clauseRef}
              </span>
            )}

            {/* Days remaining */}
            <span
              className="text-xs font-data font-semibold shrink-0"
              style={{
                color: item.isOverdue
                  ? "var(--color-semantic-red)"
                  : item.daysRemaining <= 3
                    ? "var(--color-semantic-yellow)"
                    : "var(--color-text-muted)",
              }}
            >
              {item.isOverdue
                ? `${Math.abs(item.daysRemaining)}d overdue`
                : `${item.daysRemaining}d remaining`}
            </span>

            {/* Open button */}
            <button
              onClick={() => onOpenEvent(item.eventId)}
              className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              Open <ExternalLink size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
