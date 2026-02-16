// src/lib/confidence/types.ts
// Mechanically computable confidence scoring schema.
// Shared across prompt contract, server validator, hooks, and UI components.

/** Claim types ordered by evidence strength required */
export type ClaimType =
  | "FACT_FROM_SOURCE"
  | "FACT_FROM_CONTRACT"
  | "INFERENCE"
  | "RECOMMENDATION";

/** A single citation linking a claim to its evidence */
export interface ClaimCitation {
  sourceId: string;
  clauseRef?: string;
  excerpt: string;
}

/** A single verifiable claim extracted from AI output */
export interface ConfidenceClaim {
  id: string;
  text: string;
  type: ClaimType;
  citations: ClaimCitation[];
  rangeLow?: number;
  rangeHigh?: number;
  unit?: string;
}

/** Three-factor confidence breakdown */
export interface ConfidenceBreakdown {
  /** 0-1: fraction of claims with valid citations */
  evidence_score: number;
  /** 0-1: freshness-weighted score across cited sources */
  freshness_score: number;
  /** 0-1: how directly evidence supports the claims */
  fit_score: number;
  /** 0.6*evidence + 0.2*freshness + 0.2*fit */
  composite: number;
}

/** Confidence level derived from evidence_score thresholds */
export type ConfidenceLevel = "high" | "medium" | "low";

/** Full confidence metadata block emitted by Claude and validated server-side */
export interface ConfidenceData {
  status: "complete" | "partial" | "no_evidence";
  summary: string;
  claims: ConfidenceClaim[];
  confidence_breakdown: ConfidenceBreakdown;
  confidence_level: ConfidenceLevel;
  assumptions: string[];
  missing_evidence: string[];
  safe_next_steps: string[];
  /** Server-recomputed evidence_score (may differ from Claude's self-report) */
  validated_evidence_score?: number;
  /** Whether the server overwrote Claude's evidence_score */
  score_overwritten?: boolean;
}

/** Maps evidence_score to confidence level */
export function computeConfidenceLevel(evidenceScore: number): ConfidenceLevel {
  if (evidenceScore >= 0.8) return "high";
  if (evidenceScore >= 0.5) return "medium";
  return "low";
}

/** Recompute composite from subscores */
export function computeComposite(breakdown: Pick<ConfidenceBreakdown, "evidence_score" | "freshness_score" | "fit_score">): number {
  return Math.round(
    (0.6 * breakdown.evidence_score +
      0.2 * breakdown.freshness_score +
      0.2 * breakdown.fit_score) * 100
  ) / 100;
}
