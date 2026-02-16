// src/lib/memory/build-memory-context.ts
// Builds a structured prompt section from long-term memory (cases + lessons)
// for injection into Claude system prompts.

import type { CaseRecord, LessonRecord } from "./types";

export interface MemoryContext {
  cases: CaseRecord[];
  lessons: LessonRecord[];
}

/**
 * Filter cases by relevance to a set of tags or issue types.
 * Returns top N matches sorted by tag overlap.
 */
function filterCases(
  cases: CaseRecord[],
  tags: string[],
  issueTypes: string[],
  limit: number,
): CaseRecord[] {
  const lowerTags = tags.map((t) => t.toLowerCase());
  const lowerTypes = issueTypes.map((t) => t.toLowerCase());

  const scored = cases.map((c) => {
    let score = 0;
    // Tag overlap
    for (const tag of c.tags) {
      if (lowerTags.includes(tag.toLowerCase())) score += 2;
    }
    // Issue type match
    if (lowerTypes.includes(c.issueType.toLowerCase())) score += 3;
    return { case: c, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.case);
}

/**
 * Filter lessons by relevance to issue types.
 * Only includes approved lessons.
 */
function filterLessons(
  lessons: LessonRecord[],
  issueTypes: string[],
  limit: number,
): LessonRecord[] {
  const lowerTypes = issueTypes.map((t) => t.toLowerCase());

  const scored = lessons
    .filter((l) => l.status === "approved")
    .map((l) => {
      let score = 0;
      for (const t of l.issueTypes) {
        if (lowerTypes.includes(t.toLowerCase())) score += 2;
      }
      return { lesson: l, score };
    });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.lesson);
}

/**
 * Format a case record as a concise prompt block.
 */
function formatCase(c: CaseRecord): string {
  return `### ${c.projectName}: ${c.title}
- **Issue:** ${c.issueType} | **Clauses:** ${c.clausesInvoked.join(", ")}
- **Cost:** $${c.costFinal.toLocaleString()} | **Schedule:** ${c.scheduleDaysFinal} days | **Resolution:** ${c.resolutionDays} days
- **Outcome:** ${c.outcome}
- **Key actions:** ${c.actionsPerformed.slice(0, 3).join("; ")}`;
}

/**
 * Format a lesson record as a concise prompt block.
 */
function formatLesson(l: LessonRecord): string {
  return `### ${l.title}
- **Pattern:** ${l.pattern}
- **Confidence:** ${l.confidence}%`;
}

/**
 * Build the complete memory context prompt section.
 * Returns empty string if no relevant matches found.
 */
export function buildMemoryContext(
  memory: MemoryContext,
  tags: string[],
  issueTypes: string[],
): string {
  const matchedCases = filterCases(memory.cases, tags, issueTypes, 3);
  const matchedLessons = filterLessons(memory.lessons, issueTypes, 2);

  if (matchedCases.length === 0 && matchedLessons.length === 0) return "";

  const parts: string[] = ["\n\n## Historical Precedents (Long-Term Memory)"];
  parts.push(
    "The following cases and lessons come from resolved events on prior projects. Use them for pattern comparison and to ground your recommendations in real outcomes.\n",
  );

  if (matchedCases.length > 0) {
    parts.push("### Comparable Cases");
    for (const c of matchedCases) {
      parts.push(formatCase(c));
    }
  }

  if (matchedLessons.length > 0) {
    parts.push("\n### Lessons Learned");
    for (const l of matchedLessons) {
      parts.push(formatLesson(l));
    }
  }

  parts.push(
    "\nWhen relevant, reference these historical outcomes in your analysis — cite the project name and outcome. If the current situation differs materially, explain why the historical pattern may not apply.",
  );

  return parts.join("\n");
}
