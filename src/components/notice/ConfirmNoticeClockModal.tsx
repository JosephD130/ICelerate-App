"use client";

import { useState } from "react";
import { X, Clock } from "lucide-react";
import type { Suggestion } from "@/lib/memory/types";

export interface NoticeConfirmPayload {
  clauseRef: string;
  startTime: string;
  deadline: string;
  recipientGroup: "field" | "pm" | "stakeholder";
  method: "email" | "portal" | "other";
}

interface Props {
  open: boolean;
  onClose: () => void;
  suggestion: Suggestion;
  onConfirm: (payload: NoticeConfirmPayload) => void;
}

const RECIPIENT_OPTIONS = [
  { value: "field" as const, label: "Field" },
  { value: "pm" as const, label: "PM" },
  { value: "stakeholder" as const, label: "Stakeholder" },
];

const METHOD_OPTIONS = [
  { value: "email" as const, label: "Email" },
  { value: "portal" as const, label: "Portal" },
  { value: "other" as const, label: "Other" },
];

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ConfirmNoticeClockModal({
  open,
  onClose,
  suggestion,
  onConfirm,
}: Props) {
  const clauseCitations = suggestion.citations.filter((c) => c.chunkRef);
  const defaultClause = clauseCitations[0]?.chunkRef ?? "";
  const startDefault = toLocalDatetime(suggestion.createdAt);

  // Estimate deadline: 48h from start as default notice window
  const deadlineDate = new Date(suggestion.createdAt);
  deadlineDate.setHours(deadlineDate.getHours() + 48);
  const deadlineDefault = toLocalDatetime(deadlineDate.toISOString());

  const [clauseRef, setClauseRef] = useState(defaultClause);
  const [startTime, setStartTime] = useState(startDefault);
  const [deadline, setDeadline] = useState(deadlineDefault);
  const [recipientGroup, setRecipientGroup] = useState<NoticeConfirmPayload["recipientGroup"]>("pm");
  const [method, setMethod] = useState<NoticeConfirmPayload["method"]>("email");

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden"
          style={{ borderTopWidth: 3, borderTopColor: "var(--color-semantic-yellow)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[var(--color-semantic-yellow)]" />
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Confirm Notice Clock
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Suggestion context */}
          <div className="px-4 pb-3">
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {suggestion.headline} — {suggestion.detail.slice(0, 120)}
              {suggestion.detail.length > 120 ? "..." : ""}
            </p>
          </div>

          {/* Fields */}
          <div className="px-4 space-y-3 pb-4">
            {/* Clause */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Clause Reference
              </label>
              {clauseCitations.length > 0 ? (
                <select
                  value={clauseRef}
                  onChange={(e) => setClauseRef(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  {clauseCitations.map((c, i) => (
                    <option key={i} value={c.chunkRef!}>
                      {c.chunkRef} — {c.excerpt.slice(0, 40)}...
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={clauseRef}
                  onChange={(e) => setClauseRef(e.target.value)}
                  placeholder="e.g. §7.3.1"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Clock Start
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Notice Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {/* Recipient Group */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1.5">
                Recipient Group
              </label>
              <div className="flex gap-2">
                {RECIPIENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRecipientGroup(opt.value)}
                    className="px-3 py-1 rounded-[var(--radius-pill)] text-xs font-semibold transition-colors cursor-pointer"
                    style={{
                      backgroundColor:
                        recipientGroup === opt.value
                          ? "var(--color-accent-dim)"
                          : "var(--color-surface)",
                      color:
                        recipientGroup === opt.value
                          ? "var(--color-accent)"
                          : "var(--color-text-dim)",
                      border: `1px solid ${recipientGroup === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Method */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1.5">
                Delivery Method
              </label>
              <div className="flex gap-2">
                {METHOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMethod(opt.value)}
                    className="px-3 py-1 rounded-[var(--radius-pill)] text-xs font-semibold transition-colors cursor-pointer"
                    style={{
                      backgroundColor:
                        method === opt.value
                          ? "var(--color-accent-dim)"
                          : "var(--color-surface)",
                      color:
                        method === opt.value
                          ? "var(--color-accent)"
                          : "var(--color-text-dim)",
                      border: `1px solid ${method === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--color-border)]">
            <button
              onClick={onClose}
              className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] px-3 py-1.5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onConfirm({ clauseRef, startTime, deadline, recipientGroup, method })
              }
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--color-semantic-green-dim)",
                color: "var(--color-semantic-green)",
              }}
            >
              <Clock size={11} />
              Confirm &amp; Start Clock
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
