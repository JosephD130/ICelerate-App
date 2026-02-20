"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEvents } from "@/lib/contexts/event-context";
import EventTabBar from "@/components/events/EventTabBar";
import OverviewTab from "@/components/events/tabs/OverviewTab";
import FieldTab from "@/components/events/tabs/FieldTab";
import ContractTab from "@/components/events/tabs/ContractTab";
import DecisionTab from "@/components/events/tabs/DecisionTab";
import CommunicationTab from "@/components/events/tabs/CommunicationTab";
import MonitorTab from "@/components/events/tabs/MonitorTab";
import HistoryTab from "@/components/events/tabs/HistoryTab";
import CausalStrip from "@/components/events/CausalStrip";
import NoticeClockBadge from "@/components/shared/NoticeClockBadge";
import ModeSwitcher from "@/components/events/ModeSwitcher";
import PromoteToCaseModal from "@/components/events/PromoteToCaseModal";
import CaptureMode from "@/components/events/modes/CaptureMode";
import ContractMode from "@/components/events/modes/ContractMode";
import ExposureMode from "@/components/events/modes/ExposureMode";
import StakeholderUpdateMode from "@/components/events/modes/StakeholderUpdateMode";
import DecisionOutputsMode from "@/components/events/modes/DecisionOutputsMode";
import ActivityDrawer from "@/components/events/modes/ActivityDrawer";
import SummaryMode from "@/components/events/modes/SummaryMode";
import EvidenceMode from "@/components/events/modes/EvidenceMode";
import TrackingMode from "@/components/events/modes/TrackingMode";
import AuditLogMode from "@/components/events/modes/AuditLogMode";
import { FLAGS } from "@/lib/flags";
import { T } from "@/lib/terminology";
import { generateFriendlyLabel, copyRawIdToClipboard } from "@/lib/models/event-labels";
import PipelinePanel from "@/components/pipeline/PipelinePanel";

export default function EventWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { events, activeEvent, activeTab, selectEvent, setActiveTab, pendingResolution } = useEvents();

  const eventId = params.id as string;

  // Select event on mount / id change
  useEffect(() => {
    if (eventId && (!activeEvent || activeEvent.id !== eventId)) {
      const found = events.find((e) => e.id === eventId);
      if (found) {
        selectEvent(found.id);
      } else {
        router.push("/workspace");
      }
    }
  }, [eventId, events, activeEvent, selectEvent, router]);

  if (!activeEvent) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text-dim)] text-sm">
        Loading event...
      </div>
    );
  }

  const ALIGNMENT_DOT: Record<string, string> = {
    synced: "var(--color-semantic-green)",
    drift: "var(--color-semantic-yellow)",
    misaligned: "var(--color-semantic-red)",
  };

  const friendlyLabel = activeEvent.friendlyLabel ?? generateFriendlyLabel(activeEvent.id);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb (governed mode) */}
      {FLAGS.governedRiskSystem && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)] mb-3">
          <Link href="/workspace" className="hover:text-[var(--color-accent)] transition-colors">
            {T.REGISTER}
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-muted)] font-data">{friendlyLabel}</span>
        </div>
      )}

      {/* Event header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/workspace"
          aria-label={`Back to ${FLAGS.governedRiskSystem ? T.REGISTER : "Risk Register"}`}
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor:
              ALIGNMENT_DOT[activeEvent.alignmentStatus] ??
              ALIGNMENT_DOT.drift,
          }}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] truncate" title={activeEvent.title}>
            {activeEvent.title}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {(FLAGS.governedRiskSystem || FLAGS.eventFlowSimplification) ? (
              <button
                onClick={() => copyRawIdToClipboard(activeEvent.id)}
                title={`Copy ID: ${activeEvent.id}`}
                className="text-xs font-data text-[var(--color-text-dim)] hover:text-[var(--color-accent)] cursor-pointer transition-colors"
              >
                {friendlyLabel}
              </button>
            ) : (
              <span className="text-xs font-data text-[var(--color-text-dim)]">
                {activeEvent.id}
              </span>
            )}
            <span className="text-xs text-[var(--color-text-dim)]">·</span>
            <span className="text-xs text-[var(--color-text-dim)]">
              {activeEvent.location ?? "No location"}
            </span>
          </div>
        </div>
        <NoticeClockBadge event={activeEvent} compact />
      </div>

      {/* Agentic Pipeline */}
      {FLAGS.agenticWorkflows && <PipelinePanel />}

      {/* Causal strip — persistent across all tabs (legacy only) */}
      {!FLAGS.governedRiskSystem && <CausalStrip />}

      {/* ─── Governed Risk System modes ─── */}
      {FLAGS.governedRiskSystem ? (
        <>
          <ModeSwitcher
            event={activeEvent}
            activeMode={activeTab}
            onModeChange={setActiveTab}
          />
          {activeTab === "summary" && <SummaryMode />}
          {activeTab === "evidence" && <EvidenceMode />}
          {activeTab === "contract-position" && <ContractMode />}
          {activeTab === "stakeholder-update" && <StakeholderUpdateMode />}
          {activeTab === "tracking" && <TrackingMode />}
          {activeTab === "audit-log" && <AuditLogMode />}
        </>
      ) : FLAGS.eventFlowSimplification ? (
        <>
          <ModeSwitcher
            event={activeEvent}
            activeMode={activeTab}
            onModeChange={setActiveTab}
          />
          {activeTab === "capture" && <CaptureMode />}
          {activeTab === "contract" && <ContractMode />}
          {activeTab === "exposure" && <ExposureMode />}
          {activeTab === "stakeholder-update" && <StakeholderUpdateMode />}
          {activeTab === "decision-outputs" && <DecisionOutputsMode />}
          <ActivityDrawer
            open={activeTab === "activity"}
            onClose={() => setActiveTab("capture")}
            event={activeEvent}
          />
        </>
      ) : (
        <>
          <EventTabBar activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "field" && <FieldTab />}
          {activeTab === "contract" && <ContractTab />}
          {activeTab === "decision" && <DecisionTab />}
          {activeTab === "communication" && <CommunicationTab />}
          {activeTab === "monitor" && <MonitorTab />}
          {activeTab === "history" && <HistoryTab />}
        </>
      )}

      {/* Promote to Case modal (event flow simplification) */}
      {(FLAGS.eventFlowSimplification || FLAGS.governedRiskSystem) && pendingResolution === activeEvent.id && (
        <PromoteToCaseModal event={activeEvent} />
      )}
    </div>
  );
}
