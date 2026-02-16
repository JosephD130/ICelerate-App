// src/lib/demo/v5/resolvers/intelligence-feed.ts
// Generates "Since Yesterday" insight cards from project data and daily logs.
// Pure deterministic — no AI, no side effects, no React hooks.

import { DEMO_PROJECT_BY_ID } from "@/lib/demo/v5/projects";
import { DEMO_DAILY_LOGS_V5 } from "@/lib/demo/v5/dailyLogs";

export interface InsightCard {
  id: string;
  type:
    | "notice_expiring"
    | "cost_trending"
    | "stakeholder_gap"
    | "schedule_drift"
    | "log_anomaly"
    | "new_constraint";
  headline: string;
  detail: string;
  source: string;
  impact: "high" | "medium" | "low";
  confidence: number; // 0-100
  relatedEventId: string | null;
  createdAt: string;
}

/**
 * Generate insight cards for a project by scanning events, logs, and cross-references.
 * Returns 3-6 cards sorted by impact desc, confidence desc.
 */
export function resolveIntelligenceFeed(projectId: string): InsightCard[] {
  const project = DEMO_PROJECT_BY_ID[projectId];
  if (!project) return [];

  const logs = DEMO_DAILY_LOGS_V5.filter((l) => l.projectId === projectId);
  const recentLogs = logs.filter((l) => l.date >= "2026-02-12"); // last 2 days
  const cards: InsightCard[] = [];

  // 1. Notice expiring — events with notice deadlines approaching
  for (const event of project.events) {
    if (!event.noticeRequired || event.status === "resolved") continue;
    if (event.noticeDeadlineAt) {
      const deadline = new Date(event.noticeDeadlineAt).getTime();
      const hoursLeft = Math.round((deadline - Date.now()) / (1000 * 60 * 60));
      if (hoursLeft < 72) {
        cards.push({
          id: `insight-notice-${event.id}`,
          type: "notice_expiring",
          headline: hoursLeft <= 0
            ? `Notice window OVERDUE for "${event.title}"`
            : `Notice window closing in ${hoursLeft}h`,
          detail: `Contractual notice is ${hoursLeft <= 0 ? "past due" : "approaching deadline"}. Failure to file may waive entitlement to time extension or additional compensation.`,
          source: event.docRefs.length > 0
            ? `${event.docRefs[0].clauseRefs[0] ?? "Contract"} + Event ${event.id}`
            : `Event ${event.id}`,
          impact: hoursLeft <= 0 ? "high" : hoursLeft < 24 ? "high" : "medium",
          confidence: 92,
          relatedEventId: event.id,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Equipment standby — logs showing idle equipment
  const standbyEntries = recentLogs.flatMap((log) =>
    log.equipment
      .filter((e) => e.status === "standby")
      .map((e) => ({ ...e, logId: log.id, logDate: log.date }))
  );
  if (standbyEntries.length > 0) {
    const totalStandbyHours = standbyEntries.reduce(
      (sum, e) => sum + e.count * 8, // assume 8hr day for standby cost
      0,
    );
    const relatedLog = recentLogs.find((l) =>
      l.equipment.some((e) => e.status === "standby")
    );
    const relatedEvent = relatedLog?.relatedEventIds[0] ?? null;
    cards.push({
      id: `insight-standby-${projectId}`,
      type: "log_anomaly",
      headline: `${standbyEntries.length} equipment on standby across recent logs`,
      detail: `Estimated ${totalStandbyHours} standby-hours accruing. ${standbyEntries.map((e) => e.name).slice(0, 3).join(", ")} waiting on resolution.`,
      source: `Daily Logs ${recentLogs.map((l) => l.id).join(", ")}`,
      impact: standbyEntries.length > 3 ? "high" : "medium",
      confidence: 88,
      relatedEventId: relatedEvent,
      createdAt: new Date().toISOString(),
    });
  }

  // 3. Stakeholder gap — events with high severity where stakeholders need briefing
  const unbriefedEvents = project.events.filter(
    (e) =>
      (e.severity === "critical" || e.severity === "high") &&
      e.status !== "resolved" &&
      e.stakeholderIds.length > 0,
  );
  for (const event of unbriefedEvents) {
    // Check if any log mentions unbriefed stakeholders
    const mentionsGap = recentLogs.some(
      (l) =>
        l.relatedEventIds.includes(event.id) &&
        l.constraints.some(
          (c) =>
            c.toLowerCase().includes("briefing") ||
            c.toLowerCase().includes("not been briefed") ||
            c.toLowerCase().includes("stakeholder"),
        ),
    );
    if (mentionsGap) {
      cards.push({
        id: `insight-stakeholder-${event.id}`,
        type: "stakeholder_gap",
        headline: `${event.severity === "critical" ? "Critical" : "High-priority"} event lacks stakeholder briefing`,
        detail: `"${event.title}" — ${event.stakeholderIds.length} stakeholder(s) linked but field logs indicate executive team has not been briefed on this issue.`,
        source: `Event ${event.id} + recent daily logs`,
        impact: "high",
        confidence: 85,
        relatedEventId: event.id,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 4. Cost trending — open events with significant cost exposure
  const costEvents = project.events.filter(
    (e) => e.status !== "resolved" && e.costExposure.amount > 20000,
  );
  if (costEvents.length > 0) {
    const totalExposure = costEvents.reduce((s, e) => s + e.costExposure.amount, 0);
    const contingencyPct = project.contingency > 0
      ? Math.round((totalExposure / project.contingency) * 100)
      : 0;
    cards.push({
      id: `insight-cost-${projectId}`,
      type: "cost_trending",
      headline: `$${totalExposure.toLocaleString()} open cost exposure (${contingencyPct}% of contingency)`,
      detail: `${costEvents.length} event(s) carrying unresolved cost exposure. ${costEvents.filter((e) => e.costExposure.confidence === "low").length > 0 ? "Some estimates have low confidence." : ""}`,
      source: `Events ${costEvents.map((e) => e.id).join(", ")}`,
      impact: contingencyPct > 50 ? "high" : contingencyPct > 20 ? "medium" : "low",
      confidence: 78,
      relatedEventId: costEvents[0].id,
      createdAt: new Date().toISOString(),
    });
  }

  // 5. New constraints from recent logs
  const newConstraints = recentLogs.flatMap((log) =>
    log.constraints.map((c) => ({ text: c, logId: log.id, eventIds: log.relatedEventIds }))
  );
  const uniqueConstraints = newConstraints.filter(
    (c, i) => newConstraints.findIndex((x) => x.text === c.text) === i,
  );
  if (uniqueConstraints.length > 2) {
    cards.push({
      id: `insight-constraints-${projectId}`,
      type: "new_constraint",
      headline: `${uniqueConstraints.length} active constraints in recent field logs`,
      detail: uniqueConstraints[0].text.length > 100
        ? uniqueConstraints[0].text.slice(0, 97) + "..."
        : uniqueConstraints[0].text,
      source: `Daily Logs ${recentLogs.map((l) => l.id).join(", ")}`,
      impact: "medium",
      confidence: 90,
      relatedEventId: uniqueConstraints[0].eventIds[0] ?? null,
      createdAt: new Date().toISOString(),
    });
  }

  // 6. Schedule drift — events with critical path impact but no decision record
  const scheduleDriftEvents = project.events.filter(
    (e) =>
      e.scheduleImpact.criticalPath &&
      e.scheduleImpact.days > 0 &&
      e.status !== "resolved",
  );
  if (scheduleDriftEvents.length > 0) {
    const totalDays = scheduleDriftEvents.reduce((s, e) => s + e.scheduleImpact.days, 0);
    cards.push({
      id: `insight-schedule-${projectId}`,
      type: "schedule_drift",
      headline: `${totalDays} critical path days at risk`,
      detail: `${scheduleDriftEvents.length} open event(s) affecting the critical path. Delays may cascade to project milestones.`,
      source: `Events ${scheduleDriftEvents.map((e) => e.id).join(", ")}`,
      impact: totalDays > 10 ? "high" : "medium",
      confidence: 82,
      relatedEventId: scheduleDriftEvents[0].id,
      createdAt: new Date().toISOString(),
    });
  }

  // Sort by impact (high > medium > low), then confidence desc
  const impactOrder = { high: 0, medium: 1, low: 2 };
  cards.sort((a, b) => {
    const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
    if (impactDiff !== 0) return impactDiff;
    return b.confidence - a.confidence;
  });

  return cards.slice(0, 6);
}
