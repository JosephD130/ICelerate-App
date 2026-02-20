"use client";

import {
  Radio,
  FileSearch,
  GitBranch,
  MessageSquare,
  Activity,
  Check,
  X,
  SkipForward,
  Loader2,
} from "lucide-react";
import type { PipelineState, PipelineStage, StageStatus } from "@/lib/pipeline/types";
import { STAGE_META } from "@/lib/pipeline/types";

const STAGE_ICONS: Record<PipelineStage, React.ReactNode> = {
  "field-report": <Radio size={14} />,
  rfi: <FileSearch size={14} />,
  "decision-package": <GitBranch size={14} />,
  translator: <MessageSquare size={14} />,
  monitor: <Activity size={14} />,
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <Check size={10} />,
  error: <X size={10} />,
  skipped: <SkipForward size={10} />,
};

function getStatusColor(status: StageStatus): string {
  switch (status) {
    case "completed":
      return "var(--color-semantic-green)";
    case "running":
    case "streaming":
      return "var(--color-accent)";
    case "error":
      return "var(--color-semantic-red)";
    case "skipped":
      return "var(--color-text-dim)";
    default:
      return "var(--color-border)";
  }
}

export default function PipelineProgressBar({ state }: { state: PipelineState }) {
  const elapsed = state.startedAt
    ? Math.round((Date.now() - state.startedAt) / 1000)
    : 0;

  return (
    <div className="space-y-2">
      {/* Stage indicators */}
      <div className="flex items-center gap-1">
        {state.stages.map((s, i) => {
          const meta = STAGE_META[s.stage];
          const isActive = s.status === "running" || s.status === "streaming";

          return (
            <div key={s.stage} className="flex items-center gap-1 flex-1">
              {/* Stage node */}
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-[var(--radius-sm)] text-[10px] font-semibold uppercase tracking-wide transition-all ${
                  isActive ? "ring-1 ring-[var(--color-accent)]" : ""
                }`}
                style={{
                  background:
                    s.status === "pending"
                      ? "var(--color-surface)"
                      : `color-mix(in srgb, ${getStatusColor(s.status)} 15%, transparent)`,
                  color: getStatusColor(s.status),
                }}
              >
                {isActive ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : STATUS_ICON[s.status] ? (
                  STATUS_ICON[s.status]
                ) : (
                  STAGE_ICONS[s.stage]
                )}
                <span className="hidden sm:inline">{meta.label}</span>
              </div>

              {/* Connector line */}
              {i < state.stages.length - 1 && (
                <div
                  className="flex-1 h-px min-w-[8px]"
                  style={{
                    background:
                      s.status === "completed"
                        ? "var(--color-semantic-green)"
                        : "var(--color-border)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-dim)]">
        <span>
          {state.status === "running" && state.currentStage
            ? `Running: ${STAGE_META[state.currentStage].label}...`
            : state.status === "completed"
              ? "Pipeline complete"
              : state.status === "error"
                ? `Error: ${state.error || "Unknown"}`
                : state.status === "cancelled"
                  ? "Pipeline cancelled"
                  : ""}
        </span>
        {state.status === "running" && <span>{elapsed}s elapsed</span>}
      </div>
    </div>
  );
}
