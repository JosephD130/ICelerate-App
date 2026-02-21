"use client";

import { useMemo, useState } from "react";
import { DollarSign, Clock, MapPin, AlertTriangle, FileText, ArrowRight, Link2, Sparkles } from "lucide-react";
import Link from "next/link";
import SectionTitle from "@/components/shared/SectionTitle";
import LifecycleStages from "@/components/events/LifecycleStages";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import EvidenceDrawer from "@/components/workspace/EvidenceDrawer";
import { useEvents } from "@/lib/contexts/event-context";
import { useMemory } from "@/lib/contexts/memory-context";
import { useRole } from "@/lib/contexts/role-context";
import { getRoleUiPolicy } from "@/lib/ui/risk-register-role";
import { getVisibleModes } from "@/lib/models/mode-gating";
import type { LifecycleStage } from "@/lib/models/decision-event";
import type { EvidenceItem } from "@/lib/memory/types";

export default function SummaryMode() {
  const { activeEvent, updateEvent, addHistory, setActiveTab } = useEvents();
  const { evidence, approveEvidence } = useMemory();
  const { role } = useRole();
  const policy = useMemo(() => getRoleUiPolicy(role), [role]);
  const visibleModes = useMemo(
    () => (activeEvent ? getVisibleModes(activeEvent, role) : []),
    [activeEvent, role],
  );
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  if (!activeEvent) return null;

  const linkedEvidence = evidence.filter(
    (e) => e.linkedRiskItemId === activeEvent.id && e.status === "approved"
  );

  const unlinkedEvidence = evidence.filter(
    (e) => !e.linkedRiskItemId && (e.status === "pending" || e.status === "approved")
  );

  const handleAdvanceStage = (stage: LifecycleStage) => {
    updateEvent(activeEvent.id, { lifecycleStage: stage });
    addHistory(activeEvent.id, {
      action: `Lifecycle advanced to ${stage}`,
      tab: "summary",
      detail: `Stage changed from ${activeEvent.lifecycleStage} to ${stage}`,
    });
  };

  return (
    <>
    <div className="grid grid-cols-[1fr_280px] gap-6 mt-4">
      {/* Main content */}
      <div className="space-y-5">
        {/* Description */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5">
          <SectionTitle>Description</SectionTitle>
          <p className="text-sm text-[var(--color-text-primary)] mt-2 leading-relaxed">
            {activeEvent.description || "No description provided."}
          </p>
          {activeEvent.location && (
            <div className="flex items-center gap-2 mt-3 text-xs text-[var(--color-text-muted)]">
              <MapPin size={12} />
              <span className="font-data">{activeEvent.stationNumber ? `STA ${activeEvent.stationNumber}` : activeEvent.location}</span>
            </div>
          )}
        </div>

        {/* Field Analysis (if field record exists) */}
        {activeEvent.fieldRecord?.output && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[var(--color-accent)]" />
              <SectionTitle>Field Analysis</SectionTitle>
            </div>
            <ReasoningOutput
              text={activeEvent.fieldRecord.output}
              isStreaming={false}
              variant="reasoning-engine"
            />
          </div>
        )}

        {/* Impact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cost */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-[var(--color-semantic-yellow)]" />
              <SectionTitle>Cost Exposure</SectionTitle>
            </div>
            {activeEvent.costImpact ? (
              <div>
                <div className="text-2xl font-bold font-data text-[var(--color-text-primary)]">
                  ${activeEvent.costImpact.estimated.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--color-text-dim)] mt-1">
                  Confidence: {activeEvent.costImpact.confidence}
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--color-text-dim)]">Not estimated</div>
            )}
          </div>

          {/* Schedule */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-[var(--color-semantic-blue)]" />
              <SectionTitle>Schedule Impact</SectionTitle>
            </div>
            {activeEvent.scheduleImpact ? (
              <div>
                <div className="text-2xl font-bold font-data text-[var(--color-text-primary)]">
                  {activeEvent.scheduleImpact.daysAffected} days
                </div>
                <div className="text-xs text-[var(--color-text-dim)] mt-1">
                  {activeEvent.scheduleImpact.criticalPath ? "Critical path" : "Non-critical"}
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--color-text-dim)]">Not estimated</div>
            )}
          </div>
        </div>

        {/* Evidence summary */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[var(--color-text-muted)]" />
              <SectionTitle>Linked Evidence</SectionTitle>
            </div>
            <span className="text-xs font-data text-[var(--color-text-dim)]">
              {linkedEvidence.length} item{linkedEvidence.length !== 1 ? "s" : ""}
            </span>
          </div>
          {linkedEvidence.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {linkedEvidence.slice(0, 3).map((evi) => (
                <button
                  key={evi.id}
                  type="button"
                  onClick={() => setSelectedEvidence(evi)}
                  className="w-full flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors cursor-pointer text-left"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-semantic-green)] shrink-0" />
                  <span className="truncate">{evi.sourceLabel}</span>
                  {evi.attachmentUrl && (
                    <FileText size={10} className="shrink-0 text-[var(--color-text-dim)]" />
                  )}
                </button>
              ))}
              {linkedEvidence.length > 3 && (
                <div className="text-xs text-[var(--color-text-dim)]">
                  +{linkedEvidence.length - 3} more
                </div>
              )}
            </div>
          ) : role === "pm" && unlinkedEvidence.length > 0 ? (
            <div className="mt-2 space-y-2">
              <div className="text-xs text-[var(--color-text-dim)] mb-1">
                No evidence linked. Link existing evidence to this risk item:
              </div>
              {unlinkedEvidence.slice(0, 3).map((evi) => (
                <div key={evi.id} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-semantic-yellow)] shrink-0" />
                  <span className="flex-1 text-[var(--color-text-secondary)] truncate">{evi.sourceLabel}</span>
                  <button
                    onClick={() => approveEvidence(evi.id, activeEvent.id)}
                    className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-semibold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all cursor-pointer"
                  >
                    <Link2 size={10} /> Link
                  </button>
                </div>
              ))}
              {unlinkedEvidence.length > 3 && (
                <div className="text-[10px] text-[var(--color-text-dim)]">
                  +{unlinkedEvidence.length - 3} more available
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 text-xs text-[var(--color-text-dim)]">
              No evidence linked yet. Approve evidence from the Evidence Inbox.
            </div>
          )}
        </div>

        {/* Contract references */}
        {activeEvent.contractReferences.length > 0 && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle icon={<AlertTriangle size={12} />}>Contract References</SectionTitle>
            <div className="mt-2 space-y-1.5">
              {activeEvent.contractReferences.map((ref, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-data text-[var(--color-accent)]">{ref.section}</span>
                  <span className="text-[var(--color-text-dim)]">—</span>
                  <span className="text-[var(--color-text-secondary)]">{ref.clause}</span>
                  {ref.noticeDays && (
                    <span className="ml-auto text-[var(--color-semantic-red)] font-data">
                      {ref.noticeDays}d notice
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Step CTA */}
        {(() => {
          const hasEvidence = linkedEvidence.length > 0;
          const hasContractPosition = !!activeEvent.rfiRecord;
          const hasDecision = !!activeEvent.decisionRecord || activeEvent.communications.length > 0;
          const hasTracking = activeEvent.monitorScores.length > 0;
          const modeIds = visibleModes.map((m) => m.id);

          let nextLabel = "";
          let nextDescription = "";
          let nextAction: (() => void) | null = null;
          let nextIsLink = false;
          let nextHref = "";

          if (!hasEvidence) {
            nextLabel = "Review Evidence";
            nextDescription = "Approve evidence from the Evidence Inbox to link supporting documents to this risk item.";
            nextIsLink = true;
            nextHref = "/workspace";
          } else if (!hasContractPosition && modeIds.includes("contract-position")) {
            nextLabel = "Generate Contract Position";
            nextDescription = "AI will cross-reference contract clauses and assess entitlement based on linked evidence.";
            nextAction = () => setActiveTab("contract-position");
          } else if (!hasDecision && modeIds.includes("stakeholder-update")) {
            nextLabel = "Generate Stakeholder Update";
            nextDescription = "Create role-adapted stakeholder communications from this event's data.";
            nextAction = () => setActiveTab("stakeholder-update");
          } else if (!hasTracking && modeIds.includes("tracking")) {
            nextLabel = "Score Event Health";
            nextDescription = "Run a health assessment to score this event against contractual obligations and schedule.";
            nextAction = () => setActiveTab("tracking");
          } else {
            nextLabel = "Export Decision Package";
            nextDescription = "All stages complete. Export board-ready PPTX, XLSX, or PDF with citations.";
            nextIsLink = true;
            nextHref = "/workspace/export";
          }

          return (
            <div className="bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-[var(--radius-card)] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-accent)] mb-1.5">
                Next Step
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
                {nextDescription}
              </p>
              {nextIsLink ? (
                <Link href={nextHref}>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all cursor-pointer">
                    {nextLabel} <ArrowRight size={14} />
                  </button>
                </Link>
              ) : nextAction ? (
                <button
                  onClick={nextAction}
                  className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all cursor-pointer"
                >
                  {nextLabel} <ArrowRight size={14} />
                </button>
              ) : null}
            </div>
          );
        })()}
      </div>

      {/* Sidebar: Lifecycle + metadata */}
      <div className="space-y-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle>Lifecycle</SectionTitle>
          <div className="mt-3">
            <LifecycleStages event={activeEvent} onAdvance={handleAdvanceStage} />
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 space-y-3">
          <SectionTitle>Details</SectionTitle>
          <div className="space-y-2">
            {([
              ["Status", activeEvent.status],
              ["Severity", activeEvent.severity],
              ["Type", activeEvent.eventType ?? "—"],
              ["Alignment", activeEvent.alignmentStatus],
              ["Created", new Date(activeEvent.createdAt).toLocaleDateString()],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-dim)]">{label}</span>
                <span className="font-data text-[var(--color-text-secondary)] capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Evidence Drawer */}
    <EvidenceDrawer
      item={selectedEvidence}
      onClose={() => setSelectedEvidence(null)}
      onApprove={(id) => { approveEvidence(id, activeEvent.id); setSelectedEvidence(null); }}
      onReject={() => setSelectedEvidence(null)}
    />
    </>
  );
}
