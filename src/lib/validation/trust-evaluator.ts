// src/lib/validation/trust-evaluator.ts
// Tool-type–aware trust evaluator for AI output.
// Pure, deterministic — no AI calls.

import type { ConfidenceData, ConfidenceBreakdown } from "@/lib/confidence/types";

export type TrustStatus = "verified" | "needs_review" | "unverified";

export type ToolType =
  | "field"
  | "contract"
  | "decision"
  | "communication"
  | "monitor";

export interface TrustEvalInput {
  toolType: ToolType;
  outputText: string;
  /** Optional: sources referenced in the system prompt context */
  referencedSources?: string[];
  /** Optional: doc chunk IDs that were in the context window */
  referencedDocChunks?: string[];
  /** Optional: freshness severity — "stale" or "old" blocks verified for cost/schedule */
  freshnessLevel?: "fresh" | "stale" | "old";
}

export interface TrustEvalResult {
  status: TrustStatus;
  reason: string;
  blockers: string[];
  citationCount: number;
  numericClaimCount: number;
}

// ── Regex patterns ──────────────────────────────────────

const CLAUSE_PATTERNS = [
  /§[\d.]+/g,
  /Section\s+\d+[\d.]*/gi,
  /Clause\s+[\d.]+/gi,
  /Article\s+\d+/gi,
];
const SPEC_PATTERNS = [
  /ASTM\s+[A-Z]\d+/g,
  /AASHTO\s+[A-Z]/g,
];
const RFI_CO_PATTERNS = [
  /RFI[-\s]?\d+/gi,
  /CO[-\s]?\d+/gi,
];
const DOLLAR_PATTERN = /\$[\d,]+(?:\.\d{2})?/g;
const DAYS_PATTERN = /\d+\s*(?:day|week|hour|month)s?\b/gi;
const RANGE_PATTERN = /\$[\d,]+\s*(?:[-–—]|to)\s*\$[\d,]+/gi;
const QUOTE_PATTERN = /[""\u201C\u201D].{10,80}[""\u201C\u201D]/g;

const CONTRACT_ADJACENT = new Set<ToolType>(["contract"]);

function countUniqueMatches(text: string, patterns: RegExp[]): number {
  const found = new Set<string>();
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) matches.forEach((m) => found.add(m.trim().toLowerCase()));
  }
  return found.size;
}

// ── Main evaluator ──────────────────────────────────────

export function computeTrustStatusForOutput(
  input: TrustEvalInput,
): TrustEvalResult {
  const { toolType, outputText, referencedDocChunks, freshnessLevel } = input;

  if (!outputText || outputText.trim().length === 0) {
    return {
      status: "unverified",
      reason: "No output to evaluate",
      blockers: ["No AI output generated"],
      citationCount: 0,
      numericClaimCount: 0,
    };
  }

  const blockers: string[] = [];

  // Count citations
  const clauseCitations = countUniqueMatches(outputText, CLAUSE_PATTERNS);
  const specCitations = countUniqueMatches(outputText, SPEC_PATTERNS);
  const rfiCitations = countUniqueMatches(outputText, RFI_CO_PATTERNS);
  const citationCount = clauseCitations + specCitations + rfiCitations;

  // Count numeric claims
  const dollarClaims = countUniqueMatches(outputText, [DOLLAR_PATTERN]);
  const daysClaims = countUniqueMatches(outputText, [DAYS_PATTERN]);
  const numericClaimCount = dollarClaims + daysClaims;

  // Count quotes (evidence of doc-grounded output)
  const quoteCount = countUniqueMatches(outputText, [QUOTE_PATTERN]);

  // Check for ranges (better than single-point estimates)
  const hasRanges = (outputText.match(RANGE_PATTERN) || []).length > 0;

  // ── Contract-adjacent checks ──
  if (CONTRACT_ADJACENT.has(toolType) || clauseCitations > 0) {
    // Rule: must have clause citation + quote
    if (clauseCitations === 0) {
      blockers.push("No contract clause citations found");
    } else if (quoteCount === 0 && (referencedDocChunks?.length ?? 0) === 0) {
      blockers.push("Clause cited but no supporting quote or doc reference");
    }
  }

  // ── Numeric claim checks ──
  if (numericClaimCount > 0) {
    if (!hasRanges && citationCount === 0) {
      blockers.push("Numeric claims without source citation or range");
    }
  }

  // ── Freshness checks ──
  if (freshnessLevel === "old") {
    if (dollarClaims > 0 || daysClaims > 0) {
      blockers.push("Cost/schedule claims based on stale data (>7 days old)");
    }
  }

  // ── Determine status ──
  let status: TrustStatus;
  let reason: string;

  if (blockers.length === 0 && citationCount >= 1) {
    status = "verified";
    reason = `${citationCount} citation${citationCount !== 1 ? "s" : ""}, ${numericClaimCount} quantified value${numericClaimCount !== 1 ? "s" : ""}`;
  } else if (blockers.length > 0 && (citationCount > 0 || numericClaimCount > 0)) {
    status = "needs_review";
    reason = blockers[0];
  } else if (citationCount === 0 && numericClaimCount === 0) {
    // Communication / general output with no claims — contextual assessment
    if (toolType === "communication") {
      // Translations don't need citations — verified if output exists
      status = "verified";
      reason = "Communication output — no claims requiring evidence";
    } else {
      status = "unverified";
      reason = "No citations or quantified values detected";
    }
  } else {
    status = "unverified";
    reason = "Insufficient evidence for claims made";
  }

  return { status, reason, blockers, citationCount, numericClaimCount };
}

// ── Confidence enrichment bridge ──────────────────────────

export interface EnrichedTrustResult extends TrustEvalResult {
  confidenceBreakdown?: ConfidenceBreakdown;
  claimCount?: number;
  citedClaimCount?: number;
  missingEvidence?: string[];
  scoreOverwritten?: boolean;
}

/**
 * Merge regex-based trust evaluation with AI-reported confidence data.
 * The regex evaluation remains the source of truth for trust status.
 * Confidence data enriches with subscores.
 */
export function enrichTrustWithConfidence(
  trustResult: TrustEvalResult,
  confidenceData: ConfidenceData | null | undefined,
): EnrichedTrustResult {
  if (!confidenceData) return trustResult;

  return {
    ...trustResult,
    confidenceBreakdown: confidenceData.confidence_breakdown,
    claimCount: confidenceData.claims.length,
    citedClaimCount: confidenceData.claims.filter(
      (c) => c.citations && c.citations.length > 0
    ).length,
    missingEvidence: confidenceData.missing_evidence,
    scoreOverwritten: confidenceData.score_overwritten,
  };
}
