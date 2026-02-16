"use client";

import { useState } from "react";
import { X, Save, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { Suggestion } from "@/lib/memory/types";
import type { DecisionEvent } from "@/lib/models/decision-event";
import { SUGGESTION_ACTIONS } from "@/lib/suggestion-actions";

interface Props {
  open: boolean;
  onClose: () => void;
  suggestion: Suggestion;
  events: DecisionEvent[];
  onSave: (overrides: NonNullable<Suggestion["editorOverrides"]>) => void;
  onAccept: (id: string) => void;
}

const IMPACT_OPTIONS = ["low", "medium", "high"] as const;

const INPUT_CLASS =
  "w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)] focus:outline-none";

export default function EditSuggestionDrawer({
  open,
  onClose,
  suggestion,
  events,
  onSave,
  onAccept,
}: Props) {
  const firstClause = suggestion.citations.find((c) => c.chunkRef)?.chunkRef ?? "";
  const config = SUGGESTION_ACTIONS[suggestion.type];
  const fields = new Set(config.relevantFields);

  const [showEvidence, setShowEvidence] = useState(false);

  const sourceCount = new Set(suggestion.citations.map((c) => c.sourceId)).size;
  const clauseCount = suggestion.citations.filter((c) => c.chunkRef).length;

  const [headline, setHeadline] = useState(
    suggestion.editorOverrides?.headline ?? suggestion.headline,
  );
  const [linkedEventId, setLinkedEventId] = useState(
    suggestion.editorOverrides?.linkedEventId ?? suggestion.eventId ?? "",
  );
  const [impact, setImpact] = useState<"high" | "medium" | "low">(
    suggestion.editorOverrides?.impact ?? suggestion.impact,
  );
  const [costLow, setCostLow] = useState<string>(
    suggestion.editorOverrides?.costLow?.toString() ?? "",
  );
  const [costHigh, setCostHigh] = useState<string>(
    suggestion.editorOverrides?.costHigh?.toString() ?? "",
  );
  const [scheduleDays, setScheduleDays] = useState<string>(
    suggestion.editorOverrides?.scheduleDays?.toString() ?? "",
  );
  const [clauseRef, setClauseRef] = useState(
    suggestion.editorOverrides?.clauseRef ?? firstClause,
  );
  const [deadline, setDeadline] = useState(
    suggestion.editorOverrides?.deadline ?? "",
  );
  const [note, setNote] = useState(suggestion.editorOverrides?.note ?? "");

  function buildOverrides(): NonNullable<Suggestion["editorOverrides"]> {
    const overrides: NonNullable<Suggestion["editorOverrides"]> = {};
    if (headline !== suggestion.headline) overrides.headline = headline;
    if (linkedEventId) overrides.linkedEventId = linkedEventId;
    if (impact !== suggestion.impact) overrides.impact = impact;
    if (costLow) overrides.costLow = Number(costLow);
    if (costHigh) overrides.costHigh = Number(costHigh);
    if (scheduleDays) overrides.scheduleDays = Number(scheduleDays);
    if (clauseRef) overrides.clauseRef = clauseRef;
    if (deadline) overrides.deadline = deadline;
    if (note) overrides.note = note;
    return overrides;
  }

  function handleSave() {
    onSave(buildOverrides());
    onClose();
  }

  function handleAcceptAndGenerate() {
    onSave(buildOverrides());
    onAccept(suggestion.id);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] z-50 bg-[var(--color-card)] border-l border-[var(--color-border)] flex flex-col transition-transform duration-200 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              Edit Suggestion
            </span>
            <p className="text-sm text-[var(--color-text-primary)] mt-0.5 leading-tight truncate max-w-[300px]">
              {suggestion.headline}
            </p>
            <span
              className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--color-accent-dim)",
                color: "var(--color-accent)",
              }}
            >
              {config.actionLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body: context + fields */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ── Context Section ── */}
          {/* Detail */}
          {suggestion.detail && (
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              {suggestion.detail}
            </p>
          )}

          {/* Reasoning trace */}
          <p className="text-xs font-data text-[var(--color-text-dim)]">
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

          {/* Why / Evidence / What would change toggle */}
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] cursor-pointer hover:underline"
          >
            {showEvidence ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            Why / Evidence / What would change
          </button>

          {showEvidence && (
            <div className="space-y-2 pl-2 border-l-2 border-[var(--color-border)]">
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

          {/* "If you accept" summary */}
          {suggestion.suggestedChanges && Object.keys(suggestion.suggestedChanges).length > 0 && (
            <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20">
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

          {/* ── Divider between context and edit fields ── */}
          <div className="border-t border-[var(--color-border)] pt-2">
            <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              Override Fields
            </span>
          </div>

          {/* Headline — always shown */}
          {fields.has("headline") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          )}

          {/* Link to Event */}
          {fields.has("linkedEventId") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Link to Risk Item
              </label>
              <select
                value={linkedEventId}
                onChange={(e) => setLinkedEventId(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">None</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Impact */}
          {fields.has("impact") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Impact Level
              </label>
              <div className="flex gap-2">
                {IMPACT_OPTIONS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setImpact(level)}
                    className={`flex-1 text-center py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all border cursor-pointer capitalize ${
                      impact === level
                        ? level === "high"
                          ? "border-red-500 bg-red-500/15 text-red-500"
                          : level === "medium"
                          ? "border-yellow-500 bg-yellow-500/15 text-yellow-500"
                          : "border-slate-400 bg-slate-400/15 text-slate-400"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cost Override */}
          {fields.has("costLow") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Cost Override
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <span className="text-xs text-[var(--color-text-dim)] font-data">Low ($)</span>
                  <input
                    type="number"
                    value={costLow}
                    onChange={(e) => setCostLow(e.target.value)}
                    placeholder="0"
                    className={`${INPUT_CLASS} font-data`}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-[var(--color-text-dim)] font-data">High ($)</span>
                  <input
                    type="number"
                    value={costHigh}
                    onChange={(e) => setCostHigh(e.target.value)}
                    placeholder="0"
                    className={`${INPUT_CLASS} font-data`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Schedule Override */}
          {fields.has("scheduleDays") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Schedule Impact (days)
              </label>
              <input
                type="number"
                value={scheduleDays}
                onChange={(e) => setScheduleDays(e.target.value)}
                placeholder="0"
                className={`${INPUT_CLASS} font-data`}
              />
            </div>
          )}

          {/* Clause Reference */}
          {fields.has("clauseRef") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Clause Reference
              </label>
              <input
                type="text"
                value={clauseRef}
                onChange={(e) => setClauseRef(e.target.value)}
                placeholder="e.g. §7.3.1"
                className={INPUT_CLASS}
              />
            </div>
          )}

          {/* Deadline */}
          {fields.has("deadline") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Notice Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer`}
              />
            </div>
          )}

          {/* Note — always shown */}
          {fields.has("note") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-1">
                Justification / Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain why you're overriding the AI suggestion..."
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] px-3 py-1.5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
            style={{
              backgroundColor: "var(--color-semantic-yellow-dim)",
              color: "var(--color-semantic-yellow)",
            }}
          >
            <Save size={11} />
            Save Overrides
          </button>
          <button
            onClick={handleAcceptAndGenerate}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
          >
            <CheckCircle size={11} />
            Accept &amp; Generate
          </button>
        </div>
      </div>
    </>
  );
}
