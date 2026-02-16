// src/lib/scoring/monitor-score.ts
// Deterministic multi-factor event health scoring engine.
// Pure computation — no AI calls, no side effects.

import type { DecisionEvent } from "@/lib/models/decision-event";

export interface ScoreFactor {
  id: string;
  label: string;
  weight: number;
  score: number; // 0-100
  severity: "ok" | "warning" | "critical";
  detail: string;
}

export interface DeterministicScore {
  composite: number; // 0-100 weighted
  factors: ScoreFactor[];
  grade: "A" | "B" | "C" | "D" | "F";
}

function severity(score: number): "ok" | "warning" | "critical" {
  if (score >= 70) return "ok";
  if (score >= 40) return "warning";
  return "critical";
}

function grade(composite: number): "A" | "B" | "C" | "D" | "F" {
  if (composite >= 85) return "A";
  if (composite >= 70) return "B";
  if (composite >= 55) return "C";
  if (composite >= 40) return "D";
  return "F";
}

// ── Factor 1: Contract Compliance ────────────────────────

function scoreContractCompliance(event: DecisionEvent): ScoreFactor {
  let score = 100;
  let detail = "No notice requirements";

  const hasNoticeReqs = event.contractReferences.some(
    (r) => r.noticeDays && r.noticeDays > 0,
  );

  if (hasNoticeReqs && event.noticeDeadline) {
    const hoursLeft =
      (new Date(event.noticeDeadline).getTime() - Date.now()) / 3_600_000;
    if (hoursLeft <= 0) {
      score = 0;
      detail = "Notice window expired";
    } else if (hoursLeft <= 24) {
      score = 30;
      detail = `Notice deadline in ${Math.round(hoursLeft)}h`;
    } else if (hoursLeft <= 72) {
      score = 60;
      detail = `Notice deadline in ${Math.round(hoursLeft)}h`;
    } else {
      score = 90;
      detail = `Notice deadline in ${Math.round(hoursLeft / 24)}d — on track`;
    }
  } else if (hasNoticeReqs && !event.noticeDeadline) {
    score = 50;
    detail = "Notice required — no deadline recorded";
  }

  // Bonus: contract refs present
  if (event.contractReferences.length === 0 && event.status !== "resolved") {
    score = Math.min(score, 70);
    detail += detail ? "; no contract refs" : "No contract references linked";
  }

  return {
    id: "contract-compliance",
    label: "Contract Compliance",
    weight: 0.2,
    score,
    severity: severity(score),
    detail,
  };
}

// ── Factor 2: Schedule Health ────────────────────────────

function scoreScheduleHealth(event: DecisionEvent): ScoreFactor {
  if (!event.scheduleImpact || event.scheduleImpact.daysAffected === 0) {
    return {
      id: "schedule-health",
      label: "Schedule Health",
      weight: 0.2,
      score: 100,
      severity: "ok",
      detail: "No schedule impact recorded",
    };
  }

  const days = event.scheduleImpact.daysAffected;
  const cp = event.scheduleImpact.criticalPath;
  let score: number;
  let detail: string;

  if (cp) {
    if (days > 14) {
      score = 20;
      detail = `${days} days on critical path — severe exposure`;
    } else if (days > 7) {
      score = 50;
      detail = `${days} days on critical path`;
    } else {
      score = 70;
      detail = `${days} days on critical path — manageable`;
    }
  } else {
    score = days > 14 ? 60 : 80;
    detail = `${days} day${days !== 1 ? "s" : ""} impact (non-critical path)`;
  }

  return {
    id: "schedule-health",
    label: "Schedule Health",
    weight: 0.2,
    score,
    severity: severity(score),
    detail,
  };
}

// ── Factor 3: Cost Trajectory ────────────────────────────

function scoreCostTrajectory(
  event: DecisionEvent,
  contingency: number,
): ScoreFactor {
  if (!event.costImpact || event.costImpact.estimated === 0) {
    return {
      id: "cost-trajectory",
      label: "Cost Trajectory",
      weight: 0.15,
      score: 100,
      severity: "ok",
      detail: "No cost exposure",
    };
  }

  const exposure = event.costImpact.estimated;
  const pct = contingency > 0 ? (exposure / contingency) * 100 : 50;
  let score: number;
  let detail: string;

  if (pct > 80) {
    score = 10;
    detail = `$${exposure.toLocaleString()} exposure (${pct.toFixed(0)}% of contingency) — critical`;
  } else if (pct > 50) {
    score = 40;
    detail = `$${exposure.toLocaleString()} exposure (${pct.toFixed(0)}% of contingency)`;
  } else if (pct > 20) {
    score = 65;
    detail = `$${exposure.toLocaleString()} exposure (${pct.toFixed(0)}% of contingency)`;
  } else {
    score = 90;
    detail = `$${exposure.toLocaleString()} exposure (${pct.toFixed(0)}% of contingency) — within limits`;
  }

  return {
    id: "cost-trajectory",
    label: "Cost Trajectory",
    weight: 0.15,
    score,
    severity: severity(score),
    detail,
  };
}

// ── Factor 4: Stakeholder Coverage ───────────────────────

function scoreStakeholderCoverage(event: DecisionEvent): ScoreFactor {
  const total = event.stakeholderNotifications.length;
  if (total === 0) {
    return {
      id: "stakeholder-coverage",
      label: "Stakeholder Coverage",
      weight: 0.1,
      score: 100,
      severity: "ok",
      detail: "No stakeholder notifications required",
    };
  }

  const notified = event.stakeholderNotifications.filter(
    (s) => s.notified,
  ).length;
  const score = Math.round((notified / total) * 100);
  const detail =
    notified === total
      ? `All ${total} stakeholders briefed`
      : `${notified}/${total} stakeholders briefed`;

  return {
    id: "stakeholder-coverage",
    label: "Stakeholder Coverage",
    weight: 0.1,
    score,
    severity: severity(score),
    detail,
  };
}

// ── Factor 5: Documentation Completeness ─────────────────

function scoreDocumentation(event: DecisionEvent): ScoreFactor {
  let score = 0;
  const parts: string[] = [];

  if (event.fieldRecord) {
    score += 25;
    parts.push("field");
  }
  if (event.rfiRecord) {
    score += 25;
    parts.push("RFI");
  }
  if (event.decisionRecord) {
    score += 25;
    parts.push("decision");
  }
  if (event.communications.length > 0) {
    score += 25;
    parts.push("comms");
  }

  const detail =
    parts.length === 4
      ? "All records complete"
      : parts.length > 0
        ? `${parts.join(", ")} recorded`
        : "No records captured";

  return {
    id: "documentation",
    label: "Documentation",
    weight: 0.15,
    score,
    severity: severity(score),
    detail,
  };
}

// ── Factor 6: Evidence Density ───────────────────────────

function scoreEvidenceDensity(event: DecisionEvent): ScoreFactor {
  const items =
    event.contractReferences.length + event.history.length;

  let score: number;
  let detail: string;

  if (items > 8) {
    score = 100;
    detail = `${items} evidence items — strong documentation trail`;
  } else if (items >= 4) {
    score = 70;
    detail = `${items} evidence items`;
  } else if (items >= 1) {
    score = 40;
    detail = `${items} evidence item${items !== 1 ? "s" : ""} — thin trail`;
  } else {
    score = 10;
    detail = "No evidence trail";
  }

  return {
    id: "evidence-density",
    label: "Evidence Density",
    weight: 0.1,
    score,
    severity: severity(score),
    detail,
  };
}

// ── Factor 7: Alignment Status ───────────────────────────

function scoreAlignment(event: DecisionEvent): ScoreFactor {
  const map: Record<string, number> = {
    synced: 100,
    drift: 50,
    misaligned: 10,
  };
  const score = map[event.alignmentStatus] ?? 50;
  const detail =
    event.alignmentStatus === "synced"
      ? "Field, contract, and office assumptions aligned"
      : event.alignmentStatus === "drift"
        ? "Minor inconsistencies detected"
        : "Field conditions contradict office assumptions";

  return {
    id: "alignment",
    label: "Alignment Status",
    weight: 0.1,
    score,
    severity: severity(score),
    detail,
  };
}

// ── Main Scorer ──────────────────────────────────────────

/**
 * Compute a deterministic multi-factor health score for an event.
 *
 * @param event - The DecisionEvent to score.
 * @param contingency - Project contingency budget (for cost ratio).
 * @returns DeterministicScore with composite, factors, and grade.
 */
export function computeDeterministicScore(
  event: DecisionEvent,
  contingency: number,
): DeterministicScore {
  const factors: ScoreFactor[] = [
    scoreContractCompliance(event),
    scoreScheduleHealth(event),
    scoreCostTrajectory(event, contingency),
    scoreStakeholderCoverage(event),
    scoreDocumentation(event),
    scoreEvidenceDensity(event),
    scoreAlignment(event),
  ];

  const composite = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0),
  );

  return {
    composite,
    factors,
    grade: grade(composite),
  };
}
