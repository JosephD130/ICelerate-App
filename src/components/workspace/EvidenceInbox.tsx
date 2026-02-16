"use client";

import { useState, useMemo } from "react";
import { Inbox, Mail, HardHat, Upload, FileText, Check, X, Eye, AlertTriangle, DollarSign, Clock, ChevronDown, ChevronRight } from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import { useMemory } from "@/lib/contexts/memory-context";
import { useRole } from "@/lib/contexts/role-context";
import { useEvents } from "@/lib/contexts/event-context";
import { getRoleUiPolicy } from "@/lib/ui/risk-register-role";
import { T } from "@/lib/terminology";
import type { EvidenceItem, EvidenceSourceType } from "@/lib/memory/types";
import type { DecisionEvent } from "@/lib/models/decision-event";
import EvidenceDrawer from "./EvidenceDrawer";

const SOURCE_ICONS: Record<EvidenceSourceType, typeof Mail> = {
  gmail: Mail,
  procore: HardHat,
  upload: Upload,
  field: FileText,
};

const SOURCE_LABELS: Record<EvidenceSourceType, string> = {
  gmail: "Email",
  procore: "Procore",
  upload: "File Upload",
  field: "Field Capture",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function EvidenceRow({
  item,
  onPreview,
  onApprove,
  onReject,
  canApprove,
  canReject,
  isApproved,
  linkedEvent,
}: {
  item: EvidenceItem;
  onPreview: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  canApprove: boolean;
  canReject: boolean;
  isApproved?: boolean;
  linkedEvent?: DecisionEvent | null;
}) {
  const Icon = SOURCE_ICONS[item.sourceType];
  const { extractedSignals: signals } = item;
  const preview = item.rawContentPreview.length > 90
    ? item.rawContentPreview.slice(0, 90) + "…"
    : item.rawContentPreview;

  return (
    <div
      onClick={onPreview}
      className={`bg-[var(--color-card)] border rounded-[var(--radius-card)] px-4 py-3 cursor-pointer transition-all ${
        isApproved
          ? "border-[var(--color-semantic-green)]/20"
          : "border-[var(--color-border)] hover:border-[var(--color-accent)]/30"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Source icon */}
        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[var(--color-text-muted)]" />
        </div>

        {/* Title + source label */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-1">
            {item.sourceLabel}
          </div>
          <div className="text-xs text-[var(--color-text-dim)] font-data mt-0.5">
            {SOURCE_LABELS[item.sourceType]}
            {linkedEvent && (
              <span className="ml-2 text-[var(--color-text-muted)]">
                → {linkedEvent.friendlyLabel ?? linkedEvent.title}
              </span>
            )}
            {isApproved && item.reviewedAt && (
              <span className="ml-2 text-[var(--color-semantic-green)]">
                Approved {relativeTime(item.reviewedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Impact badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {signals.noticeRisk && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-semantic-red-dim)] text-[var(--color-semantic-red)]">
              <AlertTriangle size={10} /> Notice
            </span>
          )}
          {signals.costDelta !== undefined && signals.costDelta > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-semantic-yellow-dim)] text-[var(--color-semantic-yellow)]">
              <DollarSign size={10} /> ${(signals.costDelta / 1000).toFixed(0)}K
            </span>
          )}
          {signals.scheduleDelta !== undefined && signals.scheduleDelta > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-semantic-blue-dim)] text-[var(--color-semantic-blue)]">
              <Clock size={10} /> {signals.scheduleDelta}d
            </span>
          )}
        </div>

        {/* Confidence */}
        <span
          className="text-xs font-data font-semibold shrink-0"
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

        {/* Status badge (approved items) */}
        {isApproved && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-semantic-green-dim)] text-[var(--color-semantic-green)]">
            <Check size={10} /> Approved
          </span>
        )}

        {/* Actions (pending items only) */}
        {!isApproved && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              title="Preview"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-all"
            >
              <Eye size={14} />
            </button>
            {canApprove && (
              <button
                onClick={(e) => { e.stopPropagation(); onApprove?.(); }}
                title="Approve"
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-semantic-green)] hover:bg-[var(--color-semantic-green-dim)] transition-all"
              >
                <Check size={14} />
              </button>
            )}
            {canReject && (
              <button
                onClick={(e) => { e.stopPropagation(); onReject?.(); }}
                title="Reject"
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] hover:bg-[var(--color-semantic-red-dim)] transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content preview + clause refs */}
      <div className="mt-2 ml-11">
        <p className="text-xs text-[var(--color-text-dim)] line-clamp-2 leading-relaxed">
          {preview}
        </p>
        {signals.clauseRefs && signals.clauseRefs.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {signals.clauseRefs.map((ref) => (
              <span
                key={ref}
                className="px-1.5 py-0.5 rounded-full text-[9px] font-data font-semibold bg-[var(--color-semantic-blue-dim)] text-[var(--color-semantic-blue)]"
              >
                {ref}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvidenceInbox() {
  const { pendingEvidence, evidence, approveEvidence, rejectEvidence } = useMemory();
  const { role } = useRole();
  const { events } = useEvents();
  const policy = useMemo(() => getRoleUiPolicy(role), [role]);
  const [drawerItem, setDrawerItem] = useState<EvidenceItem | null>(null);
  const [showApproved, setShowApproved] = useState(false);
  const [collapsed, setCollapsed] = useState(policy.evidence.collapsed ?? false);

  const eventMap = useMemo(() => {
    const map = new Map<string, DecisionEvent>();
    for (const e of events) map.set(e.id, e);
    return map;
  }, [events]);

  const approvedEvidence = useMemo(
    () => evidence.filter((e) => e.status === "approved"),
    [evidence],
  );

  // Role-based evidence source filtering
  const filteredPending = useMemo(() => {
    if (policy.evidence.visibleSourceTypes === "all") return pendingEvidence;
    return pendingEvidence.filter((e) => (policy.evidence.visibleSourceTypes as string[]).includes(e.sourceType));
  }, [pendingEvidence, policy]);

  const filteredApproved = useMemo(() => {
    if (policy.evidence.visibleSourceTypes === "all") return approvedEvidence;
    return approvedEvidence.filter((e) => (policy.evidence.visibleSourceTypes as string[]).includes(e.sourceType));
  }, [approvedEvidence, policy]);

  if (filteredPending.length === 0 && filteredApproved.length === 0) {
    return (
      <div className="mb-6">
        <SectionTitle icon={<Inbox size={12} />}>{T.EVIDENCE_INBOX}</SectionTitle>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 text-center mt-2">
          <Inbox size={24} className="mx-auto mb-2 text-[var(--color-text-dim)] opacity-40" />
          <p className="text-sm text-[var(--color-text-dim)]">
            No pending evidence — all signals reviewed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Collapsible header */}
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <Inbox size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
          {T.EVIDENCE_INBOX}
        </span>
        {filteredPending.length > 0 && (
          <span className="text-xs font-data leading-none px-2 py-0.5 rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
            {filteredPending.length}
          </span>
        )}
      </div>

      {/* Collapsed summary */}
      {collapsed && (
        <p className="text-xs text-[var(--color-text-dim)] ml-6 mb-2">
          {filteredPending.length} item{filteredPending.length !== 1 ? "s" : ""} pending review
        </p>
      )}

      {/* Expanded content */}
      {!collapsed && (
        <>
          {/* Pending items */}
          {filteredPending.length > 0 ? (
            <div className="space-y-2">
              {filteredPending.map((item) => (
                <EvidenceRow
                  key={item.id}
                  item={item}
                  onPreview={() => setDrawerItem(item)}
                  onApprove={() => approveEvidence(item.id, item.linkedRiskItemId)}
                  onReject={() => rejectEvidence(item.id)}
                  canApprove={policy.evidence.canApprove}
                  canReject={policy.evidence.canReject}
                  linkedEvent={item.linkedRiskItemId ? eventMap.get(item.linkedRiskItemId) : null}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 text-center mb-2">
              <p className="text-sm text-[var(--color-text-dim)]">
                No pending evidence — all signals reviewed
              </p>
            </div>
          )}

          {/* Recently Approved */}
          {filteredApproved.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowApproved(!showApproved)}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer mb-2"
              >
                {showApproved ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Recently Approved
                <span className="font-data px-1.5 py-0.5 rounded-full bg-[var(--color-semantic-green-dim)] text-[var(--color-semantic-green)]">
                  {filteredApproved.length}
                </span>
              </button>
              {showApproved && (
                <div className="space-y-2">
                  {filteredApproved.map((item) => (
                    <EvidenceRow
                      key={item.id}
                      item={item}
                      onPreview={() => setDrawerItem(item)}
                      canApprove={false}
                      canReject={false}
                      isApproved
                      linkedEvent={item.linkedRiskItemId ? eventMap.get(item.linkedRiskItemId) : null}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Evidence Drawer — always rendered so it can open from collapsed state too */}
      <EvidenceDrawer
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
        onApprove={(id, linkedId) => {
          approveEvidence(id, linkedId);
          setDrawerItem(null);
        }}
        onReject={(id) => {
          rejectEvidence(id);
          setDrawerItem(null);
        }}
      />
    </div>
  );
}
