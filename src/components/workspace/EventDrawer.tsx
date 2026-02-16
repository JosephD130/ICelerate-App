"use client";

import {
  X,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Clock,
  Scale,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { TYPO, cx } from "@/lib/ui/typography";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/ui/semantic";
import type { DecisionEvent } from "@/lib/models/decision-event";
import { FLAGS } from "@/lib/flags";
import { T } from "@/lib/terminology";
import { generateFriendlyLabel } from "@/lib/models/event-labels";

interface EventDrawerProps {
  open: boolean;
  event: DecisionEvent | null;
  onClose: () => void;
  onOpenEvent: (eventId: string) => void;
  onDraftUpdate: (eventId: string) => void;
}

function truncate(text: string, max = 300): string {
  return text.length > max ? text.slice(0, max) + "\u2026" : text;
}

export default function EventDrawer({
  open,
  event,
  onClose,
  onOpenEvent,
  onDraftUpdate,
}: EventDrawerProps) {
  const severity = event ? SEVERITY_COLORS[event.severity] : null;
  const status = event ? STATUS_COLORS[event.status] ?? STATUS_COLORS.open : null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        data-testid="event-drawer-panel"
        className="fixed right-0 top-0 z-50 h-full w-[380px] flex flex-col transition-transform duration-200 ease-in-out"
        style={{
          background: "var(--color-card)",
          borderLeft: "1px solid var(--color-border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {!event ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No risk item selected
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              className="px-5 py-4"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className={cx(TYPO.cardTitle, "text-[var(--color-text-primary)] line-clamp-2 leading-snug")}>
                  {event.title}
                </h2>
                <button
                  onClick={onClose}
                  className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer mt-0.5"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2">
                {severity && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                    style={{ backgroundColor: severity.bg, color: severity.text }}
                  >
                    {event.severity}
                  </span>
                )}
                {status && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
              {/* Location */}
              {(event.location || event.stationNumber) && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <MapPin size={13} className="shrink-0" />
                  <span className="font-data">
                    {event.stationNumber ? `@ ${event.stationNumber}` : event.location}
                  </span>
                </div>
              )}

              {/* Impact summary */}
              {(event.costImpact || event.scheduleImpact) && (
                <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                  {event.costImpact && event.costImpact.estimated > 0 && (
                    <span className="flex items-center gap-1 font-data">
                      <DollarSign size={13} />
                      ${event.costImpact.estimated.toLocaleString()}
                    </span>
                  )}
                  {event.scheduleImpact && event.scheduleImpact.daysAffected > 0 && (
                    <span className="flex items-center gap-1 font-data">
                      <Clock size={13} />
                      {event.scheduleImpact.daysAffected}d
                      {event.scheduleImpact.criticalPath && (
                        <span className="text-[var(--color-semantic-red)] text-xs ml-1">critical path</span>
                      )}
                    </span>
                  )}
                </div>
              )}

              {/* Contract references */}
              {event.contractReferences.length > 0 && (
                <section>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Scale size={11} style={{ color: "var(--color-semantic-purple)" }} />
                    <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
                      Contract References
                    </span>
                  </div>
                  <div className="space-y-2">
                    {event.contractReferences.map((ref, i) => (
                      <div
                        key={i}
                        className="pl-3"
                        style={{ borderLeft: "2px solid var(--color-semantic-purple)" }}
                      >
                        <div className="font-data text-xs font-bold" style={{ color: "var(--color-semantic-purple)" }}>
                          {ref.section} &mdash; {ref.clause}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {ref.summary}
                        </div>
                        {ref.noticeDays && ref.noticeDays > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "var(--color-semantic-yellow)" }}>
                            <AlertTriangle size={10} />
                            {ref.noticeDays}-day notice required
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Description */}
              {event.description && event.description.trim() && (
                <section>
                  <div className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)] mb-2")}>
                    Description
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                    {truncate(event.description)}
                  </p>
                </section>
              )}

              {/* Event ID */}
              <div className="text-xs font-data text-[var(--color-text-dim)]">
                {FLAGS.eventFlowSimplification
                  ? (event.friendlyLabel ?? generateFriendlyLabel(event.id))
                  : event.id}
              </div>
            </div>

            {/* Action footer */}
            <div
              className="px-5 py-4 space-y-2"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <button
                onClick={() => onOpenEvent(event.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all cursor-pointer bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
              >
                <ExternalLink size={14} />
                {FLAGS.governedRiskSystem ? `Open ${T.RISK_ITEM}` : "Open Event"}
              </button>
              <button
                onClick={() => onDraftUpdate(event.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all cursor-pointer bg-[var(--color-accent-dim)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
              >
                <MessageSquare size={14} />
                Draft Stakeholder Update
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
