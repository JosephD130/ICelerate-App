/**
 * Self-check spec for risk-metrics.
 * Run: npx tsx src/lib/risk-metrics/risk-metrics.test.ts
 */

import {
  computeExposure,
  computeDaysAtRisk,
  computeNoticeClocks,
} from "./risk-metrics";
import type { DecisionEvent } from "@/lib/models/decision-event";
import type { ProjectMetrics } from "@/lib/demo/v5/resolvers/project-metrics";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

// ---------------------------------------------------------------------------
// Minimal event factory
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<DecisionEvent> = {}): DecisionEvent {
  return {
    id: `e-${Math.random().toString(36).slice(2, 6)}`,
    title: "Test Event",
    description: "",
    trigger: "test",
    station: "capture",
    severity: "medium",
    status: "open",
    altitude: "ground",
    alignmentStatus: "synced",
    contractReferences: [],
    stakeholderNotifications: [],
    velocity: { detectedAt: new Date().toISOString(), traditionalDays: 18 },
    communications: [],
    monitorScores: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "test",
    toolSource: "test",
    tags: [],
    attachments: [],
    lifecycleStage: "field-record",
    evidenceIds: [],
    ...overrides,
  };
}

function makeMetrics(overrides: Partial<ProjectMetrics> = {}): ProjectMetrics {
  return {
    openEventCount: 0,
    resolvedEventCount: 0,
    totalCostExposure: 0,
    totalScheduleImpactDays: 0,
    criticalPathImpactDays: 0,
    contingencyUsedPct: 0,
    alignmentBreakdown: { synced: 0, drift: 0, highRisk: 0 },
    severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    noticePendingCount: 0,
    stakeholderGapCount: 0,
    logCount: 0,
    avgSourceCoverage: 0,
    scheduleVarianceDays: 0,
    ...overrides,
  };
}

// ===========================================================================
// computeExposure
// ===========================================================================

// Empty events
{
  const r = computeExposure([], null, "pm");
  assert(r.value === 0, "exposure: empty → value 0");
  assert(r.microcopy === "No cost exposure", "exposure: empty → microcopy");
  assert(r.contributors.length === 0, "exposure: empty → 0 contributors");
  assert(r.formatted === "$0", "exposure: empty → formatted $0");
}

// Mix of resolved + unresolved — only sums unresolved
{
  const events = [
    makeEvent({
      costImpact: { estimated: 5000, currency: "USD", confidence: "high", description: "cost A" },
    }),
    makeEvent({
      costImpact: { estimated: 3000, currency: "USD", confidence: "medium", description: "cost B" },
    }),
    makeEvent({
      status: "resolved",
      costImpact: { estimated: 10000, currency: "USD", confidence: "high", description: "resolved" },
    }),
  ];
  const r = computeExposure(events, null, "pm");
  assert(r.value === 8000, "exposure: sums only unresolved (5k + 3k)");
  assert(r.contributors.length === 2, "exposure: 2 contributors (resolved excluded)");
}

// Events with cost 0 excluded from contributors
{
  const events = [
    makeEvent({
      costImpact: { estimated: 0, currency: "USD", confidence: "high", description: "zero" },
    }),
    makeEvent({
      costImpact: { estimated: 2000, currency: "USD", confidence: "high", description: "real" },
    }),
  ];
  const r = computeExposure(events, null, "pm");
  assert(r.value === 2000, "exposure: zero-cost excluded from value");
  assert(r.contributors.length === 1, "exposure: zero-cost excluded from contributors");
}

// Microcopy with metrics includes contingency %
{
  const events = [
    makeEvent({
      costImpact: { estimated: 5000, currency: "USD", confidence: "high", description: "x" },
    }),
  ];
  const m = makeMetrics({ contingencyUsedPct: 42.5 });
  const r = computeExposure(events, m, "pm");
  assert(r.microcopy === "1 event \u00b7 43% of contingency", "exposure: microcopy with contingency");
}

// Microcopy without metrics — just event count
{
  const events = [
    makeEvent({
      costImpact: { estimated: 5000, currency: "USD", confidence: "high", description: "x" },
    }),
    makeEvent({
      costImpact: { estimated: 3000, currency: "USD", confidence: "high", description: "x" },
    }),
  ];
  const r = computeExposure(events, null, "pm");
  assert(r.microcopy === "2 events", "exposure: microcopy without metrics");
}

// Role stakeholder → label "Budget Exposure"
{
  const r = computeExposure([], null, "stakeholder");
  assert(r.label === "Budget Exposure", "exposure: stakeholder label");
  assert(r.ctaLabel === "View budget drivers", "exposure: stakeholder ctaLabel");
}

// Role pm → label "Exposure at Risk"
{
  const r = computeExposure([], null, "pm");
  assert(r.label === "Exposure at Risk", "exposure: pm label");
  assert(r.ctaLabel === "View cost drivers", "exposure: pm ctaLabel");
}

// ===========================================================================
// computeDaysAtRisk
// ===========================================================================

// Empty events
{
  const r = computeDaysAtRisk([], null, "pm");
  assert(r.value === 0, "days: empty → value 0");
  assert(r.microcopy === "No schedule impact", "days: empty → microcopy");
}

// Sum only unresolved events
{
  const events = [
    makeEvent({
      scheduleImpact: { daysAffected: 5, criticalPath: false, description: "delay A" },
    }),
    makeEvent({
      scheduleImpact: { daysAffected: 3, criticalPath: true, description: "delay B" },
    }),
    makeEvent({
      status: "resolved",
      scheduleImpact: { daysAffected: 10, criticalPath: false, description: "resolved" },
    }),
  ];
  const r = computeDaysAtRisk(events, null, "pm");
  assert(r.value === 8, "days: sums only unresolved (5 + 3)");
  assert(r.contributors.length === 2, "days: 2 contributors");
}

// Critical path days in microcopy when > 0
{
  const events = [
    makeEvent({
      scheduleImpact: { daysAffected: 5, criticalPath: true, description: "x" },
    }),
  ];
  const m = makeMetrics({ criticalPathImpactDays: 5 });
  const r = computeDaysAtRisk(events, m, "pm");
  assert(r.microcopy === "1 event \u00b7 5d on critical path", "days: microcopy with critical path");
}

// No critical path → just event count
{
  const events = [
    makeEvent({
      scheduleImpact: { daysAffected: 3, criticalPath: false, description: "x" },
    }),
    makeEvent({
      scheduleImpact: { daysAffected: 2, criticalPath: false, description: "x" },
    }),
  ];
  const r = computeDaysAtRisk(events, makeMetrics({ criticalPathImpactDays: 0 }), "pm");
  assert(r.microcopy === "2 events", "days: microcopy without critical path");
}

// Role field → "Schedule Exposure"
{
  const r = computeDaysAtRisk([], null, "field");
  assert(r.label === "Schedule Exposure", "days: field label");
  assert(r.ctaLabel === "View schedule drivers", "days: field ctaLabel");
}

// Role stakeholder → "Timeline Risk"
{
  const r = computeDaysAtRisk([], null, "stakeholder");
  assert(r.label === "Timeline Risk", "days: stakeholder label");
  assert(r.ctaLabel === "View timeline drivers", "days: stakeholder ctaLabel");
}

// ===========================================================================
// computeNoticeClocks
// ===========================================================================

// Empty events
{
  const r = computeNoticeClocks([], "pm");
  assert(r.value === 0, "notice: empty → value 0");
  assert(r.microcopy === "No active notices", "notice: empty → microcopy");
}

// Only open events with noticeDays > 0 counted
{
  const events = [
    makeEvent({
      status: "open",
      contractReferences: [{ section: "GC", clause: "7.1", summary: "x", noticeDays: 10 }],
    }),
    makeEvent({
      status: "in-progress",
      contractReferences: [{ section: "GC", clause: "4.2", summary: "x", noticeDays: 5 }],
    }),
    makeEvent({
      status: "open",
      contractReferences: [{ section: "A", clause: "1", summary: "x" }],
    }),
  ];
  const r = computeNoticeClocks(events, "pm");
  assert(r.value === 1, "notice: only 1 open event with noticeDays > 0");
  assert(r.contributors.length === 1, "notice: 1 contributor");
}

// in-progress events excluded (only "open")
{
  const events = [
    makeEvent({
      status: "in-progress",
      contractReferences: [{ section: "A", clause: "1", summary: "x", noticeDays: 5 }],
    }),
  ];
  const r = computeNoticeClocks(events, "pm");
  assert(r.value === 0, "notice: in-progress excluded");
}

// Overdue detection in microcopy
{
  const longAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
  const events = [
    makeEvent({
      status: "open",
      createdAt: longAgo,
      contractReferences: [{ section: "A", clause: "1", summary: "x", noticeDays: 5 }],
    }),
    makeEvent({
      status: "open",
      contractReferences: [{ section: "B", clause: "2", summary: "x", noticeDays: 999 }],
    }),
  ];
  const r = computeNoticeClocks(events, "pm");
  assert(r.microcopy === "2 events \u00b7 1 overdue", "notice: microcopy with 1 overdue");
}

// Contributors include clause reference
{
  const events = [
    makeEvent({
      status: "open",
      title: "Notice Event",
      contractReferences: [{ section: "GC", clause: "7.1", summary: "x", noticeDays: 10 }],
    }),
  ];
  const r = computeNoticeClocks(events, "pm");
  assert(r.contributors[0].description.includes("7.1"), "notice: contributor has clause ref");
  assert(r.contributors[0].description.includes("10-day"), "notice: contributor has window");
}

// Role stakeholder → "Contractual Deadlines"
{
  const r = computeNoticeClocks([], "stakeholder");
  assert(r.label === "Contractual Deadlines", "notice: stakeholder label");
  assert(r.ctaLabel === "Review deadlines", "notice: stakeholder ctaLabel");
}

// Role pm → "Active Notice Clocks"
{
  const r = computeNoticeClocks([], "pm");
  assert(r.label === "Active Notice Clocks", "notice: pm label");
}

// ===========================================================================
// Calculation metadata present
// ===========================================================================

{
  const r = computeExposure([], null, "pm");
  assert(r.calculation.formula.length > 0, "exposure: has formula");
  assert(r.calculation.inputs.length > 0, "exposure: has inputs");
  assert(r.calculation.assumptions.length > 0, "exposure: has assumptions");
  assert(r.calculation.limitations.length > 0, "exposure: has limitations");
}

{
  const r = computeDaysAtRisk([], null, "pm");
  assert(r.calculation.formula.length > 0, "days: has formula");
}

{
  const r = computeNoticeClocks([], "pm");
  assert(r.calculation.formula.length > 0, "notice: has formula");
}

console.log("\nDone.");
