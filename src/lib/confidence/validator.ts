// src/lib/confidence/validator.ts
// Server-side confidence recomputation.
// Mechanically verifies evidence_score from claims array and overwrites if mismatched.

import type { ConfidenceData } from "./types";
import { computeConfidenceLevel, computeComposite } from "./types";

/** Regex to extract the confidence JSON block from Claude's markdown output */
const CONFIDENCE_BLOCK_RE = /<!--\s*CONFIDENCE_DATA\s*\n([\s\S]*?)\n\s*-->/;

/**
 * Extract ConfidenceData JSON from a full Claude response string.
 * Returns null if not found or unparseable.
 */
export function extractConfidenceBlock(fullText: string): ConfidenceData | null {
  const match = fullText.match(CONFIDENCE_BLOCK_RE);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as ConfidenceData;
  } catch {
    return null;
  }
}

/**
 * Strip the confidence block from display text so it doesn't render as markdown.
 */
export function stripConfidenceBlock(text: string): string {
  return text.replace(/\n*<!--\s*CONFIDENCE_DATA\s*\n[\s\S]*?\n\s*-->\s*$/, "");
}

/**
 * Validate and recompute confidence scores.
 *
 * evidence_score = (claims with >=1 citation containing non-empty excerpt) / total claims
 *
 * If Claude's self-reported score differs by more than 0.05, overwrite it.
 */
export function validateAndRecompute(raw: ConfidenceData): ConfidenceData {
  const data: ConfidenceData = {
    ...raw,
    claims: raw.claims ? [...raw.claims] : [],
    assumptions: raw.assumptions ?? [],
    missing_evidence: raw.missing_evidence ?? [],
    safe_next_steps: raw.safe_next_steps ?? [],
    confidence_breakdown: raw.confidence_breakdown
      ? { ...raw.confidence_breakdown }
      : { evidence_score: 0, freshness_score: 0, fit_score: 0, composite: 0 },
  };

  const totalClaims = data.claims.length;

  if (totalClaims === 0) {
    data.confidence_breakdown.evidence_score = 0;
    data.confidence_breakdown.composite = computeComposite(data.confidence_breakdown);
    data.validated_evidence_score = 0;
    data.score_overwritten = data.confidence_breakdown.evidence_score !== 0;
    data.confidence_level = computeConfidenceLevel(0);
    return data;
  }

  // Count claims with valid citations (at least one citation with non-empty excerpt)
  const citedClaims = data.claims.filter(
    (c) =>
      c.citations &&
      c.citations.length > 0 &&
      c.citations.some((cit) => cit.excerpt && cit.excerpt.trim().length > 0)
  ).length;

  const recomputed = Math.round((citedClaims / totalClaims) * 100) / 100;
  const reported = data.confidence_breakdown.evidence_score ?? 0;

  // Validate numeric ranges on claims
  for (const claim of data.claims) {
    if (
      claim.rangeLow !== undefined &&
      claim.rangeHigh !== undefined &&
      claim.rangeLow > claim.rangeHigh
    ) {
      [claim.rangeLow, claim.rangeHigh] = [claim.rangeHigh, claim.rangeLow];
    }
  }

  // Enforce missing_evidence when evidence_score < 0.8
  if (recomputed < 0.8) {
    if (!data.missing_evidence || data.missing_evidence.length === 0) {
      const uncited = totalClaims - citedClaims;
      data.missing_evidence = [
        `${uncited} claim${uncited !== 1 ? "s" : ""} lack source citations`,
      ];
    }
  }

  // Overwrite if drift > 0.05
  const drift = Math.abs(recomputed - reported);
  if (drift > 0.05) {
    data.confidence_breakdown.evidence_score = recomputed;
    data.validated_evidence_score = recomputed;
    data.score_overwritten = true;
  } else {
    data.validated_evidence_score = recomputed;
    data.score_overwritten = false;
  }

  // Recompute composite with validated evidence_score
  data.confidence_breakdown.composite = computeComposite(data.confidence_breakdown);

  // Recompute confidence level
  data.confidence_level = computeConfidenceLevel(
    data.confidence_breakdown.evidence_score
  );

  return data;
}
