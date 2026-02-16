// src/lib/provenance/freshness.ts
// Freshness utilities for evaluating source and snapshot age.

export type FreshnessLevel = "fresh" | "stale" | "old";

export interface FreshnessBadge {
  level: FreshnessLevel;
  reason: string;
  oldestSourceLabel?: string;
  oldestSourceAgeDays?: number;
}

/** Get age of a source in hours from a timestamp string. */
export function getSourceAgeHours(sourceTimestamp: string, now?: Date): number {
  const ref = now ?? new Date();
  const src = new Date(sourceTimestamp);
  return Math.max(0, (ref.getTime() - src.getTime()) / 3_600_000);
}

/** Get age of a source in days. */
export function getSourceAgeDays(sourceTimestamp: string, now?: Date): number {
  return Math.floor(getSourceAgeHours(sourceTimestamp, now) / 24);
}

/** Simple thresholds: fresh <=24h, stale 1–7d, old >7d. */
export function classifyAge(hours: number): FreshnessLevel {
  if (hours <= 24) return "fresh";
  if (hours <= 168) return "stale"; // 7 days
  return "old";
}

/**
 * Compute a composite freshness badge for a set of sources.
 * Uses the oldest critical source to determine the overall level.
 */
export function computeFreshnessBadge(opts: {
  sources: Array<{ label: string; lastSyncAt: string }>;
  scheduleSnapshotAgeDays?: number;
  costSnapshotAgeDays?: number;
  now?: Date;
}): FreshnessBadge {
  const { sources, scheduleSnapshotAgeDays, costSnapshotAgeDays, now } = opts;
  const ref = now ?? new Date();

  let worstLevel: FreshnessLevel = "fresh";
  let worstReason = "All sources current";
  let oldestLabel: string | undefined;
  let oldestDays = 0;

  for (const src of sources) {
    const ageHours = getSourceAgeHours(src.lastSyncAt, ref);
    const ageDays = Math.floor(ageHours / 24);
    const level = classifyAge(ageHours);

    if (ageDays > oldestDays) {
      oldestDays = ageDays;
      oldestLabel = src.label;
    }

    if (level === "old" && worstLevel !== "old") {
      worstLevel = "old";
      worstReason = `${src.label} is ${ageDays}d old`;
    } else if (level === "stale" && worstLevel === "fresh") {
      worstLevel = "stale";
      worstReason = `${src.label} is ${ageDays}d old`;
    }
  }

  // Schedule/cost snapshot overrides
  if (scheduleSnapshotAgeDays !== undefined && scheduleSnapshotAgeDays > 14) {
    worstLevel = "old";
    worstReason = `Schedule snapshot ${scheduleSnapshotAgeDays}d old`;
  } else if (scheduleSnapshotAgeDays !== undefined && scheduleSnapshotAgeDays > 7 && worstLevel === "fresh") {
    worstLevel = "stale";
    worstReason = `Schedule snapshot ${scheduleSnapshotAgeDays}d old`;
  }

  if (costSnapshotAgeDays !== undefined && costSnapshotAgeDays > 14) {
    worstLevel = "old";
    worstReason = `Cost snapshot ${costSnapshotAgeDays}d old`;
  } else if (costSnapshotAgeDays !== undefined && costSnapshotAgeDays > 7 && worstLevel === "fresh") {
    worstLevel = "stale";
    worstReason = `Cost snapshot ${costSnapshotAgeDays}d old`;
  }

  return {
    level: worstLevel,
    reason: worstReason,
    oldestSourceLabel: oldestLabel,
    oldestSourceAgeDays: oldestDays,
  };
}
