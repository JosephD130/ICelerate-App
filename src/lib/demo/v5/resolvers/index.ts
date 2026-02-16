// src/lib/demo/v5/resolvers/index.ts
// Barrel re-export for all resolver modules.

export { v4ToV5EventId, v5ToV4EventId } from "./id-map";

export { resolveProjectMetrics } from "./project-metrics";
export type { ProjectMetrics } from "./project-metrics";

export { resolveEvidenceBundle } from "./evidence-bundle";
export type {
  ResolvedClause,
  ResolvedStakeholder,
  ResolvedTask,
  EvidenceBundle,
} from "./evidence-bundle";

export { resolveEventImpact } from "./event-impact";
export type {
  ImpactedTask,
  ImpactedPhase,
  ImpactedMilestone,
  EventImpact,
} from "./event-impact";

export { resolveExportDataset } from "./export-dataset";
export type {
  ResolvedSlide,
  ResolvedSheet,
  ResolvedSection,
  ExportDataset,
} from "./export-dataset";

export { resolveIntelligenceFeed } from "./intelligence-feed";
export type { InsightCard } from "./intelligence-feed";

export { resolveSuggestions } from "./suggestions";

export { resolveProjectSnapshot, resolveEventSnapshot } from "./snapshots";

export { resolveCaseFromEvent } from "./cases";

export { findSimilarCases } from "./similar-cases";
