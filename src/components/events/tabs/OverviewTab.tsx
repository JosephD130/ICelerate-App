"use client";

import { useState } from "react";
import {
  DollarSign,
  Clock,
  MapPin,
  Radio,
  FileText,
  GitBranch,
  MessageSquare,
  CheckCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEvents, type EventTab } from "@/lib/contexts/event-context";
import EvidenceBundle from "@/components/events/EvidenceBundle";
import NoticeClockBadge from "@/components/shared/NoticeClockBadge";
import DerivedFromDrawer, { type ValueSource } from "@/components/shared/DerivedFromDrawer";
import ProvenanceDrawer from "@/components/provenance/ProvenanceDrawer";
import { buildProvenanceForMetric } from "@/lib/provenance/buildProvenance";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useMemory } from "@/lib/contexts/memory-context";
import { resolveEvidenceBundle } from "@/lib/demo/v5/resolvers";
import { SEVERITY_COLORS, STATUS_COLORS, ALIGNMENT_COLORS } from "@/lib/ui/semantic";
import EventSuggestionPanel from "@/components/events/EventSuggestionPanel";
import SimilarCasesPanel from "@/components/events/SimilarCasesPanel";
import FreshnessBar from "@/components/shared/FreshnessBar";
import NextActionBar from "@/components/shared/NextActionBar";
import { resolveFreshness } from "@/lib/freshness";
import { resolveNextAction } from "@/lib/next-action";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import { FLAGS } from "@/lib/flags";

function buildCostSources(projectId: string, eventId: string): ValueSource[] {
  const bundle = resolveEvidenceBundle(projectId, eventId);
  if (!bundle) return [];
  const sources: ValueSource[] = [];
  for (const clause of bundle.clauses.slice(0, 2)) {
    sources.push({ label: clause.docTitle, type: "document", detail: `${clause.ref} — ${clause.heading}` });
  }
  for (const log of bundle.logs.slice(0, 2)) {
    sources.push({ label: `Daily Log ${log.id}`, type: "field-data", detail: log.workPerformed[0] ?? log.constraints[0] ?? `${log.date} ${log.shift} shift` });
  }
  if (bundle.tasks.length > 0) {
    const cpTasks = bundle.tasks.filter((t) => t.criticalPath);
    if (cpTasks.length > 0) {
      sources.push({ label: "Schedule Impact", type: "calculation", detail: `${cpTasks.length} critical path task(s) affected, ${cpTasks[0].varianceDays}d variance` });
    }
  }
  return sources;
}

export default function OverviewTab() {
  const { activeEvent, setActiveTab } = useEvents();
  const { activeProject } = useActiveProject();
  const { allSuggestions } = useMemory();
  const [provenanceOpen, setProvenanceOpen] = useState<string | null>(null);
  if (!activeEvent) return null;

  const severity = SEVERITY_COLORS[activeEvent.severity] ?? SEVERITY_COLORS.medium;
  const status = STATUS_COLORS[activeEvent.status] ?? STATUS_COLORS.open;
  const alignment = ALIGNMENT_COLORS[activeEvent.alignmentStatus] ?? ALIGNMENT_COLORS.drift;

  // Progress: what has been done?
  const steps = [
    { label: "Field Recorded", done: !!activeEvent.fieldRecord },
    { label: "Contract Reviewed", done: activeEvent.contractReferences.length > 0 },
    { label: "Decision Made", done: !!activeEvent.decisionRecord },
    { label: "Communicated", done: activeEvent.communications.length > 0 },
  ];
  const completedSteps = steps.filter((s) => s.done).length;

  const actionButtons: { label: string; tab: EventTab; icon: React.ReactNode; color: string }[] = [
    { label: "Field Update", tab: "field", icon: <Radio size={14} />, color: "var(--color-semantic-green)" },
    { label: "Generate RFI", tab: "contract", icon: <FileText size={14} />, color: "var(--color-semantic-blue)" },
    { label: "Position Brief", tab: "decision", icon: <GitBranch size={14} />, color: "var(--color-semantic-purple)" },
    { label: "Translate", tab: "communication", icon: <MessageSquare size={14} />, color: "var(--color-accent)" },
  ];

  const freshnessWarnings = FLAGS.freshnessWarnings
    ? resolveFreshness(activeProject.sourceProfile)
    : [];
  const nextAction = FLAGS.nextBestAction
    ? resolveNextAction(activeEvent)
    : null;

  return (
    <div className="space-y-6">
      {/* Next best action */}
      {nextAction && (
        <NextActionBar action={nextAction} onNavigate={setActiveTab} />
      )}

      {/* Source freshness */}
      {FLAGS.freshnessWarnings && <FreshnessBar warnings={freshnessWarnings} />}

      {/* Badges row */}
      <div className="flex items-center gap-2">
        <span className="badge text-[10px]" style={{ backgroundColor: severity.bg, color: severity.text }}>
          {activeEvent.severity}
        </span>
        <span className="badge text-[10px]" style={{ backgroundColor: status.bg, color: status.text }}>
          {status.label}
        </span>
        <span className="badge text-[10px]" style={{ backgroundColor: alignment.bg, color: alignment.text }}>
          {alignment.label}
        </span>
        {activeEvent.location && (
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-dim)] font-data ml-2">
            <MapPin size={10} /> {activeEvent.location}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5">
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {activeEvent.description}
        </p>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cost exposure */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-[var(--color-accent)] opacity-70" />
            <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              Cost Exposure
            </span>
          </div>
          {activeEvent.costImpact ? (
            <>
              <div className="font-data text-lg font-bold text-[var(--color-text-primary)] inline-flex items-center gap-1">
                <button
                  onClick={() => setProvenanceOpen("costExposure")}
                  className="hover:text-[var(--color-accent)] transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
                  title="View provenance"
                >
                  ${activeEvent.costImpact.estimated.toLocaleString()}
                </button>
                <DerivedFromDrawer label="Cost Exposure" sources={buildCostSources(activeProject.id, activeEvent.id)} />
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {activeEvent.costImpact.description}
              </div>
            </>
          ) : (
            <div className="text-xs text-[var(--color-text-dim)]">No cost impact</div>
          )}
        </div>

        {/* Schedule exposure */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[var(--color-semantic-yellow)] opacity-70" />
            <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              Schedule Impact
            </span>
          </div>
          {activeEvent.scheduleImpact ? (
            <>
              <div className="font-data text-lg font-bold text-[var(--color-text-primary)] inline-flex items-center gap-1">
                <button
                  onClick={() => setProvenanceOpen("scheduleDays")}
                  className="hover:text-[var(--color-accent)] transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
                  title="View provenance"
                >
                  {activeEvent.scheduleImpact.daysAffected} day{activeEvent.scheduleImpact.daysAffected !== 1 ? "s" : ""}
                </button>
                <DerivedFromDrawer label="Schedule Impact" sources={buildCostSources(activeProject.id, activeEvent.id)} />
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {activeEvent.scheduleImpact.description}
              </div>
              {activeEvent.scheduleImpact.criticalPath && (
                <span className="badge text-[10px] mt-1" style={{ backgroundColor: "var(--color-semantic-red-dim)", color: "var(--color-semantic-red)" }}>
                  Critical Path
                </span>
              )}
            </>
          ) : (
            <div className="text-xs text-[var(--color-text-dim)]">No schedule impact</div>
          )}
        </div>
      </div>

      {/* Notice Clock */}
      <NoticeClockBadge event={activeEvent} />

      {/* Progress */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
        <div className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-3">
          Alignment Progress
        </div>
        <div className="flex items-center gap-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {step.done ? (
                <CheckCircle size={14} className="text-[var(--color-semantic-green)]" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)]" />
              )}
              <span className={`text-sm ${step.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-dim)]"}`}>
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div className="w-8 h-px bg-[var(--color-border)] mx-1" />
              )}
            </div>
          ))}
          <span className="ml-auto text-[10px] font-data text-[var(--color-text-dim)]">
            {completedSteps}/{steps.length}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actionButtons.map((btn) => (
          <button
            key={btn.tab}
            onClick={() => setActiveTab(btn.tab)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 bg-[var(--color-card)]"
            style={{ color: btn.color }}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>

      {/* Timeline deep-link */}
      <Link
        href={`/workspace/timeline?eventId=${activeEvent.id}`}
        className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <Zap size={12} />
        View Impact on Timeline
      </Link>

      {/* Evidence Bundle */}
      <EvidenceBundle />

      {/* Memory: Incoming Updates + Similar Cases */}
      {FLAGS.memoryLayer && <EventSuggestionPanel />}
      {FLAGS.memoryLayer && <SimilarCasesPanel />}

      {/* Stakeholder notifications */}
      {activeEvent.stakeholderNotifications.length > 0 && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-3">
            Stakeholder Status
          </div>
          <div className="flex flex-wrap gap-2">
            {activeEvent.stakeholderNotifications.map((s) => (
              <span
                key={s.stakeholderId}
                className="badge text-[10px]"
                style={{
                  backgroundColor: s.notified ? "var(--color-semantic-green-dim)" : "var(--color-semantic-red-dim)",
                  color: s.notified ? "var(--color-semantic-green)" : "var(--color-semantic-red)",
                }}
              >
                {s.name}: {s.notified ? `Notified via ${s.method}` : "Not notified"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Provenance Drawer */}
      {FLAGS.safeUx && provenanceOpen && (
        <ProvenanceDrawer
          open={!!provenanceOpen}
          onClose={() => setProvenanceOpen(null)}
          title={provenanceOpen === "costExposure" ? "Cost Exposure" : "Schedule Impact"}
          value={
            provenanceOpen === "costExposure"
              ? `$${(activeEvent.costImpact?.estimated ?? 0).toLocaleString()}`
              : `${activeEvent.scheduleImpact?.daysAffected ?? 0} days`
          }
          provenance={buildProvenanceForMetric({
            metricKey: provenanceOpen as "costExposure" | "scheduleDays",
            eventId: activeEvent.id,
            allSuggestions,
          })}
          freshness={computeFreshnessBadge({ sources: activeProject.sourceProfile.sources })}
        />
      )}
    </div>
  );
}
