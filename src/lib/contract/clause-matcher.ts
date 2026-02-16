// src/lib/contract/clause-matcher.ts
// Multi-factor clause matching engine for contract document chunks.
// Pure deterministic — no AI calls, no side effects.

import type { DocumentChunk } from "@/lib/demo/documents";

export type TriggerType = "direct" | "consequential" | "procedural";

export interface ClauseMatch {
  docId: string;
  section: string;
  content: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  noticeImplication: boolean;
  noticeDays?: number;
  triggerType: TriggerType;
}

// ── Keyword category maps ────────────────────────────────

const NOTICE_TERMS = new Set([
  "notice", "notify", "48 hours", "deadline", "waiver", "timely",
  "written notice", "filing", "within",
]);

const COST_TERMS = new Set([
  "cost", "change order", "overhead", "profit", "compensation",
  "expenditure", "payment", "additional", "price", "budget",
]);

const SCHEDULE_TERMS = new Set([
  "delay", "time extension", "schedule", "critical path",
  "float", "milestone", "duration", "calendar days",
]);

const CONDITION_TERMS = new Set([
  "differing site conditions", "concealed", "subsurface",
  "unmarked", "unknown", "conflict", "unforeseen",
]);

const PROCEDURAL_TERMS = new Set([
  "rfi", "submittal", "change order", "construction change directive",
  "approval", "review", "inspection", "acceptance",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
}

function countOverlap(queryWords: string[], keywords: string[]): number {
  let hits = 0;
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    for (const qw of queryWords) {
      if (kwLower.includes(qw) || qw.includes(kwLower)) {
        hits++;
        break;
      }
    }
  }
  return hits;
}

function phraseMatch(query: string, content: string): number {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();

  // Extract 2-3 word phrases from query
  const words = queryLower.split(/\s+/).filter((w) => w.length > 2);
  let phraseHits = 0;

  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (contentLower.includes(bigram)) phraseHits++;

    if (i < words.length - 2) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (contentLower.includes(trigram)) phraseHits += 2;
    }
  }

  return phraseHits;
}

function hasTermOverlap(text: string, termSet: Set<string>): boolean {
  const lower = text.toLowerCase();
  const terms = Array.from(termSet);
  for (const term of terms) {
    if (lower.includes(term)) return true;
  }
  return false;
}

function determineTriggerType(
  doc: DocumentChunk,
  queryLower: string,
): TriggerType {
  const contentLower = doc.content.toLowerCase();
  const sectionLower = doc.section.toLowerCase();

  // Procedural: process-related clauses
  if (
    hasTermOverlap(contentLower, PROCEDURAL_TERMS) &&
    (sectionLower.includes("change order") ||
      sectionLower.includes("notice") ||
      sectionLower.includes("rfi"))
  ) {
    return "procedural";
  }

  // Direct: condition clauses that match the described condition
  if (
    hasTermOverlap(queryLower, CONDITION_TERMS) &&
    hasTermOverlap(contentLower, CONDITION_TERMS)
  ) {
    return "direct";
  }

  // Consequential: cost/schedule downstream effect clauses
  if (
    hasTermOverlap(contentLower, COST_TERMS) ||
    hasTermOverlap(contentLower, SCHEDULE_TERMS)
  ) {
    return "consequential";
  }

  return "direct";
}

// ── Main matcher ─────────────────────────────────────────

/**
 * Match a query string against document chunks with multi-factor scoring.
 * Returns ranked ClauseMatch[] with match explanations.
 */
export function matchClauses(
  query: string,
  documents: DocumentChunk[],
  opts?: { minScore?: number; maxResults?: number },
): ClauseMatch[] {
  const minScore = opts?.minScore ?? 15;
  const maxResults = opts?.maxResults ?? 10;

  if (!query.trim()) return [];

  const queryWords = tokenize(query);
  const queryLower = query.toLowerCase();

  const results: ClauseMatch[] = [];

  for (const doc of documents) {
    let score = 0;
    const reasons: string[] = [];

    // Factor 1: Keyword overlap (30%)
    const keywordHits = countOverlap(queryWords, doc.keywords);
    const keywordScore =
      doc.keywords.length > 0
        ? Math.min(100, Math.round((keywordHits / Math.min(doc.keywords.length, 5)) * 100))
        : 0;
    if (keywordHits > 0) {
      reasons.push(`${keywordHits} keyword match${keywordHits !== 1 ? "es" : ""}`);
    }
    score += keywordScore * 0.3;

    // Factor 2: Content phrase match (25%)
    const phrases = phraseMatch(query, doc.content);
    const phraseScore = Math.min(100, phrases * 25);
    if (phrases > 0) {
      reasons.push(`${phrases} phrase match${phrases !== 1 ? "es" : ""} in content`);
    }
    score += phraseScore * 0.25;

    // Factor 3: Section-type relevance (20%)
    let sectionScore = 0;
    if (hasTermOverlap(queryLower, NOTICE_TERMS) && hasTermOverlap(doc.content.toLowerCase(), NOTICE_TERMS)) {
      sectionScore = 80;
      reasons.push("Notice-related section");
    }
    if (hasTermOverlap(queryLower, COST_TERMS) && hasTermOverlap(doc.content.toLowerCase(), COST_TERMS)) {
      sectionScore = Math.max(sectionScore, 70);
      if (!reasons.includes("Notice-related section")) reasons.push("Cost-related section");
    }
    if (hasTermOverlap(queryLower, SCHEDULE_TERMS) && hasTermOverlap(doc.content.toLowerCase(), SCHEDULE_TERMS)) {
      sectionScore = Math.max(sectionScore, 70);
      if (reasons.length === 0 || !reasons.some((r) => r.includes("section"))) {
        reasons.push("Schedule-related section");
      }
    }
    if (hasTermOverlap(queryLower, CONDITION_TERMS) && hasTermOverlap(doc.content.toLowerCase(), CONDITION_TERMS)) {
      sectionScore = Math.max(sectionScore, 90);
      reasons.push("Directly addresses condition type");
    }
    score += sectionScore * 0.2;

    // Factor 4: Notice implication bonus (15%)
    const hasNotice = doc.keywords.some((kw) =>
      kw.toLowerCase().includes("notice") || kw.toLowerCase().includes("waiver"),
    );
    const queryMentionsTime = hasTermOverlap(queryLower, new Set([
      "delay", "schedule", "deadline", "urgent", "critical", "time",
      "notice", "48 hours", "days",
    ]));
    if (hasNotice && queryMentionsTime) {
      score += 15;
      reasons.push("Notice implications for time-sensitive issue");
    }

    // Factor 5: Cross-reference (10%) — boost if section is referenced by query
    const sectionRef = doc.section.match(/§[\d.]+/)?.[0];
    if (sectionRef && queryLower.includes(sectionRef.toLowerCase())) {
      score += 10;
      reasons.push(`Direct reference to ${sectionRef}`);
    }

    // Detect notice days from content
    const noticeMatch = doc.content.match(/(\d+)\s*hours?\s*(?:of\s+)?(?:discovery|notice)/i);
    const noticeDaysMatch = doc.content.match(/(\d+)\s*(?:calendar\s+)?days?\s*(?:of\s+)?(?:receipt|notice|discovery)/i);
    let noticeDays: number | undefined;
    if (noticeMatch) {
      noticeDays = Math.ceil(parseInt(noticeMatch[1]) / 24);
    } else if (noticeDaysMatch) {
      noticeDays = parseInt(noticeDaysMatch[1]);
    }

    const roundedScore = Math.round(score);
    if (roundedScore >= minScore) {
      results.push({
        docId: doc.id,
        section: doc.section,
        content: doc.content,
        matchScore: roundedScore,
        matchReasons: reasons,
        noticeImplication: hasNotice,
        noticeDays,
        triggerType: determineTriggerType(doc, queryLower),
      });
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, maxResults);
}
