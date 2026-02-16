import { ChevronRight, AlertTriangle, Bell, Clock } from "lucide-react";
import type { NoticeClockItem } from "@/lib/ui/risk-register-helpers";
import type { DecisionEvent } from "@/lib/models/decision-event";
import { FLAGS } from "@/lib/flags";

interface StartHereBannerProps {
  noticeClocks: NoticeClockItem[];
  events: DecisionEvent[];
  showNoticeClocks: boolean;
  onDrillNotice: () => void;
  onScrollToEvents: () => void;
  onNoticeItemClick?: (eventId: string) => void;
}

// Render up to 3 inline notice items below the headline
function NoticeItems({
  items,
  onItemClick,
}: {
  items: NoticeClockItem[];
  onItemClick?: (eventId: string) => void;
}) {
  const top3 = items.slice(0, 3);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
      {top3.map((item) => {
        const dotColor = item.isOverdue
          ? "bg-[var(--color-semantic-red)]"
          : item.daysRemaining <= 3
            ? "bg-[var(--color-semantic-yellow)]"
            : "bg-[var(--color-semantic-green)]";
        return (
          <button
            key={item.eventId}
            onClick={(e) => {
              e.stopPropagation();
              onItemClick?.(item.eventId);
            }}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
            <span className="truncate max-w-[180px]">{item.title}</span>
            <span className="font-data shrink-0">
              {item.isOverdue ? "overdue" : `${item.daysRemaining}d`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function StartHereBanner({
  noticeClocks,
  events,
  showNoticeClocks,
  onDrillNotice,
  onScrollToEvents,
  onNoticeItemClick,
}: StartHereBannerProps) {
  const overdueItems = showNoticeClocks
    ? noticeClocks.filter((c) => c.isOverdue)
    : [];

  const activeNonOverdue = showNoticeClocks
    ? noticeClocks.filter((c) => !c.isOverdue)
    : [];

  const highPriorityCount = events.filter(
    (e) =>
      e.status === "open" &&
      (e.severity === "critical" || e.severity === "high"),
  ).length;

  // Priority 1: Overdue notice clocks — red-tinted, visually dominant
  if (overdueItems.length > 0) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onDrillNotice}
        onKeyDown={(e) => e.key === "Enter" && onDrillNotice()}
        className="w-full flex items-start gap-3 px-5 py-4 mb-4 rounded-[var(--radius-sm)] text-sm bg-[var(--color-semantic-red)]/8 border border-[var(--color-semantic-red)]/25 hover:border-[var(--color-semantic-red)]/40 transition-all cursor-pointer"
      >
        <Bell size={16} className="shrink-0 mt-0.5 text-[var(--color-semantic-red)]" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-[var(--color-semantic-red)]">
            {overdueItems.length} notice deadline{overdueItems.length !== 1 ? "s" : ""} overdue
          </span>
          <span className="text-[var(--color-text-muted)]"> &mdash; review and respond</span>
          <NoticeItems items={overdueItems} onItemClick={onNoticeItemClick} />
        </div>
        <span className="shrink-0 self-center text-xs font-semibold text-[var(--color-semantic-red)] px-2.5 py-1 rounded-[var(--radius-pill)] border border-[var(--color-semantic-red)]/30">
          Review Now
        </span>
      </div>
    );
  }

  // Priority 2: Active non-overdue notice clocks — yellow-tinted
  if (activeNonOverdue.length > 0) {
    const nearest = Math.min(...activeNonOverdue.map((c) => c.daysRemaining));
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onDrillNotice}
        onKeyDown={(e) => e.key === "Enter" && onDrillNotice()}
        className="w-full flex items-start gap-3 px-5 py-4 mb-4 rounded-[var(--radius-sm)] text-sm bg-[var(--color-semantic-yellow)]/8 border border-[var(--color-semantic-yellow)]/25 hover:border-[var(--color-semantic-yellow)]/40 transition-all cursor-pointer"
      >
        <Clock size={16} className="shrink-0 mt-0.5 text-[var(--color-semantic-yellow)]" />
        <div className="flex-1 min-w-0">
          <span className="text-[var(--color-text-secondary)]">
            Nearest notice deadline in{" "}
            <span className="font-semibold font-data text-[var(--color-semantic-yellow)]">{nearest}d</span>
          </span>
          <span className="text-[var(--color-text-muted)]"> &mdash; review clocks</span>
          <NoticeItems items={activeNonOverdue} onItemClick={onNoticeItemClick} />
        </div>
        <span className="shrink-0 self-center text-xs font-semibold text-[var(--color-semantic-yellow)] px-2.5 py-1 rounded-[var(--radius-pill)] border border-[var(--color-semantic-yellow)]/30">
          Review Clocks
        </span>
      </div>
    );
  }

  // Priority 3: High-priority open events — accent-tinted
  if (highPriorityCount > 0) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onScrollToEvents}
        onKeyDown={(e) => e.key === "Enter" && onScrollToEvents()}
        className="w-full flex items-center gap-3 px-5 py-4 mb-4 rounded-[var(--radius-sm)] text-sm bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/40 transition-all cursor-pointer"
      >
        <AlertTriangle size={16} className="shrink-0 text-[var(--color-accent)]" />
        <span className="flex-1 text-[var(--color-accent)]">
          <span className="font-semibold">{highPriorityCount}</span> high-priority {FLAGS.governedRiskSystem ? "risk item" : "event"}{highPriorityCount !== 1 ? "s" : ""} need attention
        </span>
        <span className="shrink-0 text-xs font-semibold text-[var(--color-accent)] px-2.5 py-1 rounded-[var(--radius-pill)] border border-[var(--color-accent)]/30">
          Review
        </span>
      </div>
    );
  }

  // Priority 4: All clear — neutral surface
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onScrollToEvents}
      onKeyDown={(e) => e.key === "Enter" && onScrollToEvents()}
      className="w-full flex items-center gap-3 px-5 py-4 mb-4 rounded-[var(--radius-sm)] text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/20 transition-all cursor-pointer"
    >
      <span className="flex-1">
        No urgent risks &mdash; {FLAGS.governedRiskSystem ? "review open risk items" : "review open events"}
      </span>
      <ChevronRight size={14} className="shrink-0" />
    </div>
  );
}
