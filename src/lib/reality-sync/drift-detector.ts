import type { DecisionEvent } from "@/lib/models/decision-event";
import type { DailyLog } from "@/lib/demo/v5/dailyLogs";

export type DriftSeverity = "synced" | "drift" | "misaligned";

export interface DriftRule {
  id: string;
  name: string;
  /** Basic rules only need events; log-aware rules receive logs as second arg. */
  check: (events: DecisionEvent[], logs?: DailyLog[]) => DriftResult | null;
}

export interface DriftResult {
  ruleId: string;
  severity: DriftSeverity;
  column: "field" | "contract" | "office";
  message: string;
}

export const DRIFT_RULES: DriftRule[] = [
  {
    id: "unfiled-notice",
    name: "Unfiled Notice",
    check: (events) => {
      const needsNotice = events.filter(
        (e) =>
          e.status === "open" &&
          e.contractReferences.some((r) => r.noticeDays && r.noticeDays > 0)
      );
      if (needsNotice.length === 0) return null;

      const urgent = needsNotice.find((e) => {
        const ref = e.contractReferences.find((r) => r.noticeDays);
        if (!ref?.noticeDays) return false;
        const hoursElapsed =
          (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60);
        return hoursElapsed > ref.noticeDays * 24 * 1.5; // well past window
      });

      return {
        ruleId: "unfiled-notice",
        severity: urgent ? "misaligned" : "drift",
        column: "contract",
        message: urgent
          ? `Notice window ${Math.round(((Date.now() - new Date(urgent.createdAt).getTime()) / (1000 * 60 * 60)))}h elapsed — filing deadline approaching`
          : `${needsNotice.length} event(s) require contractual notice`,
      };
    },
  },
  {
    id: "unbriefed-stakeholders",
    name: "Unbriefed Stakeholders",
    check: (events) => {
      const unbriefed = events.filter(
        (e) =>
          e.severity === "critical" || e.severity === "high"
            ? e.stakeholderNotifications.some((s) => !s.notified)
            : false
      );
      if (unbriefed.length === 0) return null;
      return {
        ruleId: "unbriefed-stakeholders",
        severity: unbriefed.some((e) => e.severity === "critical")
          ? "misaligned"
          : "drift",
        column: "office",
        message: `${unbriefed.length} high-priority event(s) with unbriefed stakeholders`,
      };
    },
  },
  {
    id: "stale-decision",
    name: "Stale Decision",
    check: (events) => {
      const stale = events.filter((e) => {
        if (e.status !== "open") return false;
        const hoursOpen =
          (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60);
        return hoursOpen > 48;
      });
      if (stale.length === 0) return null;
      return {
        ruleId: "stale-decision",
        severity: stale.length > 5 ? "misaligned" : "drift",
        column: "field",
        message: `${stale.length} decision(s) open >48 hours without resolution`,
      };
    },
  },
  {
    id: "budget-gap",
    name: "Budget Gap",
    check: (events) => {
      const totalExposure = events
        .filter((e) => e.status !== "resolved" && e.costImpact)
        .reduce((sum, e) => sum + (e.costImpact?.estimated ?? 0), 0);
      if (totalExposure === 0) return null;
      // Check against demo contingency of $312K
      const pct = (totalExposure / 312000) * 100;
      return {
        ruleId: "budget-gap",
        severity: pct > 80 ? "misaligned" : pct > 20 ? "drift" : "synced",
        column: "office",
        message: `$${totalExposure.toLocaleString()} open exposure (${pct.toFixed(0)}% of contingency)`,
      };
    },
  },
  // ── Log-aware rules ────────────────────────────────────────
  {
    id: "log-schedule-conflict",
    name: "Log ↔ Schedule Conflict",
    check: (events, logs) => {
      if (!logs || logs.length === 0) return null;
      // Find events referenced by logs that mention standby/constraints but have no schedule impact
      const recentLogs = logs.slice(-6);
      const constraintLogEventIds = new Set(
        recentLogs
          .filter((l) => l.constraints.length > 0 || l.equipment.some((eq) => eq.status === "standby"))
          .flatMap((l) => l.relatedEventIds)
      );
      const conflicts = events.filter(
        (e) =>
          constraintLogEventIds.has(e.id) &&
          e.status !== "resolved" &&
          (!e.scheduleImpact || e.scheduleImpact.daysAffected === 0)
      );
      if (conflicts.length === 0) return null;
      return {
        ruleId: "log-schedule-conflict",
        severity: conflicts.length > 2 ? "misaligned" : "drift",
        column: "field",
        message: `${conflicts.length} event(s) show field constraints but no schedule impact recorded`,
      };
    },
  },
  {
    id: "cost-without-decision",
    name: "Cost Without Decision",
    check: (events) => {
      const unresolved = events.filter(
        (e) =>
          e.status !== "resolved" &&
          e.costImpact &&
          e.costImpact.estimated > 0 &&
          (!e.decisionRecord || e.decisionRecord.panels.length === 0)
      );
      if (unresolved.length === 0) return null;
      const maxCost = Math.max(...unresolved.map((e) => e.costImpact?.estimated ?? 0));
      return {
        ruleId: "cost-without-decision",
        severity: maxCost > 25000 ? "misaligned" : "drift",
        column: "office",
        message: `${unresolved.length} event(s) have cost exposure but no decision record`,
      };
    },
  },
  {
    id: "equipment-standby-alert",
    name: "Equipment Standby Alert",
    check: (_events, logs) => {
      if (!logs || logs.length === 0) return null;
      const recentLogs = logs.slice(-6);
      const standbyCount = recentLogs.reduce(
        (sum, l) => sum + l.equipment.filter((eq) => eq.status === "standby").reduce((s, eq) => s + eq.count, 0),
        0
      );
      if (standbyCount <= 2) return null;
      return {
        ruleId: "equipment-standby-alert",
        severity: standbyCount > 5 ? "misaligned" : "drift",
        column: "field",
        message: `${standbyCount} pieces of equipment on standby across recent logs`,
      };
    },
  },
];

export function detectDrifts(events: DecisionEvent[], logs?: DailyLog[]): DriftResult[] {
  return DRIFT_RULES.map((rule) => rule.check(events, logs)).filter(
    (r): r is DriftResult => r !== null
  );
}
