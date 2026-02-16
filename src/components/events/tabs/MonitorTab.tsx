"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Activity, Loader2, RotateCcw, BarChart3, TrendingUp, AlertTriangle, PenLine } from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import ScoreBar from "@/components/shared/ScoreBar";
import TrendMiniChart from "@/components/shared/TrendMiniChart";
import ImpactReviewPanel, { type ReviewItem } from "@/components/shared/ImpactReviewPanel";
import IntelligenceNudge from "@/components/shared/IntelligenceNudge";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import CompletionIndicator from "@/components/shared/CompletionIndicator";
import VerificationBanner from "@/components/verification/VerificationBanner";
import { computeTrustStatusForOutput, type TrustEvalResult } from "@/lib/validation/trust-evaluator";
import type { TrustState } from "@/lib/models/decision-event";
import { useActiveProject } from "@/lib/contexts/project-context";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import { FLAGS } from "@/lib/flags";
import { searchDocuments } from "@/lib/demo/documents";
import { matchNudges } from "@/lib/demo/long-term-memory";
import { useStream } from "@/lib/hooks/use-stream";
import { useEvents } from "@/lib/contexts/event-context";
import { useMemory } from "@/lib/contexts/memory-context";
import WhatChangedBar from "@/components/events/WhatChangedBar";
import { snapshotEvent, computeDeltas, type Delta } from "@/lib/ui/delta";
import { computeDeterministicScore } from "@/lib/scoring/monitor-score";
import ScoreFactorBreakdown from "@/components/shared/ScoreFactorBreakdown";

function buildAutoLog(event: {
  fieldRecord?: { observation: string; location: string } | null;
  contractReferences: { section: string; clause: string }[];
  decisionRecord?: { panels: { stakeholderId: string }[] } | null;
  communications: { persona: string }[];
  status: string;
  severity: string;
  alignmentStatus: string;
  costImpact?: { estimated: number } | null;
  scheduleImpact?: { daysAffected: number; criticalPath: boolean } | null;
}) {
  const parts: string[] = [];
  if (event.fieldRecord) {
    parts.push(`Field Observation: ${event.fieldRecord.observation}`);
    parts.push(`Location: ${event.fieldRecord.location}`);
  }
  if (event.contractReferences.length > 0) {
    parts.push(`Contract References: ${event.contractReferences.map((r) => `${r.section} — ${r.clause}`).join("; ")}`);
  }
  if (event.decisionRecord) {
    parts.push(`Position Brief: ${event.decisionRecord.panels.length} stakeholder panels generated`);
  }
  if (event.communications.length > 0) {
    parts.push(`Communications: ${event.communications.length} sent (${event.communications.map((c) => c.persona).join(", ")})`);
  }
  parts.push(`Event Status: ${event.status}`);
  parts.push(`Severity: ${event.severity}`);
  parts.push(`Alignment: ${event.alignmentStatus}`);
  if (event.costImpact) { parts.push(`Cost Exposure: $${event.costImpact.estimated.toLocaleString()}`); }
  if (event.scheduleImpact) { parts.push(`Schedule Impact: ${event.scheduleImpact.daysAffected} days${event.scheduleImpact.criticalPath ? " (critical path)" : ""}`); }
  return parts.join("\n");
}

export default function MonitorTab() {
  const { activeEvent, updateEvent, addHistory } = useEvents();
  const { activeProject } = useActiveProject();
  const { store } = useMemory();

  const autoLog = useMemo(() => (activeEvent ? buildAutoLog(activeEvent) : ""), [activeEvent]);

  const [logEntry, setLogEntry] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState<string | null>(null);
  const snapRef = useRef<ReturnType<typeof snapshotEvent> | null>(null);

  useEffect(() => {
    if (autoLog && !initialized) {
      setLogEntry(autoLog);
      setInitialized(true);
    }
  }, [autoLog, initialized]);

  const nudges = useMemo(() => matchNudges(logEntry), [logEntry]);
  const relevantDocs = useMemo(
    () => searchDocuments(logEntry || activeEvent?.description || "").map((d) => ({ title: `${d.title} — ${d.section}`, content: d.content })),
    [logEntry, activeEvent?.description]
  );

  const { text, isStreaming, error, confidenceData, send, reset } = useStream({
    tool: "pulse-log",
    context: {
      documents: relevantDocs,
      longTermMemory: { cases: store.getCases(), lessons: store.getLessons() },
      toolSpecific: {
        tags: ["utility", "differing-site", "notice", "subsurface"],
        issueTypes: ["utility", "notice", "differing-site"],
      },
    },
  });

  const isComplete = !isStreaming && text.length > 0 && !error;

  const trustResult: TrustEvalResult | null = useMemo(() => {
    if (!isComplete || !text) return null;
    const badge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });
    return computeTrustStatusForOutput({
      toolType: "monitor",
      outputText: text,
      freshnessLevel: badge.level,
    });
  }, [isComplete, text, activeProject.sourceProfile.sources]);

  const handleScore = () => {
    if (!logEntry.trim()) return;
    if (activeEvent) snapRef.current = snapshotEvent(activeEvent);
    send([{ role: "user", content: `Analyze this event status and produce a multi-factor risk assessment:\n\n${logEntry}\n\nProduce all required sections: Overall Health Score (use **Score: XX/100** format), Risk Breakdown (Contractual Risk, Schedule Cascade Risk, Financial Escalation Risk, Stakeholder Misalignment Risk), If No Action in 48 Hours, Pattern Comparison, Threshold Detection table, and Recommended Priority Actions.` }]);
  };

  // When streaming completes, extract score and queue for review instead of auto-saving
  useEffect(() => {
    if (isComplete && activeEvent && pendingScore === null && !reviewDismissed) {
      const scoreMatch = text.match(/\*\*Score:\s*(\d{1,3})\/100\*\*/i)
        || text.match(/(?:overall|quality|score)[:\s]*(\d{1,3})/i);
      const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 70;
      setPendingScore(score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // Deterministic scoring from event data
  const deterministicScore = useMemo(() => {
    if (!activeEvent) return null;
    return computeDeterministicScore(activeEvent, activeProject.contingency ?? 312000);
  }, [activeEvent, activeProject.contingency]);

  const handleApproveScore = (items: ReviewItem[]) => {
    if (!activeEvent) return;
    const scoreItem = items.find((it) => it.label === "Score");
    const score = scoreItem ? Math.min(100, Math.max(0, parseInt(scoreItem.value) || 70)) : (pendingScore ?? 70);
    const summaryItem = items.find((it) => it.label === "Summary");
    const analysis = summaryItem ? summaryItem.value : (editedText ?? text).slice(0, 200);
    const trust: TrustState | undefined = trustResult
      ? {
          trustStatus: trustResult.status,
          trustReason: trustResult.reason,
          evidenceRefs: { sourceIds: [], docChunkIds: [] },
          evaluatedAt: new Date().toISOString(),
          confidenceBreakdown: confidenceData?.confidence_breakdown,
          scoreOverwritten: confidenceData?.score_overwritten,
        }
      : undefined;
    updateEvent(activeEvent.id, {
      monitorScores: [...activeEvent.monitorScores, { date: new Date().toISOString().slice(0, 10), score, analysis, trust }],
    });
    addHistory(activeEvent.id, { action: "Monitor score recorded", tab: "monitor", detail: `Score: ${score}/100 (reviewed)` });
    if (snapRef.current) {
      const afterEvent = { ...activeEvent, monitorScores: [...activeEvent.monitorScores, { date: new Date().toISOString().slice(0, 10), score, analysis, trust }] };
      setDeltas(computeDeltas(snapRef.current, snapshotEvent(afterEvent)));
    }
    setPendingScore(null);
  };

  const handleRejectScore = () => {
    setPendingScore(null);
    setReviewDismissed(true);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleScore(); }
      if (e.key === "Escape" && text) { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!activeEvent) return null;

  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-6">
      <div className="space-y-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle>Event Status Summary</SectionTitle>
          <textarea value={logEntry} onChange={(e) => setLogEntry(e.target.value)} className="w-full h-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm font-data text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-semantic-yellow)] focus:outline-none" placeholder="Event status data is auto-generated from event records..." />
          <button onClick={handleScore} disabled={isStreaming || !logEntry.trim()} className="btn-primary w-full mt-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isStreaming ? (<><Loader2 size={16} className="animate-spin" /> Scoring...</>) : (<><Activity size={16} /> Score Event Health</>)}
          </button>
        </div>

        {nudges.length > 0 && (<div className="space-y-2"><SectionTitle>Risk Control Layer</SectionTitle>{nudges.slice(0, 2).map((n) => (<IntelligenceNudge key={n.id} nudge={n} />))}</div>)}

        {activeEvent.monitorScores.length > 0 && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle icon={<BarChart3 size={12} />}>Score Trend</SectionTitle>
            <div className="space-y-2">
              {activeEvent.monitorScores.map((ms, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-data text-[var(--color-text-dim)] w-20 shrink-0">{ms.date}</span>
                  <div className="flex-1"><ScoreBar value={ms.score} color={ms.score >= 80 ? "var(--color-semantic-green)" : ms.score >= 60 ? "var(--color-semantic-yellow)" : "var(--color-semantic-red)"} showValue={false} /></div>
                  <span className="text-xs font-data w-8 text-right" style={{ color: ms.score >= 80 ? "var(--color-semantic-green)" : ms.score >= 60 ? "var(--color-semantic-yellow)" : "var(--color-semantic-red)" }}>{ms.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Trends */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle icon={<TrendingUp size={12} />}>Risk Trends</SectionTitle>
          <div className="space-y-3 mt-3">
            <TrendMiniChart
              label="Exposure"
              data={activeEvent.monitorScores.length > 0
                ? activeEvent.monitorScores.map((_, i) => (activeEvent.costImpact?.estimated ?? 0) * (0.7 + i * 0.1))
                : [activeEvent.costImpact?.estimated ?? 0]}
              color="var(--color-accent)"
              suffix=""
            />
            <TrendMiniChart
              label="Notice Risk"
              data={activeEvent.contractReferences.some((r) => r.noticeDays && r.noticeDays > 0)
                ? activeEvent.monitorScores.length > 0
                  ? activeEvent.monitorScores.map((_, i) => Math.max(0, 100 - i * 15))
                  : [100]
                : [0]}
              color="var(--color-semantic-yellow)"
              suffix="%"
            />
            <TrendMiniChart
              label="Comm. Gap"
              data={[
                activeEvent.communications.length > 0 ? 0 : 1,
                activeEvent.stakeholderNotifications.filter((s) => !s.notified).length,
              ]}
              color={activeEvent.stakeholderNotifications.some((s) => !s.notified) ? "var(--color-semantic-red)" : "var(--color-semantic-green)"}
              suffix=""
            />
          </div>
        </div>
      </div>

      <div className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 min-h-[500px] ${isComplete ? "animate-completion-flash" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Multi-Factor Risk Assessment</SectionTitle>
          {text && (<button onClick={reset} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"><RotateCcw size={14} /></button>)}
        </div>
        {text ? (
          isEditing ? (
            <textarea
              value={editedText ?? text}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full min-h-[300px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 text-sm text-[var(--color-text-primary)] font-mono leading-relaxed focus:border-[var(--color-accent)] focus:outline-none resize-y"
            />
          ) : (
            <ReasoningOutput text={editedText ?? text} isStreaming={isStreaming} variant="reasoning-engine" />
          )
        ) : error ? (<div className="text-sm text-[var(--color-semantic-red)]">Error: {error}</div>) : (<div className="flex items-center justify-center h-[400px] text-[var(--color-text-dim)] text-sm">Click &ldquo;Score Event Health&rdquo; to analyze this event</div>)}
        {FLAGS.verificationGate && isComplete && trustResult && (
          <VerificationBanner result={trustResult} confidenceData={confidenceData} />
        )}
        {isComplete && <CompletionIndicator text={text} />}
        {isComplete && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => { if (!isEditing) setEditedText(text); setIsEditing(!isEditing); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
            >
              <PenLine size={12} />
              {isEditing ? "Preview" : "Edit"}
            </button>
          </div>
        )}
        {isComplete && pendingScore !== null && (
          <ImpactReviewPanel
            title="Review Score Before Saving"
            items={[
              { label: "Score", value: String(pendingScore), editable: true },
              ...(FLAGS.deterministicScoring && deterministicScore
                ? [{ label: "Data Score", value: `${deterministicScore.composite}/100 (Grade ${deterministicScore.grade})`, editable: false }]
                : []),
              { label: "Summary", value: text.slice(0, 200), editable: true },
              { label: "Source", value: "AI-generated risk assessment", editable: false },
            ]}
            onApprove={handleApproveScore}
            onReject={handleRejectScore}
          />
        )}
        {FLAGS.deterministicScoring && isComplete && deterministicScore && (
          <>
            {pendingScore !== null && Math.abs(pendingScore - deterministicScore.composite) > 15 && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-semantic-yellow-dim)] border border-[var(--color-semantic-yellow)]">
                <AlertTriangle size={12} className="text-[var(--color-semantic-yellow)] shrink-0" />
                <span className="text-xs text-[var(--color-semantic-yellow)]">
                  AI score ({pendingScore}) diverges from data score ({deterministicScore.composite}) by {Math.abs(pendingScore - deterministicScore.composite)} points — review recommended
                </span>
              </div>
            )}
            <ScoreFactorBreakdown score={deterministicScore} showDivergence={pendingScore !== null} aiScore={pendingScore} />
          </>
        )}
        {isComplete && <WhatChangedBar deltas={deltas} />}
      </div>
    </div>
  );
}
