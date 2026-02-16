"use client";

import { useState, useMemo, useEffect } from "react";
import { DollarSign, Clock, Bell } from "lucide-react";
import { useEvents } from "@/lib/contexts/event-context";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useRole } from "@/lib/contexts/role-context";
import { resolveProjectMetrics } from "@/lib/demo/v5/resolvers";
import KpiTile from "@/components/workspace/KpiTile";
import CalculationDrawer from "@/components/workspace/CalculationDrawer";
import FreshnessBar from "@/components/shared/FreshnessBar";
import { resolveFreshness } from "@/lib/freshness";
import { FLAGS } from "@/lib/flags";
import { useMemory } from "@/lib/contexts/memory-context";
import {
  computeExposure,
  computeDaysAtRisk,
  computeNoticeClocks,
  type MetricResult,
} from "@/lib/risk-metrics/risk-metrics";
import type { DrillDown } from "@/lib/ui/risk-register-helpers";
import type { RoleMode } from "@/lib/ui/risk-register-role";
import type { ProjectSnapshot } from "@/lib/memory/types";

interface Props {
  activeDrill: DrillDown;
  onDrill: (drill: DrillDown) => void;
  onScheduleCta?: () => void;
  onNoticeCta?: () => void;
  showKpis?: { cost: boolean; schedule: boolean; notice: boolean };
}

export default function ProjectHealthSummary({
  activeDrill,
  onDrill,
  onScheduleCta,
  onNoticeCta,
  showKpis,
}: Props) {
  const kpis = showKpis ?? { cost: true, schedule: true, notice: true };
  const visibleCount = [kpis.cost, kpis.schedule, kpis.notice].filter(Boolean).length;
  const { events } = useEvents();
  const { activeProject } = useActiveProject();
  const { role } = useRole();
  const { store } = useMemory();
  const metrics = resolveProjectMetrics(activeProject.id);
  const [calcDrawerMetric, setCalcDrawerMetric] = useState<MetricResult | null>(null);

  const roleMode = role as RoleMode;
  // Defer snapshot read to avoid SSR/client hydration mismatch (localStorage not available on server)
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | undefined>(undefined);
  useEffect(() => {
    if (FLAGS.riskMomentum) {
      setSnapshot(store.getLatestProjectSnapshot(activeProject.id) ?? undefined);
    }
  }, [store, activeProject.id]);

  const exposure = useMemo(
    () => computeExposure(events, metrics, roleMode, snapshot),
    [events, metrics, roleMode, snapshot],
  );

  const days = useMemo(
    () => computeDaysAtRisk(events, metrics, roleMode, snapshot),
    [events, metrics, roleMode, snapshot],
  );

  const notice = useMemo(
    () => computeNoticeClocks(events, roleMode, snapshot),
    [events, roleMode, snapshot],
  );

  const snapshotUpdated = useMemo(() => {
    if (!snapshot?.date) return undefined;
    const diff = Date.now() - new Date(snapshot.date).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "just now";
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }, [snapshot]);

  const freshnessWarnings = FLAGS.freshnessWarnings
    ? resolveFreshness(activeProject.sourceProfile)
    : [];

  return (
    <div className="mb-6">
      {FLAGS.freshnessWarnings && <FreshnessBar warnings={freshnessWarnings} />}
      <div
        className={`grid gap-5 ${
          visibleCount === 1
            ? "grid-cols-1 max-w-sm"
            : visibleCount === 2
              ? "grid-cols-2"
              : "grid-cols-3"
        }`}
      >
        {/* Exposure at Risk */}
        {kpis.cost && (
          <KpiTile
            icon={<DollarSign size={14} className="text-[var(--color-accent)] opacity-70" />}
            label={exposure.label}
            value={exposure.formatted}
            whatThisMeans={exposure.whatThisMeans}
            breakdown={exposure.microcopy}
            ctaLabel={exposure.ctaLabel}
            onCtaClick={() => onDrill(activeDrill === "cost" ? null : "cost")}
            onWhyClick={() => setCalcDrawerMetric(exposure)}
            isActive={activeDrill === "cost"}
            delta={exposure.delta}
            lastUpdated={snapshotUpdated}
          />
        )}

        {/* Days at Risk */}
        {kpis.schedule && (
          <KpiTile
            icon={<Clock size={14} className="text-[var(--color-text-muted)]" />}
            label={days.label}
            value={days.formatted}
            whatThisMeans={days.whatThisMeans}
            breakdown={days.microcopy}
            ctaLabel={days.ctaLabel}
            onCtaClick={() => {
              if (onScheduleCta) {
                onScheduleCta();
              } else {
                onDrill(activeDrill === "schedule" ? null : "schedule");
              }
            }}
            onWhyClick={() => setCalcDrawerMetric(days)}
            isActive={activeDrill === "schedule"}
            delta={days.delta}
            lastUpdated={snapshotUpdated}
          />
        )}

        {/* Active Notice Clocks */}
        {kpis.notice && (
          <KpiTile
            icon={<Bell size={14} className="text-[var(--color-text-muted)]" />}
            label={notice.label}
            value={notice.formatted}
            whatThisMeans={notice.whatThisMeans}
            breakdown={notice.microcopy}
            ctaLabel={notice.ctaLabel}
            onCtaClick={() => {
              if (onNoticeCta) {
                onNoticeCta();
              } else {
                onDrill(activeDrill === "notice" ? null : "notice");
              }
            }}
            onWhyClick={() => setCalcDrawerMetric(notice)}
            isActive={activeDrill === "notice"}
            delta={notice.delta}
            lastUpdated={snapshotUpdated}
          />
        )}
      </div>

      {/* Calculation Drawer */}
      {calcDrawerMetric && (
        <CalculationDrawer
          open={!!calcDrawerMetric}
          onClose={() => setCalcDrawerMetric(null)}
          metric={calcDrawerMetric}
        />
      )}
    </div>
  );
}
