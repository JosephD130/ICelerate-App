import type { EvidenceItem } from "@/lib/memory/types";
import type { DecisionEvent } from "@/lib/models/decision-event";

/**
 * Generate synthetic evidence items from a newly created event.
 * Used by the auto-link feature to ensure new events have evidence immediately.
 */
export function generateAutoLinkedEvidence(
  event: DecisionEvent,
  projectId: string,
): EvidenceItem[] {
  const now = new Date().toISOString();
  const items: EvidenceItem[] = [];

  // 1. Always generate a field observation evidence item
  items.push({
    id: `evi-auto-field-${event.id}`,
    projectId,
    sourceType: "field",
    sourceLabel: `Field Observation — ${event.title.slice(0, 50)}`,
    rawContentPreview: event.description || event.title,
    extractedSignals: {
      noticeRisk: event.contractReferences.some((r) => r.noticeDays),
      costDelta: event.costImpact?.estimated,
      scheduleDelta: event.scheduleImpact?.daysAffected,
      clauseRefs: event.contractReferences.map((r) => r.section).filter(Boolean),
      confidenceScore: 75,
    },
    linkedRiskItemId: event.id,
    status: "approved",
    reviewedAt: now,
    createdAt: now,
  });

  // 2. Generate cost/schedule signal evidence if either impact is present
  const hasCost = event.costImpact && event.costImpact.estimated > 0;
  const hasSchedule = event.scheduleImpact && event.scheduleImpact.daysAffected > 0;

  if (hasCost || hasSchedule) {
    const parts: string[] = [];
    if (hasCost)
      parts.push(
        `Estimated cost: $${event.costImpact!.estimated.toLocaleString()} (${event.costImpact!.confidence} confidence)`,
      );
    if (hasSchedule)
      parts.push(
        `Schedule impact: ${event.scheduleImpact!.daysAffected} days${event.scheduleImpact!.criticalPath ? " (critical path)" : ""}`,
      );

    items.push({
      id: `evi-auto-impact-${event.id}`,
      projectId,
      sourceType: "upload",
      sourceLabel: "PM Estimate — Cost & Schedule Impact",
      rawContentPreview: parts.join(". ") + ".",
      extractedSignals: {
        costDelta: event.costImpact?.estimated,
        scheduleDelta: event.scheduleImpact?.daysAffected,
        confidenceScore: 70,
      },
      linkedRiskItemId: event.id,
      status: "approved",
      reviewedAt: now,
      createdAt: now,
    });
  }

  // 3. Generate evidence items for uploaded file attachments (PDFs, images)
  for (const att of event.attachments) {
    const dataUrl = att.metadata.dataUrl;
    if (!dataUrl) continue;

    items.push({
      id: `evi-auto-att-${att.id}`,
      projectId,
      sourceType: "upload",
      sourceLabel: att.title,
      rawContentPreview: att.rawText ? att.rawText.slice(0, 200) : `[${att.kind}: ${att.title}]`,
      extractedSignals: {
        confidenceScore: 80,
      },
      linkedRiskItemId: event.id,
      status: "approved",
      reviewedAt: now,
      createdAt: now,
      attachmentUrl: dataUrl,
      attachmentName: att.title,
      attachmentType: att.metadata.type,
    });
  }

  return items;
}
