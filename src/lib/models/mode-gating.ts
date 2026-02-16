// Mode gating — deterministic visibility rules for event modes.
// Pure functions — no React, no side effects.

import type { DecisionEvent } from "./decision-event";
import type { Role } from "@/lib/contexts/role-context";
import { FLAGS } from "@/lib/flags";

// Legacy modes (eventFlowSimplification)
export type LegacyEventMode =
  | "capture"
  | "contract"
  | "exposure"
  | "stakeholder-update"
  | "decision-outputs"
  | "activity";

// Governed risk system modes
export type GovernedEventMode =
  | "summary"
  | "evidence"
  | "contract-position"
  | "stakeholder-update"
  | "tracking"
  | "audit-log";

export type EventMode = LegacyEventMode | GovernedEventMode;

export interface ModeConfig {
  id: EventMode;
  label: string;
  visible: (event: DecisionEvent, role: Role) => boolean;
}

// ── Governed Risk System modes ──────────────────────────

const GOVERNED_MODE_CONFIGS: ModeConfig[] = [
  {
    id: "summary",
    label: "Summary",
    visible: () => true,
  },
  {
    id: "evidence",
    label: "Evidence",
    visible: () => true,
  },
  {
    id: "contract-position",
    label: "Contract Position",
    visible: (event, role) =>
      role === "pm" ||
      role === "stakeholder" ||
      event.eventType === "notice-contract" ||
      event.contractReferences.length > 0 ||
      !!event.fieldRecord?.noticeRequired,
  },
  {
    id: "stakeholder-update",
    label: "Stakeholder Update",
    visible: (event, role) =>
      role === "pm" ||
      event.eventType === "notice-contract" ||
      event.eventType === "drift-variance" ||
      event.severity === "high" ||
      event.severity === "critical" ||
      (role === "stakeholder" && event.status !== "resolved"),
  },
  {
    id: "tracking",
    label: "Tracking",
    visible: () => true,
  },
  {
    id: "audit-log",
    label: "Audit Log",
    visible: () => true,
  },
];

const GOVERNED_MODE_ROLE_ACCESS: Record<GovernedEventMode, Role[]> = {
  summary: ["field", "pm", "stakeholder"],
  evidence: ["field", "pm", "stakeholder"],
  "contract-position": ["pm", "stakeholder"],
  "stakeholder-update": ["field", "pm", "stakeholder"],
  tracking: ["field", "pm", "stakeholder"],
  "audit-log": ["field", "pm", "stakeholder"],
};

// ── Legacy modes ────────────────────────────────────────

const LEGACY_MODE_CONFIGS: ModeConfig[] = [
  {
    id: "capture",
    label: "Capture",
    visible: () => true,
  },
  {
    id: "contract",
    label: "Contract",
    visible: (event) =>
      event.eventType === "notice-contract" ||
      event.contractReferences.length > 0 ||
      !!event.fieldRecord?.noticeRequired,
  },
  {
    id: "exposure",
    label: "Exposure",
    visible: (event) =>
      !!event.costImpact ||
      !!event.scheduleImpact ||
      event.eventType === "cost-schedule",
  },
  {
    id: "stakeholder-update",
    label: "Stakeholder Update",
    visible: (event, role) =>
      event.eventType === "notice-contract" ||
      event.eventType === "drift-variance" ||
      event.severity === "high" ||
      event.severity === "critical" ||
      (role === "stakeholder" && event.status !== "resolved"),
  },
  {
    id: "decision-outputs",
    label: "Decision Outputs",
    visible: (event, role) => {
      const hasTrust =
        !!event.fieldRecord?.trust ||
        !!event.rfiRecord?.trust ||
        !!event.decisionRecord?.trust ||
        event.monitorScores.some((s) => !!s.trust);
      return hasTrust || role === "pm" || role === "stakeholder";
    },
  },
  {
    id: "activity",
    label: "Activity",
    visible: () => true,
  },
];

const LEGACY_MODE_ROLE_ACCESS: Record<LegacyEventMode, Role[]> = {
  capture: ["field", "pm", "stakeholder"],
  contract: ["pm", "stakeholder"],
  exposure: ["pm", "stakeholder"],
  "stakeholder-update": ["field", "pm", "stakeholder"],
  "decision-outputs": ["pm", "stakeholder"],
  activity: ["field", "pm", "stakeholder"],
};

// ── Public API ──────────────────────────────────────────

export const MODE_CONFIGS = FLAGS.governedRiskSystem
  ? GOVERNED_MODE_CONFIGS
  : LEGACY_MODE_CONFIGS;

/**
 * Get the list of visible modes for a given event and role.
 * Filters by both data-driven visibility and role access.
 */
export function getVisibleModes(
  event: DecisionEvent,
  role: Role,
): ModeConfig[] {
  if (FLAGS.governedRiskSystem) {
    return GOVERNED_MODE_CONFIGS.filter(
      (m) =>
        m.visible(event, role) &&
        GOVERNED_MODE_ROLE_ACCESS[m.id as GovernedEventMode]?.includes(role),
    );
  }
  return LEGACY_MODE_CONFIGS.filter(
    (m) =>
      m.visible(event, role) &&
      LEGACY_MODE_ROLE_ACCESS[m.id as LegacyEventMode]?.includes(role),
  );
}
