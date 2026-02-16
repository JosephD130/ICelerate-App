"use client";

import { Check, Circle } from "lucide-react";
import { getVisibleModes, type EventMode } from "@/lib/models/mode-gating";
import { useRole } from "@/lib/contexts/role-context";
import { useMemory } from "@/lib/contexts/memory-context";
import type { EventTab } from "@/lib/contexts/event-context";
import type { DecisionEvent } from "@/lib/models/decision-event";

/**
 * Determine whether a mode's work has been completed for this event.
 * Returns true (done), false (not done), or null (no completion tracking).
 */
function isModeComplete(
  modeId: EventMode,
  event: DecisionEvent,
  approvedEvidenceCount: number,
): boolean | null {
  switch (modeId) {
    case "summary":
      return null; // entry point — always accessible
    case "evidence":
      return approvedEvidenceCount > 0;
    case "contract-position":
    case "contract":
      return !!event.rfiRecord;
    case "stakeholder-update":
      return !!event.decisionRecord || event.communications.length > 0;
    case "tracking":
      return event.monitorScores.length > 0;
    case "capture":
      return !!event.fieldRecord;
    case "audit-log":
    case "activity":
      return null; // informational — no completion
    default:
      return null;
  }
}

interface Props {
  event: DecisionEvent;
  activeMode: EventTab;
  onModeChange: (mode: EventTab) => void;
}

export default function ModeSwitcher({ event, activeMode, onModeChange }: Props) {
  const { role } = useRole();
  const { evidence } = useMemory();
  const modes = getVisibleModes(event, role);

  const approvedEvidenceCount = evidence.filter(
    (e) => e.linkedRiskItemId === event.id && e.status === "approved",
  ).length;

  return (
    <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1">
      {modes.map((m) => {
        const isActive = m.id === activeMode;
        const complete = isModeComplete(m.id, event, approvedEvidenceCount);

        return (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id as EventTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border cursor-pointer ${
              isActive
                ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text-primary)]"
            }`}
          >
            {complete === true ? (
              <span className="w-4 h-4 rounded-full bg-[var(--color-semantic-green)] flex items-center justify-center shrink-0">
                <Check size={10} className="text-white" />
              </span>
            ) : complete === false && isActive ? (
              <Circle size={10} className="text-[var(--color-accent)] shrink-0" />
            ) : null}
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
