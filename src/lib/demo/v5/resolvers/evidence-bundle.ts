// src/lib/demo/v5/resolvers/evidence-bundle.ts
// Cross-references an event to its supporting evidence: logs, clauses,
// stakeholders, tasks, and attachments. Pure deterministic utility.

import type { DemoProject } from "@/lib/demo/v5/projects";
import { DEMO_PROJECT_BY_ID } from "@/lib/demo/v5/projects";
import type { DailyLog } from "@/lib/demo/v5/dailyLogs";
import { DEMO_DAILY_LOGS_V5 } from "@/lib/demo/v5/dailyLogs";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ResolvedClause {
  docId: string;
  docTitle: string;
  ref: string;
  heading: string;
  summary: string;
  noticeWindowHours?: number;
}

export interface ResolvedStakeholder {
  id: string;
  name: string;
  role: string;
  org?: string;
  influence: "high" | "medium" | "low";
}

export interface ResolvedTask {
  id: string;
  wbs: string;
  name: string;
  phaseName: string;
  baselineStart: string;
  baselineFinish: string;
  forecastStart: string;
  forecastFinish: string;
  varianceDays: number;
  percentComplete: number;
  criticalPath: boolean;
}

export interface EvidenceBundle {
  eventId: string;
  eventTitle: string;
  logs: DailyLog[];
  clauses: ResolvedClause[];
  stakeholders: ResolvedStakeholder[];
  tasks: ResolvedTask[];
  attachments: Array<{ logId: string; type: string; title: string; ref: string }>;
  totalItems: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(dateA: string, dateB: string): number {
  const msA = new Date(dateA).getTime();
  const msB = new Date(dateB).getTime();
  return Math.round((msB - msA) / 86_400_000);
}

function resolvePhaseName(phaseId: string, project: DemoProject): string {
  const phase = project.phases.find((p) => p.id === phaseId);
  return phase?.name ?? phaseId;
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Build an evidence bundle for a specific event within a project.
 * Returns null if the project or event is not found.
 */
export function resolveEvidenceBundle(
  projectId: string,
  eventId: string,
): EvidenceBundle | null {
  const project = DEMO_PROJECT_BY_ID[projectId];
  if (!project) return null;

  const event = project.events.find((e) => e.id === eventId);
  if (!event) return null;

  // Logs: daily logs that reference this event
  const logs = DEMO_DAILY_LOGS_V5.filter(
    (l) => l.projectId === projectId && l.relatedEventIds.includes(eventId),
  );

  // Clauses: event.docRefs -> project.documents lookup to find doc title, then clause lookup
  const clauses: ResolvedClause[] = [];
  for (const docRef of event.docRefs) {
    const doc = project.documents.find((d) => d.id === docRef.docId);
    if (!doc) continue;
    for (const clauseRef of docRef.clauseRefs) {
      const clause = doc.clauses.find((c) => c.ref === clauseRef);
      clauses.push({
        docId: doc.id,
        docTitle: doc.title,
        ref: clauseRef,
        heading: clause?.heading ?? clauseRef,
        summary: clause?.summary ?? "",
        noticeWindowHours: clause?.noticeWindowHours,
      });
    }
  }

  // Stakeholders: event.stakeholderIds -> project.stakeholders lookup
  const stakeholders: ResolvedStakeholder[] = [];
  for (const sid of event.stakeholderIds) {
    const s = project.stakeholders.find((st) => st.id === sid);
    if (!s) continue;
    stakeholders.push({
      id: s.id,
      name: s.name,
      role: s.role,
      org: s.org,
      influence: s.influence,
    });
  }

  // Tasks: event.taskIds -> project.tasks lookup + phase name
  const tasks: ResolvedTask[] = [];
  for (const tid of event.taskIds) {
    const t = project.tasks.find((task) => task.id === tid);
    if (!t) continue;
    tasks.push({
      id: t.id,
      wbs: t.wbs,
      name: t.name,
      phaseName: resolvePhaseName(t.phaseId, project),
      baselineStart: t.baselineStart,
      baselineFinish: t.baselineFinish,
      forecastStart: t.forecastStart,
      forecastFinish: t.forecastFinish,
      varianceDays: daysBetween(t.baselineFinish, t.forecastFinish),
      percentComplete: t.percentComplete,
      criticalPath: t.criticalPath,
    });
  }

  // Attachments: collected from filtered logs' attachments arrays
  const attachments: Array<{ logId: string; type: string; title: string; ref: string }> = [];
  for (const log of logs) {
    if (log.attachments) {
      for (const att of log.attachments) {
        attachments.push({
          logId: log.id,
          type: att.type,
          title: att.title,
          ref: att.ref,
        });
      }
    }
  }

  const totalItems =
    logs.length +
    clauses.length +
    stakeholders.length +
    tasks.length +
    attachments.length;

  return {
    eventId: event.id,
    eventTitle: event.title,
    logs,
    clauses,
    stakeholders,
    tasks,
    attachments,
    totalItems,
  };
}
