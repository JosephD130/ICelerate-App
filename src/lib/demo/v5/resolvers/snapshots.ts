// src/lib/demo/v5/resolvers/snapshots.ts
// Generates ProjectSnapshot and EventSnapshot from current state.
// Pure computation — no React hooks, no side effects, no API calls.

import type {
  ProjectSnapshot,
  EventSnapshot,
  SnapshotDelta,
  DeltaDirection,
} from "@/lib/memory/types";
import type { DecisionEvent } from "@/lib/models/decision-event";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date().toISOString().slice(0, 10);
const NOW_ISO = new Date().toISOString();

function delta(
  field: string,
  prior: number | string,
  current: number | string,
): SnapshotDelta {
  let direction: DeltaDirection = "unchanged";
  if (typeof prior === "number" && typeof current === "number") {
    if (current > prior) direction = "up";
    else if (current < prior) direction = "down";
  } else if (String(prior) !== String(current)) {
    direction = "up"; // non-numeric change defaults to "up" for visibility
  }
  return { field, prior, current, direction };
}

function countNoticeClocks(events: DecisionEvent[]): number {
  return events.filter(
    (e) =>
      e.status !== "resolved" &&
      e.noticeDeadline !== undefined &&
      e.noticeDeadline !== null,
  ).length;
}

function countMisaligned(events: DecisionEvent[]): number {
  return events.filter(
    (e) =>
      e.status !== "resolved" &&
      (e.alignmentStatus === "misaligned" || e.alignmentStatus === "drift"),
  ).length;
}

// ---------------------------------------------------------------------------
// Project Snapshot
// ---------------------------------------------------------------------------

/**
 * Aggregate a ProjectSnapshot from an array of DecisionEvent[].
 * Computes totals across all events and generates deltas from a prior snapshot.
 *
 * @param projectId - The project identifier.
 * @param events - All DecisionEvent[] for this project.
 * @param priorSnapshot - The previous ProjectSnapshot (null if first snapshot).
 * @returns A new ProjectSnapshot reflecting current state.
 */
export function resolveProjectSnapshot(
  projectId: string,
  events: DecisionEvent[],
  priorSnapshot: ProjectSnapshot | null,
): ProjectSnapshot {
  const openEvents = events.filter(
    (e) => e.status === "open" || e.status === "in-progress",
  );
  const resolvedEvents = events.filter((e) => e.status === "resolved");

  // Total cost exposure across open events
  const totalExposure = openEvents.reduce(
    (sum, e) => sum + (e.costImpact?.estimated ?? 0),
    0,
  );

  // Total schedule days across all open events
  const totalScheduleDays = openEvents.reduce(
    (sum, e) => sum + (e.scheduleImpact?.daysAffected ?? 0),
    0,
  );

  // Critical path days: only events on critical path
  const criticalPathDays = openEvents
    .filter((e) => e.scheduleImpact?.criticalPath)
    .reduce((sum, e) => sum + (e.scheduleImpact?.daysAffected ?? 0), 0);

  // Contingency usage: approximate as ratio of exposure to a reference budget
  // Since we don't have the project budget here, express as a percentage of total exposure
  // relative to what was tracked in the prior snapshot or a reasonable starting value
  const contingencyUsedPct = priorSnapshot
    ? Math.max(
        priorSnapshot.contingencyUsedPct,
        Math.round((totalExposure / Math.max(totalExposure + 100000, 1)) * 100),
      )
    : Math.round((totalExposure / Math.max(totalExposure + 100000, 1)) * 100);

  const activeNoticeClocks = countNoticeClocks(events);
  const misalignedEvents = countMisaligned(events);

  const version = priorSnapshot ? priorSnapshot.version + 1 : 1;

  // Compute deltas from prior snapshot
  const deltasFromPrior: SnapshotDelta[] = [];
  if (priorSnapshot) {
    if (totalExposure !== priorSnapshot.totalExposure) {
      deltasFromPrior.push(
        delta("totalExposure", priorSnapshot.totalExposure, totalExposure),
      );
    }
    if (totalScheduleDays !== priorSnapshot.totalScheduleDays) {
      deltasFromPrior.push(
        delta(
          "totalScheduleDays",
          priorSnapshot.totalScheduleDays,
          totalScheduleDays,
        ),
      );
    }
    if (criticalPathDays !== priorSnapshot.criticalPathDays) {
      deltasFromPrior.push(
        delta(
          "criticalPathDays",
          priorSnapshot.criticalPathDays,
          criticalPathDays,
        ),
      );
    }
    if (contingencyUsedPct !== priorSnapshot.contingencyUsedPct) {
      deltasFromPrior.push(
        delta(
          "contingencyUsedPct",
          priorSnapshot.contingencyUsedPct,
          contingencyUsedPct,
        ),
      );
    }
    if (activeNoticeClocks !== priorSnapshot.activeNoticeClocks) {
      deltasFromPrior.push(
        delta(
          "activeNoticeClocks",
          priorSnapshot.activeNoticeClocks,
          activeNoticeClocks,
        ),
      );
    }
    if (misalignedEvents !== priorSnapshot.misalignedEvents) {
      deltasFromPrior.push(
        delta(
          "misalignedEvents",
          priorSnapshot.misalignedEvents,
          misalignedEvents,
        ),
      );
    }
    if (openEvents.length !== priorSnapshot.openEvents) {
      deltasFromPrior.push(
        delta("openEvents", priorSnapshot.openEvents, openEvents.length),
      );
    }
    if (resolvedEvents.length !== priorSnapshot.resolvedEvents) {
      deltasFromPrior.push(
        delta(
          "resolvedEvents",
          priorSnapshot.resolvedEvents,
          resolvedEvents.length,
        ),
      );
    }
  }

  return {
    id: `snap-proj-${projectId}-v${version}`,
    projectId,
    date: TODAY,
    version,
    totalExposure,
    totalScheduleDays,
    criticalPathDays,
    contingencyUsedPct,
    activeNoticeClocks,
    misalignedEvents,
    openEvents: openEvents.length,
    resolvedEvents: resolvedEvents.length,
    deltasFromPrior,
    createdAt: NOW_ISO,
  };
}

// ---------------------------------------------------------------------------
// Event Snapshot
// ---------------------------------------------------------------------------

/**
 * Capture a point-in-time snapshot of a single DecisionEvent.
 *
 * @param event - The DecisionEvent to snapshot.
 * @param projectId - The project this event belongs to.
 * @returns An EventSnapshot reflecting the event's current state.
 */
export function resolveEventSnapshot(
  event: DecisionEvent,
  projectId: string,
): EventSnapshot {
  // Evidence count: sum of contract references, stakeholder notifications, communications,
  // monitor scores, and history entries
  const evidenceCount =
    event.contractReferences.length +
    event.stakeholderNotifications.length +
    event.communications.length +
    event.monitorScores.length +
    event.history.length;

  // Entitlement strength heuristic: based on evidence density and contract references
  // More contract refs + more evidence = stronger entitlement position
  let entitlementStrength = 30; // baseline
  if (event.contractReferences.length > 0) {
    entitlementStrength += Math.min(event.contractReferences.length * 15, 30);
  }
  if (event.fieldRecord) {
    entitlementStrength += 10;
  }
  if (event.stakeholderNotifications.some((s) => s.notified)) {
    entitlementStrength += 10;
  }
  if (event.history.length > 2) {
    entitlementStrength += 5;
  }
  if (event.monitorScores.length > 0) {
    entitlementStrength += 5;
  }
  // Reduce if notice deadline exists but no decision record
  if (event.noticeDeadline && !event.decisionRecord) {
    entitlementStrength -= 10;
  }
  entitlementStrength = Math.max(0, Math.min(100, entitlementStrength));

  // Determine a version number from the event's history length
  const version = Math.max(1, event.history.length);

  return {
    id: `snap-evt-${event.id}-v${version}`,
    eventId: event.id,
    projectId,
    date: TODAY,
    version,
    status: event.status,
    severity: event.severity,
    costExposure: event.costImpact?.estimated ?? 0,
    costConfidence: event.costImpact?.confidence ?? "low",
    scheduleDays: event.scheduleImpact?.daysAffected ?? 0,
    criticalPath: event.scheduleImpact?.criticalPath ?? false,
    noticeDeadline: event.noticeDeadline,
    alignmentStatus: event.alignmentStatus,
    evidenceCount,
    entitlementStrength,
    createdAt: NOW_ISO,
  };
}
