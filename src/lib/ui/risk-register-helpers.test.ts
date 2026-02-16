/**
 * Self-check spec for risk-register-helpers.
 * Run: npx tsx src/lib/ui/risk-register-helpers.test.ts
 */

import {
  applyDrillDown,
  applySortKey,
  drillDownLabel,
  costMicrocopy,
  noticeMicrocopy,
  resolveNoticeClocks,
} from "./risk-register-helpers";
import type { DecisionEvent } from "@/lib/models/decision-event";

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
    title: "Test",
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

// ---------------------------------------------------------------------------
// applyDrillDown
// ---------------------------------------------------------------------------

// cost: returns only non-resolved events with cost > 0
{
  const events = [
    makeEvent({ costImpact: { estimated: 5000, currency: "USD", confidence: "high", description: "x" } }),
    makeEvent({ costImpact: { estimated: 0, currency: "USD", confidence: "high", description: "x" } }),
    makeEvent({
      status: "resolved",
      costImpact: { estimated: 3000, currency: "USD", confidence: "high", description: "x" },
    }),
    makeEvent({}), // no cost
  ];
  const result = applyDrillDown(events, "cost");
  assert(result.length === 1, "drill cost — only 1 event with cost > 0 and not resolved");
}

// schedule: returns only non-resolved events with daysAffected > 0
{
  const events = [
    makeEvent({ scheduleImpact: { daysAffected: 5, criticalPath: false, description: "x" } }),
    makeEvent({ scheduleImpact: { daysAffected: 0, criticalPath: false, description: "x" } }),
    makeEvent({
      status: "resolved",
      scheduleImpact: { daysAffected: 3, criticalPath: true, description: "x" },
    }),
  ];
  const result = applyDrillDown(events, "schedule");
  assert(result.length === 1, "drill schedule — only 1 event with days > 0 and not resolved");
}

// notice: returns only open events with noticeDays > 0
{
  const events = [
    makeEvent({
      status: "open",
      contractReferences: [{ section: "A", clause: "1", summary: "x", noticeDays: 5 }],
    }),
    makeEvent({
      status: "in-progress",
      contractReferences: [{ section: "B", clause: "2", summary: "x", noticeDays: 3 }],
    }),
    makeEvent({
      status: "open",
      contractReferences: [{ section: "C", clause: "3", summary: "x" }], // no noticeDays
    }),
  ];
  const result = applyDrillDown(events, "notice");
  assert(result.length === 1, "drill notice — only 1 open event with noticeDays > 0");
}

// null drill returns all events
{
  const events = [makeEvent(), makeEvent(), makeEvent()];
  const result = applyDrillDown(events, null);
  assert(result.length === 3, "drill null — returns all events");
}

// ---------------------------------------------------------------------------
// applySortKey
// ---------------------------------------------------------------------------

// severity: critical before high before medium
{
  const events = [
    makeEvent({ severity: "medium", createdAt: "2025-01-03T00:00:00Z" }),
    makeEvent({ severity: "critical", createdAt: "2025-01-01T00:00:00Z" }),
    makeEvent({ severity: "high", createdAt: "2025-01-02T00:00:00Z" }),
  ];
  const result = applySortKey(events, "severity");
  assert(result[0].severity === "critical", "sort severity — critical first");
  assert(result[1].severity === "high", "sort severity — high second");
  assert(result[2].severity === "medium", "sort severity — medium third");
}

// cost: highest cost first, nulls last
{
  const events = [
    makeEvent({ costImpact: { estimated: 1000, currency: "USD", confidence: "high", description: "x" } }),
    makeEvent({}), // no cost — should be last
    makeEvent({ costImpact: { estimated: 5000, currency: "USD", confidence: "high", description: "x" } }),
  ];
  const result = applySortKey(events, "cost");
  assert(result[0].costImpact?.estimated === 5000, "sort cost — highest first");
  assert(result[1].costImpact?.estimated === 1000, "sort cost — second");
  assert(!result[2].costImpact, "sort cost — no cost last");
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------
assert(drillDownLabel("cost") === "Cost Exposure", "label cost");
assert(drillDownLabel("schedule") === "Schedule Impact", "label schedule");
assert(drillDownLabel("notice") === "Notice Clocks", "label notice");
assert(drillDownLabel(null) === "", "label null");

// ---------------------------------------------------------------------------
// Microcopy
// ---------------------------------------------------------------------------

// costMicrocopy
{
  const events = [
    makeEvent({ costImpact: { estimated: 5000, currency: "USD", confidence: "high", description: "x" } }),
    makeEvent({ costImpact: { estimated: 3000, currency: "USD", confidence: "high", description: "x" } }),
    makeEvent({ status: "resolved", costImpact: { estimated: 1000, currency: "USD", confidence: "high", description: "x" } }),
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = costMicrocopy(events, { contingencyUsedPct: 42.5 } as any);
  assert(m === "2 events · 43% of contingency", "costMicrocopy with metrics");
}

{
  const m = costMicrocopy([], null);
  assert(m === "No cost exposure", "costMicrocopy empty");
}

// noticeMicrocopy
{
  const longAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(); // 200 days ago
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
  const m = noticeMicrocopy(events);
  assert(m === "2 events · 1 overdue", "noticeMicrocopy with 1 overdue");
}

// ---------------------------------------------------------------------------
// resolveNoticeClocks
// ---------------------------------------------------------------------------

// Returns correct items for events with notice clocks
{
  const recentEvent = makeEvent({
    status: "open",
    createdAt: new Date().toISOString(),
    contractReferences: [{ section: "GC", clause: "7.1", summary: "Notice", noticeDays: 10 }],
    title: "Recent Notice Event",
  });
  const oldEvent = makeEvent({
    status: "open",
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    contractReferences: [{ section: "GC", clause: "4.2", summary: "Overdue Notice", noticeDays: 5 }],
    title: "Overdue Notice Event",
  });
  const resolvedEvent = makeEvent({
    status: "resolved",
    contractReferences: [{ section: "A", clause: "1", summary: "x", noticeDays: 5 }],
    title: "Resolved — should not appear",
  });
  const noNoticeEvent = makeEvent({
    status: "open",
    title: "No notice — should not appear",
  });

  const items = resolveNoticeClocks([recentEvent, oldEvent, resolvedEvent, noNoticeEvent]);
  assert(items.length === 2, "resolveNoticeClocks — returns 2 items (excludes resolved and no-notice)");
  assert(items[0].isOverdue === true, "resolveNoticeClocks — overdue event first");
  assert(items[0].title === "Overdue Notice Event", "resolveNoticeClocks — overdue event title");
  assert(items[0].clauseRef === "4.2", "resolveNoticeClocks — clause ref from overdue event");
  assert(items[1].isOverdue === false, "resolveNoticeClocks — recent event not overdue");
  assert(items[1].daysRemaining > 0, "resolveNoticeClocks — recent event has days remaining");
}

// Empty events returns empty array
{
  assert(resolveNoticeClocks([]).length === 0, "resolveNoticeClocks — empty input");
}

console.log("\nDone.");
