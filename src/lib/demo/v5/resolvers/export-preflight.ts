import type { DecisionEvent } from "@/lib/models/decision-event";

export interface ExportPreflight {
  itemCount: number;
  eventCount: number;
  contractRefCount: number;
  communicationCount: number;
  sections: string[];
  warnings: string[];
}

/**
 * Compute a preflight summary of what an export will contain.
 */
export function resolveExportPreflight(
  events: DecisionEvent[],
  format: string,
): ExportPreflight {
  const eventCount = events.length;
  const contractRefCount = events.reduce((s, e) => s + e.contractReferences.length, 0);
  const communicationCount = events.reduce((s, e) => s + e.communications.length, 0);
  const monitorCount = events.reduce((s, e) => s + e.monitorScores.length, 0);

  const sections: string[] = [];
  const warnings: string[] = [];

  // Build sections list
  sections.push(`${eventCount} event${eventCount !== 1 ? "s" : ""}`);
  if (contractRefCount > 0) sections.push(`${contractRefCount} contract reference${contractRefCount !== 1 ? "s" : ""}`);
  if (communicationCount > 0) sections.push(`${communicationCount} communication${communicationCount !== 1 ? "s" : ""}`);
  if (monitorCount > 0) sections.push(`${monitorCount} health score${monitorCount !== 1 ? "s" : ""}`);

  // Build warnings
  const noDecision = events.filter((e) => !e.decisionRecord && e.status !== "resolved");
  if (noDecision.length > 0) {
    warnings.push(`${noDecision.length} event${noDecision.length !== 1 ? "s" : ""} missing decision record`);
  }

  const noCost = events.filter((e) => !e.costImpact && e.status !== "resolved");
  if (noCost.length > 0) {
    warnings.push(`${noCost.length} event${noCost.length !== 1 ? "s" : ""} missing cost data`);
  }

  const noField = events.filter((e) => !e.fieldRecord);
  if (noField.length > 0) {
    warnings.push(`${noField.length} event${noField.length !== 1 ? "s" : ""} without field observation`);
  }

  // Format-specific hints
  if (format === "pptx") sections.push("stakeholder deck format");
  if (format === "xlsx") sections.push("multi-sheet workbook");
  if (format === "pdf") sections.push("print-ready alignment report");
  if (format === "csv") sections.push("flat event data for import");

  const itemCount = eventCount + contractRefCount + communicationCount + monitorCount;

  return { itemCount, eventCount, contractRefCount, communicationCount, sections, warnings };
}
