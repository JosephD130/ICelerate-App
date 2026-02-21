"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Send, Loader2, RotateCcw, Clock, ArrowRight, Zap, Beaker, Brain, PenLine } from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import IntelligenceNudge from "@/components/shared/IntelligenceNudge";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import CompletionIndicator from "@/components/shared/CompletionIndicator";
import VerificationBanner from "@/components/verification/VerificationBanner";
import { computeTrustStatusForOutput, type TrustEvalResult } from "@/lib/validation/trust-evaluator";
import type { TrustState } from "@/lib/models/decision-event";
import { useActiveProject } from "@/lib/contexts/project-context";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import { FLAGS } from "@/lib/flags";
import ConflictAlert from "@/components/events/ConflictAlert";
import ImpactReviewPanel, { type ReviewItem } from "@/components/shared/ImpactReviewPanel";
import { personas } from "@/lib/demo/personas";
import { searchDocuments } from "@/lib/demo/documents";
import { matchNudges } from "@/lib/demo/long-term-memory";
import { useMultiStream } from "@/lib/hooks/use-multi-stream";
import { useStream } from "@/lib/hooks/use-stream";
import { useEvents } from "@/lib/contexts/event-context";
import { useMemory } from "@/lib/contexts/memory-context";
import WhatChangedBar from "@/components/events/WhatChangedBar";
import { snapshotEvent, computeDeltas, type Delta } from "@/lib/ui/delta";

const STAKEHOLDER_PANELS = personas.map((p) => ({
  id: p.id,
  label: p.name,
  emoji: p.emoji,
}));

export default function DecisionTab() {
  const { activeEvent, updateEvent, addHistory } = useEvents();
  const { activeProject } = useActiveProject();
  const { store } = useMemory();

  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [pendingReview, setPendingReview] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [panelEdits, setPanelEdits] = useState<Record<string, string>>({});
  const snapRef = useRef<ReturnType<typeof snapshotEvent> | null>(null);

  useEffect(() => {
    if (activeEvent && !initialized) {
      setInput(
        activeEvent.decisionRecord?.input ??
        activeEvent.fieldRecord?.observation ??
        activeEvent.description ??
        ""
      );
      setInitialized(true);
    }
  }, [activeEvent, initialized]);

  const nudges = useMemo(() => matchNudges(input), [input]);
  const relevantDocs = useMemo(
    () =>
      searchDocuments(input || activeEvent?.description || "").map((d) => ({
        title: `${d.title} — ${d.section}`,
        content: d.content,
      })),
    [input, activeEvent?.description]
  );

  const memoryContext = useMemo(() => ({
    cases: store.getCases(),
    lessons: store.getLessons(),
  }), [store]);

  const { panels, isActive, sendAll, reset } = useMultiStream(
    STAKEHOLDER_PANELS,
    {
      tool: "decision-package",
      context: {
        documents: relevantDocs,
        longTermMemory: memoryContext,
        toolSpecific: {
          tags: ["utility", "differing-site", "notice", "subsurface"],
          issueTypes: ["utility", "notice", "differing-site"],
        },
      },
    }
  );

  const allDone = panels.every((p) => !p.isStreaming && (p.text || p.error));

  // Decision Synthesis — 5th stream that analyzes all 4 stakeholder outputs
  const {
    text: synthesisText,
    isStreaming: synthesisStreaming,
    error: synthesisError,
    thinkingText: synthesisThinking,
    send: sendSynthesis,
    reset: resetSynthesis,
  } = useStream({
    tool: "decision-synthesis",
    context: {
      documents: relevantDocs,
      longTermMemory: memoryContext,
      toolSpecific: {
        tags: ["utility", "differing-site", "notice"],
        issueTypes: ["utility", "notice"],
      },
    },
  });

  // Trigger synthesis after all 4 panels complete
  const synthesisTriggered = useRef(false);
  useEffect(() => {
    if (
      FLAGS.decisionSynthesis &&
      allDone &&
      panels.some((p) => p.text) &&
      !synthesisTriggered.current &&
      !synthesisText &&
      !synthesisStreaming
    ) {
      synthesisTriggered.current = true;
      const panelSummaries = panels
        .filter((p) => p.text)
        .map((p) => {
          const persona = personas.find((pr) => pr.id === p.id);
          return `### ${p.label} (${persona?.role ?? "Stakeholder"})\n${p.text}`;
        })
        .join("\n\n---\n\n");

      sendSynthesis([
        {
          role: "user",
          content: `Original Field Condition:\n${input}\n\n---\n\nBelow are the independent stakeholder reasoning tracks. Synthesize them into a unified decision recommendation.\n\n${panelSummaries}`,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, panels, input, synthesisText, synthesisStreaming, sendSynthesis]);

  const handleGenerate = () => {
    if (!input.trim()) return;
    setStartTime(Date.now());
    synthesisTriggered.current = false;
    resetSynthesis();
    if (activeEvent) snapRef.current = snapshotEvent(activeEvent);
    sendAll((panelId, panelLabel) => {
      const persona = personas.find((p) => p.id === panelId);
      return `Field Condition / Issue:\n${input}\n\nRun a STAKEHOLDER REASONING TRACK for: ${panelLabel} (${persona?.role ?? "Stakeholder"})\nThis person cares about: ${persona?.cares ?? "project outcomes"}\nReading level: ${persona?.readingLevel ?? 7}/10\n\nProduce all required sections: Stakeholder Lens, Primary Concern Triggered (with severity rating), Recommended Position (APPROVE/DELAY/ESCALATE/SEEK CLARIFICATION with rationale, conditions, and timeline), Evidence Cited (from documents), Risk If Delayed (48-hour and 1-week consequences with dollar estimates), and finally the Adapted Communication calibrated to this stakeholder's role and reading level.`;
    });
  };
  const velocitySeconds = allDone && startTime ? Math.round((Date.now() - startTime) / 1000) : null;

  const trustResult: TrustEvalResult | null = useMemo(() => {
    if (!allDone || !panels.some((p) => p.text)) return null;
    const combined = panels.map((p) => p.text).join("\n");
    const badge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });
    return computeTrustStatusForOutput({
      toolType: "decision",
      outputText: combined,
      referencedDocChunks: relevantDocs.map((d) => d.title),
      freshnessLevel: badge.level,
    });
  }, [allDone, panels, activeProject.sourceProfile.sources, relevantDocs]);

  // When all panels complete, queue for review instead of auto-saving
  useEffect(() => {
    if (allDone && panels.some((p) => p.text) && input.trim() && activeEvent && !pendingReview && !reviewDismissed) {
      setPendingReview(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  // Aggregate confidence from the first panel with data (representative for combined trust)
  const aggregateConfidence = useMemo(() => {
    const panelWithData = panels.find((p) => p.confidenceData);
    return panelWithData?.confidenceData ?? null;
  }, [panels]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleApproveDecision = (_items: ReviewItem[]) => {
    if (!activeEvent) return;
    const trust: TrustState | undefined = trustResult
      ? {
          trustStatus: trustResult.status,
          trustReason: trustResult.reason,
          evidenceRefs: { sourceIds: [], docChunkIds: relevantDocs.map((d) => d.title) },
          evaluatedAt: new Date().toISOString(),
          confidenceBreakdown: aggregateConfidence?.confidence_breakdown,
          scoreOverwritten: aggregateConfidence?.score_overwritten,
        }
      : undefined;
    updateEvent(activeEvent.id, {
      decisionRecord: {
        input,
        panels: panels.map((p) => ({ stakeholderId: p.id, output: panelEdits[p.id] ?? p.text, sent: false })),
        trust,
      },
    });
    addHistory(activeEvent.id, {
      action: "Decision package created",
      tab: "decision",
      detail: `${panels.filter((p) => p.text).length} stakeholder panels generated (reviewed)`,
    });
    if (snapRef.current) {
      setDeltas(computeDeltas(snapRef.current, snapshotEvent(activeEvent)));
    }
    setPendingReview(false);
  };

  const handleRejectDecision = () => {
    setPendingReview(false);
    setReviewDismissed(true);
  };

  const loadDemo = () => {
    setInput(`Phase 2 utility relocation is 68% complete. We encountered an unmarked 12" DIP water main at STA 42+50 that conflicts with the proposed storm drain alignment. The contractor submitted RFI-047 requesting a 15-foot horizontal offset. This will require a design revision to the CB-7 junction structure and approximately $45,000 in additional costs. We're evaluating the Type II diffuser specification for the revised outfall location. Schedule impact is estimated at 12 working days if the revision is approved by EOW.`);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleGenerate(); }
      if (e.key === "Escape" && panels.some((p) => p.text)) { e.preventDefault(); reset(); setStartTime(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!activeEvent) return null;

  return (
    <div>
      {velocitySeconds !== null && (
        <div className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] px-4 py-2 mb-4 w-fit ml-auto">
          <Zap size={16} className="text-[var(--color-accent)]" />
          <div>
            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Decision Velocity</div>
            <div className="flex items-center gap-2">
              <span className="font-data text-sm text-[var(--color-text-dim)] line-through">18 days</span>
              <ArrowRight size={12} className="text-[var(--color-accent)]" />
              <span className="font-data text-sm font-bold text-[var(--color-accent)]">{velocitySeconds}s</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle>Field Condition / Issue</SectionTitle>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full h-28 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-accent)] focus:outline-none" placeholder="Enter a field condition, issue, or decision point..." />
          {!input.trim() && (<button onClick={loadDemo} className="flex items-center gap-1.5 mt-2 text-sm text-[var(--color-semantic-purple)] hover:text-[var(--color-text-primary)] transition-colors"><Beaker size={12} /> Load demo scenario</button>)}
          {nudges.length > 0 && (<div className="mt-3 space-y-2">{nudges.slice(0, 2).map((n) => (<IntelligenceNudge key={n.id} nudge={n} />))}</div>)}
        </div>
        <div className="flex flex-col gap-2 justify-end">
          <button onClick={handleGenerate} disabled={isActive || !input.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            {isActive ? (<><Loader2 size={16} className="animate-spin" /> Generating...</>) : (<><Send size={16} /> Generate Package</>)}
          </button>
          {panels.some((p) => p.text) && (<button onClick={() => { reset(); resetSynthesis(); synthesisTriggered.current = false; setStartTime(null); }} className="flex items-center justify-center gap-1.5 py-2 px-4 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"><RotateCcw size={12} /> Reset</button>)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {panels.map((panel) => {
          const persona = personas.find((p) => p.id === panel.id);
          const panelComplete = !panel.isStreaming && panel.text && !panel.error;
          return (
            <div key={panel.id} className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 min-h-[400px] flex flex-col ${panelComplete ? "animate-completion-flash" : ""}`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{panel.emoji}</span>
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">{panel.label}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{persona?.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {panel.isStreaming && (<><Loader2 size={12} className="animate-spin text-[var(--color-accent)]" /><span className="text-xs font-data text-[var(--color-accent)]">Streaming</span></>)}
                  {panelComplete && (
                    <>
                      <button
                        onClick={() => {
                          if (editingPanelId === panel.id) { setEditingPanelId(null); }
                          else { if (!panelEdits[panel.id]) setPanelEdits((prev) => ({ ...prev, [panel.id]: panel.text })); setEditingPanelId(panel.id); }
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
                      >
                        <PenLine size={10} />
                        {editingPanelId === panel.id ? "Preview" : "Edit"}
                      </button>
                      <Clock size={10} className="text-[var(--color-semantic-green)]" />
                      <span className="text-xs font-data text-[var(--color-semantic-green)]">Complete</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {panel.text ? (
                  editingPanelId === panel.id ? (
                    <textarea
                      value={panelEdits[panel.id] ?? panel.text}
                      onChange={(e) => setPanelEdits((prev) => ({ ...prev, [panel.id]: e.target.value }))}
                      className="w-full min-h-[300px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 text-sm text-[var(--color-text-primary)] font-mono leading-relaxed focus:border-[var(--color-accent)] focus:outline-none resize-y"
                    />
                  ) : (
                    <ReasoningOutput text={panelEdits[panel.id] ?? panel.text} isStreaming={panel.isStreaming} variant="reasoning-engine" />
                  )
                ) : panel.error ? (<div className="text-sm text-[var(--color-semantic-red)]">Error: {panel.error}</div>) : (<div className="flex items-center justify-center h-full text-[var(--color-text-dim)] text-xs">Awaiting generation...</div>)}
              </div>
              {panelComplete && <CompletionIndicator text={panel.text} />}
            </div>
          );
        })}
      </div>

      {allDone && panels.some((p) => p.text) && (
        <ConflictAlert
          panels={panels.filter((p) => p.text).map((p) => ({ id: p.id, label: p.label, text: p.text }))}
        />
      )}

      {/* Decision Synthesis Panel — 5th stream */}
      {FLAGS.decisionSynthesis && (synthesisStreaming || synthesisText || synthesisError || synthesisThinking) && (
        <div className={`mt-4 bg-[var(--color-card)] border-2 border-[var(--color-accent)]/30 rounded-[var(--radius-card)] p-5 ${!synthesisStreaming && synthesisText ? "animate-completion-flash" : ""}`}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-[var(--color-accent)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--color-accent)]">Decision Synthesis</div>
                <div className="text-xs text-[var(--color-text-muted)]">Cross-stakeholder analysis &amp; unified recommendation</div>
              </div>
            </div>
            {synthesisStreaming && !synthesisText && synthesisThinking && (
              <div className="flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin text-[var(--color-accent)]" />
                <span className="text-xs font-data text-[var(--color-accent)]">Reasoning...</span>
              </div>
            )}
            {synthesisStreaming && synthesisText && (
              <div className="flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin text-[var(--color-accent)]" />
                <span className="text-xs font-data text-[var(--color-accent)]">Synthesizing...</span>
              </div>
            )}
            {!synthesisStreaming && synthesisText && (
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-[var(--color-semantic-green)]" />
                <span className="text-xs font-data text-[var(--color-semantic-green)]">Complete</span>
              </div>
            )}
          </div>
          {synthesisText ? (
            <ReasoningOutput
              text={synthesisText}
              isStreaming={synthesisStreaming}
              variant="reasoning-engine"
              thinkingText={synthesisThinking}
              isThinking={false}
            />
          ) : synthesisError ? (
            <div className="text-sm text-[var(--color-semantic-red)]">Error: {synthesisError}</div>
          ) : synthesisThinking ? (
            <ReasoningOutput
              text=""
              isStreaming={false}
              thinkingText={synthesisThinking}
              isThinking={synthesisStreaming}
            />
          ) : (
            <div className="flex items-center justify-center h-20 text-[var(--color-text-dim)] text-xs">
              Analyzing stakeholder positions...
            </div>
          )}
          {!synthesisStreaming && synthesisText && <CompletionIndicator text={synthesisText} />}
        </div>
      )}

      {FLAGS.verificationGate && trustResult && (
        <VerificationBanner result={trustResult} confidenceData={aggregateConfidence} />
      )}

      {allDone && panels.some((p) => p.text) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-data text-[var(--color-text-dim)]">
          <Brain size={12} className="text-[var(--color-accent)]" />
          {panels.filter((p) => p.text).length} stakeholder perspectives generated from: {relevantDocs.length} source section{relevantDocs.length !== 1 ? "s" : ""}
          {relevantDocs.filter((d) => d.title.includes("§") || d.title.toLowerCase().includes("section")).length > 0 && (
            <> + {relevantDocs.filter((d) => d.title.includes("§") || d.title.toLowerCase().includes("section")).length} contract clause{relevantDocs.filter((d) => d.title.includes("§") || d.title.toLowerCase().includes("section")).length !== 1 ? "s" : ""}</>
          )}
        </div>
      )}

      {allDone && pendingReview && (
        <ImpactReviewPanel
          title="Review Stakeholder Position Brief"
          items={[
            { label: "Panels", value: `${panels.filter((p) => p.text).length} stakeholder outputs`, editable: false },
            { label: "Input", value: input.slice(0, 120) + (input.length > 120 ? "..." : ""), editable: false },
            { label: "Action", value: "Save to decision record", editable: false },
          ]}
          onApprove={handleApproveDecision}
          onReject={handleRejectDecision}
        />
      )}

      {relevantDocs.length > 0 && (<div className="mt-3 text-xs text-[var(--color-text-dim)] font-data">{relevantDocs.length} document section{relevantDocs.length !== 1 ? "s" : ""} in context</div>)}
      {allDone && panels.some((p) => p.text) && <WhatChangedBar deltas={deltas} />}
    </div>
  );
}
