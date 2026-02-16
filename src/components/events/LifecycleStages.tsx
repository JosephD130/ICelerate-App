"use client";

import { Check, Circle, Lock } from "lucide-react";
import type { LifecycleStage, DecisionEvent } from "@/lib/models/decision-event";
import { T } from "@/lib/terminology";
import { useEvents } from "@/lib/contexts/event-context";
import { useRole } from "@/lib/contexts/role-context";
import { getRoleUiPolicy } from "@/lib/ui/risk-register-role";
import { useMemo } from "react";

const STAGES: { id: LifecycleStage; label: string; index: number }[] = [
  { id: "field-record", label: T.PIPELINE[0], index: 0 },
  { id: "spec-check", label: T.PIPELINE[1], index: 1 },
  { id: "position", label: T.PIPELINE[2], index: 2 },
  { id: "issue-notice", label: T.PIPELINE[3], index: 3 },
];

function stageIndex(stage: LifecycleStage): number {
  return STAGES.findIndex((s) => s.id === stage);
}

function canAdvance(event: DecisionEvent, targetStage: LifecycleStage): boolean {
  switch (targetStage) {
    case "spec-check":
      return !!event.fieldRecord;
    case "position":
      return !!event.rfiRecord;
    case "issue-notice":
      return !!event.decisionRecord;
    default:
      return false;
  }
}

interface Props {
  event: DecisionEvent;
  compact?: boolean;
  onAdvance?: (stage: LifecycleStage) => void;
}

export default function LifecycleStages({ event, compact = false, onAdvance }: Props) {
  const { role } = useRole();
  const policy = useMemo(() => getRoleUiPolicy(role), [role]);
  const currentIdx = stageIndex(event.lifecycleStage);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => {
          const isComplete = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={stage.id} className="flex items-center gap-1">
              {i > 0 && <div className="w-3 h-px bg-[var(--color-border)]" />}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  isComplete
                    ? "bg-[var(--color-semantic-green-dim)] text-[var(--color-semantic-green)]"
                    : isCurrent
                    ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-dim)]"
                }`}
                title={stage.label}
              >
                {isComplete ? <Check size={10} /> : i + 1}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {STAGES.map((stage, i) => {
        const isComplete = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isLocked = i > currentIdx;
        const canAdvanceHere = isCurrent && i < STAGES.length - 1 && canAdvance(event, STAGES[i + 1].id);
        const canUserAdvance = policy.governance?.canAdvanceStage ?? role === "pm";

        return (
          <div key={stage.id}>
            <div className="flex items-center gap-3">
              {/* Stage indicator */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isComplete
                    ? "bg-[var(--color-semantic-green)] text-white"
                    : isCurrent
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-surface)] text-[var(--color-text-dim)] border border-[var(--color-border)]"
                }`}
              >
                {isComplete ? (
                  <Check size={14} />
                ) : isLocked ? (
                  <Lock size={12} />
                ) : (
                  <Circle size={12} />
                )}
              </div>

              {/* Label + status */}
              <div className="flex-1">
                <div className={`text-sm font-medium ${isComplete ? "text-[var(--color-semantic-green)]" : isCurrent ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-dim)]"}`}>
                  {stage.label}
                </div>
                <div className="text-xs text-[var(--color-text-dim)]">
                  {isComplete ? "Complete" : isCurrent ? "In Progress" : "Locked"}
                </div>
                {isLocked && (
                  <div className="text-[10px] text-[var(--color-text-dim)] mt-0.5">
                    {stage.id === "spec-check" && "Requires: Field Record saved"}
                    {stage.id === "position" && "Requires: Contract Position generated"}
                    {stage.id === "issue-notice" && "Requires: Decision Package generated"}
                  </div>
                )}
              </div>

              {/* Advance button */}
              {isCurrent && canAdvanceHere && canUserAdvance && onAdvance && (
                <button
                  onClick={() => onAdvance(STAGES[i + 1].id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent-dim)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all"
                >
                  Advance
                </button>
              )}
            </div>

            {/* Connector line */}
            {i < STAGES.length - 1 && (
              <div className="ml-3.5 w-px h-4 bg-[var(--color-border)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
