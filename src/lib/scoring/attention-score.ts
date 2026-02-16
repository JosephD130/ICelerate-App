// src/lib/scoring/attention-score.ts
// Pure deterministic attention score (0-100) per project.
// No AI, no side effects — just math over existing project data.

import type { DemoProject } from "@/lib/demo/v5/projects";
import { resolveProjectMetrics } from "@/lib/demo/v5/resolvers";
import { computeFreshnessBadge, type FreshnessLevel } from "@/lib/provenance/freshness";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AttentionTier = "critical" | "elevated" | "monitoring" | "stable";

export interface AttentionFactor {
  key: string;
  label: string;
  score: number;   // 0-100 raw factor score
  weight: number;  // 0-1 weight (sums to 1 across all factors)
  detail: string;  // human-readable detail
}

export interface AttentionScore {
  total: number;         // 0-100 weighted total
  tier: AttentionTier;
  factors: AttentionFactor[];
  freshness: FreshnessLevel;
  topEventId: string | null;  // highest-exposure unresolved event
}

// ---------------------------------------------------------------------------
// Tier thresholds
// ---------------------------------------------------------------------------

export function tierFromScore(score: number): AttentionTier {
  if (score >= 75) return "critical";
  if (score >= 50) return "elevated";
  if (score >= 25) return "monitoring";
  return "stable";
}

export const TIER_COLORS: Record<AttentionTier, { color: string; bg: string; label: string }> = {
  critical: { color: "var(--color-semantic-red)", bg: "var(--color-semantic-red-dim)", label: "Attention Now" },
  elevated: { color: "var(--color-semantic-yellow)", bg: "var(--color-semantic-yellow-dim)", label: "Needs Review" },
  monitoring: { color: "var(--color-semantic-blue)", bg: "var(--color-semantic-blue-dim)", label: "Monitor" },
  stable: { color: "var(--color-semantic-green)", bg: "var(--color-semantic-green-dim)", label: "Stable" },
};

// ---------------------------------------------------------------------------
// Default weights (PM perspective — balanced)
// ---------------------------------------------------------------------------

export const DEFAULT_WEIGHTS: Record<string, number> = {
  events: 0.20,
  severity: 0.20,
  notice: 0.15,
  schedule: 0.15,
  freshness: 0.15,
  contingency: 0.15,
};

// ---------------------------------------------------------------------------
// Factor scoring functions — each returns 0-100
// ---------------------------------------------------------------------------

function scoreEvents(project: DemoProject): { score: number; detail: string } {
  const open = project.events.filter((e) => e.status !== "resolved").length;
  const total = project.events.length;
  if (total === 0) return { score: 0, detail: "No events" };
  const ratio = open / Math.max(total, 1);
  // More unresolved = higher score; 5+ open events = 100
  const score = Math.min(100, open * 20 + ratio * 30);
  return { score: Math.round(score), detail: `${open} open of ${total} total` };
}

function scoreSeverity(project: DemoProject): { score: number; detail: string } {
  const metrics = resolveProjectMetrics(project.id);
  if (!metrics) return { score: 0, detail: "No data" };
  const { critical, high } = metrics.severityBreakdown;
  const { highRisk } = metrics.alignmentBreakdown;
  // Critical events = 30pts each (capped), high = 15pts each, high-risk alignment = 20pts each
  const score = Math.min(100, critical * 30 + high * 15 + highRisk * 20);
  return {
    score: Math.round(score),
    detail: critical > 0
      ? `${critical} critical event${critical !== 1 ? "s" : ""}`
      : high > 0
        ? `${high} high severity`
        : "Low severity",
  };
}

function scoreNotice(project: DemoProject): { score: number; detail: string } {
  const now = Date.now();
  let urgentCount = 0;
  let pendingCount = 0;
  for (const e of project.events) {
    if (!e.noticeRequired || e.status === "resolved") continue;
    pendingCount++;
    if (e.noticeDeadlineAt) {
      const daysLeft = (new Date(e.noticeDeadlineAt).getTime() - now) / 86_400_000;
      if (daysLeft < 7) urgentCount++;
    }
  }
  const score = Math.min(100, urgentCount * 40 + pendingCount * 15);
  return {
    score: Math.round(score),
    detail: urgentCount > 0
      ? `${urgentCount} notice${urgentCount !== 1 ? "s" : ""} due within 7d`
      : pendingCount > 0
        ? `${pendingCount} pending notice${pendingCount !== 1 ? "s" : ""}`
        : "No notices pending",
  };
}

function scoreSchedule(project: DemoProject): { score: number; detail: string } {
  const criticalPath = project.events.filter(
    (e) => e.scheduleImpact.criticalPath && e.status !== "resolved"
  );
  const totalDays = criticalPath.reduce((s, e) => s + e.scheduleImpact.days, 0);
  // 30+ days on critical path = 100
  const score = Math.min(100, totalDays * 3.5 + criticalPath.length * 10);
  return {
    score: Math.round(score),
    detail: criticalPath.length > 0
      ? `${totalDays}d on critical path`
      : "No critical path risk",
  };
}

function scoreFreshness(project: DemoProject): { score: number; detail: string; level: FreshnessLevel } {
  const badge = computeFreshnessBadge({ sources: project.sourceProfile.sources });
  const levelScore: Record<FreshnessLevel, number> = { fresh: 0, stale: 45, old: 90 };
  return {
    score: levelScore[badge.level],
    detail: badge.reason,
    level: badge.level,
  };
}

function scoreContingency(project: DemoProject): { score: number; detail: string } {
  const metrics = resolveProjectMetrics(project.id);
  if (!metrics) return { score: 0, detail: "No data" };
  const pct = metrics.contingencyUsedPct;
  // Above 80% = critical (100), 50-80% linear, under 20% = 0
  const score = pct >= 80 ? 100 : pct >= 50 ? ((pct - 50) / 30) * 80 + 20 : pct >= 20 ? ((pct - 20) / 30) * 20 : 0;
  return {
    score: Math.round(score),
    detail: `${Math.round(pct)}% of contingency consumed`,
  };
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

export function computeAttentionScore(
  project: DemoProject,
  weights: Record<string, number> = DEFAULT_WEIGHTS,
): AttentionScore {
  const eventsResult = scoreEvents(project);
  const severityResult = scoreSeverity(project);
  const noticeResult = scoreNotice(project);
  const scheduleResult = scoreSchedule(project);
  const freshnessResult = scoreFreshness(project);
  const contingencyResult = scoreContingency(project);

  const factors: AttentionFactor[] = [
    { key: "events", label: "Open Risks", score: eventsResult.score, weight: weights.events, detail: eventsResult.detail },
    { key: "severity", label: "Risk Severity", score: severityResult.score, weight: weights.severity, detail: severityResult.detail },
    { key: "notice", label: "Notice Clocks", score: noticeResult.score, weight: weights.notice, detail: noticeResult.detail },
    { key: "schedule", label: "Schedule Risk", score: scheduleResult.score, weight: weights.schedule, detail: scheduleResult.detail },
    { key: "freshness", label: "Source Freshness", score: freshnessResult.score, weight: weights.freshness, detail: freshnessResult.detail },
    { key: "contingency", label: "Contingency Burn", score: contingencyResult.score, weight: weights.contingency, detail: contingencyResult.detail },
  ];

  const total = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  // Find highest-exposure unresolved event
  const unresolvedEvents = project.events.filter((e) => e.status !== "resolved");
  const topEvent = unresolvedEvents.length > 0
    ? unresolvedEvents.reduce((best, e) =>
        e.costExposure.amount > best.costExposure.amount ? e : best
      )
    : null;

  return {
    total: Math.min(100, Math.max(0, total)),
    tier: tierFromScore(total),
    factors: factors.sort((a, b) => b.score * b.weight - a.score * a.weight),
    freshness: freshnessResult.level,
    topEventId: topEvent?.id ?? null,
  };
}
