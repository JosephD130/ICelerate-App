// src/lib/demo/v5/resolvers/suggestions.ts
// Generates deterministic Suggestion[] from project events, logs, and cross-references.
// Pure computation — no React hooks, no side effects, no API calls.

import type { Suggestion, SuggestionCitation } from "@/lib/memory/types";
import { DEMO_PROJECT_BY_ID } from "@/lib/demo/v5/projects";
import type { DemoProject, Task } from "@/lib/demo/v5/projects";
import { DEMO_DAILY_LOGS_V5 } from "@/lib/demo/v5/dailyLogs";
import type { DailyLog } from "@/lib/demo/v5/dailyLogs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW_ISO = new Date().toISOString();

function hoursUntil(isoDate: string): number {
  return Math.round(
    (new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60),
  );
}

function daysBetween(dateA: string, dateB: string): number {
  return Math.round(
    (new Date(dateB).getTime() - new Date(dateA).getTime()) / 86_400_000,
  );
}

function makeCitation(
  sourceId: string,
  excerpt: string,
  chunkRef?: string,
): SuggestionCitation {
  return { sourceId, excerpt, chunkRef };
}

// ---------------------------------------------------------------------------
// Rule 1: notice_risk
// Events with notice deadlines < 72 hours from now.
// ---------------------------------------------------------------------------

function noticeRiskSuggestions(
  project: DemoProject,
  logs: DailyLog[],
  existing: Set<string>,
): Suggestion[] {
  const results: Suggestion[] = [];

  for (const event of project.events) {
    if (event.status === "resolved" || !event.noticeRequired) continue;
    if (!event.noticeDeadlineAt) continue;

    const id = `sug-notice-${event.id}`;
    if (existing.has(id)) continue;

    const hours = hoursUntil(event.noticeDeadlineAt);
    if (hours >= 72) continue;

    // Find the clause reference for the notice requirement
    const citations: SuggestionCitation[] = [];
    for (const docRef of event.docRefs) {
      const doc = project.documents.find((d) => d.id === docRef.docId);
      if (!doc) continue;
      for (const clauseRef of docRef.clauseRefs) {
        const clause = doc.clauses.find((c) => c.ref === clauseRef);
        if (clause?.noticeWindowHours) {
          citations.push(
            makeCitation(
              doc.id,
              `${clause.ref} "${clause.heading}": ${clause.summary}`,
              clause.ref,
            ),
          );
        }
      }
    }

    // Add a log citation if any log references this event
    const relatedLog = logs.find(
      (l) =>
        l.projectId === project.id && l.relatedEventIds.includes(event.id),
    );
    if (relatedLog) {
      citations.push(
        makeCitation(
          relatedLog.id,
          `Daily log ${relatedLog.date} references this event in constraints.`,
        ),
      );
    }

    const overdue = hours <= 0;
    results.push({
      id,
      projectId: project.id,
      eventId: event.id,
      type: "notice_risk",
      headline: overdue
        ? `Notice window OVERDUE for "${event.title}"`
        : `Notice deadline in ${hours}h — "${event.title}"`,
      detail: overdue
        ? `The contractual notice window has expired. Failure to file may waive entitlement to time extension or additional compensation. Immediate action recommended.`
        : `The notice deadline is approaching in ${hours} hours. Contractual notice must be submitted before ${event.noticeDeadlineAt} to preserve entitlement.`,
      confidence: overdue ? 95 : 90,
      rationale: `Event "${event.title}" has noticeRequired=true with a deadline at ${event.noticeDeadlineAt}. Current time places the window at ${hours} hours remaining.`,
      citations,
      impact: overdue ? "high" : hours < 24 ? "high" : "medium",
      suggestedChanges: {
        action: "Submit written notice per contract requirements",
        deadline: event.noticeDeadlineAt,
      },
      status: "pending",
      createdAt: NOW_ISO,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Rule 2: cost_revision
// Standby equipment hours in logs suggest higher cost than event estimates.
// ---------------------------------------------------------------------------

function costRevisionSuggestions(
  project: DemoProject,
  logs: DailyLog[],
  existing: Set<string>,
): Suggestion[] {
  const results: Suggestion[] = [];
  const projectLogs = logs.filter((l) => l.projectId === project.id);

  for (const event of project.events) {
    if (event.status === "resolved") continue;

    const id = `sug-cost-${event.id}`;
    if (existing.has(id)) continue;

    // Find logs related to this event that have standby equipment
    const eventLogs = projectLogs.filter((l) =>
      l.relatedEventIds.includes(event.id),
    );
    const standbyEntries = eventLogs.flatMap((log) =>
      log.equipment
        .filter((e) => e.status === "standby")
        .map((e) => ({ ...e, logId: log.id, logDate: log.date })),
    );

    if (standbyEntries.length === 0) continue;

    // Estimate standby cost: count * 8hr day * $150/hr rough rate
    const HOURLY_RATE = 150;
    const totalStandbyHours = standbyEntries.reduce(
      (sum, e) => sum + e.count * 8,
      0,
    );
    const estimatedStandbyCost = totalStandbyHours * HOURLY_RATE;

    // Only flag if standby cost is substantial relative to the event's estimate
    if (estimatedStandbyCost < 3000) continue;
    const currentEstimate = event.costExposure.amount;
    if (currentEstimate > 0 && estimatedStandbyCost < currentEstimate * 0.15)
      continue;

    const citations: SuggestionCitation[] = standbyEntries
      .slice(0, 3)
      .map((e) =>
        makeCitation(
          e.logId,
          `${e.name} on standby (${e.count} unit(s)) — log date ${e.logDate}.`,
        ),
      );

    const revisedEstimate = currentEstimate + estimatedStandbyCost;

    results.push({
      id,
      projectId: project.id,
      eventId: event.id,
      type: "cost_revision",
      headline: `Standby costs may increase exposure for "${event.title}"`,
      detail: `${standbyEntries.length} equipment standby entries across ${eventLogs.length} log(s) suggest ~$${estimatedStandbyCost.toLocaleString()} in accrued standby costs. Current event estimate is $${currentEstimate.toLocaleString()}. Revised exposure may be ~$${revisedEstimate.toLocaleString()}.`,
      confidence: event.costExposure.confidence === "high" ? 75 : 85,
      rationale: `Daily logs show ${totalStandbyHours} standby-hours of equipment tied to this event. At an estimated rate of $${HOURLY_RATE}/hr, this adds ~$${estimatedStandbyCost.toLocaleString()} that may not be reflected in the current cost estimate.`,
      citations,
      impact:
        estimatedStandbyCost > currentEstimate * 0.5 || estimatedStandbyCost > 10000
          ? "high"
          : "medium",
      suggestedChanges: {
        costExposure: {
          amount: revisedEstimate,
          notes: `Revised to include standby costs of ~$${estimatedStandbyCost.toLocaleString()}`,
        },
      },
      status: "pending",
      createdAt: NOW_ISO,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Rule 3: stakeholder_action
// High-severity events with unbriefed stakeholders.
// ---------------------------------------------------------------------------

function stakeholderActionSuggestions(
  project: DemoProject,
  logs: DailyLog[],
  existing: Set<string>,
): Suggestion[] {
  const results: Suggestion[] = [];
  const projectLogs = logs.filter((l) => l.projectId === project.id);

  for (const event of project.events) {
    if (event.status === "resolved") continue;
    if (event.severity !== "critical" && event.severity !== "high") continue;
    if (event.stakeholderIds.length === 0) continue;

    const id = `sug-stakeholder-${event.id}`;
    if (existing.has(id)) continue;

    // Check for evidence in logs that stakeholders have not been briefed
    const eventLogs = projectLogs.filter((l) =>
      l.relatedEventIds.includes(event.id),
    );
    const briefingGapEvidence = eventLogs.filter((l) =>
      l.constraints.some(
        (c) =>
          c.toLowerCase().includes("not been briefed") ||
          c.toLowerCase().includes("briefing gap") ||
          c.toLowerCase().includes("stakeholder") ||
          c.toLowerCase().includes("unaware") ||
          c.toLowerCase().includes("not yet distributed"),
      ),
    );

    if (briefingGapEvidence.length === 0) continue;

    // Resolve stakeholder names for the suggestion detail
    const unbriefedNames = event.stakeholderIds
      .map((sid) => project.stakeholders.find((s) => s.id === sid))
      .filter((s) => s !== undefined)
      .filter((s) => s.influence === "high")
      .map((s) => s.name);

    if (unbriefedNames.length === 0) continue;

    const citations: SuggestionCitation[] = briefingGapEvidence
      .slice(0, 2)
      .map((log) => {
        const constraint = log.constraints.find(
          (c) =>
            c.toLowerCase().includes("briefing") ||
            c.toLowerCase().includes("stakeholder") ||
            c.toLowerCase().includes("unaware") ||
            c.toLowerCase().includes("not yet distributed"),
        );
        return makeCitation(
          log.id,
          constraint ?? `Log ${log.date} indicates stakeholder briefing gap.`,
        );
      });

    results.push({
      id,
      projectId: project.id,
      eventId: event.id,
      type: "stakeholder_action",
      headline: `${event.severity === "critical" ? "Critical" : "High-priority"} event unbriefed: ${unbriefedNames.slice(0, 2).join(", ")}`,
      detail: `"${event.title}" is ${event.severity} severity with ${unbriefedNames.length} high-influence stakeholder(s) who have not been briefed. Field logs indicate a communication gap that may delay decision-making or escalate risk.`,
      confidence: 88,
      rationale: `Daily logs explicitly reference stakeholder briefing gaps for this ${event.severity}-severity event. ${unbriefedNames.join(", ")} have high influence and need to be informed to enable timely decisions.`,
      citations,
      impact: "high",
      suggestedChanges: {
        action: "Schedule stakeholder briefing",
        stakeholders: unbriefedNames,
      },
      status: "pending",
      createdAt: NOW_ISO,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Rule 4: alignment_change
// Field logs show work resumed but event still "open" without resolution.
// ---------------------------------------------------------------------------

function alignmentChangeSuggestions(
  project: DemoProject,
  logs: DailyLog[],
  existing: Set<string>,
): Suggestion[] {
  const results: Suggestion[] = [];
  const projectLogs = logs
    .filter((l) => l.projectId === project.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const event of project.events) {
    if (event.status === "resolved") continue;

    const id = `sug-alignment-${event.id}`;
    if (existing.has(id)) continue;

    // Look for logs related to this event where work has resumed
    const eventLogs = projectLogs.filter((l) =>
      l.relatedEventIds.includes(event.id),
    );
    if (eventLogs.length < 2) continue;

    // Check if the most recent log shows active work (not just standby/documentation)
    const latestLog = eventLogs[0];
    const hasActiveWork = latestLog.workPerformed.some(
      (w) =>
        w.toLowerCase().includes("resumed") ||
        w.toLowerCase().includes("continued") ||
        w.toLowerCase().includes("completed") ||
        w.toLowerCase().includes("submitted") ||
        w.toLowerCase().includes("advanced"),
    );

    // Check if earlier logs had a hold/halt
    const hadHold = eventLogs.some((l) =>
      l.constraints.some(
        (c) =>
          c.toLowerCase().includes("halted") ||
          c.toLowerCase().includes("hold") ||
          c.toLowerCase().includes("standby") ||
          c.toLowerCase().includes("on hold"),
      ),
    );

    if (!hasActiveWork || !hadHold) continue;

    // The event is still open but work seems to be progressing — alignment may have shifted
    const citations: SuggestionCitation[] = [
      makeCitation(
        latestLog.id,
        latestLog.workPerformed
          .find(
            (w) =>
              w.toLowerCase().includes("resumed") ||
              w.toLowerCase().includes("continued") ||
              w.toLowerCase().includes("completed") ||
              w.toLowerCase().includes("submitted") ||
              w.toLowerCase().includes("advanced"),
          ) ?? `Recent work activity logged on ${latestLog.date}.`,
      ),
    ];

    const holdLog = eventLogs.find((l) =>
      l.constraints.some(
        (c) =>
          c.toLowerCase().includes("halted") ||
          c.toLowerCase().includes("hold") ||
          c.toLowerCase().includes("on hold"),
      ),
    );
    if (holdLog) {
      const holdConstraint = holdLog.constraints.find(
        (c) =>
          c.toLowerCase().includes("halted") ||
          c.toLowerCase().includes("hold") ||
          c.toLowerCase().includes("on hold"),
      );
      citations.push(
        makeCitation(
          holdLog.id,
          holdConstraint ?? `Hold/halt documented on ${holdLog.date}.`,
        ),
      );
    }

    results.push({
      id,
      projectId: project.id,
      eventId: event.id,
      type: "alignment_change",
      headline: `Field activity progressing but event still "${event.status}" — "${event.title}"`,
      detail: `Earlier logs showed a hold or halt for this event, but the most recent log (${latestLog.date}) shows active work. The event status is still "${event.status}" and alignment is "${event.alignmentStatus}". Consider updating the event status or confirming resolution conditions.`,
      confidence: 78,
      rationale: `Work resumption detected in log ${latestLog.id} (${latestLog.date}) despite prior hold in log ${holdLog?.id ?? "unknown"}. Event status has not been updated to reflect field conditions.`,
      citations,
      impact: event.alignmentStatus === "high_risk" ? "high" : "medium",
      suggestedChanges: {
        alignmentStatus: "drift",
        action: "Review event status against current field conditions",
      },
      status: "pending",
      createdAt: NOW_ISO,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Rule 5: contract_reference
// Log constraints mention specs/clauses not yet on event's docRefs.
// ---------------------------------------------------------------------------

function contractReferenceSuggestions(
  project: DemoProject,
  logs: DailyLog[],
  existing: Set<string>,
): Suggestion[] {
  const results: Suggestion[] = [];
  const projectLogs = logs.filter((l) => l.projectId === project.id);

  // Build a set of all known clause refs across all project documents
  const allClauseRefs = new Map<string, { docId: string; docTitle: string; heading: string; summary: string }>();
  for (const doc of project.documents) {
    for (const clause of doc.clauses) {
      allClauseRefs.set(clause.ref, {
        docId: doc.id,
        docTitle: doc.title,
        heading: clause.heading,
        summary: clause.summary,
      });
    }
  }

  for (const event of project.events) {
    if (event.status === "resolved") continue;

    const id = `sug-contract-${event.id}`;
    if (existing.has(id)) continue;

    // Collect clause refs already on this event
    const existingRefs = new Set<string>();
    for (const docRef of event.docRefs) {
      for (const clauseRef of docRef.clauseRefs) {
        existingRefs.add(clauseRef);
      }
    }

    // Search logs related to this event for mentions of clause refs
    const eventLogs = projectLogs.filter((l) =>
      l.relatedEventIds.includes(event.id),
    );

    const foundRefs: Array<{
      ref: string;
      docId: string;
      docTitle: string;
      heading: string;
      summary: string;
      logId: string;
      constraintText: string;
    }> = [];

    for (const log of eventLogs) {
      for (const constraint of log.constraints) {
        // Look for section/clause references in constraint text (e.g., §7.3.1, §105.17)
        const refMatches = constraint.match(/§[\d.]+[A-Za-z]*/g);
        if (!refMatches) continue;

        for (const ref of refMatches) {
          if (existingRefs.has(ref)) continue;
          const clauseInfo = allClauseRefs.get(ref);
          if (!clauseInfo) continue;

          foundRefs.push({
            ref,
            ...clauseInfo,
            logId: log.id,
            constraintText: constraint,
          });
        }
      }

      // Also check workPerformed for clause references
      for (const work of log.workPerformed) {
        const refMatches = work.match(/§[\d.]+[A-Za-z]*/g);
        if (!refMatches) continue;

        for (const ref of refMatches) {
          if (existingRefs.has(ref)) continue;
          if (foundRefs.some((f) => f.ref === ref)) continue;
          const clauseInfo = allClauseRefs.get(ref);
          if (!clauseInfo) continue;

          foundRefs.push({
            ref,
            ...clauseInfo,
            logId: log.id,
            constraintText: work,
          });
        }
      }
    }

    if (foundRefs.length === 0) continue;

    const citations: SuggestionCitation[] = foundRefs.slice(0, 3).map((f) =>
      makeCitation(f.logId, f.constraintText, f.ref),
    );

    results.push({
      id,
      projectId: project.id,
      eventId: event.id,
      type: "contract_reference",
      headline: `${foundRefs.length} clause ref(s) found in logs but not on event — "${event.title}"`,
      detail: `Field logs reference ${foundRefs.map((f) => f.ref).join(", ")} in relation to this event, but these clauses are not listed in the event's document references. Adding them strengthens contract traceability.`,
      confidence: 82,
      rationale: `Log text explicitly references ${foundRefs.map((f) => `${f.ref} ("${f.heading}")`).join("; ")} which are valid clauses from project documents but missing from event docRefs.`,
      citations,
      impact: foundRefs.some((f) => f.heading.toLowerCase().includes("notice"))
        ? "high"
        : "medium",
      suggestedChanges: {
        addDocRefs: foundRefs.map((f) => ({
          docId: f.docId,
          clauseRef: f.ref,
        })),
      },
      status: "pending",
      createdAt: NOW_ISO,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Rule 6: schedule_revision
// Task forecast dates slipped beyond event schedule impact estimate.
// ---------------------------------------------------------------------------

function scheduleRevisionSuggestions(
  project: DemoProject,
  _logs: DailyLog[],
  existing: Set<string>,
): Suggestion[] {
  const results: Suggestion[] = [];

  for (const event of project.events) {
    if (event.status === "resolved") continue;
    if (event.scheduleImpact.days === 0) continue;

    const id = `sug-schedule-${event.id}`;
    if (existing.has(id)) continue;

    // Find all tasks linked to this event and check forecast slippage
    const linkedTasks = event.taskIds
      .map((tid) => project.tasks.find((t) => t.id === tid))
      .filter((t): t is Task => t !== undefined);

    if (linkedTasks.length === 0) continue;

    // Compute the maximum forecast variance across linked tasks
    let maxVariance = 0;
    let worstTask: Task | null = null;
    for (const task of linkedTasks) {
      const variance = daysBetween(task.baselineFinish, task.forecastFinish);
      if (variance > maxVariance) {
        maxVariance = variance;
        worstTask = task;
      }
    }

    // Only flag if the actual task slippage exceeds the event's stated schedule impact
    if (maxVariance <= event.scheduleImpact.days) continue;
    if (!worstTask) continue;

    const overage = maxVariance - event.scheduleImpact.days;

    const citations: SuggestionCitation[] = [
      makeCitation(
        event.id,
        `Event states ${event.scheduleImpact.days}-day impact. Task ${worstTask.id} ("${worstTask.name}") shows ${maxVariance}-day forecast variance.`,
      ),
    ];

    // Add citation for critical path impact if applicable
    if (worstTask.criticalPath) {
      citations.push(
        makeCitation(
          worstTask.id,
          `Task ${worstTask.id} is on the critical path: baseline finish ${worstTask.baselineFinish}, forecast finish ${worstTask.forecastFinish}.`,
        ),
      );
    }

    results.push({
      id,
      projectId: project.id,
      eventId: event.id,
      type: "schedule_revision",
      headline: `Schedule impact understated by ${overage} day(s) — "${event.title}"`,
      detail: `Event estimates ${event.scheduleImpact.days}-day schedule impact, but linked task "${worstTask.name}" (${worstTask.id}) shows a ${maxVariance}-day forecast variance from baseline.${worstTask.criticalPath ? " This task is on the critical path." : ""} Consider revising the event schedule impact.`,
      confidence: worstTask.criticalPath ? 90 : 80,
      rationale: `Task ${worstTask.id} baseline finish is ${worstTask.baselineFinish}, forecast finish is ${worstTask.forecastFinish} (${maxVariance}-day variance). Event records only ${event.scheduleImpact.days} day(s) of impact.`,
      citations,
      impact: worstTask.criticalPath && overage > 3 ? "high" : "medium",
      suggestedChanges: {
        scheduleImpact: {
          days: maxVariance,
          notes: `Revised based on task ${worstTask.id} forecast variance`,
        },
      },
      status: "pending",
      createdAt: NOW_ISO,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Generate deterministic Suggestion[] for a project by applying 6 rules
 * against events, logs, tasks, and document references.
 *
 * @param projectId - The project to generate suggestions for.
 * @param existingSuggestionIds - Set of suggestion IDs already present (for dedup).
 * @returns Array of new Suggestion objects sorted by impact desc, confidence desc.
 */
export function resolveSuggestions(
  projectId: string,
  existingSuggestionIds: Set<string>,
): Suggestion[] {
  const project = DEMO_PROJECT_BY_ID[projectId];
  if (!project) return [];

  const logs = DEMO_DAILY_LOGS_V5;

  const suggestions: Suggestion[] = [
    ...noticeRiskSuggestions(project, logs, existingSuggestionIds),
    ...costRevisionSuggestions(project, logs, existingSuggestionIds),
    ...stakeholderActionSuggestions(project, logs, existingSuggestionIds),
    ...alignmentChangeSuggestions(project, logs, existingSuggestionIds),
    ...contractReferenceSuggestions(project, logs, existingSuggestionIds),
    ...scheduleRevisionSuggestions(project, logs, existingSuggestionIds),
  ];

  // Sort by impact (high > medium > low), then confidence desc
  const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => {
    const impactDiff =
      (impactOrder[a.impact] ?? 2) - (impactOrder[b.impact] ?? 2);
    if (impactDiff !== 0) return impactDiff;
    return b.confidence - a.confidence;
  });

  return suggestions;
}
