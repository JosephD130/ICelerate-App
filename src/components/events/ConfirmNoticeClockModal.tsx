"use client";

import { AlertTriangle, X, Clock } from "lucide-react";
import type { DecisionEvent } from "@/lib/models/decision-event";

interface Props {
  open: boolean;
  event: DecisionEvent;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmNoticeClockModal({ open, event, onConfirm, onCancel }: Props) {
  if (!open) return null;

  const noticeDays = event.contractReferences
    .filter((r) => r.noticeDays && r.noticeDays > 0)
    .map((r) => r.noticeDays!)
    .sort((a, b) => a - b)[0];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-[var(--color-semantic-yellow)]">
            <AlertTriangle size={18} />
            <span className="text-base font-semibold text-[var(--color-text-primary)]">
              Start Notice Clock
            </span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
            Start the notice clock for <strong>{event.title}</strong>?
          </p>
          {noticeDays && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-semantic-yellow-dim)] border border-[var(--color-semantic-yellow)]/30">
              <Clock size={14} className="text-[var(--color-semantic-yellow)] shrink-0" />
              <span className="text-xs text-[var(--color-semantic-yellow)]">
                This will begin tracking the <strong>{noticeDays}-day</strong> contractual notice window.
              </span>
            </div>
          )}
          <p className="text-xs text-[var(--color-text-dim)] mt-3">
            Once started, the notice deadline will be tracked and displayed across the system.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--color-border)]">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-semantic-yellow)] text-[var(--color-bg)] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Start Clock
          </button>
        </div>
      </div>
    </>
  );
}
