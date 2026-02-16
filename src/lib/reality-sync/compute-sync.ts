import type { DecisionEvent, AlignmentStatus } from "@/lib/models/decision-event";
import type { DailyLog } from "@/lib/demo/v5/dailyLogs";
import { detectDrifts, type DriftResult, type DriftSeverity } from "./drift-detector";

export interface SyncColumn {
  label: string;
  status: DriftSeverity;
  items: string[];
}

export interface RealitySyncState {
  overall: DriftSeverity;
  field: SyncColumn;
  contract: SyncColumn;
  office: SyncColumn;
  drifts: DriftResult[];
}

function worstSeverity(severities: DriftSeverity[]): DriftSeverity {
  if (severities.includes("misaligned")) return "misaligned";
  if (severities.includes("drift")) return "drift";
  return "synced";
}

export function computeSync(events: DecisionEvent[], logs?: DailyLog[]): RealitySyncState {
  const drifts = detectDrifts(events, logs);

  // Build field column
  const openEvents = events.filter((e) => e.status === "open" || e.status === "in-progress");
  const holdZones = openEvents
    .filter((e) => e.location)
    .map((e) => `Hold zone: ${e.location}${e.stationNumber ? ` (STA ${e.stationNumber})` : ""}`);
  const fieldItems = [
    ...holdZones.slice(0, 2),
    ...openEvents.slice(0, 3 - holdZones.length).map((e) => e.title),
  ];
  if (fieldItems.length === 0) fieldItems.push("No active field issues");

  const fieldDrifts = drifts.filter((d) => d.column === "field");
  fieldItems.push(...fieldDrifts.map((d) => d.message));

  // Build contract column
  const contractItems: string[] = [];
  const noticeEvents = events.filter((e) =>
    e.contractReferences.some((r) => r.noticeDays && r.noticeDays > 0)
  );
  for (const ev of noticeEvents.slice(0, 2)) {
    const ref = ev.contractReferences.find((r) => r.noticeDays);
    if (ref) {
      contractItems.push(`${ref.section} — Notice: ${(ref.noticeDays ?? 0) * 24}h window`);
    }
  }
  const contractDrifts = drifts.filter((d) => d.column === "contract");
  contractItems.push(...contractDrifts.map((d) => d.message));
  if (contractItems.length === 0) contractItems.push("All notices current");

  // Build office column
  const officeItems: string[] = [];
  const totalExposure = events
    .filter((e) => e.status !== "resolved" && e.costImpact)
    .reduce((sum, e) => sum + (e.costImpact?.estimated ?? 0), 0);
  if (totalExposure > 0) {
    officeItems.push(`Open cost exposure: $${totalExposure.toLocaleString()}`);
  }
  const unbriefed = events.filter((e) =>
    e.stakeholderNotifications.some((s) => !s.notified)
  );
  if (unbriefed.length > 0) {
    officeItems.push(`${unbriefed.length} event(s) with unbriefed stakeholders`);
  }
  const officeDrifts = drifts.filter((d) => d.column === "office");
  officeItems.push(...officeDrifts.map((d) => d.message));
  if (officeItems.length === 0) officeItems.push("Stakeholders briefed and current");

  const fieldStatus = worstSeverity(fieldDrifts.map((d) => d.severity));
  const contractStatus = worstSeverity(contractDrifts.map((d) => d.severity));
  const officeStatus = worstSeverity(officeDrifts.map((d) => d.severity));

  return {
    overall: worstSeverity([fieldStatus, contractStatus, officeStatus]),
    field: { label: "Field Reality", status: fieldStatus, items: fieldItems },
    contract: { label: "Contract Position", status: contractStatus, items: contractItems },
    office: { label: "Office Narrative", status: officeStatus, items: officeItems },
    drifts,
  };
}

/** Compute alignment status for a single event */
export function computeEventSync(event: DecisionEvent): AlignmentStatus {
  if (event.status === "resolved") return "synced";

  let score = 0;
  let maxScore = 0;

  // Field record exists?
  maxScore += 2;
  if (event.fieldRecord) score += 2;

  // Contract references attached?
  maxScore += 2;
  if (event.contractReferences.length > 0) score += 2;

  // Stakeholders notified?
  maxScore += 3;
  const totalStakeholders = event.stakeholderNotifications.length;
  const notifiedCount = event.stakeholderNotifications.filter((s) => s.notified).length;
  if (totalStakeholders === 0) {
    score += 1; // No stakeholders required — partial credit
  } else {
    score += Math.round((notifiedCount / totalStakeholders) * 3);
  }

  // Decision made?
  maxScore += 2;
  if (event.decisionRecord && event.decisionRecord.panels.length > 0) score += 2;

  // Communication sent?
  maxScore += 1;
  if (event.communications.length > 0) score += 1;

  const ratio = maxScore > 0 ? score / maxScore : 0;

  // Critical/high severity with low alignment = misaligned
  if (
    (event.severity === "critical" || event.severity === "high") &&
    ratio < 0.4
  ) {
    return "misaligned";
  }

  if (ratio >= 0.8) return "synced";
  if (ratio >= 0.4) return "drift";
  return "misaligned";
}
