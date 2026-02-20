"use client";

import { useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEvents } from "@/lib/contexts/event-context";
import {
  computeCostTimeline,
  computeSeverityDistribution,
  computeStatusBreakdown,
  computeVelocityComparison,
  computeAlignmentTrend,
  computeTopContributors,
  computeSummaryStats,
} from "@/lib/analytics/compute-analytics";

function ChartCard({
  title,
  icon,
  children,
  stat,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  stat?: string;
}) {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[var(--color-accent)]">{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {title}
        </span>
        {stat && (
          <span className="text-xs font-data text-[var(--color-text-dim)] ml-auto">
            {stat}
          </span>
        )}
      </div>
      <div className="h-[200px]">{children}</div>
    </div>
  );
}

const chartTooltipStyle = {
  contentStyle: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "11px",
    color: "var(--color-text-primary)",
  },
  itemStyle: { color: "var(--color-text-secondary)" },
};

export default function AnalyticsPage() {
  const { events } = useEvents();

  const costData = useMemo(() => computeCostTimeline(events), [events]);
  const severityData = useMemo(
    () => computeSeverityDistribution(events),
    [events],
  );
  const statusData = useMemo(() => computeStatusBreakdown(events), [events]);
  const velocityData = useMemo(
    () => computeVelocityComparison(events),
    [events],
  );
  const alignmentData = useMemo(
    () => computeAlignmentTrend(events),
    [events],
  );
  const topContributors = useMemo(
    () => computeTopContributors(events),
    [events],
  );
  const stats = useMemo(() => computeSummaryStats(events), [events]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
          <BarChart3 size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Analytics
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {stats.total} events tracked &middot; {stats.openCount} open &middot;{" "}
            {stats.criticalCount} high/critical
          </p>
        </div>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Exposure",
            value: `$${(stats.totalCost / 1000).toFixed(0)}K`,
            icon: <DollarSign size={14} />,
            color: "var(--color-semantic-red)",
          },
          {
            label: "Schedule Days at Risk",
            value: `${stats.totalScheduleDays}d`,
            icon: <Clock size={14} />,
            color: "var(--color-semantic-yellow)",
          },
          {
            label: "Open Items",
            value: String(stats.openCount),
            icon: <Shield size={14} />,
            color: "var(--color-accent)",
          },
          {
            label: "Total Events",
            value: String(stats.total),
            icon: <Activity size={14} />,
            color: "var(--color-semantic-blue)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-3"
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
              <span style={{ color: s.color }}>{s.icon}</span>
              {s.label}
            </div>
            <div
              className="text-xl font-bold font-data"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cost Exposure Over Time */}
        <ChartCard
          title="Cost Exposure"
          icon={<TrendingUp size={14} />}
          stat={costData.length > 0 ? `$${(costData[costData.length - 1].cumulative / 1000).toFixed(0)}K total` : "No data"}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={costData}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--color-text-dim)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-text-dim)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                {...chartTooltipStyle}
                formatter={(v) => [`$${Number(v).toLocaleString()}`, "Cumulative"]}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#FF6B35"
                fill="url(#costGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Risk Distribution */}
        <ChartCard
          title="Risk Distribution"
          icon={<Shield size={14} />}
          stat={`${stats.total} events`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Breakdown */}
        <ChartCard
          title="Status Breakdown"
          icon={<Activity size={14} />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-text-dim)" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 10, fill: "var(--color-text-dim)" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Decision Velocity */}
        <ChartCard
          title="Decision Velocity"
          icon={<Clock size={14} />}
          stat="Traditional vs ICelerate"
        >
          {velocityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <XAxis
                  dataKey="title"
                  tick={{ fontSize: 9, fill: "var(--color-text-dim)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-text-dim)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 60).toFixed(0)}h`}
                />
                <Tooltip
                  {...chartTooltipStyle}
                  formatter={(v) => {
                    const n = Number(v);
                    return [
                      n >= 1440
                        ? `${(n / 1440).toFixed(1)} days`
                        : n >= 60
                          ? `${(n / 60).toFixed(1)} hours`
                          : `${n} min`,
                      "",
                    ];
                  }}
                />
                <Bar dataKey="traditional" fill="var(--color-text-dim)" radius={[4, 4, 0, 0]} name="Traditional" />
                <Bar dataKey="actual" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="ICelerate" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-[var(--color-text-dim)]">
              No velocity data yet
            </div>
          )}
        </ChartCard>

        {/* Alignment Trend */}
        <ChartCard title="Alignment Status" icon={<Activity size={14} />}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={alignmentData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--color-text-dim)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-text-dim)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip {...chartTooltipStyle} />
              <Area
                type="monotone"
                dataKey="synced"
                stackId="1"
                stroke="var(--color-semantic-green)"
                fill="var(--color-semantic-green-dim)"
              />
              <Area
                type="monotone"
                dataKey="drift"
                stackId="1"
                stroke="var(--color-semantic-yellow)"
                fill="var(--color-semantic-yellow-dim)"
              />
              <Area
                type="monotone"
                dataKey="misaligned"
                stackId="1"
                stroke="var(--color-semantic-red)"
                fill="var(--color-semantic-red-dim)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Risk Contributors */}
        <ChartCard
          title="Top Risk Contributors"
          icon={<DollarSign size={14} />}
          stat={`${topContributors.length} items`}
        >
          <div className="space-y-2 overflow-y-auto h-full pr-1">
            {topContributors.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-[var(--color-text-dim)]">
                No cost data
              </div>
            ) : (
              topContributors.map((c, i) => {
                const maxCost = topContributors[0]?.cost || 1;
                const pct = (c.cost / maxCost) * 100;
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--color-text-secondary)] truncate max-w-[200px]">
                        {c.title}
                      </span>
                      <span className="text-[10px] font-data text-[var(--color-text-primary)]">
                        ${(c.cost / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
