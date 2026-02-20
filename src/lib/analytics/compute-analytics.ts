import type { DecisionEvent } from "@/lib/models/decision-event";

export interface TimelinePoint {
  date: string;
  cumulative: number;
}

export interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface StatusItem {
  status: string;
  count: number;
  color: string;
}

export interface VelocityItem {
  title: string;
  traditional: number;
  actual: number;
}

export interface AlignmentPoint {
  date: string;
  synced: number;
  drift: number;
  misaligned: number;
}

export interface ContributorItem {
  title: string;
  cost: number;
  severity: string;
  color: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--color-semantic-red)",
  high: "#F97316",
  medium: "var(--color-semantic-yellow)",
  low: "var(--color-semantic-green)",
  info: "var(--color-semantic-blue)",
};

const STATUS_COLORS: Record<string, string> = {
  open: "var(--color-semantic-red)",
  "in-progress": "var(--color-semantic-yellow)",
  resolved: "var(--color-semantic-green)",
  escalated: "var(--color-semantic-purple)",
};

export function computeCostTimeline(events: DecisionEvent[]): TimelinePoint[] {
  const sorted = [...events]
    .filter((e) => e.costImpact?.estimated)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let cumulative = 0;
  return sorted.map((e) => {
    cumulative += e.costImpact!.estimated;
    return {
      date: e.createdAt.slice(0, 10),
      cumulative,
    };
  });
}

export function computeSeverityDistribution(
  events: DecisionEvent[],
): DistributionItem[] {
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.severity] = (counts[e.severity] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: SEVERITY_COLORS[name] || "var(--color-text-dim)",
    }))
    .sort((a, b) => b.value - a.value);
}

export function computeStatusBreakdown(events: DecisionEvent[]): StatusItem[] {
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.status] = (counts[e.status] || 0) + 1;
  }
  return Object.entries(counts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1).replace("-", " "),
    count,
    color: STATUS_COLORS[status] || "var(--color-text-dim)",
  }));
}

export function computeVelocityComparison(
  events: DecisionEvent[],
): VelocityItem[] {
  return events
    .filter((e) => e.velocity.totalMinutes != null)
    .map((e) => ({
      title:
        e.title.length > 25 ? e.title.slice(0, 22) + "..." : e.title,
      traditional: e.velocity.traditionalDays * 24 * 60,
      actual: e.velocity.totalMinutes!,
    }));
}

export function computeAlignmentTrend(
  events: DecisionEvent[],
): AlignmentPoint[] {
  // Group events by creation date and count alignment states
  const byDate: Record<string, { synced: number; drift: number; misaligned: number }> = {};
  for (const e of events) {
    const date = e.createdAt.slice(0, 10);
    if (!byDate[date]) byDate[date] = { synced: 0, drift: 0, misaligned: 0 };
    byDate[date][e.alignmentStatus]++;
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));
}

export function computeTopContributors(
  events: DecisionEvent[],
): ContributorItem[] {
  return events
    .filter((e) => e.costImpact?.estimated && e.costImpact.estimated > 0)
    .sort((a, b) => (b.costImpact?.estimated || 0) - (a.costImpact?.estimated || 0))
    .slice(0, 7)
    .map((e) => ({
      title: e.title,
      cost: e.costImpact!.estimated,
      severity: e.severity,
      color: SEVERITY_COLORS[e.severity] || "var(--color-text-dim)",
    }));
}

/** Summary stats for the dashboard header */
export function computeSummaryStats(events: DecisionEvent[]) {
  const totalCost = events.reduce(
    (sum, e) => sum + (e.costImpact?.estimated || 0),
    0,
  );
  const totalScheduleDays = events.reduce(
    (sum, e) => sum + (e.scheduleImpact?.daysAffected || 0),
    0,
  );
  const openCount = events.filter(
    (e) => e.status === "open" || e.status === "in-progress",
  ).length;
  const criticalCount = events.filter(
    (e) => e.severity === "critical" || e.severity === "high",
  ).length;

  return { totalCost, totalScheduleDays, openCount, criticalCount, total: events.length };
}
