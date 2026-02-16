// Pure role-based default state values for the Risk Register page.
// Separate from RoleUiPolicy: policy controls visibility, defaults control initial state.
// No React, no side effects, no API calls.

import type { DrillDown, SortKey } from "./risk-register-helpers";

export interface RoleDefaults {
  defaultDriverMode: DrillDown;
  defaultMorningReviewCollapsed: boolean;
  showNoticeStrip: boolean;
  defaultListSort: SortKey;
  helperCopy: string;
}

const FIELD_DEFAULTS: RoleDefaults = {
  defaultDriverMode: null,
  defaultMorningReviewCollapsed: false,
  showNoticeStrip: false,
  defaultListSort: "schedule",
  helperCopy:
    "Your field priorities for today. Capture conditions, flag risks, send updates.",
};

const PM_DEFAULTS: RoleDefaults = {
  defaultDriverMode: null,
  defaultMorningReviewCollapsed: false,
  showNoticeStrip: true,
  defaultListSort: "severity",
  helperCopy:
    "Full risk view. Review action items, clear notices, manage events.",
};

const STAKEHOLDER_DEFAULTS: RoleDefaults = {
  defaultDriverMode: "cost",
  defaultMorningReviewCollapsed: true,
  showNoticeStrip: true,
  defaultListSort: "severity",
  helperCopy:
    "Executive summary. Top exposures and items requiring your input.",
};

const DEFAULTS: Record<string, RoleDefaults> = {
  field: FIELD_DEFAULTS,
  pm: PM_DEFAULTS,
  stakeholder: STAKEHOLDER_DEFAULTS,
};

export function getRoleDefaults(role: string): RoleDefaults {
  return DEFAULTS[role] ?? PM_DEFAULTS;
}
