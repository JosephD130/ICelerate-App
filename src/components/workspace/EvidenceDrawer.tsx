"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, Sparkles, BarChart3, FileText, AlertTriangle, DollarSign, Clock, Check, Ban, Link2, Database, PenLine, Eye, ExternalLink, Download } from "lucide-react";
import type { EvidenceItem } from "@/lib/memory/types";
import { useEvents } from "@/lib/contexts/event-context";
import { useStream } from "@/lib/hooks/use-stream";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import CalibrationBadge from "@/components/calibration/CalibrationBadge";

type DrawerTab = "analysis" | "signals" | "details" | "document";

interface Props {
  item: EvidenceItem | null;
  onClose: () => void;
  onApprove: (id: string, linkedRiskItemId?: string) => void;
  onReject: (id: string) => void;
}

const BASE_TABS: { id: DrawerTab; label: string; icon: typeof Sparkles }[] = [
  { id: "analysis", label: "AI Analysis", icon: Sparkles },
  { id: "signals", label: "Signals", icon: BarChart3 },
  { id: "details", label: "Details", icon: FileText },
];

export default function EvidenceDrawer({ item, onClose, onApprove, onReject }: Props) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("analysis");
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState<string | null>(null);
  const { events } = useEvents();
  const prevItemIdRef = useRef<string | null>(null);

  const linkedEvent = item?.linkedRiskItemId
    ? events.find((e) => e.id === item.linkedRiskItemId)
    : null;

  const hasAttachment = !!item?.attachmentUrl;
  const TAB_CONFIG = useMemo(() => {
    const tabs = [...BASE_TABS];
    if (hasAttachment) {
      tabs.push({ id: "document", label: "Document", icon: Eye });
    }
    return tabs;
  }, [hasAttachment]);

  const { text, isStreaming, error, send, reset } = useStream({
    tool: "evidence-analysis",
    context: {
      toolSpecific: {
        evidence: item ? {
          sourceLabel: item.sourceLabel,
          sourceType: item.sourceType,
          rawContentPreview: item.rawContentPreview,
          extractedSignals: item.extractedSignals,
        } : undefined,
        linkedEvent: linkedEvent ? {
          title: linkedEvent.title,
          status: linkedEvent.status,
          severity: linkedEvent.severity,
          costImpact: linkedEvent.costImpact,
          scheduleImpact: linkedEvent.scheduleImpact,
        } : undefined,
      },
    },
  });

  // Auto-trigger analysis when a new item is opened
  useEffect(() => {
    if (item && item.id !== prevItemIdRef.current) {
      prevItemIdRef.current = item.id;
      setActiveTab("analysis");
      setIsEditing(false);
      setEditedAnalysis(null);
      reset();

      // Build the user message with evidence content
      const message = `Analyze this evidence item for approval:\n\nSource: ${item.sourceLabel} (${item.sourceType})\n\nContent:\n${item.rawContentPreview}\n\nExtracted Signals:\n- Notice Risk: ${item.extractedSignals.noticeRisk ? "Yes" : "No"}\n- Cost Delta: $${item.extractedSignals.costDelta ?? 0}\n- Schedule Delta: ${item.extractedSignals.scheduleDelta ?? 0} days\n- Confidence: ${item.extractedSignals.confidenceScore}%\n- Clause Refs: ${item.extractedSignals.clauseRefs?.join(", ") ?? "None"}`;

      // Small delay to let reset complete
      setTimeout(() => {
        send([{ role: "user", content: message }]);
      }, 50);
    }
  }, [item, send, reset]);

  // Clean up on close
  useEffect(() => {
    if (!item) {
      prevItemIdRef.current = null;
      reset();
    }
  }, [item, reset]);

  if (!item) return null;

  const signals = item.extractedSignals;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[560px] bg-[var(--color-bg)] border-l border-[var(--color-border)] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] line-clamp-1">
              {item.sourceLabel}
            </h2>
            <p className="text-xs text-[var(--color-text-dim)] font-data mt-0.5">
              {item.sourceType.toUpperCase()} · {new Date(item.createdAt).toLocaleDateString()}
              {linkedEvent && (
                <span className="ml-2 text-[var(--color-text-muted)]">
                  → {linkedEvent.friendlyLabel ?? linkedEvent.title}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--color-border)] px-5">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                    : "border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* AI Analysis Tab */}
          {activeTab === "analysis" && (
            <div className="space-y-4">
              {/* Original evidence content */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-2">
                  Source Content
                </h3>
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 text-xs text-[var(--color-text-secondary)] font-data leading-relaxed max-h-[120px] overflow-y-auto">
                  {item.rawContentPreview}
                </div>
              </div>

              {/* AI Analysis */}
              <div>
                {error && (
                  <div className="bg-[var(--color-semantic-red-dim)] border border-[var(--color-semantic-red)]/20 rounded-[var(--radius-sm)] p-3 mb-4">
                    <p className="text-sm text-[var(--color-semantic-red)]">
                      {error}. Check your API key configuration.
                    </p>
                  </div>
                )}
                {!text && !isStreaming && !error && (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-dim)]">
                    <Sparkles size={14} className="animate-pulse text-[var(--color-accent)]" />
                    Initializing analysis...
                  </div>
                )}
                {(text || isStreaming) && (
                  isEditing ? (
                    <textarea
                      value={editedAnalysis ?? text}
                      onChange={(e) => setEditedAnalysis(e.target.value)}
                      className="w-full min-h-[200px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 text-sm text-[var(--color-text-primary)] font-mono leading-relaxed focus:border-[var(--color-accent)] focus:outline-none resize-y"
                    />
                  ) : (
                    <ReasoningOutput
                      text={editedAnalysis ?? text}
                      isStreaming={isStreaming}
                      variant="reasoning-engine"
                    />
                  )
                )}
                {text && !isStreaming && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => { if (!isEditing) setEditedAnalysis(text); setIsEditing(!isEditing); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
                    >
                      <PenLine size={10} />
                      {isEditing ? "Preview" : "Edit"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signals Tab */}
          {activeTab === "signals" && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                Extracted Signals
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Notice Risk */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className="text-[var(--color-text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">Notice Risk</span>
                  </div>
                  <span className={`text-sm font-semibold ${signals.noticeRisk ? "text-[var(--color-semantic-red)]" : "text-[var(--color-text-dim)]"}`}>
                    {signals.noticeRisk ? "Yes" : "No"}
                  </span>
                </div>

                {/* Cost Delta */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={12} className="text-[var(--color-text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">Cost Delta</span>
                  </div>
                  <span className="text-sm font-semibold font-data text-[var(--color-text-primary)]">
                    {signals.costDelta !== undefined ? `$${signals.costDelta.toLocaleString()}` : "—"}
                  </span>
                </div>

                {/* Schedule Delta */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-[var(--color-text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">Schedule Delta</span>
                  </div>
                  <span className="text-sm font-semibold font-data text-[var(--color-text-primary)]">
                    {signals.scheduleDelta !== undefined ? `${signals.scheduleDelta} days` : "—"}
                  </span>
                </div>

                {/* Confidence */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={12} className="text-[var(--color-text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">Confidence</span>
                  </div>
                  <span
                    className="text-sm font-semibold font-data"
                    style={{
                      color: signals.confidenceScore >= 85
                        ? "var(--color-semantic-green)"
                        : signals.confidenceScore >= 70
                        ? "var(--color-semantic-yellow)"
                        : "var(--color-semantic-red)",
                    }}
                  >
                    {signals.confidenceScore}%
                  </span>
                </div>
              </div>

              {/* Clause Refs */}
              {signals.clauseRefs && signals.clauseRefs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">Clause References</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {signals.clauseRefs.map((ref) => (
                      <span
                        key={ref}
                        className="px-2 py-0.5 rounded-full text-xs font-data bg-[var(--color-semantic-blue-dim)] text-[var(--color-semantic-blue)]"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Calibration Badge */}
              <CalibrationBadge objectType="evidence" />
            </div>
          )}

          {/* Document Tab */}
          {activeTab === "document" && item?.attachmentUrl && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Actions */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-data text-[var(--color-text-dim)] flex-1 truncate">
                  {item.attachmentName ?? "Document"}
                </span>
                <a
                  href={item.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
                >
                  <ExternalLink size={10} /> Open in new tab
                </a>
                <a
                  href={item.attachmentUrl}
                  download={item.attachmentName}
                  className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
                >
                  <Download size={10} /> Download
                </a>
              </div>

              {/* Viewer */}
              <div className="flex-1 min-h-[400px] rounded-[var(--radius-sm)] overflow-hidden border border-[var(--color-border)]">
                {item.attachmentType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.attachmentUrl}
                    alt={item.attachmentName ?? "Attachment"}
                    className="w-full h-full object-contain bg-[var(--color-surface)]"
                  />
                ) : (
                  <iframe
                    src={item.attachmentUrl}
                    title={item.attachmentName ?? "Document viewer"}
                    className="w-full h-full bg-white"
                    style={{ minHeight: 400 }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Details Tab (merged: raw content + linked item + memory impact) */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Raw Content */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-3">
                  Raw Content
                </h3>
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-4 text-sm text-[var(--color-text-primary)] font-data whitespace-pre-wrap leading-relaxed">
                  {item.rawContentPreview}
                </div>
              </div>

              {/* Linked Risk Item */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-3">
                  Linked Risk Item
                </h3>
                {linkedEvent ? (
                  <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">{linkedEvent.title}</div>
                    <div className="text-xs text-[var(--color-text-dim)] font-data mt-1">
                      {linkedEvent.friendlyLabel ?? linkedEvent.id} · {linkedEvent.status} · {linkedEvent.severity}
                    </div>
                    {linkedEvent.costImpact && (
                      <div className="text-xs font-data text-[var(--color-text-muted)] mt-2">
                        Cost: ${linkedEvent.costImpact.estimated.toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)] p-4 text-center">
                    <Link2 size={16} className="mx-auto mb-1.5 text-[var(--color-text-dim)] opacity-40" />
                    <p className="text-xs text-[var(--color-text-dim)]">
                      No linked risk item. Approving will create a draft.
                    </p>
                  </div>
                )}
              </div>

              {/* Memory Impact */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-3">
                  Memory Impact (if approved)
                </h3>
                <div className="space-y-2">
                  <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 flex items-start gap-2">
                    <Database size={14} className="text-[var(--color-semantic-green)] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-text-primary)]">Short-Term Memory</div>
                      <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
                        Signals saved to project snapshot. KPIs updated.
                      </div>
                    </div>
                  </div>
                  {signals.costDelta !== undefined && signals.costDelta > 0 && (
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 flex items-start gap-2">
                      <DollarSign size={14} className="text-[var(--color-semantic-yellow)] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-[var(--color-text-primary)]">Cost Exposure</div>
                        <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
                          Total exposure increases by ${signals.costDelta.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {signals.scheduleDelta !== undefined && signals.scheduleDelta > 0 && (
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 flex items-start gap-2">
                      <Clock size={14} className="text-[var(--color-semantic-blue)] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-[var(--color-text-primary)]">Schedule Impact</div>
                        <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
                          Schedule impact increases by {signals.scheduleDelta} days
                        </div>
                      </div>
                    </div>
                  )}
                  {signals.noticeRisk && (
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-[var(--color-semantic-red)] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-[var(--color-text-primary)]">Notice Risk</div>
                        <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
                          Suggestion resolver will flag notice deadline
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-[var(--color-border)] px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => onApprove(item.id, item.linkedRiskItemId)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-semantic-green)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Check size={14} />
            Approve Evidence
          </button>
          <button
            onClick={() => onReject(item.id)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-input)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-semantic-red)] hover:text-[var(--color-semantic-red)] transition-colors"
          >
            <Ban size={14} />
            Reject
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-[var(--radius-input)] text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
