import type { DecisionEvent } from "@/lib/models/decision-event";

export interface ConfidenceFactor {
  label: string;
  weight: number;
  met: boolean;
}

export interface DecisionConfidence {
  score: number; // 0-100
  factors: ConfidenceFactor[];
}

/**
 * Compute a decision confidence score based on how complete
 * the event's data chain is.
 */
export function resolveDecisionConfidence(event: DecisionEvent): DecisionConfidence {
  const factors: ConfidenceFactor[] = [
    {
      label: "Field data captured",
      weight: 20,
      met: !!event.fieldRecord,
    },
    {
      label: "Contract reviewed",
      weight: 20,
      met: event.contractReferences.length > 0,
    },
    {
      label: "Cost estimated",
      weight: 20,
      met: !!(event.costImpact && event.costImpact.estimated > 0),
    },
    {
      label: "Schedule assessed",
      weight: 15,
      met: !!(event.scheduleImpact && event.scheduleImpact.daysAffected > 0),
    },
    {
      label: "Stakeholders briefed",
      weight: 15,
      met: event.stakeholderNotifications.some((s) => s.notified),
    },
    {
      label: "Decision documented",
      weight: 10,
      met: !!event.decisionRecord,
    },
  ];

  const score = factors.reduce((sum, f) => sum + (f.met ? f.weight : 0), 0);

  return { score, factors };
}
