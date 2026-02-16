// Continuous Calibration Engine — types
// Captures structured feedback from user verification actions.
// No model training. Fully auditable. Deterministic improvement.

export type CalibrationAction = "approved" | "rejected" | "edited";
export type CalibrationObjectType = "evidence" | "suggestion" | "notice";

export type CalibrationReasonCode =
  | "missing_citation"
  | "wrong_clause"
  | "wrong_deadline"
  | "wrong_cost_range"
  | "wrong_schedule_impact"
  | "wrong_risk_type"
  | "stale_data"
  | "irrelevant";

export interface CalibrationDiff {
  field: string;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
}

export interface CalibrationRecord {
  id: string;
  timestamp: string;
  projectId: string;
  riskItemId?: string;
  evidenceId?: string;
  suggestionId?: string;
  action: CalibrationAction;
  objectType: CalibrationObjectType;
  predicted: Record<string, unknown>;
  final: Record<string, unknown>;
  diff: CalibrationDiff[];
  reasonCodes: CalibrationReasonCode[];
  sourceProvenance: string[];
  confidenceAtTime: number;
  userRole: string;
  resolverRule?: string;
}

export interface CalibrationStats {
  totalRecords: number;
  byAction: Record<CalibrationAction, number>;
  byObjectType: Record<CalibrationObjectType, number>;
  topReasonCodes: { code: CalibrationReasonCode; count: number }[];
  ruleAcceptanceRates: {
    rule: string;
    accepted: number;
    rejected: number;
    edited: number;
  }[];
  recentRecords: CalibrationRecord[];
}

export interface CalibrationInsight {
  correctionCount: number;
  commonFix: string | null;
  confidenceCap: number | null;
}

export const REASON_CODE_LABELS: Record<CalibrationReasonCode, string> = {
  missing_citation: "Add citation",
  wrong_clause: "Correct clause ref",
  wrong_deadline: "Adjust deadline",
  wrong_cost_range: "Adjust cost range",
  wrong_schedule_impact: "Adjust schedule days",
  wrong_risk_type: "Change risk type",
  stale_data: "Stale source data",
  irrelevant: "Not relevant",
};
