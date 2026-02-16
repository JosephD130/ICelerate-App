// Pure deterministic "Top Risk" computation — no API calls, no side effects.

export type TopRiskLabel =
  | "Notice Clock"
  | "Overdue Item"
  | "Critical Path Delay"
  | "High Cost Exposure"
  | "Variance Detected"
  | "Pending Review"
  | "No Immediate Action";

export type ReasonCode =
  | "notice_clock"
  | "overdue"
  | "critical_path"
  | "cost_exposure"
  | "variance"
  | "pending_review"
  | "none";

export interface TopRiskResult {
  label: TopRiskLabel;
  count?: number;
  displayText: string; // "Top risk: Notice Clock (3)" or "All clear"
  reasonCode: ReasonCode;
}

export interface TopRiskInput {
  projectStatus?: "synced" | "drift" | "misaligned";
  driftCount?: number;
  activeNoticeClocks?: number;
  contractValue?: number;
  unresolvedEvents: Array<{
    id: string;
    severity?: "critical" | "high" | "medium" | "low" | "info";
    status?: string;
    alignmentStatus?: "synced" | "drift" | "misaligned";
    noticeClockActive?: boolean;
    overdue?: boolean;
    overdueHours?: number;
    criticalPath?: boolean;
    scheduleImpactDays?: number;
    costExposureAmount?: number;
    updatedAt?: string | number;
  }>;
  suggestions?: Array<{
    trust?: "verified" | "needs_review" | "unverified";
  }>;
}

export function formatCount(count?: number): string {
  if (count === undefined || count === 0) return "";
  if (count >= 10) return " (9+)";
  return ` (${count})`;
}

export function buildDisplay(label: TopRiskLabel, count?: number): string {
  return `Top risk: ${label}${formatCount(count)}`;
}

/**
 * Strict 7-rule priority cascade. First match wins.
 *
 * 1. Notice Clock  — active notice clocks exist
 * 2. Overdue Item  — any event overdue
 * 3. Critical Path Delay — critical path + schedule impact >= 1 day
 * 4. High Cost Exposure — aggregate cost above threshold
 * 5. Variance Detected — drifts or misaligned events
 * 6. Pending Review — suggestions needing review
 * 7. No Immediate Action — fallback
 */
export function computeTopRisk(input: TopRiskInput): TopRiskResult {
  const {
    projectStatus,
    driftCount = 0,
    activeNoticeClocks = 0,
    contractValue,
    unresolvedEvents,
    suggestions = [],
  } = input;

  // Rule 1: Notice Clock
  const eventNoticeClocks = unresolvedEvents.filter(
    (e) => e.noticeClockActive === true
  ).length;
  const totalNoticeClocks = Math.max(activeNoticeClocks, eventNoticeClocks);
  if (totalNoticeClocks > 0) {
    return {
      label: "Notice Clock",
      count: totalNoticeClocks,
      displayText: buildDisplay("Notice Clock", totalNoticeClocks),
      reasonCode: "notice_clock",
    };
  }

  // Rule 2: Overdue Item
  const overdueEvents = unresolvedEvents.filter(
    (e) => e.overdue === true || (e.overdueHours !== undefined && e.overdueHours > 0)
  );
  if (overdueEvents.length > 0) {
    return {
      label: "Overdue Item",
      count: overdueEvents.length,
      displayText: buildDisplay("Overdue Item", overdueEvents.length),
      reasonCode: "overdue",
    };
  }

  // Rule 3: Critical Path Delay
  const hasCriticalPathDelay = unresolvedEvents.some(
    (e) => e.criticalPath === true && (e.scheduleImpactDays ?? 0) >= 1
  );
  if (hasCriticalPathDelay) {
    return {
      label: "Critical Path Delay",
      displayText: buildDisplay("Critical Path Delay"),
      reasonCode: "critical_path",
    };
  }

  // Rule 4: High Cost Exposure
  const totalCostExposure = unresolvedEvents.reduce(
    (sum, e) => sum + (e.costExposureAmount ?? 0),
    0
  );
  const costThreshold =
    contractValue !== undefined && contractValue > 0
      ? Math.max(50_000, contractValue * 0.01)
      : 50_000;
  if (totalCostExposure >= costThreshold) {
    return {
      label: "High Cost Exposure",
      displayText: buildDisplay("High Cost Exposure"),
      reasonCode: "cost_exposure",
    };
  }

  // Rule 5: Variance Detected
  const varianceEvents = unresolvedEvents.filter(
    (e) => e.alignmentStatus === "drift" || e.alignmentStatus === "misaligned"
  ).length;
  const totalVariance = Math.max(driftCount, varianceEvents);
  if (totalVariance > 0) {
    return {
      label: "Variance Detected",
      count: totalVariance,
      displayText: buildDisplay("Variance Detected", totalVariance),
      reasonCode: "variance",
    };
  }

  // Rule 6: Pending Review
  const pendingReviewCount = suggestions.filter(
    (s) => s.trust === "needs_review" || s.trust === "unverified"
  ).length;
  if (pendingReviewCount > 0) {
    return {
      label: "Pending Review",
      count: pendingReviewCount,
      displayText: buildDisplay("Pending Review", pendingReviewCount),
      reasonCode: "pending_review",
    };
  }

  // Rule 7: No Immediate Action (fallback)
  const allClear =
    projectStatus === "synced" &&
    driftCount === 0 &&
    activeNoticeClocks === 0;

  return {
    label: "No Immediate Action",
    displayText: allClear ? "All clear" : buildDisplay("No Immediate Action"),
    reasonCode: "none",
  };
}
