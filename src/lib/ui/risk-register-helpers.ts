// Pure deterministic helpers for Risk Register drill-down.
// No React, no side effects, no API calls.

import type { DecisionEvent } from "@/lib/models/decision-event";
import type { ProjectMetrics } from "@/lib/demo/v5/resolvers/project-metrics";
import { FLAGS } from "@/lib/flags";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DrillDown = "cost" | "schedule" | "notice" | null;
export type SortKey = "newest" | "severity" | "cost" | "schedule";

// ---------------------------------------------------------------------------
// Drill-down filters
// ---------------------------------------------------------------------------

const DRILL_FILTERS: Record<
  Exclude<DrillDown, null>,
  (e: DecisionEvent) => boolean
> = {
  cost: (e) =>
    e.status !== "resolved" && (e.costImpact?.estimated ?? 0) > 0,
  schedule: (e) =>
    e.status !== "resolved" && (e.scheduleImpact?.daysAffected ?? 0) > 0,
  notice: (e) =>
    e.status === "open" &&
    e.contractReferences.some((r) => r.noticeDays && r.noticeDays > 0),
};

export function applyDrillDown(
  events: DecisionEvent[],
  drill: DrillDown,
): DecisionEvent[] {
  if (drill === null) return events;
  return events.filter(DRILL_FILTERS[drill]);
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function applySortKey(
  events: DecisionEvent[],
  key: SortKey,
): DecisionEvent[] {
  const sorted = [...events];
  switch (key) {
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "severity":
      sorted.sort((a, b) => {
        const sa = SEVERITY_ORDER[a.severity] ?? 9;
        const sb = SEVERITY_ORDER[b.severity] ?? 9;
        if (sa !== sb) return sa - sb;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      break;
    case "cost":
      sorted.sort(
        (a, b) =>
          (b.costImpact?.estimated ?? 0) - (a.costImpact?.estimated ?? 0),
      );
      break;
    case "schedule":
      sorted.sort(
        (a, b) =>
          (b.scheduleImpact?.daysAffected ?? 0) -
          (a.scheduleImpact?.daysAffected ?? 0),
      );
      break;
  }
  return sorted;
}

// ---------------------------------------------------------------------------
// Labels & microcopy
// ---------------------------------------------------------------------------

const DRILL_LABELS: Record<Exclude<DrillDown, null>, string> = {
  cost: "Cost Exposure",
  schedule: "Schedule Impact",
  notice: "Notice Clocks",
};

export function drillDownLabel(drill: DrillDown): string {
  return drill ? DRILL_LABELS[drill] : "";
}

export function costMicrocopy(
  events: DecisionEvent[],
  metrics: ProjectMetrics | null,
): string {
  const count = events.filter(
    (e) => e.status !== "resolved" && (e.costImpact?.estimated ?? 0) > 0,
  ).length;
  const pct = metrics ? `${Math.round(metrics.contingencyUsedPct)}% of contingency` : "";
  const unit = FLAGS.governedRiskSystem ? "item" : "event";
  if (count === 0) return "No cost exposure";
  return pct ? `${count} ${unit}${count !== 1 ? "s" : ""} · ${pct}` : `${count} ${unit}${count !== 1 ? "s" : ""}`;
}

export function scheduleMicrocopy(
  events: DecisionEvent[],
  metrics: ProjectMetrics | null,
): string {
  const count = events.filter(
    (e) =>
      e.status !== "resolved" && (e.scheduleImpact?.daysAffected ?? 0) > 0,
  ).length;
  const cpd = metrics?.criticalPathImpactDays ?? 0;
  const unit = FLAGS.governedRiskSystem ? "item" : "event";
  if (count === 0) return "No schedule impact";
  return cpd > 0
    ? `${count} ${unit}${count !== 1 ? "s" : ""} · ${cpd}d on critical path`
    : `${count} ${unit}${count !== 1 ? "s" : ""}`;
}

// ---------------------------------------------------------------------------
// Notice Clock resolver (deterministic, no AI)
// ---------------------------------------------------------------------------

export interface NoticeClockItem {
  eventId: string;
  title: string;
  clauseRef: string | null;
  daysRemaining: number;
  isOverdue: boolean;
}

/** Resolve active notice clocks from events. Returns items sorted by urgency (overdue first, then fewest days remaining). */
export function resolveNoticeClocks(events: DecisionEvent[]): NoticeClockItem[] {
  const items: NoticeClockItem[] = [];
  for (const e of events) {
    if (e.status !== "open") continue;
    const ref = e.contractReferences.find(
      (r) => r.noticeDays && r.noticeDays > 0,
    );
    if (!ref) continue;
    const hoursTotal = ref.noticeDays! * 24;
    const hoursElapsed =
      (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60);
    const daysRemaining = Math.ceil((hoursTotal - hoursElapsed) / 24);
    items.push({
      eventId: e.id,
      title: e.title,
      clauseRef: ref.clause || ref.section || null,
      daysRemaining,
      isOverdue: daysRemaining <= 0,
    });
  }
  items.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return a.daysRemaining - b.daysRemaining;
  });
  return items;
}

/** Count notice-bearing events and how many are overdue. */
export function noticeMicrocopy(events: DecisionEvent[]): string {
  let count = 0;
  let overdue = 0;
  for (const e of events) {
    const ref = e.contractReferences.find(
      (r) => r.noticeDays && r.noticeDays > 0,
    );
    if (!ref || e.status !== "open") continue;
    count++;
    const hoursTotal = ref.noticeDays! * 24;
    const hoursElapsed =
      (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursTotal - hoursElapsed <= 0) overdue++;
  }
  const unit = FLAGS.governedRiskSystem ? "item" : "event";
  if (count === 0) return "No active notices";
  return overdue > 0
    ? `${count} ${unit}${count !== 1 ? "s" : ""} · ${overdue} overdue`
    : `${count} ${unit}${count !== 1 ? "s" : ""}`;
}
