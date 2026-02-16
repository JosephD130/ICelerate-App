import type { Suggestion, SuggestionType } from "@/lib/memory/types";

// ─── Provenance data attached to any metric or value ───

export interface ProvenanceData {
  changedBecause?: {
    suggestionId: string;
    summary: string;
    acceptedAt?: string;
  };
  sources: Array<{
    sourceId: string;
    type: string;
    timestamp: string;
    excerpt: string;
  }>;
  citations?: Array<{
    docId?: string;
    clauseRef?: string;
    quote?: string;
  }>;
  assumptions?: string[];
  missingEvidence?: string[];
}

// Map metric keys to the suggestion type they originate from.
const METRIC_TO_TYPE: Record<string, SuggestionType> = {
  costExposure: "cost_revision",
  scheduleDays: "schedule_revision",
  noticeDeadline: "notice_risk",
};

/** Find the most-recent accepted suggestion matching a metric + event. */
function findLatestAccepted(
  suggestions: Suggestion[],
  targetType: SuggestionType,
  eventId?: string,
): Suggestion | undefined {
  return suggestions
    .filter(
      (s) =>
        s.type === targetType &&
        (s.status === "accepted" || s.status === "edited") &&
        (eventId === undefined || s.eventId === eventId),
    )
    .sort(
      (a, b) =>
        new Date(b.reviewedAt ?? b.createdAt).getTime() -
        new Date(a.reviewedAt ?? a.createdAt).getTime(),
    )[0];
}

/** Build provenance from a matched suggestion (shared logic). */
function buildFromSuggestions(
  matched: Suggestion[],
): ProvenanceData {
  if (matched.length === 0) {
    return {
      sources: [],
      missingEvidence: ["No accepted suggestion linked to this metric"],
    };
  }

  // Use the most recent as the "changedBecause" entry.
  const latest = matched[0];

  const changedBecause = {
    suggestionId: latest.id,
    summary: latest.headline,
    acceptedAt: latest.reviewedAt,
  };

  // Aggregate sources from all matched suggestions.
  const sources = matched.flatMap((s) =>
    s.citations.map((c) => ({
      sourceId: c.sourceId,
      type: "document",
      timestamp: s.createdAt,
      excerpt: c.excerpt,
    })),
  );

  // Extract citations that have a chunkRef (clause-level evidence).
  const citations = matched
    .flatMap((s) => s.citations)
    .filter((c) => c.chunkRef)
    .map((c) => ({
      docId: c.sourceId,
      clauseRef: c.chunkRef,
      quote: c.excerpt,
    }));

  // Surface assumptions from editor overrides.
  const assumptions: string[] = [];
  for (const s of matched) {
    if (s.editorOverrides?.costLow != null && s.editorOverrides?.costHigh != null) {
      const low = s.editorOverrides.costLow.toLocaleString();
      const high = s.editorOverrides.costHigh.toLocaleString();
      assumptions.push(`Exposure range: $${low} \u2014 $${high}`);
    }
    if (s.suggestedChanges) {
      for (const [key, val] of Object.entries(s.suggestedChanges)) {
        if (/rate/i.test(key)) {
          assumptions.push(`${key}: ${val}`);
        }
      }
    }
  }

  // Flag missing evidence.
  const missingEvidence: string[] = [];
  if (latest.confidence < 80) {
    missingEvidence.push(
      "Confidence below 80% \u2014 additional verification recommended",
    );
  }
  const totalCitations = matched.flatMap((s) => s.citations).length;
  if (totalCitations < 2) {
    missingEvidence.push(
      `Only ${totalCitations} source(s) \u2014 cross-referencing recommended`,
    );
  }

  return {
    changedBecause,
    sources,
    ...(citations.length > 0 ? { citations } : {}),
    ...(assumptions.length > 0 ? { assumptions } : {}),
    ...(missingEvidence.length > 0 ? { missingEvidence } : {}),
  };
}

// ─── Public API ────────────────────────────────────────

/** Build provenance for a single metric on a specific event. */
export function buildProvenanceForMetric(opts: {
  metricKey: "costExposure" | "scheduleDays" | "noticeDeadline";
  eventId: string;
  allSuggestions: Suggestion[];
}): ProvenanceData {
  const targetType = METRIC_TO_TYPE[opts.metricKey];
  const matched = findLatestAccepted(
    opts.allSuggestions,
    targetType,
    opts.eventId,
  );
  return buildFromSuggestions(matched ? [matched] : []);
}

/** Build aggregated provenance across all events for a project-level metric. */
export function buildProvenanceForProject(opts: {
  metricKey: "costExposure" | "scheduleDays";
  allSuggestions: Suggestion[];
}): ProvenanceData {
  const targetType = METRIC_TO_TYPE[opts.metricKey];
  const matched = opts.allSuggestions
    .filter(
      (s) =>
        s.type === targetType &&
        (s.status === "accepted" || s.status === "edited"),
    )
    .sort(
      (a, b) =>
        new Date(b.reviewedAt ?? b.createdAt).getTime() -
        new Date(a.reviewedAt ?? a.createdAt).getTime(),
    );
  return buildFromSuggestions(matched);
}
