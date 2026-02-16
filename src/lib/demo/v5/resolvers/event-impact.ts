// src/lib/demo/v5/resolvers/event-impact.ts
// Computes the cascading task impact of an event: direct tasks, one-level
// downstream predecessor walk, affected milestones, and phase grouping.
// Pure deterministic utility — no side effects.

import type { Phase } from "@/lib/demo/v5/projects";
import { DEMO_PROJECT_BY_ID } from "@/lib/demo/v5/projects";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ImpactedTask {
  id: string;
  wbs: string;
  name: string;
  phaseName: string;
  varianceDays: number;
  criticalPath: boolean;
  isDirect: boolean; // true if in event.taskIds, false if downstream
}

export interface ImpactedPhase {
  id: string;
  name: string;
  directTaskCount: number;
  downstreamTaskCount: number;
}

export interface ImpactedMilestone {
  id: string;
  name: string;
  dateBaseline: string;
  dateForecast: string;
  slipDays: number;
  status: string;
}

export interface EventImpact {
  directTaskIds: string[];
  downstreamTaskIds: string[];
  impactedTasks: ImpactedTask[];
  impactedPhases: ImpactedPhase[];
  impactedMilestones: ImpactedMilestone[];
  totalCostExposure: number;
  totalScheduleDays: number;
  criticalPathAffected: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(dateA: string, dateB: string): number {
  const msA = new Date(dateA).getTime();
  const msB = new Date(dateB).getTime();
  return Math.round((msB - msA) / 86_400_000);
}

function resolvePhaseName(phaseId: string, phases: Phase[]): string {
  return phases.find((p) => p.id === phaseId)?.name ?? phaseId;
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Compute the cascading impact of a single event on the project's tasks,
 * milestones, and phases.
 * Returns null if the project or event is not found.
 */
export function resolveEventImpact(
  projectId: string,
  eventId: string,
): EventImpact | null {
  const project = DEMO_PROJECT_BY_ID[projectId];
  if (!project) return null;

  const event = project.events.find((e) => e.id === eventId);
  if (!event) return null;

  const taskMap = new Map(project.tasks.map((t) => [t.id, t]));

  // 1. Direct tasks from event.taskIds
  const directTaskIds = event.taskIds.filter((id) => taskMap.has(id));
  const directTaskIdSet = new Set(directTaskIds);

  // 2. Downstream: one-level predecessor walk
  //    Find tasks whose `predecessors` array includes any direct task ID
  const downstreamTaskIds: string[] = [];
  for (const t of project.tasks) {
    if (directTaskIdSet.has(t.id)) continue; // skip direct tasks
    const hasPredecessorInDirect = t.predecessors.some((pred) =>
      directTaskIdSet.has(pred),
    );
    if (hasPredecessorInDirect) {
      downstreamTaskIds.push(t.id);
    }
  }

  // 3. Build ImpactedTask array for all tasks (direct + downstream)
  const allTaskIds = [...directTaskIds, ...downstreamTaskIds];
  const impactedTasks: ImpactedTask[] = [];
  for (const tid of allTaskIds) {
    const t = taskMap.get(tid);
    if (!t) continue;
    impactedTasks.push({
      id: t.id,
      wbs: t.wbs,
      name: t.name,
      phaseName: resolvePhaseName(t.phaseId, project.phases),
      varianceDays: daysBetween(t.baselineFinish, t.forecastFinish),
      criticalPath: t.criticalPath,
      isDirect: directTaskIdSet.has(t.id),
    });
  }

  // 4. Group impacted tasks by phase
  const phaseGroupMap = new Map<
    string,
    { direct: number; downstream: number }
  >();
  for (const it of impactedTasks) {
    const t = taskMap.get(it.id);
    if (!t) continue;
    const phaseId = t.phaseId;
    const group = phaseGroupMap.get(phaseId) ?? { direct: 0, downstream: 0 };
    if (it.isDirect) group.direct++;
    else group.downstream++;
    phaseGroupMap.set(phaseId, group);
  }

  const impactedPhases: ImpactedPhase[] = [];
  phaseGroupMap.forEach((counts, phaseId) => {
    impactedPhases.push({
      id: phaseId,
      name: resolvePhaseName(phaseId, project.phases),
      directTaskCount: counts.direct,
      downstreamTaskCount: counts.downstream,
    });
  });

  // 5. Impacted milestones: milestones where dateForecast > dateBaseline
  const impactedMilestones: ImpactedMilestone[] = [];
  for (const m of project.milestones) {
    const slipDays = daysBetween(m.dateBaseline, m.dateForecast);
    if (slipDays > 0) {
      impactedMilestones.push({
        id: m.id,
        name: m.name,
        dateBaseline: m.dateBaseline,
        dateForecast: m.dateForecast,
        slipDays,
        status: m.status,
      });
    }
  }

  // 6. Summary values
  const totalCostExposure = event.costExposure.amount;
  const totalScheduleDays = event.scheduleImpact.days;
  const criticalPathAffected = event.scheduleImpact.criticalPath;

  return {
    directTaskIds,
    downstreamTaskIds,
    impactedTasks,
    impactedPhases,
    impactedMilestones,
    totalCostExposure,
    totalScheduleDays,
    criticalPathAffected,
  };
}
