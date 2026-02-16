// src/lib/memory/types.ts
// Data models for the Memory + Confidence architecture.
// Short-term memory: per project, per day.
// Long-term memory: cross-project cases and lessons.

// ═══════════════════════════════════════════════════
// SHORT-TERM MEMORY
// ═══════════════════════════════════════════════════

/** Immutable raw input — email, log, schedule, etc. */
export interface SourceObject {
  id: string;
  projectId: string;
  kind: "email" | "log" | "schedule" | "transcript" | "photo" | "document";
  title: string;
  rawText: string;
  metadata: Record<string, string>;
  hash: string;
  ingestedAt: string;
}

/** Citation linking a suggestion to its evidence. */
export interface SuggestionCitation {
  sourceId: string;
  chunkRef?: string; // clause ref like §7.3.1
  excerpt: string;
}

export type SuggestionStatus = "pending" | "accepted" | "edited" | "rejected";

export type SuggestionType =
  | "cost_revision"
  | "schedule_revision"
  | "notice_risk"
  | "stakeholder_action"
  | "alignment_change"
  | "new_event"
  | "contract_reference"
  | "field_observation";

/** Pending interpretation — review before committing. */
export interface Suggestion {
  id: string;
  projectId: string;
  eventId?: string;
  type: SuggestionType;
  headline: string;
  detail: string;
  confidence: number; // 0-100
  rationale: string;
  citations: SuggestionCitation[];
  impact: "high" | "medium" | "low";
  suggestedChanges?: Record<string, unknown>;
  status: SuggestionStatus;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  editorOverrides?: {
    linkedEventId?: string;
    costLow?: number;
    costHigh?: number;
    scheduleDays?: number;
    clauseRef?: string;
    note?: string;
    headline?: string;
    impact?: "high" | "medium" | "low";
    deadline?: string;
    stakeholders?: string[];
  };
  /** Source freshness level at the time this suggestion was generated. */
  sourceFreshness?: "fresh" | "stale" | "old";
  /** Structured confidence breakdown when computed by confidence scoring system. */
  confidenceBreakdown?: {
    evidence_score: number;
    freshness_score: number;
    fit_score: number;
    composite: number;
  };
}

/** Direction of change in a snapshot delta. */
export type DeltaDirection = "up" | "down" | "unchanged";

export interface SnapshotDelta {
  field: string;
  prior: number | string;
  current: number | string;
  direction: DeltaDirection;
}

/** Canonical project-level rollup, versioned. */
export interface ProjectSnapshot {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  version: number;
  totalExposure: number;
  totalScheduleDays: number;
  criticalPathDays: number;
  contingencyUsedPct: number;
  activeNoticeClocks: number;
  misalignedEvents: number;
  openEvents: number;
  resolvedEvents: number;
  deltasFromPrior: SnapshotDelta[];
  createdAt: string;
}

/** Canonical event-level state, versioned. */
export interface EventSnapshot {
  id: string;
  eventId: string;
  projectId: string;
  date: string;
  version: number;
  status: string;
  severity: string;
  costExposure: number;
  costConfidence: string;
  scheduleDays: number;
  criticalPath: boolean;
  noticeDeadline?: string;
  alignmentStatus: string;
  evidenceCount: number;
  entitlementStrength: number; // 0-100
  createdAt: string;
}

// ═══════════════════════════════════════════════════
// EVIDENCE ITEMS (Governed Risk System)
// ═══════════════════════════════════════════════════

export type EvidenceSourceType = "gmail" | "procore" | "upload" | "field";
export type EvidenceStatus = "pending" | "approved" | "rejected";

export interface ExtractedSignals {
  noticeRisk?: boolean;
  costDelta?: number;
  scheduleDelta?: number;
  clauseRefs?: string[];
  confidenceScore: number;
}

export interface EvidenceItem {
  id: string;
  projectId: string;
  sourceType: EvidenceSourceType;
  sourceLabel: string;
  rawContentPreview: string;
  extractedSignals: ExtractedSignals;
  linkedRiskItemId?: string;
  status: EvidenceStatus;
  reviewedAt?: string;
  createdAt: string;
  /** URL or data-URL for the original document (PDF, image, etc.) */
  attachmentUrl?: string;
  /** Original filename */
  attachmentName?: string;
  /** MIME type (e.g. "application/pdf", "image/jpeg") */
  attachmentType?: string;
}

// ═══════════════════════════════════════════════════
// LONG-TERM MEMORY
// ═══════════════════════════════════════════════════

/** Closed event normalized into a reusable case. */
export interface CaseRecord {
  id: string;
  sourceEventId: string;
  sourceProjectId: string;
  projectName: string;
  issueType: string;
  title: string;
  summary: string;
  actionsPerformed: string[];
  outcome: string;
  clausesInvoked: string[];
  costFinal: number;
  scheduleDaysFinal: number;
  resolutionDays: number;
  tags: string[];
  closedAt: string;
  createdAt: string;
}

/** Curated pattern from resolved cases. */
export type LessonStatus = "proposed" | "approved" | "rejected";

export interface LessonRecord {
  id: string;
  title: string;
  pattern: string;
  detail: string;
  caseIds: string[];
  issueTypes: string[];
  confidence: number; // 0-100
  status: LessonStatus;
  approvedAt?: string;
  createdAt: string;
}
