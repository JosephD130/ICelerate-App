// src/lib/memory/morning-review.ts
// Pure sorting/filtering for the Morning Review mode.

import type { Suggestion, SuggestionType } from "./types";

/** Priority order — lower index = higher priority. */
const TYPE_PRIORITY: SuggestionType[] = [
  "notice_risk",
  "alignment_change",
  "schedule_revision",
  "cost_revision",
  "stakeholder_action",
  "contract_reference",
  "new_event",
  "field_observation",
];

export function getMorningReviewSuggestions(
  suggestions: Suggestion[],
  limit: number = 5,
): Suggestion[] {
  const pending = suggestions.filter((s) => s.status === "pending");

  const sorted = [...pending].sort((a, b) => {
    const pa = TYPE_PRIORITY.indexOf(a.type);
    const pb = TYPE_PRIORITY.indexOf(b.type);
    if (pa !== pb) return pa - pb;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return sorted.slice(0, limit);
}

export const REVIEW_CHIPS = ["notice", "drift", "cost", "schedule"] as const;
export type ReviewChip = (typeof REVIEW_CHIPS)[number];

const CHIP_TO_TYPE: Record<ReviewChip, SuggestionType> = {
  notice: "notice_risk",
  drift: "alignment_change",
  cost: "cost_revision",
  schedule: "schedule_revision",
};

export function filterByChips(
  suggestions: Suggestion[],
  activeChips: Set<ReviewChip>,
): Suggestion[] {
  if (activeChips.size === 0) return suggestions;
  const allowedTypes = new Set(
    Array.from(activeChips).map((c) => CHIP_TO_TYPE[c]),
  );
  return suggestions.filter((s) => allowedTypes.has(s.type));
}
