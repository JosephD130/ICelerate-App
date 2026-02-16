// src/lib/freshness.ts
// Pure freshness resolver — flags stale/aging data sources from project sourceProfile.

import type { SourceProfile } from "@/lib/demo/v5/projects";

export interface FreshnessWarning {
  sourceLabel: string;
  daysSinceSync: number;
  severity: "stale" | "aging";
}

export function resolveFreshness(
  sourceProfile: SourceProfile,
  now?: Date,
): FreshnessWarning[] {
  const refDate = now ?? new Date();
  const warnings: FreshnessWarning[] = [];

  for (const source of sourceProfile.sources) {
    if (source.status === "disconnected") continue;

    const syncDate = new Date(source.lastSyncAt);
    const daysSinceSync = Math.floor(
      (refDate.getTime() - syncDate.getTime()) / 86_400_000,
    );

    if (daysSinceSync > 7) {
      warnings.push({ sourceLabel: source.label, daysSinceSync, severity: "stale" });
    } else if (daysSinceSync > 3) {
      warnings.push({ sourceLabel: source.label, daysSinceSync, severity: "aging" });
    }
  }

  return warnings.sort((a, b) => b.daysSinceSync - a.daysSinceSync);
}
