"use client";

import { Timer } from "lucide-react";
import type { DecisionEvent } from "@/lib/models/decision-event";

interface Props {
  event: DecisionEvent;
  compact?: boolean;
}

export default function NoticeClockBadge({ event, compact = false }: Props) {
  // Find first contract reference with a notice window
  const noticeRef = event.contractReferences.find(
    (r) => r.noticeDays && r.noticeDays > 0,
  );
  if (!noticeRef || !noticeRef.noticeDays) return null;

  const hoursTotal = noticeRef.noticeDays * 24;
  const hoursElapsed = (Date.now() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60);
  const hoursRemaining = Math.round(hoursTotal - hoursElapsed);

  const isOverdue = hoursRemaining <= 0;
  const isUrgent = hoursRemaining > 0 && hoursRemaining < 6;
  const isWarning = hoursRemaining >= 6 && hoursRemaining < 24;

  const color = isOverdue || isUrgent
    ? "var(--color-semantic-red)"
    : isWarning
      ? "var(--color-semantic-yellow)"
      : "var(--color-semantic-green)";

  const bgColor = isOverdue || isUrgent
    ? "var(--color-semantic-red-dim)"
    : isWarning
      ? "var(--color-semantic-yellow-dim)"
      : "var(--color-semantic-green-dim)";

  const label = isOverdue
    ? `OVERDUE ${Math.abs(hoursRemaining)}h`
    : `${hoursRemaining}h left`;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-data"
        style={{ color }}
        title={`Notice: ${noticeRef.section} — ${noticeRef.clause}`}
      >
        <Timer size={10} />
        {label}
      </span>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-card)] p-4 border"
      style={{ backgroundColor: bgColor, borderColor: color }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Timer size={14} style={{ color }} />
        <span
          className="text-xs font-semibold uppercase tracking-[1.2px]"
          style={{ color }}
        >
          Notice Clock
        </span>
      </div>
      <div className="font-data text-lg font-bold" style={{ color }}>
        {label}
      </div>
      <div className="text-xs text-[var(--color-text-muted)] mt-1">
        {noticeRef.section} — {noticeRef.clause}
      </div>
      <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
        {noticeRef.noticeDays}-day window from {new Date(event.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
    </div>
  );
}
