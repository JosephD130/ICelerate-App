// Converts V5 demo project events to V4 DecisionEvent format
import type { Event as V5Event, DemoProject } from "./projects";
import type {
  DecisionEvent,
  AlignmentStatus,
} from "@/lib/models/decision-event";

export function v5EventToDecisionEvent(
  e: V5Event,
  project: DemoProject
): DecisionEvent {
  const alignment: AlignmentStatus =
    e.alignmentStatus === "high_risk" ? "misaligned" : (e.alignmentStatus as AlignmentStatus);

  const status = e.status === "in_progress" ? "in-progress" : e.status === "resolved" ? "resolved" : "open";

  // Resolve stakeholder names from IDs
  const stakeholderNotifications = e.stakeholderIds.map((sid) => {
    const s = project.stakeholders.find((st) => st.id === sid);
    return {
      stakeholderId: sid,
      name: s?.name ?? sid,
      role: s?.role ?? "Unknown",
      notified: false,
    };
  });

  // Resolve contract references from docRefs
  const contractReferences = e.docRefs.flatMap((dr) => {
    const doc = project.documents.find((d) => d.id === dr.docId);
    if (!doc) return [];
    return dr.clauseRefs.map((clauseRef) => {
      const clause = doc.clauses.find((c) => c.ref === clauseRef);
      return {
        section: clauseRef,
        clause: clause?.heading ?? clauseRef,
        summary: clause?.summary ?? "",
        noticeDays: clause?.noticeWindowHours
          ? Math.ceil(clause.noticeWindowHours / 24)
          : undefined,
      };
    });
  });

  return {
    id: e.id,
    title: e.title,
    description: e.summary,
    trigger: `Detected from ${project.sourceProfile.mode} data sources`,
    station: "capture",
    severity: e.severity,
    status,
    altitude: "ground",
    alignmentStatus: alignment,
    location: e.location,
    costImpact: {
      estimated: e.costExposure.amount,
      currency: "USD",
      confidence: e.costExposure.confidence,
      description: e.costExposure.notes,
    },
    scheduleImpact: {
      daysAffected: e.scheduleImpact.days,
      criticalPath: e.scheduleImpact.criticalPath,
      description: e.scheduleImpact.notes,
    },
    contractReferences,
    noticeDeadline: e.noticeDeadlineAt,
    stakeholderNotifications,
    velocity: {
      detectedAt: e.createdAt,
      traditionalDays: 18,
    },
    communications: [],
    monitorScores: [],
    history: [
      {
        action: "Event created",
        tab: "overview",
        timestamp: e.createdAt,
        detail: e.summary.slice(0, 120),
      },
    ],
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    createdBy: "system",
    toolSource: "v5-seed",
    tags: [],
    attachments: [],
    lifecycleStage: "field-record",
    evidenceIds: [],
  };
}
