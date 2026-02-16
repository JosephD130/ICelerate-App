// src/lib/demo/v5/resolvers/project-metrics.ts
// Pure deterministic metrics computed from V5 project data and daily logs.
// No React hooks, no side effects, no API calls.

import { DEMO_PROJECT_BY_ID } from "@/lib/demo/v5/projects";
import { DEMO_DAILY_LOGS_V5 } from "@/lib/demo/v5/dailyLogs";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface ProjectMetrics {
  openEventCount: number;
  resolvedEventCount: number;
  totalCostExposure: number;
  totalScheduleImpactDays: number;
  criticalPathImpactDays: number;
  contingencyUsedPct: number; // totalCostExposure / project.contingency * 100
  alignmentBreakdown: { synced: number; drift: number; highRisk: number };
  severityBreakdown: { critical: number; high: number; medium: number; low: number };
  noticePendingCount: number; // events where noticeRequired=true and status!="resolved"
  stakeholderGapCount: number; // unique stakeholders linked to open events but count across events
  logCount: number; // daily logs for this project
  avgSourceCoverage: number; // average of all source coverage values
  scheduleVarianceDays: number; // diff between endDateForecast and endDateBaseline in calendar days
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse YYYY-MM-DD string and compute difference in calendar days. */
function daysBetween(dateA: string, dateB: string): number {
  const msA = new Date(dateA).getTime();
  const msB = new Date(dateB).getTime();
  return Math.round((msB - msA) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Compute project-level metrics for a single project.
 * Returns null if the project is not found.
 */
export function resolveProjectMetrics(projectId: string): ProjectMetrics | null {
  const project = DEMO_PROJECT_BY_ID[projectId];
  if (!project) return null;

  const events = project.events;
  const logs = DEMO_DAILY_LOGS_V5.filter((l) => l.projectId === projectId);

  // Event counts by status
  let openEventCount = 0;
  let resolvedEventCount = 0;
  for (const e of events) {
    if (e.status === "open" || e.status === "in_progress") openEventCount++;
    if (e.status === "resolved") resolvedEventCount++;
  }

  // Cost exposure
  const totalCostExposure = events.reduce(
    (sum, e) => sum + e.costExposure.amount,
    0,
  );

  // Schedule impact: sum of all schedule days, plus critical-path-only sum
  let totalScheduleImpactDays = 0;
  let criticalPathImpactDays = 0;
  for (const e of events) {
    totalScheduleImpactDays += e.scheduleImpact.days;
    if (e.scheduleImpact.criticalPath) {
      criticalPathImpactDays += e.scheduleImpact.days;
    }
  }

  // Contingency usage
  const contingencyUsedPct =
    project.contingency > 0
      ? (totalCostExposure / project.contingency) * 100
      : 0;

  // Alignment breakdown
  const alignmentBreakdown = { synced: 0, drift: 0, highRisk: 0 };
  for (const e of events) {
    if (e.alignmentStatus === "synced") alignmentBreakdown.synced++;
    else if (e.alignmentStatus === "drift") alignmentBreakdown.drift++;
    else if (e.alignmentStatus === "high_risk") alignmentBreakdown.highRisk++;
  }

  // Severity breakdown
  const severityBreakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const e of events) {
    severityBreakdown[e.severity]++;
  }

  // Notice pending: events where noticeRequired=true and status!="resolved"
  let noticePendingCount = 0;
  for (const e of events) {
    if (e.noticeRequired && e.status !== "resolved") {
      noticePendingCount++;
    }
  }

  // Stakeholder gap: count unique stakeholders linked to open (non-resolved) events
  const openStakeholderIds = new Set<string>();
  for (const e of events) {
    if (e.status !== "resolved") {
      for (const sid of e.stakeholderIds) {
        openStakeholderIds.add(sid);
      }
    }
  }
  const stakeholderGapCount = openStakeholderIds.size;

  // Log count
  const logCount = logs.length;

  // Average source coverage
  const sources = project.sourceProfile.sources;
  const avgSourceCoverage =
    sources.length > 0
      ? sources.reduce((sum, s) => sum + s.coverage, 0) / sources.length
      : 0;

  // Schedule variance: endDateForecast - endDateBaseline in calendar days
  const scheduleVarianceDays = daysBetween(
    project.endDateBaseline,
    project.endDateForecast,
  );

  return {
    openEventCount,
    resolvedEventCount,
    totalCostExposure,
    totalScheduleImpactDays,
    criticalPathImpactDays,
    contingencyUsedPct: Math.round(contingencyUsedPct * 100) / 100,
    alignmentBreakdown,
    severityBreakdown,
    noticePendingCount,
    stakeholderGapCount,
    logCount,
    avgSourceCoverage: Math.round(avgSourceCoverage * 100) / 100,
    scheduleVarianceDays,
  };
}
