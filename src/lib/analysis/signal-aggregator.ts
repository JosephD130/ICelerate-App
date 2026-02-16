// src/lib/analysis/signal-aggregator.ts
// Cross-system signal aggregation engine.
// Merges suggestions, drift results, and insight cards into a unified morning brief.
// Pure deterministic — no AI calls.

import type { Suggestion } from "@/lib/memory/types";
import type { DriftResult } from "@/lib/reality-sync/drift-detector";
import type { InsightCard } from "@/lib/demo/v5/resolvers/intelligence-feed";
import type { DecisionEvent } from "@/lib/models/decision-event";
import type { EventTab } from "@/lib/contexts/event-context";

export type SignalPriority = 1 | 2 | 3;
export type SignalCategory =
  | "notice"
  | "cost"
  | "schedule"
  | "stakeholder"
  | "alignment"
  | "quality";

export interface AggregatedSignal {
  id: string;
  priority: SignalPriority;
  category: SignalCategory;
  headline: string;
  detail: string;
  sources: string[];
  eventIds: string[];
  actionRequired: boolean;
  suggestedTab?: EventTab;
}

export interface MorningBrief {
  date: string;
  projectId: string;
  signals: AggregatedSignal[];
  topRisk: AggregatedSignal | null;
  actionCount: number;
  overallHealth: "good" | "caution" | "critical";
}

// ── Helpers ───────────────────────────────────────────────

function categorizeSuggestion(type: string): SignalCategory {
  switch (type) {
    case "notice_risk":
      return "notice";
    case "cost_revision":
      return "cost";
    case "schedule_revision":
      return "schedule";
    case "stakeholder_action":
      return "stakeholder";
    case "alignment_change":
      return "alignment";
    case "contract_reference":
      return "quality";
    default:
      return "quality";
  }
}

function categorizeInsight(type: string): SignalCategory {
  switch (type) {
    case "notice_expiring":
      return "notice";
    case "cost_trending":
      return "cost";
    case "schedule_drift":
      return "schedule";
    case "stakeholder_gap":
      return "stakeholder";
    case "log_anomaly":
      return "quality";
    case "new_constraint":
      return "alignment";
    default:
      return "quality";
  }
}

function categorizeDrift(column: string): SignalCategory {
  switch (column) {
    case "contract":
      return "notice";
    case "field":
      return "alignment";
    case "office":
      return "stakeholder";
    default:
      return "quality";
  }
}

function suggestedTabForCategory(category: SignalCategory): EventTab {
  switch (category) {
    case "notice":
      return "contract";
    case "cost":
      return "monitor";
    case "schedule":
      return "monitor";
    case "stakeholder":
      return "communication";
    case "alignment":
      return "field";
    case "quality":
      return "monitor";
  }
}

// ── Main aggregator ───────────────────────────────────────

/**
 * Aggregate signals from suggestions, drift results, and insight cards
 * into a unified morning brief.
 */
export function aggregateSignals(opts: {
  suggestions: Suggestion[];
  driftResults: DriftResult[];
  insightCards: InsightCard[];
  events: DecisionEvent[];
  projectId: string;
}): MorningBrief {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { suggestions, driftResults, insightCards, events, projectId } = opts;
  const signals: AggregatedSignal[] = [];
  const seenEventIds = new Set<string>();

  // ── From suggestions ──
  for (const sug of suggestions) {
    if (sug.status !== "pending") continue;
    const category = categorizeSuggestion(sug.type);
    const isNoticeOverdue =
      sug.type === "notice_risk" && sug.headline.includes("OVERDUE");
    const isHighImpact = sug.impact === "high";

    let priority: SignalPriority;
    if (isNoticeOverdue || (isHighImpact && category === "notice")) {
      priority = 1;
    } else if (isHighImpact || sug.confidence >= 85) {
      priority = 2;
    } else {
      priority = 3;
    }

    const eventIds = sug.eventId ? [sug.eventId] : [];
    eventIds.forEach((id) => seenEventIds.add(id));

    signals.push({
      id: `sig-sug-${sug.id}`,
      priority,
      category,
      headline: sug.headline,
      detail: sug.detail,
      sources: [`Suggestion: ${sug.type}`],
      eventIds,
      actionRequired: priority <= 2,
      suggestedTab: suggestedTabForCategory(category),
    });
  }

  // ── From drift results ──
  for (const drift of driftResults) {
    const category = categorizeDrift(drift.column);
    const priority: SignalPriority =
      drift.severity === "misaligned" ? 1 : drift.severity === "drift" ? 2 : 3;

    signals.push({
      id: `sig-drift-${drift.ruleId}`,
      priority,
      category,
      headline: drift.message,
      detail: `Drift detected in ${drift.column} column — ${drift.severity} severity`,
      sources: [`Drift: ${drift.ruleId}`],
      eventIds: [],
      actionRequired: drift.severity === "misaligned",
      suggestedTab: suggestedTabForCategory(category),
    });
  }

  // ── From insight cards (avoid duplicates with seen event IDs) ──
  for (const card of insightCards) {
    // Skip if we already have a signal for this event from suggestions
    if (card.relatedEventId && seenEventIds.has(card.relatedEventId)) continue;

    const category = categorizeInsight(card.type);
    const priority: SignalPriority =
      card.impact === "high" ? 2 : card.impact === "medium" ? 3 : 3;

    const eventIds = card.relatedEventId ? [card.relatedEventId] : [];

    signals.push({
      id: `sig-insight-${card.id}`,
      priority,
      category,
      headline: card.headline,
      detail: card.detail,
      sources: [card.source],
      eventIds,
      actionRequired: card.impact === "high",
      suggestedTab: suggestedTabForCategory(category),
    });
  }

  // ── Sort by priority, then by category importance ──
  const categoryOrder: Record<SignalCategory, number> = {
    notice: 0,
    cost: 1,
    schedule: 2,
    stakeholder: 3,
    alignment: 4,
    quality: 5,
  };

  signals.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (categoryOrder[a.category] ?? 5) - (categoryOrder[b.category] ?? 5);
  });

  // ── Determine overall health ──
  const p1Count = signals.filter((s) => s.priority === 1).length;
  const p2Count = signals.filter((s) => s.priority === 2).length;
  const actionCount = signals.filter((s) => s.actionRequired).length;

  let overallHealth: "good" | "caution" | "critical";
  if (p1Count >= 2) {
    overallHealth = "critical";
  } else if (p1Count >= 1 || p2Count >= 3) {
    overallHealth = "caution";
  } else {
    overallHealth = "good";
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    projectId,
    signals,
    topRisk: signals.length > 0 ? signals[0] : null,
    actionCount,
    overallHealth,
  };
}
