"use client";

import { useState } from "react";
import { Mail, HardHat, Upload, FileText, Check, Clock, AlertTriangle, DollarSign, ArrowRight, Eye } from "lucide-react";
import Link from "next/link";
import SectionTitle from "@/components/shared/SectionTitle";
import AttachmentChip from "@/components/events/modes/AttachmentChip";
import EvidenceDrawer from "@/components/workspace/EvidenceDrawer";
import { useEvents } from "@/lib/contexts/event-context";
import { useMemory } from "@/lib/contexts/memory-context";
import { useRole } from "@/lib/contexts/role-context";
import { getRoleUiPolicy } from "@/lib/ui/risk-register-role";
import type { EvidenceItem, EvidenceSourceType } from "@/lib/memory/types";

const SOURCE_ICONS: Record<EvidenceSourceType, typeof Mail> = {
  gmail: Mail,
  procore: HardHat,
  upload: Upload,
  field: FileText,
};

export default function EvidenceMode() {
  const { activeEvent } = useEvents();
  const { evidence, approveEvidence } = useMemory();
  const { role } = useRole();
  const policy = getRoleUiPolicy(role);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  if (!activeEvent) return null;

  const linkedEvidence = evidence.filter((e) => {
    if (e.linkedRiskItemId !== activeEvent.id || e.status !== "approved") return false;
    if (policy.evidence.visibleSourceTypes === "all") return true;
    return (policy.evidence.visibleSourceTypes as string[]).includes(e.sourceType);
  });
  const pendingCount = evidence.filter((e) => {
    if (e.status !== "pending") return false;
    if (policy.evidence.visibleSourceTypes === "all") return true;
    return (policy.evidence.visibleSourceTypes as string[]).includes(e.sourceType);
  }).length;

  return (
    <div className="mt-4 space-y-6">
      {/* Approved evidence */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle icon={<Check size={12} />}>Approved Evidence</SectionTitle>
          <span className="text-xs font-data text-[var(--color-text-dim)]">
            {linkedEvidence.length} item{linkedEvidence.length !== 1 ? "s" : ""}
          </span>
        </div>

        {linkedEvidence.length === 0 ? (
          <div className="bg-[var(--color-card)] border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)] p-8 text-center">
            <FileText size={24} className="mx-auto mb-2 text-[var(--color-text-dim)] opacity-40" />
            <p className="text-sm text-[var(--color-text-dim)]">
              No evidence linked to this risk item yet.
            </p>
            <p className="text-xs text-[var(--color-text-dim)] mt-1">
              Approve evidence from the Evidence Inbox to link it here.
            </p>
            {pendingCount > 0 && (
              <p className="text-xs font-data text-[var(--color-semantic-yellow)] mt-2">
                {pendingCount} item{pendingCount !== 1 ? "s" : ""} pending review in Evidence Inbox
              </p>
            )}
            <Link href="/workspace">
              <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all cursor-pointer">
                Review Evidence Inbox <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {linkedEvidence.map((evi) => {
              const Icon = SOURCE_ICONS[evi.sourceType];
              const signals = evi.extractedSignals;

              return (
                <button
                  type="button"
                  key={evi.id}
                  onClick={() => setSelectedEvidence(evi)}
                  className="w-full text-left bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 hover:border-[var(--color-accent)]/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} className="text-[var(--color-text-muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                        {evi.sourceLabel}
                        {evi.attachmentUrl && (
                          <Eye size={12} className="text-[var(--color-text-dim)]" />
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-text-dim)] font-data mt-0.5">
                        {evi.sourceType.toUpperCase()} · Approved {evi.reviewedAt ? new Date(evi.reviewedAt).toLocaleDateString() : ""}
                      </div>

                      {/* Signals row */}
                      <div className="flex items-center gap-2 mt-2">
                        {signals.noticeRisk && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-semantic-red-dim)] text-[var(--color-semantic-red)]">
                            <AlertTriangle size={10} /> Notice Risk
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
                        {signals.clauseRefs && signals.clauseRefs.length > 0 && (
                          signals.clauseRefs.map((ref) => (
                            <span key={ref} className="px-1.5 py-0.5 rounded-full text-[10px] font-data bg-[var(--color-semantic-blue-dim)] text-[var(--color-semantic-blue)]">
                              {ref}
                            </span>
                          ))
                        )}
                        <span
                          className="ml-auto text-xs font-data font-semibold"
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

                      {/* Preview */}
                      <div className="mt-2 text-xs text-[var(--color-text-dim)] line-clamp-2">
                        {evi.rawContentPreview}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Attachments (existing) */}
      {activeEvent.attachments.length > 0 && (
        <div>
          <SectionTitle>Attachments</SectionTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {activeEvent.attachments.map((att) => (
              <AttachmentChip key={att.id} attachment={att} />
            ))}
          </div>
        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        item={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        onApprove={(id) => { approveEvidence(id, activeEvent.id); setSelectedEvidence(null); }}
        onReject={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
