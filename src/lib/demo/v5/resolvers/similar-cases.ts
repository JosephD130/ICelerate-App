// src/lib/demo/v5/resolvers/similar-cases.ts
// Finds similar CaseRecords and LessonRecords for a given DecisionEvent.
// Pure computation — no React hooks, no side effects, no API calls.

import type { CaseRecord, LessonRecord } from "@/lib/memory/types";
import type { DecisionEvent } from "@/lib/models/decision-event";

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

/**
 * Count overlapping items between two arrays (case-insensitive for strings).
 */
function overlapCount(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  let count = 0;
  for (const item of b) {
    if (setA.has(item.toLowerCase())) count++;
  }
  return count;
}

/**
 * Check if two cost values are within a factor of 2 of each other.
 * Returns a score from 0 to 1 based on proximity.
 */
function costProximity(costA: number, costB: number): number {
  if (costA === 0 && costB === 0) return 1;
  if (costA === 0 || costB === 0) return 0;
  const ratio = Math.max(costA, costB) / Math.min(costA, costB);
  if (ratio > 2) return 0;
  // Linear decay: ratio 1.0 = score 1.0, ratio 2.0 = score 0.0
  return Math.max(0, 1 - (ratio - 1));
}

/**
 * Extract clause identifiers from a DecisionEvent's contractReferences.
 * Returns an array of strings like "§7.3.1", "§12.4", etc.
 */
function extractEventClauses(event: DecisionEvent): string[] {
  const clauses: string[] = [];
  for (const ref of event.contractReferences) {
    // Use the clause field (e.g., "§7.3.1") for matching
    if (ref.clause && !clauses.includes(ref.clause)) {
      clauses.push(ref.clause);
    }
    // Also include section if present (e.g., "§7.3.1" from section field)
    if (ref.section && !clauses.includes(ref.section)) {
      clauses.push(ref.section);
    }
  }
  return clauses;
}

// ---------------------------------------------------------------------------
// Case scoring
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Why-matched explanation builder
// ---------------------------------------------------------------------------

export interface WhyMatched {
  bullets: string[];
}

function buildCaseWhyMatched(
  event: DecisionEvent,
  caseRecord: CaseRecord,
): WhyMatched {
  const bullets: string[] = [];

  // Clause overlap
  const eventClauses = extractEventClauses(event);
  const clauseOverlap = overlapCount(eventClauses, caseRecord.clausesInvoked);
  if (clauseOverlap > 0) {
    const matchedClauses = caseRecord.clausesInvoked
      .filter((c) => eventClauses.some((ec) => ec.toLowerCase() === c.toLowerCase()))
      .slice(0, 2);
    bullets.push(`Matched clause${matchedClauses.length > 1 ? "s" : ""}: ${matchedClauses.join(", ")}`);
  }

  // Cost proximity
  const eventCost = event.costImpact?.estimated ?? 0;
  const caseCost = caseRecord.costFinal;
  if (eventCost > 0 && caseCost > 0 && costProximity(eventCost, caseCost) > 0) {
    bullets.push(`Similar cost range: $${caseCost.toLocaleString()} vs $${eventCost.toLocaleString()}`);
  }

  // Tag overlap
  const tagOverlap = overlapCount(event.tags, caseRecord.tags);
  if (tagOverlap > 0 && bullets.length < 2) {
    const matchedTags = caseRecord.tags
      .filter((t) => event.tags.some((et) => et.toLowerCase() === t.toLowerCase()))
      .slice(0, 2);
    bullets.push(`Shared tags: ${matchedTags.join(", ")}`);
  }

  // Issue type
  if (bullets.length < 2) {
    const issueMatch = event.tags.some(
      (t) => t.toLowerCase() === caseRecord.issueType.toLowerCase(),
    );
    if (issueMatch) {
      bullets.push(`Same issue type: ${caseRecord.issueType}`);
    }
  }

  if (bullets.length === 0) {
    bullets.push("General pattern similarity");
  }

  return { bullets: bullets.slice(0, 2) };
}

function buildLessonWhyMatched(
  event: DecisionEvent,
  lesson: LessonRecord,
): WhyMatched {
  const bullets: string[] = [];

  // Issue type overlap
  const issueOverlap = event.tags.filter((t) =>
    lesson.issueTypes.some((it) => it.toLowerCase() === t.toLowerCase()),
  );
  if (issueOverlap.length > 0) {
    bullets.push(`Applies to: ${issueOverlap.slice(0, 2).join(", ")}`);
  }

  // Keyword matching
  const eventWords = new Set(
    event.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
  );
  const patternWords = lesson.pattern.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const matched = patternWords.filter((w) => eventWords.has(w));
  if (matched.length > 0 && bullets.length < 2) {
    bullets.push(`Pattern match: "${lesson.pattern.slice(0, 60)}"`);
  }

  if (bullets.length === 0) {
    bullets.push(`Confidence: ${lesson.confidence}%`);
  }

  return { bullets: bullets.slice(0, 2) };
}

// ---------------------------------------------------------------------------
// Feedback type alias
// ---------------------------------------------------------------------------

export type SimilarityFeedbackMap = Map<string, "helpful" | "not_applicable">;

interface ScoredCase {
  caseRecord: CaseRecord;
  score: number;
  whyMatched: WhyMatched;
}

/**
 * Score a CaseRecord against a DecisionEvent for similarity.
 * Scoring criteria:
 * - Tag overlap (0-40 points)
 * - Clause overlap (0-30 points)
 * - Cost range overlap (0-20 points)
 * - Issue type match (0-10 points)
 */
function scoreCaseMatch(event: DecisionEvent, caseRecord: CaseRecord): number {
  let score = 0;

  // 1. Tag overlap: each matching tag is worth points, capped at 40
  const eventTags = event.tags;
  const caseTags = caseRecord.tags;
  const tagOverlap = overlapCount(eventTags, caseTags);
  const maxPossibleTags = Math.max(
    1,
    Math.min(eventTags.length, caseTags.length),
  );
  score += Math.min(40, Math.round((tagOverlap / maxPossibleTags) * 40));

  // 2. Clause overlap: compare event contractReferences with case clausesInvoked
  const eventClauses = extractEventClauses(event);
  const caseClauses = caseRecord.clausesInvoked;
  const clauseOverlap = overlapCount(eventClauses, caseClauses);
  const maxPossibleClauses = Math.max(
    1,
    Math.min(eventClauses.length, caseClauses.length),
  );
  score += Math.min(30, Math.round((clauseOverlap / maxPossibleClauses) * 30));

  // 3. Cost range overlap: within 2x factor
  const eventCost = event.costImpact?.estimated ?? 0;
  const caseCost = caseRecord.costFinal;
  score += Math.round(costProximity(eventCost, caseCost) * 20);

  // 4. Issue type match: check if any event tag matches the case issue type
  const issueTypeMatch = eventTags.some(
    (t) => t.toLowerCase() === caseRecord.issueType.toLowerCase(),
  );
  if (issueTypeMatch) {
    score += 10;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Lesson scoring
// ---------------------------------------------------------------------------

interface ScoredLesson {
  lesson: LessonRecord;
  score: number;
  whyMatched: WhyMatched;
}

/**
 * Score a LessonRecord against a DecisionEvent for relevance.
 * Scoring criteria:
 * - Issue type overlap (0-40 points)
 * - Tag overlap with lesson pattern keywords (0-30 points)
 * - Lesson confidence (0-20 points)
 * - Approved status bonus (0-10 points)
 */
function scoreLessonMatch(
  event: DecisionEvent,
  lesson: LessonRecord,
): number {
  let score = 0;

  // 1. Issue type overlap: event tags vs lesson issueTypes
  const eventTags = event.tags;
  const issueOverlap = overlapCount(eventTags, lesson.issueTypes);
  const maxPossible = Math.max(
    1,
    Math.min(eventTags.length, lesson.issueTypes.length),
  );
  score += Math.min(40, Math.round((issueOverlap / maxPossible) * 40));

  // 2. Pattern keyword matching: check if the lesson pattern or title
  //    contains words from the event's tags or title
  const eventWords = [
    ...eventTags,
    ...event.title.toLowerCase().split(/\s+/),
  ].map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const patternWords = [
    ...lesson.pattern.toLowerCase().split(/\s+/),
    ...lesson.title.toLowerCase().split(/\s+/),
  ].map((w) => w.replace(/[^a-z0-9]/g, ""));

  const wordOverlap = overlapCount(
    eventWords.filter((w) => w.length > 3),
    patternWords.filter((w) => w.length > 3),
  );
  score += Math.min(30, wordOverlap * 6);

  // 3. Lesson confidence: higher confidence lessons are more valuable
  score += Math.round((lesson.confidence / 100) * 20);

  // 4. Approved status bonus
  if (lesson.status === "approved") {
    score += 10;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

export interface MatchedCase {
  caseRecord: CaseRecord;
  score: number;
  whyMatched: WhyMatched;
}

export interface MatchedLesson {
  lesson: LessonRecord;
  score: number;
  whyMatched: WhyMatched;
}

/**
 * Find similar CaseRecords and LessonRecords for a given DecisionEvent.
 * Returns the top 3 cases and top 2 lessons sorted by relevance score.
 *
 * Accepts an optional feedback map to downrank dismissed items:
 * - not_applicable → score × 0.1
 * - helpful → score × 1.1
 *
 * @param event - The current DecisionEvent to find matches for.
 * @param allCases - All available CaseRecord[] from long-term memory.
 * @param allLessons - All available LessonRecord[] from long-term memory.
 * @param feedback - Optional map of targetId → feedback for score adjustment.
 * @returns Object with top matching cases and lessons (with scores and whyMatched).
 */
export function findSimilarCases(
  event: DecisionEvent,
  allCases: CaseRecord[],
  allLessons: LessonRecord[],
  feedback?: SimilarityFeedbackMap,
): { cases: MatchedCase[]; lessons: MatchedLesson[] } {
  // Filter out cases from the same event (don't match an event to its own case)
  const candidateCases = allCases.filter(
    (c) => c.sourceEventId !== event.id,
  );

  // Score and sort cases — apply feedback multiplier
  const scoredCases: ScoredCase[] = candidateCases
    .map((c) => {
      let score = scoreCaseMatch(event, c);
      const fb = feedback?.get(c.id);
      if (fb === "not_applicable") score *= 0.1;
      else if (fb === "helpful") score *= 1.1;
      return {
        caseRecord: c,
        score,
        whyMatched: buildCaseWhyMatched(event, c),
      };
    })
    .filter((sc) => sc.score > 0)
    .sort((a, b) => b.score - a.score);

  // Score and sort lessons — apply feedback multiplier
  const scoredLessons: ScoredLesson[] = allLessons
    .map((l) => {
      let score = scoreLessonMatch(event, l);
      const fb = feedback?.get(l.id);
      if (fb === "not_applicable") score *= 0.1;
      else if (fb === "helpful") score *= 1.1;
      return {
        lesson: l,
        score,
        whyMatched: buildLessonWhyMatched(event, l),
      };
    })
    .filter((sl) => sl.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    cases: scoredCases.slice(0, 3).map((sc) => ({
      caseRecord: sc.caseRecord,
      score: sc.score,
      whyMatched: sc.whyMatched,
    })),
    lessons: scoredLessons.slice(0, 2).map((sl) => ({
      lesson: sl.lesson,
      score: sl.score,
      whyMatched: sl.whyMatched,
    })),
  };
}
