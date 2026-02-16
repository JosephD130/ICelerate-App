"use client";

import { useState, useMemo } from "react";
import {
  FileText, CheckCircle, Circle, ExternalLink,
  Send, Loader2, RotateCcw, Activity,
} from "lucide-react";
import Link from "next/link";
import SectionTitle from "@/components/shared/SectionTitle";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import CompletionIndicator from "@/components/shared/CompletionIndicator";
import VerificationBanner from "@/components/verification/VerificationBanner";
import { computeTrustStatusForOutput, type TrustEvalResult } from "@/lib/validation/trust-evaluator";
import { useActiveProject } from "@/lib/contexts/project-context";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import { FLAGS } from "@/lib/flags";
import { searchDocuments } from "@/lib/demo/documents";
import { useStream } from "@/lib/hooks/use-stream";
import { useEvents } from "@/lib/contexts/event-context";
import { useRole } from "@/lib/contexts/role-context";
import { computeDeterministicScore } from "@/lib/scoring/monitor-score";
import ScoreFactorBreakdown from "@/components/shared/ScoreFactorBreakdown";

interface Deliverable {
  label: string;
  ready: boolean;
}

const ROLE_DELIVERABLES: Record<string, Deliverable[]> = {
  field: [
    { label: "Daily Brief", ready: false },
    { label: "Photo Log Packet", ready: false },
    { label: "Issue Notice Draft", ready: false },
  ],
  pm: [
    { label: "Owner Meeting Pack", ready: false },
    { label: "Top 3 Cost Drivers", ready: false },
    { label: "Notice Log", ready: false },
    { label: "RFI Draft Bundle", ready: false },
  ],
  stakeholder: [
    { label: "Executive Summary", ready: false },
    { label: "Exposure Snapshot", ready: false },
    { label: "Board Memo", ready: false },
  ],
};

const ROLE_CHIPS: Record<string, string[]> = {
  field: ["What should I capture next?", "What's missing?"],
  pm: ["What deadlines are at risk?", "Draft owner meeting notes"],
  stakeholder: ["Summarize exposure", "What decisions are needed?"],
};

export default function DecisionOutputsMode() {
  const { activeEvent, addHistory } = useEvents();
  const { activeProject } = useActiveProject();
  const { role } = useRole();

  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  // Context readiness checklist
  const checklist = useMemo(() => {
    if (!activeEvent) return [];
    return [
      { label: "Field record captured", done: !!activeEvent.fieldRecord },
      { label: "Contract reviewed", done: activeEvent.contractReferences.length > 0 || !!activeEvent.rfiRecord },
      { label: "Cost estimated", done: !!activeEvent.costImpact },
      { label: "Stakeholders briefed", done: activeEvent.communications.length > 0 },
      { label: "Evidence validated", done: !!activeEvent.fieldRecord?.trust || !!activeEvent.rfiRecord?.trust || !!activeEvent.decisionRecord?.trust },
    ];
  }, [activeEvent]);

  const deliverables = ROLE_DELIVERABLES[role] ?? ROLE_DELIVERABLES.pm;
  const chips = ROLE_CHIPS[role] ?? ROLE_CHIPS.pm;

  const relevantDocs = useMemo(
    () => searchDocuments(activeEvent?.description || "").map((d) => ({ title: `${d.title} — ${d.section}`, content: d.content })),
    [activeEvent?.description]
  );

  const { text, isStreaming, error, confidenceData, send, reset } = useStream({
    tool: "pulse-chat",
    context: { documents: relevantDocs },
  });

  const isComplete = !isStreaming && text.length > 0 && !error;

  const trustResult: TrustEvalResult | null = useMemo(() => {
    if (!isComplete || !text) return null;
    const badge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });
    return computeTrustStatusForOutput({ toolType: "monitor", outputText: text, freshnessLevel: badge.level });
  }, [isComplete, text, activeProject.sourceProfile.sources]);

  const deterministicScore = useMemo(() => {
    if (!activeEvent) return null;
    return computeDeterministicScore(activeEvent, activeProject.contingency ?? 312000);
  }, [activeEvent, activeProject.contingency]);

  const handleChip = (chip: string) => {
    setSelectedChip(chip);
    const context = activeEvent
      ? `Event: ${activeEvent.title}\nStatus: ${activeEvent.status}\nSeverity: ${activeEvent.severity}\n${activeEvent.costImpact ? `Cost: $${activeEvent.costImpact.estimated.toLocaleString()}` : ""}\n${activeEvent.scheduleImpact ? `Schedule: ${activeEvent.scheduleImpact.daysAffected}d` : ""}\n\nQuestion: ${chip}`
      : chip;
    send([{ role: "user", content: context }]);
    if (activeEvent) {
      addHistory(activeEvent.id, { action: "Decision assistant query", tab: "decision-outputs", detail: chip });
    }
  };

  if (!activeEvent) return null;

  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-6">
      {/* Left — Outputs + Checklist */}
      <div className="space-y-4">
        {/* Context Readiness */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle>Context Readiness</SectionTitle>
          <div className="space-y-2 mt-2">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle size={14} className="text-[var(--color-semantic-green)] shrink-0" />
                ) : (
                  <Circle size={14} className="text-[var(--color-text-dim)] shrink-0" />
                )}
                <span className={item.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-dim)]"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Deliverables */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle icon={<FileText size={12} />}>Deliverable Buckets</SectionTitle>
          <div className="space-y-2 mt-2">
            {deliverables.map((d) => (
              <div key={d.label} className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface)] rounded-[var(--radius-sm)]">
                <span className="text-sm text-[var(--color-text-secondary)]">{d.label}</span>
                <span className="text-xs font-data text-[var(--color-text-dim)]">Draft</span>
              </div>
            ))}
          </div>
          <Link href="/workspace/export" className="flex items-center gap-1.5 mt-3 text-sm text-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors">
            Full project export <ExternalLink size={12} />
          </Link>
        </div>

        {/* Event Health Score */}
        {FLAGS.deterministicScoring && deterministicScore && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle icon={<Activity size={12} />}>Event Health</SectionTitle>
            <ScoreFactorBreakdown score={deterministicScore} showDivergence={false} aiScore={null} />
          </div>
        )}
      </div>

      {/* Right — Decision Assistant */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 min-h-[500px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Decision Assistant</SectionTitle>
          {text && <button onClick={reset} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"><RotateCcw size={14} /></button>}
        </div>

        {/* Prompt chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {chips.map((chip) => (
            <button key={chip} onClick={() => handleChip(chip)} disabled={isStreaming} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${selectedChip === chip ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40"} disabled:opacity-50`}>
              {chip}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {isStreaming && (
            <div className="flex items-center gap-2 mb-3 text-sm text-[var(--color-accent)]">
              <Loader2 size={14} className="animate-spin" />
              Analyzing...
            </div>
          )}
          {text ? (
            <ReasoningOutput text={text} isStreaming={isStreaming} variant="reasoning-engine" />
          ) : error ? (
            <div className="text-sm text-[var(--color-semantic-red)]">Error: {error}</div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-[var(--color-text-dim)] text-sm">
              Select a prompt above or ask a question about this event
            </div>
          )}
        </div>

        {FLAGS.verificationGate && isComplete && trustResult && <VerificationBanner result={trustResult} confidenceData={confidenceData} />}
        {isComplete && <CompletionIndicator text={text} />}

        {/* Guardrails footer */}
        {isComplete && (
          <div className="mt-3 flex items-center gap-3 text-xs font-data text-[var(--color-text-dim)] border-t border-[var(--color-border)] pt-3">
            <span>{checklist.filter((c) => c.done).length}/{checklist.length} evidence sources</span>
            <span>&middot;</span>
            <span>{trustResult?.status === "verified" ? "Verified" : "Needs review"}</span>
            <span>&middot;</span>
            <span>{relevantDocs.length} docs in context</span>
          </div>
        )}
      </div>
    </div>
  );
}
