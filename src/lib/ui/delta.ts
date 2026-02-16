import type { DecisionEvent } from "@/lib/models/decision-event";

export interface EventSnapshot {
  costEstimated: number;
  scheduleDays: number;
  alignmentStatus: string;
  contractRefCount: number;
  stakeholderCount: number;
  communicationCount: number;
  monitorScoreCount: number;
}

export interface Delta {
  label: string;
  value: string;
  direction: "up" | "down" | "changed";
}

export function snapshotEvent(event: DecisionEvent): EventSnapshot {
  return {
    costEstimated: event.costImpact?.estimated ?? 0,
    scheduleDays: event.scheduleImpact?.daysAffected ?? 0,
    alignmentStatus: event.alignmentStatus,
    contractRefCount: event.contractReferences.length,
    stakeholderCount: event.stakeholderNotifications.filter((s) => s.notified).length,
    communicationCount: event.communications.length,
    monitorScoreCount: event.monitorScores.length,
  };
}

export function computeDeltas(before: EventSnapshot, after: EventSnapshot): Delta[] {
  const deltas: Delta[] = [];

  if (after.costEstimated !== before.costEstimated) {
    const diff = after.costEstimated - before.costEstimated;
    deltas.push({
      label: "Exposure",
      value: `${diff >= 0 ? "+" : ""}$${Math.abs(diff).toLocaleString()}`,
      direction: diff > 0 ? "up" : "down",
    });
  }

  if (after.scheduleDays !== before.scheduleDays) {
    const diff = after.scheduleDays - before.scheduleDays;
    deltas.push({
      label: "Schedule",
      value: `${diff >= 0 ? "+" : ""}${diff} day${Math.abs(diff) !== 1 ? "s" : ""}`,
      direction: diff > 0 ? "up" : "down",
    });
  }

  if (after.alignmentStatus !== before.alignmentStatus) {
    deltas.push({
      label: "Alignment",
      value: `${before.alignmentStatus} → ${after.alignmentStatus}`,
      direction: after.alignmentStatus === "synced" ? "down" : "up",
    });
  }

  if (after.contractRefCount !== before.contractRefCount) {
    const diff = after.contractRefCount - before.contractRefCount;
    deltas.push({
      label: "Clauses",
      value: `+${diff}`,
      direction: "changed",
    });
  }

  if (after.communicationCount !== before.communicationCount) {
    const diff = after.communicationCount - before.communicationCount;
    deltas.push({
      label: "Comms",
      value: `+${diff}`,
      direction: "changed",
    });
  }

  if (after.monitorScoreCount !== before.monitorScoreCount) {
    deltas.push({
      label: "Score",
      value: "updated",
      direction: "changed",
    });
  }

  return deltas;
}
