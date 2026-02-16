"use client";

import { Bell, ChevronRight } from "lucide-react";
import { TYPO, cx } from "@/lib/ui/typography";
import type { NoticeClockItem } from "@/lib/ui/risk-register-helpers";

interface NoticeClocksStripProps {
  items: NoticeClockItem[];
  onItemClick: (eventId: string) => void;
  onViewAll?: () => void;
}

export default function NoticeClocksStrip({
  items,
  onItemClick,
  onViewAll,
}: NoticeClocksStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Icon + label */}
        <div className="flex items-center gap-2 shrink-0">
          <Bell size={13} className="text-[var(--color-semantic-yellow)]" />
          <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
            Notices
          </span>
        </div>

        {/* Items row */}
        <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden">
          {items.slice(0, 3).map((item) => (
            <button
              key={item.eventId}
              onClick={() => onItemClick(item.eventId)}
              className="flex items-center gap-2 min-w-0 hover:bg-[var(--color-surface)] rounded-[var(--radius-sm)] px-2 py-1 transition-colors cursor-pointer"
            >
              {/* Colored dot */}
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
              {/* Title (truncated) */}
              <span className="text-sm text-[var(--color-text-primary)] truncate max-w-[160px]">
                {item.title}
              </span>
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
                  : `${item.daysRemaining}d`}
              </span>
            </button>
          ))}
        </div>

        {/* Overflow link */}
        {items.length > 3 && onViewAll && (
          <button
            onClick={onViewAll}
            className="shrink-0 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer flex items-center gap-0.5"
          >
            View all ({items.length}) <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
