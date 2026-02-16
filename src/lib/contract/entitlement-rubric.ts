// src/lib/contract/entitlement-rubric.ts
// 8-factor entitlement strength assessment engine.
// Pure deterministic — no AI calls, no side effects.

import type { DecisionEvent } from "@/lib/models/decision-event";
import type { ClauseMatch } from "@/lib/contract/clause-matcher";

export interface EntitlementFactor {
  id: string;
  label: string;
  met: boolean;
  weight: number;
  evidence: string;
}

export interface EntitlementAssessment {
  strength: "HIGH" | "MEDIUM" | "LOW";
  score: number; // 0-100
  factors: EntitlementFactor[];
  missingForUpgrade: string[];
}

/**
 * Assess entitlement strength for an event based on 8 weighted factors.
 *
 * @param event - The DecisionEvent to assess.
 * @param clauseMatches - Matched clauses from clause-matcher.
 * @returns EntitlementAssessment with strength, score, factors, and upgrade hints.
 */
export function assessEntitlement(
  event: DecisionEvent,
  clauseMatches: ClauseMatch[],
): EntitlementAssessment {
  const factors: EntitlementFactor[] = [
    // Factor 1: Written notice filed (20%)
    {
      id: "notice-filed",
      label: "Written notice filed",
      weight: 0.2,
      met: !!event.fieldRecord,
      evidence: event.fieldRecord
        ? `Field observation recorded at ${event.fieldRecord.timestamp}`
        : "No field record exists",
    },

    // Factor 2: Within notice window (15%)
    {
      id: "notice-window",
      label: "Within notice window",
      weight: 0.15,
      met: !event.noticeDeadline ||
        new Date(event.noticeDeadline).getTime() > Date.now(),
      evidence: event.noticeDeadline
        ? new Date(event.noticeDeadline).getTime() > Date.now()
          ? `Notice deadline ${event.noticeDeadline} — still within window`
          : `Notice deadline ${event.noticeDeadline} — EXPIRED`
        : "No notice deadline set",
    },

    // Factor 3: Clause support (15%)
    {
      id: "clause-support",
      label: "Clause support identified",
      weight: 0.15,
      met: clauseMatches.some((c) => c.matchScore >= 50),
      evidence:
        clauseMatches.filter((c) => c.matchScore >= 50).length > 0
          ? `${clauseMatches.filter((c) => c.matchScore >= 50).length} clause(s) with score ≥50: ${clauseMatches.filter((c) => c.matchScore >= 50).map((c) => c.section).slice(0, 3).join(", ")}`
          : "No strong clause matches found",
    },

    // Factor 4: Condition documented (10%)
    {
      id: "condition-documented",
      label: "Condition documented",
      weight: 0.1,
      met: !!event.fieldRecord && event.fieldRecord.observation.length > 50,
      evidence: event.fieldRecord
        ? event.fieldRecord.observation.length > 50
          ? `Observation: ${event.fieldRecord.observation.length} characters`
          : "Field observation too brief for strong documentation"
        : "No field observation",
    },

    // Factor 5: Cost quantified (10%)
    {
      id: "cost-quantified",
      label: "Cost quantified",
      weight: 0.1,
      met: !!(event.costImpact && event.costImpact.estimated > 0),
      evidence: event.costImpact
        ? `$${event.costImpact.estimated.toLocaleString()} (${event.costImpact.confidence} confidence)`
        : "No cost impact recorded",
    },

    // Factor 6: Schedule documented (10%)
    {
      id: "schedule-documented",
      label: "Schedule impact documented",
      weight: 0.1,
      met: !!(event.scheduleImpact && event.scheduleImpact.daysAffected > 0),
      evidence: event.scheduleImpact
        ? `${event.scheduleImpact.daysAffected} days${event.scheduleImpact.criticalPath ? " (critical path)" : ""}`
        : "No schedule impact recorded",
    },

    // Factor 7: Stakeholders notified (10%)
    {
      id: "stakeholders-notified",
      label: "Stakeholders notified",
      weight: 0.1,
      met: event.stakeholderNotifications.some((s) => s.notified),
      evidence:
        event.stakeholderNotifications.filter((s) => s.notified).length > 0
          ? `${event.stakeholderNotifications.filter((s) => s.notified).length}/${event.stakeholderNotifications.length} notified`
          : event.stakeholderNotifications.length > 0
            ? "No stakeholders have been notified"
            : "No stakeholders linked",
    },

    // Factor 8: Decision on record (10%)
    {
      id: "decision-recorded",
      label: "Decision on record",
      weight: 0.1,
      met: !!event.decisionRecord,
      evidence: event.decisionRecord
        ? `Decision package with ${event.decisionRecord.panels.length} panel(s)`
        : "No decision package generated",
    },
  ];

  const score = Math.round(
    factors.reduce((sum, f) => sum + (f.met ? f.weight * 100 : 0), 0),
  );

  const strength: "HIGH" | "MEDIUM" | "LOW" =
    score >= 75 ? "HIGH" : score >= 45 ? "MEDIUM" : "LOW";

  // Build "missing for upgrade" hints
  const missingForUpgrade: string[] = [];
  if (strength === "LOW") {
    for (const f of factors) {
      if (!f.met && f.weight >= 0.15) {
        missingForUpgrade.push(`${f.label} — would add ${Math.round(f.weight * 100)} points`);
      }
    }
  } else if (strength === "MEDIUM") {
    const needed = 75 - score;
    for (const f of factors) {
      if (!f.met) {
        const points = Math.round(f.weight * 100);
        if (points >= needed || f.weight >= 0.1) {
          missingForUpgrade.push(`${f.label} (+${points} pts)`);
        }
      }
    }
  }

  return { strength, score, factors, missingForUpgrade };
}
