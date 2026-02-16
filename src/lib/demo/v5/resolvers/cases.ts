// src/lib/demo/v5/resolvers/cases.ts
// Converts a resolved DecisionEvent into a CaseRecord for long-term memory.
// Pure computation — no React hooks, no side effects, no API calls.

import type { CaseRecord } from "@/lib/memory/types";
import type { DecisionEvent } from "@/lib/models/decision-event";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW_ISO = new Date().toISOString();

/**
 * Extract the issue type from event tags.
 * Uses the first tag that looks like a category, or falls back to "general".
 */
function extractIssueType(tags: string[]): string {
  if (tags.length === 0) return "general";
  // Prefer tags that look like issue categories
  const categoryPatterns = [
    "differing-site",
    "utility",
    "notice",
    "submittal",
    "inspection",
    "weather",
    "schedule",
    "cost",
    "safety",
    "stakeholder",
    "alignment",
    "rfi",
    "change-order",
    "claim",
    "design",
    "quality",
    "procurement",
  ];
  const match = tags.find((t) =>
    categoryPatterns.some((p) => t.toLowerCase().includes(p)),
  );
  return match ?? tags[0];
}

/**
 * Extract action descriptions from the event history entries.
 */
function extractActions(event: DecisionEvent): string[] {
  return event.history
    .filter((h) => h.action && h.action !== "Event created")
    .map((h) => {
      const detail = h.detail ? ` — ${h.detail}` : "";
      return `${h.action}${detail}`;
    });
}

/**
 * Build a summary of the case outcome from the event's current state.
 */
export function buildOutcome(event: DecisionEvent): string {
  const parts: string[] = [];

  if (event.status === "resolved") {
    parts.push("Resolved.");
  } else if (event.status === "escalated") {
    parts.push("Escalated.");
  } else {
    parts.push(`Status: ${event.status}.`);
  }

  if (event.costImpact) {
    parts.push(
      `Final cost: $${event.costImpact.estimated.toLocaleString()} (${event.costImpact.confidence} confidence).`,
    );
  }

  if (event.scheduleImpact) {
    parts.push(
      `Schedule: ${event.scheduleImpact.daysAffected} day(s)${event.scheduleImpact.criticalPath ? " on critical path" : ""}.`,
    );
  }

  if (event.decisionRecord) {
    const sentPanels = event.decisionRecord.panels.filter((p) => p.sent);
    if (sentPanels.length > 0) {
      parts.push(
        `${sentPanels.length} stakeholder communication(s) sent.`,
      );
    }
  }

  return parts.join(" ");
}

/**
 * Collect all unique clause references from the event's contract references.
 */
export function extractClauses(event: DecisionEvent): string[] {
  const clauses: string[] = [];
  for (const ref of event.contractReferences) {
    const key = ref.section
      ? `${ref.section} ${ref.clause}`
      : ref.clause;
    if (!clauses.includes(key)) {
      clauses.push(key);
    }
  }
  return clauses;
}

/**
 * Compute resolution days from the event's velocity metrics or date range.
 * Returns the number of days from detection to decision/communication/now.
 */
function computeResolutionDays(event: DecisionEvent): number {
  // Prefer velocity metrics if available
  if (event.velocity.totalMinutes !== undefined && event.velocity.totalMinutes > 0) {
    return Math.max(1, Math.round(event.velocity.totalMinutes / (60 * 24)));
  }

  // Use decidedAt or communicatedAt if available
  const endDate =
    event.velocity.communicatedAt ??
    event.velocity.decidedAt ??
    event.updatedAt;
  const startDate = event.velocity.detectedAt ?? event.createdAt;

  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const days = Math.round(diffMs / 86_400_000);
  return Math.max(1, days);
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Convert a DecisionEvent into a CaseRecord for long-term memory storage.
 * This captures the event's resolution as a reusable case for future reference.
 *
 * @param event - The DecisionEvent to convert (typically a resolved event).
 * @param projectName - The human-readable project name.
 * @returns A CaseRecord capturing the event's resolution.
 */
export function resolveCaseFromEvent(
  event: DecisionEvent,
  projectName: string,
): CaseRecord {
  const actions = extractActions(event);

  // If no history actions beyond creation, synthesize from available records
  if (actions.length === 0) {
    if (event.fieldRecord) {
      actions.push(`Field observation: ${event.fieldRecord.observation.slice(0, 120)}`);
    }
    if (event.rfiRecord) {
      actions.push(`RFI generated: ${event.rfiRecord.description.slice(0, 120)}`);
    }
    if (event.decisionRecord) {
      actions.push(
        `Decision package created with ${event.decisionRecord.panels.length} panel(s)`,
      );
    }
    if (event.communications.length > 0) {
      actions.push(
        `${event.communications.length} communication(s) sent across rooms/personas`,
      );
    }
  }

  const closedAt =
    event.status === "resolved"
      ? event.velocity.communicatedAt ?? event.velocity.decidedAt ?? event.updatedAt
      : event.updatedAt;

  return {
    id: `case-${event.id}`,
    sourceEventId: event.id,
    sourceProjectId: event.toolSource !== "manual" ? event.toolSource : event.id.split("-")[1] ?? "unknown",
    projectName,
    issueType: extractIssueType(event.tags),
    title: event.title,
    summary: event.description || event.trigger,
    actionsPerformed: actions,
    outcome: buildOutcome(event),
    clausesInvoked: extractClauses(event),
    costFinal: event.costImpact?.estimated ?? 0,
    scheduleDaysFinal: event.scheduleImpact?.daysAffected ?? 0,
    resolutionDays: computeResolutionDays(event),
    tags: [...event.tags],
    closedAt,
    createdAt: NOW_ISO,
  };
}
