// Pure deterministic KPI metadata — no React, no side effects.
// Used by CalculationDrawer to show "How it's calculated" for each KPI.

export interface KpiDefinition {
  id: string;
  label: string;
  formula: string;
  inputs: string[];
  assumptions: string[];
  limitations: string[];
}

export const KPI_DEFINITIONS: Record<string, KpiDefinition> = {
  exposure: {
    id: "exposure",
    label: "Exposure at Risk",
    formula:
      "Sum of costImpact.estimated across all unresolved events that have a cost impact greater than zero.",
    inputs: [
      "costImpact.estimated from each DecisionEvent",
      "Event status (excludes resolved)",
      "Contingency usage percentage from project metrics",
    ],
    assumptions: [
      "Each event's cost estimate is independent",
      "No double-counting across related events",
      "Estimates use contractor-submitted values unless overridden",
    ],
    limitations: [
      "Does not account for concurrent risk reduction",
      "Confidence level not factored into sum",
      "Change orders in draft status counted at face value",
    ],
  },
  days: {
    id: "days",
    label: "Days at Risk",
    formula:
      "Sum of scheduleImpact.daysAffected across all unresolved events that have a schedule impact.",
    inputs: [
      "scheduleImpact.daysAffected from each DecisionEvent",
      "Event status (excludes resolved)",
      "Critical path flag from project metrics",
    ],
    assumptions: [
      "Schedule impacts are additive (worst case)",
      "No parallel path compression applied",
      "Critical path determination from last schedule update",
    ],
    limitations: [
      "Concurrent delays may reduce actual impact",
      "Does not model float consumption",
      "Critical path data may be stale if schedule not updated",
    ],
  },
  notice: {
    id: "notice",
    label: "Active Notice Clocks",
    formula:
      "Count of open events with contractReferences containing a noticeDays value greater than zero.",
    inputs: [
      "contractReferences[].noticeDays from each DecisionEvent",
      "Event status (open only)",
      "Event createdAt timestamp for clock calculation",
    ],
    assumptions: [
      "Notice window starts at event creation",
      "All referenced clauses require written notice",
      "Clock runs calendar days, not business days",
    ],
    limitations: [
      "Does not track partial compliance",
      "Multiple clauses per event counted as single notice",
      "Does not verify if notice was actually sent",
    ],
  },
};

export function getKpiDefinition(id: string): KpiDefinition | undefined {
  return KPI_DEFINITIONS[id];
}
