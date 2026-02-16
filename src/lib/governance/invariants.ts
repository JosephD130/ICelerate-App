// Pure governance invariant checks.
// No React, no side effects.

import type { EvidenceItem } from "@/lib/memory/types";
import type { DecisionEvent } from "@/lib/models/decision-event";

/** Risk Item creation requires at least one approved evidence item. */
export function canCreateRiskItem(evidence: EvidenceItem[]): boolean {
  return evidence.some((e) => e.status === "approved");
}

/** KPI updates require approved evidence in the system. */
export function canUpdateKpi(evidence: EvidenceItem[]): boolean {
  return evidence.some((e) => e.status === "approved");
}

/**
 * Notice clock cannot start without explicit confirmation.
 * Always returns false — UI must show ConfirmNoticeClockModal.
 */
export function requiresNoticeConfirmation(event: DecisionEvent): boolean {
  return event.contractReferences.some((r) => r.noticeDays !== undefined && r.noticeDays > 0);
}

/** Export data requires all trust states to be validated. */
export function canExportData(event: DecisionEvent): boolean {
  const hasTrust =
    !!event.fieldRecord?.trust ||
    !!event.rfiRecord?.trust ||
    !!event.decisionRecord?.trust ||
    event.monitorScores.some((s) => !!s.trust);
  if (!hasTrust) return true; // No AI outputs → nothing to validate
  // Check that all trust states are verified
  const trustStates = [
    event.fieldRecord?.trust,
    event.rfiRecord?.trust,
    event.decisionRecord?.trust,
    ...event.monitorScores.map((s) => s.trust),
  ].filter(Boolean);
  return trustStates.every((t) => t!.trustStatus !== "unverified");
}
