"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Radio,
  FileText,
  Building2,
  HardHat,
  Briefcase,
  Users,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { computeSync, type RealitySyncState } from "@/lib/reality-sync/compute-sync";
import { useEvents } from "@/lib/contexts/event-context";
import { useRole, type Role } from "@/lib/contexts/role-context";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useMemory } from "@/lib/contexts/memory-context";
import { DEMO_DAILY_LOGS_V5 } from "@/lib/demo/v5/dailyLogs";
import type { DriftSeverity } from "@/lib/reality-sync/drift-detector";
import { computeTopRisk } from "@/lib/risk/top-risk";
import { computeTrustStatus } from "@/components/trust/TrustBadge";

const STATUS_CONFIG: Record<DriftSeverity, { color: string; label: string }> = {
  synced: {
    color: "var(--color-semantic-green)",
    label: "Synced",
  },
  drift: {
    color: "var(--color-semantic-yellow)",
    label: "Variance Detected",
  },
  misaligned: {
    color: "var(--color-semantic-red)",
    label: "High Risk Misalignment",
  },
};

const COLUMN_ICONS: Record<string, React.ReactNode> = {
  "Field Reality": <Radio size={14} />,
  "Contract Position": <FileText size={14} />,
  "Office Narrative": <Building2 size={14} />,
};

const ROLE_LABELS: Record<Role, { label: string; icon: React.ReactNode }> = {
  field: { label: "Field", icon: <HardHat size={12} /> },
  pm: { label: "PM", icon: <Briefcase size={12} /> },
  stakeholder: { label: "Exec", icon: <Users size={12} /> },
};

export default function RealitySyncPanel() {
  const { events, activeEvent, selectEvent } = useEvents();
  const { role, setRole } = useRole();
  const { activeProject } = useActiveProject();
  const { allSuggestions } = useMemory();
  const [expanded, setExpanded] = useState(false);

  // Filter daily logs for the active project
  const projectLogs = useMemo(
    () => DEMO_DAILY_LOGS_V5.filter((l) => l.projectId === activeProject.id),
    [activeProject.id]
  );

  // Compute sync for all events (project-level) or single active event
  const sync: RealitySyncState = useMemo(() => {
    if (activeEvent) {
      return computeSync([activeEvent], projectLogs);
    }
    return computeSync(events, projectLogs);
  }, [events, activeEvent, projectLogs]);

  const overallConfig = STATUS_CONFIG[sync.overall];
  const columns = [sync.field, sync.contract, sync.office];

  const alignColor = activeEvent
    ? activeEvent.alignmentStatus === "synced"
      ? "var(--color-semantic-green)"
      : activeEvent.alignmentStatus === "drift"
      ? "var(--color-semantic-yellow)"
      : "var(--color-semantic-red)"
    : overallConfig.color;

  const noticeCount = useMemo(() => {
    return sync.drifts.filter((d) => d.ruleId === "unfiled-notice").length;
  }, [sync.drifts]);

  const topRisk = useMemo(() => {
    const unresolvedEvents = events
      .filter((e) => e.status !== "resolved")
      .map((e) => {
        const noticeRef = e.contractReferences.find(
          (r) => r.noticeDays !== undefined && r.noticeDays > 0
        );
        const noticeClockActive = !!noticeRef;
        let overdue = false;
        let overdueHours = 0;
        if (noticeRef?.noticeDays) {
          const hoursTotal = noticeRef.noticeDays * 24;
          const hoursElapsed =
            (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60);
          const hoursRemaining = hoursTotal - hoursElapsed;
          if (hoursRemaining <= 0) {
            overdue = true;
            overdueHours = Math.abs(Math.round(hoursRemaining));
          }
        }
        return {
          id: e.id,
          severity: e.severity,
          status: e.status,
          alignmentStatus: e.alignmentStatus,
          noticeClockActive,
          overdue,
          overdueHours,
          criticalPath: e.scheduleImpact?.criticalPath ?? false,
          scheduleImpactDays: e.scheduleImpact?.daysAffected ?? 0,
          costExposureAmount: e.costImpact?.estimated ?? 0,
          updatedAt: e.updatedAt,
        };
      });

    const suggestions = allSuggestions
      .filter((s) => s.status === "pending" || s.status === "edited")
      .map((s) => ({ trust: computeTrustStatus(s).status }));

    return computeTopRisk({
      projectStatus: sync.overall,
      driftCount: sync.drifts.length,
      activeNoticeClocks: noticeCount,
      contractValue: activeProject.contractValue,
      unresolvedEvents,
      suggestions,
    });
  }, [events, allSuggestions, sync, noticeCount, activeProject.contractValue]);

  return (
    <div className="border-b border-[var(--color-border)]">
      {/* Compact status bar — click to toggle detail */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((p) => !p)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium cursor-pointer bg-[var(--color-card)]"
      >
        {activeEvent ? (
          <>
            {/* ── Mode B: Active event selected ── */}
            {/* Left: alignment dot + title + ID */}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: alignColor }}
            />
            <span
              className="text-sm text-[var(--color-text-primary)] truncate max-w-[280px] shrink-0"
              title={activeEvent.title}
            >
              {activeEvent.title}
            </span>
            <span className="text-xs font-data text-[var(--color-text-dim)] shrink-0">
              {activeEvent.id}
            </span>

            {/* Center: cost / schedule / critical path + top risk */}
            <div className="flex items-center gap-2 text-xs font-data text-[var(--color-text-muted)]">
              {activeEvent.costImpact && (
                <>
                  <span className="text-[var(--color-accent)]">
                    ${activeEvent.costImpact.estimated.toLocaleString()}
                  </span>
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
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "var(--color-semantic-red-dim)",
                    color: "var(--color-semantic-red)",
                  }}
                >
                  Critical Path
                </span>
              )}
            </div>

            {/* Top risk */}
            <span
              className={`text-xs truncate max-w-[180px] text-[var(--color-text-muted)] ${
                topRisk.reasonCode === "notice_clock" || topRisk.reasonCode === "overdue"
                  ? "font-semibold"
                  : "font-medium"
              }`}
              title={topRisk.displayText}
            >
              {topRisk.displayText}
            </span>
          </>
        ) : (
          <>
            {/* ── Mode A: Project-level (no active event) ── */}
            <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
              {activeProject.name}
            </span>

            {/* Status chip with colored dot */}
            <span className="inline-flex items-center gap-1.5 border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-xs text-[var(--color-text-muted)] shrink-0">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: overallConfig.color }}
              />
              {overallConfig.label}
            </span>

            {/* Top risk microcopy */}
            <span
              className={`text-xs truncate max-w-[200px] text-[var(--color-text-muted)] ${
                topRisk.reasonCode === "notice_clock" || topRisk.reasonCode === "overdue"
                  ? "font-semibold"
                  : "font-medium"
              }`}
              title={topRisk.displayText}
            >
              {topRisk.displayText}
            </span>
          </>
        )}

        {/* Right: event actions (when active) + Role switcher + expand chevron */}
        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {activeEvent && (
            <>
              <Link
                href={`/workspace/events/${activeEvent.id}`}
                className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
              >
                <ExternalLink size={10} />
                View
              </Link>
              <button
                onClick={() => selectEvent(null)}
                aria-label="Dismiss active event"
                className="p-1 rounded hover:bg-[var(--color-card-hover)] text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                <X size={14} />
              </button>
              <span className="w-px h-5 bg-[var(--color-border)]" />
            </>
          )}
          <div className="inline-flex border border-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden">
            {(["field", "pm", "stakeholder"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex items-center gap-1 px-2.5 h-8 text-xs font-medium transition-all ${
                  role === r
                    ? "bg-slate-800 text-white"
                    : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
                aria-label={`Switch to ${ROLE_LABELS[r].label} role`}
              >
                {ROLE_LABELS[r].icon}
                {ROLE_LABELS[r].label}
              </button>
            ))}
          </div>
          <ChevronDown
            size={14}
            className={`transition-transform text-[var(--color-text-dim)] ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* 3-column layout — collapsible */}
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-[var(--color-border)] border-t border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          {columns.map((col) => {
            const config = STATUS_CONFIG[col.status];
            return (
              <div key={col.label} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[var(--color-text-muted)]">
                    {COLUMN_ICONS[col.label]}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                    {col.label}
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full block ml-auto"
                    style={{ backgroundColor: config.color }}
                  />
                </div>
                <ul className="space-y-2">
                  {col.items.slice(0, 4).map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                        style={{ backgroundColor: config.color }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
