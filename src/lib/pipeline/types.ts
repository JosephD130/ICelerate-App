export type PipelineStage =
  | "field-report"
  | "rfi"
  | "decision-package"
  | "translator"
  | "monitor";

export type PipelineStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "error"
  | "cancelled";

export type StageStatus =
  | "pending"
  | "running"
  | "streaming"
  | "completed"
  | "error"
  | "skipped";

export interface StageResult {
  stage: PipelineStage;
  status: StageStatus;
  text: string;
  panels?: { id: string; label: string; text: string }[];
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface PipelineState {
  status: PipelineStatus;
  currentStage: PipelineStage | null;
  stages: StageResult[];
  eventId: string;
  input: string;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface PipelineConfig {
  stages: PipelineStage[];
  autoSave: boolean;
  skipCompleted: boolean;
}

export const DEFAULT_PIPELINE: PipelineStage[] = [
  "field-report",
  "rfi",
  "decision-package",
  "translator",
  "monitor",
];

export const DEFAULT_CONFIG: PipelineConfig = {
  stages: DEFAULT_PIPELINE,
  autoSave: true,
  skipCompleted: true,
};

export const STAGE_META: Record<
  PipelineStage,
  { label: string; icon: string; color: string }
> = {
  "field-report": { label: "Field Report", icon: "radio", color: "var(--color-semantic-green)" },
  rfi: { label: "Contract Position", icon: "file-search", color: "var(--color-semantic-blue)" },
  "decision-package": { label: "Decision Package", icon: "git-branch", color: "var(--color-semantic-purple)" },
  translator: { label: "Communications", icon: "message-square", color: "var(--color-accent)" },
  monitor: { label: "Health Score", icon: "activity", color: "var(--color-semantic-yellow)" },
};
