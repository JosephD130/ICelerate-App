"use client";

import { useState } from "react";
import {
  CheckCircle,
  PenLine,
  X,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  FileText,
  Activity,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Suggestion } from "@/lib/memory/types";
import type { DecisionEvent } from "@/lib/models/decision-event";
import TrustBadge, { computeTrustStatus } from "@/components/trust/TrustBadge";
import EditSuggestionDrawer from "@/components/suggestions/EditSuggestionDrawer";
import ConfirmNoticeClockModal from "@/components/notice/ConfirmNoticeClockModal";
import CalibrationBadge from "@/components/calibration/CalibrationBadge";

const TYPE_ICON: Record<string, typeof AlertTriangle> = {
  notice_risk: Clock,
  cost_revision: DollarSign,
  stakeholder_action: Users,
  alignment_change: AlertTriangle,
  contract_reference: FileText,
  schedule_revision: Calendar,
  new_event: Activity,
  field_observation: Eye,
};

const IMPACT_BORDER: Record<string, string> = {
  high: "border-l-red-600",
  medium: "border-l-yellow-500",
  low: "border-l-slate-400",
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (id: string) => void;
  onEditStructured: (id: string, overrides: NonNullable<Suggestion["editorOverrides"]>) => void;
  onReject: (id: string) => void;
  events: DecisionEvent[];
  allowAccept?: boolean;
  allowEdit?: boolean;
  allowReject?: boolean;
}

export default function SuggestionCard({
  suggestion,
  onAccept,
  onEditStructured,
  onReject,
  events,
  allowAccept = true,
  allowEdit = true,
  allowReject = true,
}: SuggestionCardProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  const Icon = TYPE_ICON[suggestion.type] ?? AlertTriangle;
  const borderClass = IMPACT_BORDER[suggestion.impact] ?? IMPACT_BORDER.medium;
  const isPending = suggestion.status === "pending";
  const isEdited = suggestion.status === "edited";
  const trust = computeTrustStatus(suggestion);

  // Reasoning trace
  const sourceCount = new Set(suggestion.citations.map((c) => c.sourceId)).size;
  const clauseCount = suggestion.citations.filter((c) => c.chunkRef).length;

  function handleAcceptClick() {
    if (suggestion.type === "notice_risk") {
      setNoticeModalOpen(true);
    } else {
      onAccept(suggestion.id);
    }
  }

  return (
    <>
      <div
        className={`bg-[var(--color-card)] border border-[var(--color-border)] border-l-4 ${borderClass} shadow-sm rounded-[var(--radius-card)] p-5 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon size={14} className="shrink-0 text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
              {suggestion.headline}
            </span>
          </div>
          <TrustBadge status={trust.status} reason={trust.reason} size="sm" />
        </div>

        {/* Detail */}
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-1 flex-1">
          {suggestion.detail}
        </p>

        {/* Reasoning trace + freshness */}
        <p className="text-xs font-data text-[var(--color-text-dim)] mb-2">
          Derived from {sourceCount} source{sourceCount !== 1 ? "s" : ""}
          {clauseCount > 0 && <> + {clauseCount} contract clause{clauseCount !== 1 ? "s" : ""}</>}
          {suggestion.sourceFreshness && (
            <span
              className="ml-1.5"
              style={{
                color:
                  suggestion.sourceFreshness === "old"
                    ? "var(--color-semantic-red)"
                    : suggestion.sourceFreshness === "stale"
                    ? "var(--color-semantic-yellow)"
                    : "var(--color-semantic-green)",
              }}
            >
              {suggestion.sourceFreshness === "old"
                ? "Sources >7d old"
                : suggestion.sourceFreshness === "stale"
                ? "Sources 1-7d old"
                : "Fresh sources"}
            </span>
          )}
        </p>

        {/* Why / Evidence toggle */}
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] mb-2 cursor-pointer hover:underline"
        >
          {showEvidence ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          Why / Evidence / What would change
        </button>

        {showEvidence && (
          <div className="mb-2 space-y-2 pl-2 border-l-2 border-[var(--color-border)]">
            {/* Why */}
            {suggestion.rationale && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
                  Why
                </span>
                <p className="text-xs text-[var(--color-text-primary)] leading-relaxed mt-0.5">
                  {suggestion.rationale.split(". ").slice(0, 2).join(". ")}
                  {suggestion.rationale.split(". ").length > 2 ? "." : ""}
                </p>
              </div>
            )}

            {/* Evidence */}
            {suggestion.citations.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
                  Evidence
                </span>
                <div className="mt-0.5 space-y-1">
                  {suggestion.citations.slice(0, 3).map((c, i) => (
                    <div
                      key={i}
                      className="text-[10px] text-[var(--color-text-dim)] font-data pl-2"
                      style={{ borderLeft: "2px solid var(--color-border)" }}
                    >
                      {c.chunkRef && (
                        <span className="text-[var(--color-semantic-purple)] mr-1">{c.chunkRef}</span>
                      )}
                      {c.excerpt.slice(0, 120)}{c.excerpt.length > 120 ? "..." : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What would change */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
                What would change
              </span>
              <ul className="mt-0.5 space-y-0.5">
                {suggestion.suggestedChanges && Object.entries(suggestion.suggestedChanges).map(([key, val]) => {
                  if (key === "costExposure" && typeof val === "object" && val !== null && "amount" in (val as Record<string, unknown>)) {
                    return (
                      <li key={key} className="text-[10px] text-[var(--color-text-primary)]">
                        Update cost estimate to <strong>${Number((val as Record<string, unknown>).amount).toLocaleString()}</strong>
                      </li>
                    );
                  }
                  if (key === "scheduleImpact" && typeof val === "object" && val !== null && "days" in (val as Record<string, unknown>)) {
                    return (
                      <li key={key} className="text-[10px] text-[var(--color-text-primary)]">
                        Update schedule impact to <strong>{String((val as Record<string, unknown>).days)} days</strong>
                      </li>
                    );
                  }
                  if (key === "action" && typeof val === "string") {
                    return (
                      <li key={key} className="text-[10px] text-[var(--color-text-primary)]">
                        Action: <strong>{val}</strong>
                      </li>
                    );
                  }
                  if (key === "deadline" && typeof val === "string") {
                    return (
                      <li key={key} className="text-[10px] text-[var(--color-text-primary)]">
                        Deadline: <strong>{new Date(val).toLocaleDateString()}</strong>
                      </li>
                    );
                  }
                  if (key === "stakeholders" && Array.isArray(val)) {
                    return (
                      <li key={key} className="text-[10px] text-[var(--color-text-primary)]">
                        Notify: <strong>{(val as string[]).join(", ")}</strong>
                      </li>
                    );
                  }
                  if (key === "addDocRefs" && Array.isArray(val)) {
                    return (
                      <li key={key} className="text-[10px] text-[var(--color-text-primary)]">
                        Add clause: <strong>{(val as Array<Record<string, string>>).map((r) => r.clauseRef).filter(Boolean).join(", ")}</strong>
                      </li>
                    );
                  }
                  return null;
                })}
                {(!suggestion.suggestedChanges || Object.keys(suggestion.suggestedChanges).length === 0) && (
                  <li className="text-[10px] text-[var(--color-text-dim)]">No data changes — advisory only</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] bg-transparent font-medium capitalize">
            {suggestion.impact}
          </span>
          <span className="text-xs font-data text-[var(--color-text-dim)]">
            {suggestion.confidence}% confidence
          </span>
          <span className="text-xs font-data text-[var(--color-text-dim)]">
            {suggestion.citations.length} citation{suggestion.citations.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Calibration Badge */}
        <CalibrationBadge resolverRule={suggestion.type} objectType="suggestion" />

        {/* Editor overrides note (when edited) */}
        {isEdited && suggestion.editorOverrides?.note && (
          <div className="mb-3 px-2 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-semantic-yellow-dim)]">
            <span className="text-[10px] font-data text-[var(--color-semantic-yellow)]">
              Override note: {suggestion.editorOverrides.note}
            </span>
          </div>
        )}

        {/* "If you accept" summary */}
        {(isPending || isEdited) && suggestion.suggestedChanges && Object.keys(suggestion.suggestedChanges).length > 0 && (
          <div className="mb-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20">
            <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-accent)] block mb-1">
              If you accept
            </span>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {suggestion.type === "notice_risk" && "A notice clock will start tracking the contractual deadline. The system will alert you as the deadline approaches."}
              {suggestion.type === "cost_revision" && (suggestion.suggestedChanges.costExposure ? `The cost estimate for this risk item will be updated to $${Number((suggestion.suggestedChanges.costExposure as Record<string, number>).amount ?? 0).toLocaleString()}.` : "The cost estimate will be revised based on new evidence.")}
              {suggestion.type === "schedule_revision" && (suggestion.suggestedChanges.scheduleImpact ? `Schedule impact will be revised to ${String((suggestion.suggestedChanges.scheduleImpact as Record<string, number>).days ?? 0)} days. This may affect critical path calculations.` : "Schedule impact will be revised based on new data.")}
              {suggestion.type === "stakeholder_action" && "A stakeholder briefing will be queued and the decision package will be prepared for distribution."}
              {suggestion.type === "contract_reference" && "The referenced clause will be added to the risk item\u2019s document references for traceability."}
            </p>
          </div>
        )}

        {/* Actions */}
        {(isPending || isEdited) && (allowAccept || allowEdit || allowReject) && (
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
            {allowAccept && (
              <button
                onClick={handleAcceptClick}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] transition-colors cursor-pointer"
              >
                <CheckCircle size={12} /> Accept
              </button>
            )}
            {allowEdit && (
              <button
                onClick={() => setEditDrawerOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                <PenLine size={12} /> Edit
              </button>
            )}
            {allowReject && (
              <button
                onClick={() => onReject(suggestion.id)}
                className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors ml-auto cursor-pointer"
              >
                <X size={12} /> Reject
              </button>
            )}
          </div>
        )}
        {/* Read-only footer when no actions allowed */}
        {(isPending || isEdited) && !allowAccept && !allowEdit && !allowReject && (
          <div className="pt-3 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-dim)]">
              Read-only — actions available in PM role
            </span>
          </div>
        )}

        {/* Non-pending, non-edited status */}
        {suggestion.status === "accepted" && (
          <div className="pt-3 border-t border-[var(--color-border)]">
            <span className="text-xs font-data text-[var(--color-semantic-green)]">
              Accepted{suggestion.reviewedAt ? ` on ${new Date(suggestion.reviewedAt).toLocaleDateString()}` : ""}
            </span>
          </div>
        )}
        {suggestion.status === "rejected" && (
          <div className="pt-3 border-t border-[var(--color-border)]">
            <span className="text-xs font-data text-[var(--color-text-dim)]">
              Rejected{suggestion.reviewedAt ? ` on ${new Date(suggestion.reviewedAt).toLocaleDateString()}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      <EditSuggestionDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        suggestion={suggestion}
        events={events}
        onSave={(overrides) => onEditStructured(suggestion.id, overrides)}
        onAccept={onAccept}
      />

      {/* Notice Clock Modal */}
      {suggestion.type === "notice_risk" && (
        <ConfirmNoticeClockModal
          open={noticeModalOpen}
          onClose={() => setNoticeModalOpen(false)}
          suggestion={suggestion}
          onConfirm={() => {
            setNoticeModalOpen(false);
            onAccept(suggestion.id);
          }}
        />
      )}
    </>
  );
}
