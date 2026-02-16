"use client";
import { useEvents } from "@/lib/contexts/event-context";
import { X, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ActiveEventStrip() {
  const { activeEvent, selectEvent } = useEvents();
  if (!activeEvent) return null;

  const alignColor = activeEvent.alignmentStatus === "synced"
    ? "var(--color-semantic-green)"
    : activeEvent.alignmentStatus === "drift"
    ? "var(--color-semantic-yellow)"
    : "var(--color-semantic-red)";

  return (
    <div className="h-9 flex items-center justify-between px-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: alignColor }} />
        <span className="text-sm text-[var(--color-text-primary)] truncate max-w-[280px]" title={activeEvent.title}>
          {activeEvent.title}
        </span>
        <span className="text-xs font-data text-[var(--color-text-dim)] shrink-0">
          {activeEvent.id}
        </span>
      </div>

      {/* Center */}
      <div className="flex items-center gap-2 text-xs font-data text-[var(--color-text-muted)]">
        {activeEvent.costImpact && (
          <>
            <span className="text-[var(--color-accent)]">${activeEvent.costImpact.estimated.toLocaleString()}</span>
            <span className="text-[var(--color-text-dim)]">|</span>
          </>
        )}
        {activeEvent.scheduleImpact && (
          <>
            <span>{activeEvent.scheduleImpact.daysAffected}d</span>
            <span className="text-[var(--color-text-dim)]">|</span>
          </>
        )}
        {activeEvent.scheduleImpact?.criticalPath && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-semantic-red-dim)", color: "var(--color-semantic-red)" }}>
            Critical Path
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <Link
          href={`/workspace/events/${activeEvent.id}`}
          className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
        >
          <ExternalLink size={10} />
          View Event
        </Link>
        <button
          onClick={() => selectEvent(null)}
          aria-label="Dismiss active event"
          className="p-1.5 rounded hover:bg-[var(--color-card)] text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
