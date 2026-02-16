// Continuous Calibration Engine — pure functions, no side effects.
// Builds CalibrationRecords from user actions and computes aggregate stats.

import type { EvidenceItem } from "@/lib/memory/types";
import type { Suggestion } from "@/lib/memory/types";
import type {
  CalibrationRecord,
  CalibrationDiff,
  CalibrationReasonCode,
  CalibrationStats,
  CalibrationInsight,
  CalibrationAction,
  CalibrationObjectType,
  REASON_CODE_LABELS,
} from "./types";

// ── Record Builders ────────────────────────────────────

export function buildEvidenceCalibration(
  item: EvidenceItem,
  action: "approved" | "rejected",
  userRole: string,
  projectId: string,
): CalibrationRecord {
  const signals = item.extractedSignals;
  const predicted: Record<string, unknown> = {
    noticeRisk: signals.noticeRisk ?? false,
    costDelta: signals.costDelta ?? 0,
    scheduleDelta: signals.scheduleDelta ?? 0,
    clauseRefs: signals.clauseRefs ?? [],
    confidence: signals.confidenceScore,
  };

  const final: Record<string, unknown> =
    action === "approved"
      ? { ...predicted }
      : { noticeRisk: false, costDelta: 0, scheduleDelta: 0, clauseRefs: [], confidence: 0 };

  const diff: CalibrationDiff[] = [];
  const reasonCodes: CalibrationReasonCode[] = [];

  if (action === "rejected") {
    diff.push({ field: "status", before: "pending", after: "rejected" });
    reasonCodes.push("irrelevant");
  }
  if (signals.confidenceScore < 70) {
    reasonCodes.push("missing_citation");
  }

  return {
    id: `cal-ev-${item.id}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    projectId,
    evidenceId: item.id,
    riskItemId: item.linkedRiskItemId,
    action,
    objectType: "evidence",
    predicted,
    final,
    diff,
    reasonCodes,
    sourceProvenance: [`${item.sourceType}:${item.sourceLabel}`],
    confidenceAtTime: signals.confidenceScore,
    userRole,
  };
}

export function buildSuggestionCalibration(
  suggestion: Suggestion,
  action: CalibrationAction,
  userRole: string,
  editorOverrides?: Suggestion["editorOverrides"],
): CalibrationRecord {
  const sc = suggestion.suggestedChanges ?? {};
  const predicted: Record<string, unknown> = {
    headline: suggestion.headline,
    confidence: suggestion.confidence,
    impact: suggestion.impact,
    costAmount: (sc.costExposure as { amount?: number } | undefined)?.amount,
    scheduleDays: (sc.scheduleImpact as { days?: number } | undefined)?.days,
    deadline: sc.deadline as string | undefined,
    clauseRef: suggestion.citations?.[0]?.chunkRef,
  };

  const ov = editorOverrides ?? suggestion.editorOverrides;
  const final: Record<string, unknown> = action === "rejected"
    ? {}
    : {
        ...predicted,
        ...(ov?.costHigh !== undefined ? { costAmount: ov.costHigh } : {}),
        ...(ov?.costLow !== undefined && ov?.costHigh === undefined ? { costAmount: ov.costLow } : {}),
        ...(ov?.scheduleDays !== undefined ? { scheduleDays: ov.scheduleDays } : {}),
        ...(ov?.clauseRef !== undefined ? { clauseRef: ov.clauseRef } : {}),
        ...(ov?.deadline !== undefined ? { deadline: ov.deadline } : {}),
        ...(ov?.headline !== undefined ? { headline: ov.headline } : {}),
        ...(ov?.impact !== undefined ? { impact: ov.impact } : {}),
      };

  const diff: CalibrationDiff[] = [];
  const reasonCodes: CalibrationReasonCode[] = [];

  if (action === "rejected") {
    reasonCodes.push("irrelevant");
  } else if (action === "edited" && ov) {
    if (ov.costHigh !== undefined || ov.costLow !== undefined) {
      const beforeCost = predicted.costAmount as number | undefined;
      const afterCost = (ov.costHigh ?? ov.costLow) as number | undefined;
      if (beforeCost !== afterCost) {
        diff.push({ field: "costAmount", before: beforeCost ?? null, after: afterCost ?? null });
        reasonCodes.push("wrong_cost_range");
      }
    }
    if (ov.scheduleDays !== undefined && ov.scheduleDays !== predicted.scheduleDays) {
      diff.push({ field: "scheduleDays", before: (predicted.scheduleDays as number) ?? null, after: ov.scheduleDays });
      reasonCodes.push("wrong_schedule_impact");
    }
    if (ov.clauseRef !== undefined && ov.clauseRef !== predicted.clauseRef) {
      diff.push({ field: "clauseRef", before: (predicted.clauseRef as string) ?? null, after: ov.clauseRef });
      reasonCodes.push("wrong_clause");
    }
    if (ov.deadline !== undefined && ov.deadline !== predicted.deadline) {
      diff.push({ field: "deadline", before: (predicted.deadline as string) ?? null, after: ov.deadline });
      reasonCodes.push("wrong_deadline");
    }
  }

  if (suggestion.citations.length === 0) {
    reasonCodes.push("missing_citation");
  }

  return {
    id: `cal-sg-${suggestion.id}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    projectId: suggestion.projectId,
    suggestionId: suggestion.id,
    riskItemId: suggestion.eventId,
    action,
    objectType: "suggestion",
    predicted,
    final,
    diff,
    reasonCodes: Array.from(new Set(reasonCodes)),
    sourceProvenance: suggestion.citations.map((c) => c.sourceId),
    confidenceAtTime: suggestion.confidence,
    userRole,
    resolverRule: suggestion.type,
  };
}

export interface NoticeConfirmPayload {
  clauseRef: string;
  deadline: string;
  recipientGroup: string;
  method: string;
}

export function buildNoticeCalibration(
  suggestion: Suggestion,
  payload: NoticeConfirmPayload,
  userRole: string,
): CalibrationRecord {
  const predicted: Record<string, unknown> = {
    clauseRef: suggestion.citations?.[0]?.chunkRef ?? null,
    deadline: (suggestion.suggestedChanges?.deadline as string) ?? null,
  };
  const final: Record<string, unknown> = {
    clauseRef: payload.clauseRef,
    deadline: payload.deadline,
    recipientGroup: payload.recipientGroup,
    method: payload.method,
  };

  const diff: CalibrationDiff[] = [];
  const reasonCodes: CalibrationReasonCode[] = [];

  if (predicted.clauseRef !== final.clauseRef) {
    diff.push({ field: "clauseRef", before: predicted.clauseRef as string | null, after: payload.clauseRef });
    reasonCodes.push("wrong_clause");
  }
  if (predicted.deadline !== final.deadline) {
    diff.push({ field: "deadline", before: predicted.deadline as string | null, after: payload.deadline });
    reasonCodes.push("wrong_deadline");
  }

  return {
    id: `cal-nt-${suggestion.id}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    projectId: suggestion.projectId,
    suggestionId: suggestion.id,
    riskItemId: suggestion.eventId,
    action: "approved",
    objectType: "notice",
    predicted,
    final,
    diff,
    reasonCodes,
    sourceProvenance: suggestion.citations.map((c) => c.sourceId),
    confidenceAtTime: suggestion.confidence,
    userRole,
    resolverRule: "notice_risk",
  };
}

// ── Stats Computation ──────────────────────────────────

export function computeCalibrationStats(records: CalibrationRecord[]): CalibrationStats {
  const byAction: Record<CalibrationAction, number> = { approved: 0, rejected: 0, edited: 0 };
  const byObjectType: Record<CalibrationObjectType, number> = { evidence: 0, suggestion: 0, notice: 0 };
  const reasonCounts = new Map<CalibrationReasonCode, number>();
  const ruleMap = new Map<string, { approved: number; rejected: number; edited: number }>();

  for (const r of records) {
    byAction[r.action]++;
    byObjectType[r.objectType]++;

    for (const code of r.reasonCodes) {
      reasonCounts.set(code, (reasonCounts.get(code) ?? 0) + 1);
    }

    if (r.resolverRule) {
      const entry = ruleMap.get(r.resolverRule) ?? { approved: 0, rejected: 0, edited: 0 };
      entry[r.action]++;
      ruleMap.set(r.resolverRule, entry);
    }
  }

  const topReasonCodes = Array.from(reasonCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  const ruleAcceptanceRates = Array.from(ruleMap.entries())
    .map(([rule, counts]) => ({ rule, accepted: counts.approved, rejected: counts.rejected, edited: counts.edited }))
    .sort((a, b) => {
      const rateA = a.accepted / Math.max(1, a.accepted + a.rejected + a.edited);
      const rateB = b.accepted / Math.max(1, b.accepted + b.rejected + b.edited);
      return rateB - rateA;
    });

  const recentRecords = records
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return { totalRecords: records.length, byAction, byObjectType, topReasonCodes, ruleAcceptanceRates, recentRecords };
}

// ── Insight for specific patterns ──────────────────────

export function getCalibrationInsight(
  records: CalibrationRecord[],
  resolverRule?: string,
  objectType?: CalibrationObjectType,
): CalibrationInsight | null {
  const matched = records.filter((r) => {
    if (resolverRule && r.resolverRule !== resolverRule) return false;
    if (objectType && r.objectType !== objectType) return false;
    return true;
  });

  const corrections = matched.filter((r) => r.action === "edited" || r.action === "rejected");
  if (corrections.length === 0) return null;

  // Find most common reason code
  const reasonCounts = new Map<CalibrationReasonCode, number>();
  for (const r of corrections) {
    for (const code of r.reasonCodes) {
      reasonCounts.set(code, (reasonCounts.get(code) ?? 0) + 1);
    }
  }

  let commonFix: string | null = null;
  let maxCount = 0;
  for (const [code, count] of Array.from(reasonCounts)) {
    if (count > maxCount) {
      maxCount = count;
      // Use label from the REASON_CODE_LABELS map
      const labels: Record<string, string> = {
        missing_citation: "Add citation",
        wrong_clause: "Correct clause ref",
        wrong_deadline: "Adjust deadline",
        wrong_cost_range: "Adjust cost range",
        wrong_schedule_impact: "Adjust schedule days",
        wrong_risk_type: "Change risk type",
        stale_data: "Stale source data",
        irrelevant: "Not relevant",
      };
      commonFix = labels[code] ?? code;
    }
  }

  return {
    correctionCount: corrections.length,
    commonFix,
    confidenceCap: corrections.length >= 3 ? 55 : null,
  };
}
