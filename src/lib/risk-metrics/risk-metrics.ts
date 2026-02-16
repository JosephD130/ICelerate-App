// Single source of truth for Risk Register KPI computation.
// Pure deterministic functions — no React, no side effects, no API calls.

import type { DecisionEvent } from "@/lib/models/decision-event";
import type { ProjectMetrics } from "@/lib/demo/v5/resolvers/project-metrics";
import type { RoleMode } from "@/lib/ui/risk-register-role";
import type { ProjectSnapshot } from "@/lib/memory/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricCalculation {
  formula: string;
  inputs: string[];
  assumptions: string[];
  limitations: string[];
}

export interface Contributor {
  eventId: string;
  title: string;
  amount: number; // $ for cost, days for schedule, 1 for notice
  description: string;
}

export interface KpiDelta {
  direction: "up" | "down" | "unchanged";
  formatted: string; // e.g. "↑ $12,000" or "↓ 3 days"
  label: string; // e.g. "since last week"
}

export interface MetricResult {
  id: string; // "exposure" | "days" | "notice"
  value: number;
  formatted: string; // "$45,000" or "12" or "3"
  label: string; // Role-aware
  whatThisMeans: string; // Role-aware explanation
  microcopy: string; // Deterministic breakdown
  ctaLabel: string; // Role-aware CTA text
  contributors: Contributor[];
  calculation: MetricCalculation;
  delta?: KpiDelta;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function plural(n: number, singular: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${singular}s`;
}

function resolveDelta(
  snapshot: ProjectSnapshot | undefined,
  field: string,
  formatValue: (v: number) => string,
): KpiDelta | undefined {
  if (!snapshot) return undefined;
  const d = snapshot.deltasFromPrior.find((dp) => dp.field === field);
  if (!d) return undefined;
  const prior = typeof d.prior === "number" ? d.prior : Number(d.prior);
  const current = typeof d.current === "number" ? d.current : Number(d.current);
  const diff = current - prior;
  if (diff === 0) return { direction: "unchanged", formatted: "", label: "" };
  const arrow = diff > 0 ? "\u2191" : "\u2193";
  return {
    direction: diff > 0 ? "up" : "down",
    formatted: `${arrow} ${formatValue(Math.abs(diff))}`,
    label: "since last week",
  };
}

// ---------------------------------------------------------------------------
// Role-aware label maps
// ---------------------------------------------------------------------------

const EXPOSURE_LABELS: Record<RoleMode, string> = {
  field: "Exposure at Risk",
  pm: "Exposure at Risk",
  stakeholder: "Budget Exposure",
};

const EXPOSURE_WHAT: Record<RoleMode, string> = {
  field: "Potential cost impact if unresolved.",
  pm: "Potential cost impact if unresolved.",
  stakeholder: "Total unresolved budget risk across active events.",
};

const EXPOSURE_CTA: Record<RoleMode, string> = {
  field: "View cost drivers",
  pm: "View cost drivers",
  stakeholder: "View budget drivers",
};

const DAYS_LABELS: Record<RoleMode, string> = {
  field: "Schedule Exposure",
  pm: "Days at Risk",
  stakeholder: "Timeline Risk",
};

const DAYS_WHAT: Record<RoleMode, string> = {
  field: "Schedule days at risk from active field conditions.",
  pm: "Potential schedule impact from active risks.",
  stakeholder: "Aggregate timeline exposure requiring executive attention.",
};

const DAYS_CTA: Record<RoleMode, string> = {
  field: "View schedule drivers",
  pm: "View schedule drivers",
  stakeholder: "View timeline drivers",
};

const NOTICE_LABELS: Record<RoleMode, string> = {
  field: "Active Notice Clocks",
  pm: "Active Notice Clocks",
  stakeholder: "Contractual Deadlines",
};

const NOTICE_WHAT: Record<RoleMode, string> = {
  field: "Contractual deadlines that can affect entitlement.",
  pm: "Contractual deadlines that can affect entitlement.",
  stakeholder: "Active notice windows with potential legal exposure.",
};

const NOTICE_CTA: Record<RoleMode, string> = {
  field: "Review notice items",
  pm: "Review notice items",
  stakeholder: "Review deadlines",
};

// ---------------------------------------------------------------------------
// computeExposure
// ---------------------------------------------------------------------------

export function computeExposure(
  events: DecisionEvent[],
  metrics: ProjectMetrics | null,
  role: RoleMode,
  snapshot?: ProjectSnapshot,
): MetricResult {
  const contributing = events.filter(
    (e) =>
      e.status !== "resolved" &&
      e.costImpact &&
      e.costImpact.estimated > 0,
  );

  const value = contributing.reduce(
    (sum, e) => sum + (e.costImpact?.estimated ?? 0),
    0,
  );

  const contributors: Contributor[] = contributing.map((e) => ({
    eventId: e.id,
    title: e.title,
    amount: e.costImpact!.estimated,
    description: e.costImpact!.description,
  }));

  const n = contributors.length;
  let microcopy: string;
  if (n === 0) {
    microcopy = "No cost exposure";
  } else if (metrics) {
    microcopy = `${plural(n, "event")} \u00b7 ${Math.round(metrics.contingencyUsedPct)}% of contingency`;
  } else {
    microcopy = plural(n, "event");
  }

  return {
    id: "exposure",
    value,
    formatted: `$${value.toLocaleString()}`,
    label: EXPOSURE_LABELS[role],
    whatThisMeans: EXPOSURE_WHAT[role],
    microcopy,
    ctaLabel: EXPOSURE_CTA[role],
    contributors,
    calculation: {
      formula:
        "Sum of costImpact.estimated across all unresolved events that have a cost impact greater than zero.",
      inputs: [
        "costImpact.estimated from each DecisionEvent",
        "Event status (excludes resolved)",
        "Contingency usage percentage from project metrics",
      ],
      assumptions: [
        "Each event\u2019s cost estimate is independent",
        "No double-counting across related events",
        "Estimates use contractor-submitted values unless overridden",
      ],
      limitations: [
        "Does not account for concurrent risk reduction",
        "Confidence level not factored into sum",
        "Change orders in draft status counted at face value",
      ],
    },
    delta: resolveDelta(snapshot, "totalExposure", (v) => `$${v.toLocaleString()}`),
  };
}

// ---------------------------------------------------------------------------
// computeDaysAtRisk
// ---------------------------------------------------------------------------

export function computeDaysAtRisk(
  events: DecisionEvent[],
  metrics: ProjectMetrics | null,
  role: RoleMode,
  snapshot?: ProjectSnapshot,
): MetricResult {
  const contributing = events.filter(
    (e) =>
      e.status !== "resolved" &&
      e.scheduleImpact &&
      e.scheduleImpact.daysAffected > 0,
  );

  const value = contributing.reduce(
    (sum, e) => sum + (e.scheduleImpact?.daysAffected ?? 0),
    0,
  );

  const contributors: Contributor[] = contributing.map((e) => ({
    eventId: e.id,
    title: e.title,
    amount: e.scheduleImpact!.daysAffected,
    description: e.scheduleImpact!.description,
  }));

  const n = contributors.length;
  const cpd = metrics?.criticalPathImpactDays ?? 0;
  let microcopy: string;
  if (n === 0) {
    microcopy = "No schedule impact";
  } else if (cpd > 0) {
    microcopy = `${plural(n, "event")} \u00b7 ${cpd}d on critical path`;
  } else {
    microcopy = plural(n, "event");
  }

  return {
    id: "days",
    value,
    formatted: String(value),
    label: DAYS_LABELS[role],
    whatThisMeans: DAYS_WHAT[role],
    microcopy,
    ctaLabel: DAYS_CTA[role],
    contributors,
    calculation: {
      formula:
        "Sum of scheduleImpact.daysAffected across all unresolved events that have a schedule impact.",
      inputs: [
        "scheduleImpact.daysAffected from each DecisionEvent",
        "Event status (excludes resolved)",
        "Critical path flag from project metrics",
      ],
      assumptions: [
        "Schedule impacts are additive (worst case)",
        "No parallel path compression applied",
        "Critical path determination from last schedule update",
      ],
      limitations: [
        "Concurrent delays may reduce actual impact",
        "Does not model float consumption",
        "Critical path data may be stale if schedule not updated",
      ],
    },
    delta: resolveDelta(snapshot, "totalScheduleDays", (v) => `${v} day${v !== 1 ? "s" : ""}`),
  };
}

// ---------------------------------------------------------------------------
// computeNoticeClocks
// ---------------------------------------------------------------------------

export function computeNoticeClocks(
  events: DecisionEvent[],
  role: RoleMode,
  snapshot?: ProjectSnapshot,
): MetricResult {
  const contributing = events.filter(
    (e) =>
      e.status === "open" &&
      e.contractReferences.some((r) => r.noticeDays && r.noticeDays > 0),
  );

  const value = contributing.length;

  // Compute overdue count
  let overdue = 0;
  const contributors: Contributor[] = contributing.map((e) => {
    const ref = e.contractReferences.find(
      (r) => r.noticeDays && r.noticeDays > 0,
    )!;
    const hoursTotal = ref.noticeDays! * 24;
    const hoursElapsed =
      (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursTotal - hoursElapsed <= 0) overdue++;
    const clauseRef = ref.clause || ref.section;
    return {
      eventId: e.id,
      title: e.title,
      amount: 1,
      description: `${clauseRef} \u2014 ${ref.noticeDays}-day window`,
    };
  });

  const n = contributors.length;
  let microcopy: string;
  if (n === 0) {
    microcopy = "No active notices";
  } else if (overdue > 0) {
    microcopy = `${plural(n, "event")} \u00b7 ${overdue} overdue`;
  } else {
    microcopy = plural(n, "event");
  }

  return {
    id: "notice",
    value,
    formatted: String(value),
    label: NOTICE_LABELS[role],
    whatThisMeans: NOTICE_WHAT[role],
    microcopy,
    ctaLabel: NOTICE_CTA[role],
    contributors,
    calculation: {
      formula:
        "Count of open events with contractReferences containing a noticeDays value greater than zero.",
      inputs: [
        "contractReferences[].noticeDays from each DecisionEvent",
        "Event status (open only)",
        "Event createdAt timestamp for clock calculation",
      ],
      assumptions: [
        "Notice window starts at event creation",
        "All referenced clauses require written notice",
        "Clock runs calendar days, not business days",
      ],
      limitations: [
        "Does not track partial compliance",
        "Multiple clauses per event counted as single notice",
        "Does not verify if notice was actually sent",
      ],
    },
    delta: resolveDelta(snapshot, "activeNoticeClocks", (v) => `${v} clock${v !== 1 ? "s" : ""}`),
  };
}
