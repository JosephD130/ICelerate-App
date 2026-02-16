// Pure role-based UI policy for the Risk Register page.
// No React, no side effects, no API calls.

import type { SuggestionType, EvidenceSourceType } from "@/lib/memory/types";
import type { SortKey, DrillDown } from "./risk-register-helpers";
import { T } from "@/lib/terminology";
import { FLAGS } from "@/lib/flags";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoleMode = "field" | "pm" | "stakeholder";

export interface RoleUiPolicy {
  showKpis: { cost: boolean; schedule: boolean; notice: boolean };
  primaryCta: "new_event" | "new_field_record" | "export_board_ready";
  ctaLabel: string;
  helperSubtitle: string;
  morningReview: {
    title: string;
    sublabel: string;
    collapsed: boolean;
    allowAccept: boolean;
    allowEdit: boolean;
    allowReject: boolean;
    visibleTypes: SuggestionType[];
  };
  showTopRisksSummary: boolean;
  eventListMode: "full" | "readonly";
  showFieldBadges: boolean;
  showOperationalFilters: boolean;
  statusFilterDefaults: string[];
  list: {
    showCostMeta: boolean;
    showScheduleMeta: boolean;
    showNoticeMeta: boolean;
  };
  defaults: {
    sort: SortKey;
  };
  // Governed risk system extensions
  evidence: {
    canApprove: boolean;
    canReject: boolean;
    collapsed: boolean;
    visibleSourceTypes: EvidenceSourceType[] | "all";
  };
  governance: {
    canIssueNotice: boolean;
    canEditStructuredFields: boolean;
    canCreateRiskItem: boolean;
    canAdvanceStage: boolean;
  };
}

// ---------------------------------------------------------------------------
// All suggestion types (PM sees everything)
// ---------------------------------------------------------------------------

const ALL_SUGGESTION_TYPES: SuggestionType[] = [
  "notice_risk",
  "alignment_change",
  "schedule_revision",
  "cost_revision",
  "stakeholder_action",
  "contract_reference",
  "new_event",
  "field_observation",
];

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

const FIELD_POLICY: RoleUiPolicy = {
  showKpis: { cost: false, schedule: true, notice: false },
  primaryCta: "new_field_record",
  ctaLabel: "New Field Record",
  helperSubtitle: "Today's field priorities — capture conditions and send updates.",
  morningReview: {
    title: T.ACTION_REQUIRED,
    sublabel: "AI-flagged items that need your input.",
    collapsed: false,
    allowAccept: false,
    allowEdit: true,
    allowReject: false,
    visibleTypes: [
      "alignment_change",
      "schedule_revision",
      "stakeholder_action",
      "contract_reference",
    ],
  },
  showTopRisksSummary: false,
  eventListMode: "full",
  showFieldBadges: true,
  showOperationalFilters: true,
  statusFilterDefaults: ["open", "in-progress"],
  list: {
    showCostMeta: false,
    showScheduleMeta: true,
    showNoticeMeta: false,
  },
  defaults: { sort: "schedule" },
  evidence: { canApprove: true, canReject: false, collapsed: false, visibleSourceTypes: ["field"] },
  governance: { canIssueNotice: false, canEditStructuredFields: true, canCreateRiskItem: false, canAdvanceStage: false },
};

const PM_POLICY: RoleUiPolicy = {
  showKpis: { cost: true, schedule: true, notice: true },
  primaryCta: "new_event",
  ctaLabel: FLAGS.governedRiskSystem ? `New ${T.RISK_ITEM}` : "New Event",
  helperSubtitle: FLAGS.governedRiskSystem
    ? "Your daily view of risk items, notices, and schedule impact — sorted by priority."
    : "Your daily view of risk, notice, and schedule impact — sorted by priority.",
  morningReview: {
    title: T.ACTION_REQUIRED,
    sublabel: "AI-flagged items that need your decision.",
    collapsed: false,
    allowAccept: true,
    allowEdit: true,
    allowReject: true,
    visibleTypes: ALL_SUGGESTION_TYPES,
  },
  showTopRisksSummary: false,
  eventListMode: "full",
  showFieldBadges: false,
  showOperationalFilters: true,
  statusFilterDefaults: ["open", "in-progress", "resolved"],
  list: {
    showCostMeta: true,
    showScheduleMeta: true,
    showNoticeMeta: true,
  },
  defaults: { sort: "severity" },
  evidence: { canApprove: true, canReject: true, collapsed: false, visibleSourceTypes: "all" },
  governance: { canIssueNotice: true, canEditStructuredFields: true, canCreateRiskItem: true, canAdvanceStage: true },
};

const EXEC_POLICY: RoleUiPolicy = {
  showKpis: { cost: true, schedule: true, notice: true },
  primaryCta: "export_board_ready",
  ctaLabel: "Board-Ready Export",
  helperSubtitle: "Executive risk summary — top exposures and decision items.",
  morningReview: {
    title: "Decisions Needed",
    sublabel: "Items requiring executive input.",
    collapsed: true,
    allowAccept: false,
    allowEdit: false,
    allowReject: false,
    visibleTypes: [
      "notice_risk",
      "cost_revision",
      "schedule_revision",
      "stakeholder_action",
      "alignment_change",
    ],
  },
  showTopRisksSummary: true,
  eventListMode: "readonly",
  showFieldBadges: false,
  showOperationalFilters: false,
  statusFilterDefaults: ["open", "in-progress"],
  list: {
    showCostMeta: true,
    showScheduleMeta: true,
    showNoticeMeta: true,
  },
  defaults: { sort: "severity" },
  evidence: { canApprove: false, canReject: false, collapsed: true, visibleSourceTypes: "all" },
  governance: { canIssueNotice: false, canEditStructuredFields: false, canCreateRiskItem: false, canAdvanceStage: false },
};

const POLICIES: Record<RoleMode, RoleUiPolicy> = {
  field: FIELD_POLICY,
  pm: PM_POLICY,
  stakeholder: EXEC_POLICY,
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export function getRoleUiPolicy(role: RoleMode): RoleUiPolicy {
  return POLICIES[role];
}

/**
 * Returns true when the active drill-down targets a KPI that the
 * current role's policy hides (e.g. drill="cost" on field role).
 */
export function shouldClearDrillDown(
  drill: DrillDown,
  policy: RoleUiPolicy,
): boolean {
  if (!drill) return false;
  const map: Record<string, boolean> = {
    cost: policy.showKpis.cost,
    schedule: policy.showKpis.schedule,
    notice: policy.showKpis.notice,
  };
  return !map[drill];
}

const DRILL_ROLE_LABELS: Record<string, string> = {
  cost: "Cost Exposure drill-down is available in PM and Exec roles.",
  schedule: "Schedule Impact drill-down is available in all roles.",
  notice: "Notice Clocks drill-down is available in PM and Exec roles.",
};

export function drillDownUnavailableMessage(drill: DrillDown): string {
  if (!drill) return "";
  return DRILL_ROLE_LABELS[drill] ?? "";
}
