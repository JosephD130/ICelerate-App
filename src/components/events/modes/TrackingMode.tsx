"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Activity, Loader2, RotateCcw, BarChart3, TrendingUp, Check, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";
import SectionTitle from "@/components/shared/SectionTitle";
import ScoreBar from "@/components/shared/ScoreBar";
import TrendMiniChart from "@/components/shared/TrendMiniChart";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import CompletionIndicator from "@/components/shared/CompletionIndicator";
import ScoreFactorBreakdown from "@/components/shared/ScoreFactorBreakdown";
import VerificationBanner from "@/components/verification/VerificationBanner";
import ImpactReviewPanel, { type ReviewItem } from "@/components/shared/ImpactReviewPanel";
import { computeTrustStatusForOutput, type TrustEvalResult } from "@/lib/validation/trust-evaluator";
import type { TrustState } from "@/lib/models/decision-event";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useEvents } from "@/lib/contexts/event-context";
import { useRole } from "@/lib/contexts/role-context";
import { useMemory } from "@/lib/contexts/memory-context";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import { FLAGS } from "@/lib/flags";
import { searchDocuments } from "@/lib/demo/documents";
import { useStream, type ContentBlock } from "@/lib/hooks/use-stream";
import { computeDeterministicScore } from "@/lib/scoring/monitor-score";
import { extractFieldEntities, type FieldExtraction } from "@/lib/extraction/field-extractor";
import { getVisibleModes } from "@/lib/models/mode-gating";
import type { EventTab } from "@/lib/contexts/event-context";

const GRADE_COLORS: Record<string, string> = {
  A: "var(--color-semantic-green)",
  B: "var(--color-semantic-green)",
  C: "var(--color-semantic-yellow)",
  D: "var(--color-semantic-red)",
  F: "var(--color-semantic-red)",
};

const ROLE_PROMPT: Record<string, { perspective: string; actions: string }> = {
  field: {
    perspective: "You are advising a field superintendent. Focus on schedule impact, crew safety, site constraints, and what needs to happen on the ground today. Avoid financial details or political framing.",
    actions: "3 numbered field actions (e.g., hold zones, crew reallocation, equipment moves, documentation to capture)",
  },
  pm: {
    perspective: "You are advising a project manager. Balance cost exposure, schedule risk, contract compliance, and stakeholder communication. Be operationally thorough.",
    actions: "3 numbered PM actions (e.g., issue notice, update forecast, brief stakeholder, generate RFI)",
  },
  stakeholder: {
    perspective: "You are briefing an executive / public works director. Focus on budget impact as % of contingency, milestone risk, political exposure, and board-ready framing. No technical jargon.",
    actions: "3 numbered executive actions (e.g., approve contingency draw, request briefing, escalate to council)",
  },
};

export default function TrackingMode() {
  const { activeEvent, updateEvent, addHistory, setActiveTab } = useEvents();
  const { activeProject } = useActiveProject();
  const { role } = useRole();
  const { store } = useMemory();

  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [scoreJustApproved, setScoreJustApproved] = useState(false);
  const snapRef = useRef<null>(null);

  const relevantDocs = useMemo(
    () => searchDocuments(activeEvent?.description || "").map((d) => ({ title: `${d.title} — ${d.section}`, content: d.content })),
    [activeEvent?.description]
  );

  const linkedEvidence = useMemo(() => {
    if (!activeEvent) return [];
    return store.getEvidence(activeProject.id)
      .filter(e => e.linkedRiskItemId === activeEvent.id && e.status === "approved");
  }, [activeEvent, activeProject.id, store]);

  const { text, isStreaming, error, confidenceData, send, reset } = useStream({
    tool: "pulse-log",
    context: {
      documents: relevantDocs,
      longTermMemory: { cases: store.getCases(), lessons: store.getLessons() },
      toolSpecific: {
        tags: ["utility", "differing-site", "notice", "subsurface"],
        issueTypes: ["utility", "notice", "differing-site"],
        evidence: linkedEvidence,
        fieldRecord: activeEvent?.fieldRecord,
        rfiRecord: activeEvent?.rfiRecord,
        attachments: activeEvent?.attachments,
        costImpact: activeEvent?.costImpact,
        scheduleImpact: activeEvent?.scheduleImpact,
        contractReferences: activeEvent?.contractReferences,
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

  const deterministicScore = useMemo(() => {
    if (!activeEvent) return null;
    return computeDeterministicScore(activeEvent, activeProject.contingency ?? 312000);
  }, [activeEvent, activeProject.contingency]);

  // Extract structured data from AI output (description, cost, schedule, etc.)
  const fieldExtraction: FieldExtraction | null = useMemo(
    () => (FLAGS.fieldExtraction && isComplete && text ? extractFieldEntities(text) : null),
    [isComplete, text],
  );

  const visibleModes = useMemo(
    () => (activeEvent ? getVisibleModes(activeEvent, role) : []),
    [activeEvent, role],
  );
  const modeIds = useMemo(() => visibleModes.map((m) => m.id), [visibleModes]);

  useEffect(() => {
    if (isComplete && activeEvent && pendingScore === null && !reviewDismissed) {
      const scoreMatch = text.match(/\*\*Score:\s*(\d{1,3})\/100\*\*/i)
        || text.match(/(?:overall|quality|score)[:\s]*(\d{1,3})/i);
      const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 70;
      setPendingScore(score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  if (!activeEvent) return null;

  const handleScore = () => {
    setScoreJustApproved(false);
    const rp = ROLE_PROMPT[role] ?? ROLE_PROMPT.pm;

    // Build rich context from all event data
    const parts: string[] = [
      `Analyze this event and produce a focused risk assessment. Be concise.`,
      `\n\n${rp.perspective}`,
      `\n\n## Event: ${activeEvent.title}\n${activeEvent.description}`,
    ];

    // Field record
    if (activeEvent.fieldRecord) {
      const fr = activeEvent.fieldRecord;
      parts.push(`\n\n## Field Record\nObserver: ${fr.observer ?? "Unknown"}\nLocation: ${fr.location ?? "N/A"}\nObservation:\n${fr.observation}`);
      if (fr.output) parts.push(`\nField AI Analysis:\n${fr.output}`);
    }

    // Cost & schedule
    if (activeEvent.costImpact) {
      parts.push(`\n\nCost Exposure: $${activeEvent.costImpact.estimated.toLocaleString()} (confidence: ${activeEvent.costImpact.confidence})`);
    }
    if (activeEvent.scheduleImpact) {
      parts.push(`Schedule Impact: ${activeEvent.scheduleImpact.daysAffected} days${activeEvent.scheduleImpact.criticalPath ? " (CRITICAL PATH)" : ""}`);
    }

    // Contract references
    if (activeEvent.contractReferences.length > 0) {
      parts.push(`\nContract References: ${activeEvent.contractReferences.map(r => `${r.section} — ${r.clause}${r.noticeDays ? ` (${r.noticeDays}d notice)` : ""}`).join("; ")}`);
    }

    // RFI / contract position
    if (activeEvent.rfiRecord?.output) {
      parts.push(`\n\n## Contract Position Analysis\n${activeEvent.rfiRecord.output}`);
    }

    // Evidence summaries
    if (linkedEvidence.length > 0) {
      parts.push(`\n\n## Linked Evidence (${linkedEvidence.length} items)`);
      for (const evi of linkedEvidence) {
        const s = evi.extractedSignals;
        parts.push(`- ${evi.sourceLabel} (${evi.sourceType}): ${evi.rawContentPreview.slice(0, 150)}...` +
          (s.costDelta ? ` | Cost: $${s.costDelta.toLocaleString()}` : "") +
          (s.scheduleDelta ? ` | Schedule: ${s.scheduleDelta}d` : "") +
          (s.noticeRisk ? ` | NOTICE RISK` : "") +
          (s.clauseRefs?.length ? ` | Clauses: ${s.clauseRefs.join(", ")}` : ""));
      }
    }

    // Attachments (text content)
    const textAttachments = activeEvent.attachments.filter(
      (att) => att.rawText && !att.metadata.base64Data
    );
    if (textAttachments.length > 0) {
      parts.push(`\n\n## Uploaded Documents`);
      for (const att of textAttachments) {
        parts.push(`### ${att.title}\n${att.rawText.slice(0, 5000)}`);
      }
    }

    parts.push(`\n\nData Score: ${deterministicScore?.composite ?? "N/A"}/100 (Grade ${deterministicScore?.grade ?? "N/A"})`);
    parts.push(`\n\nProduce exactly:\n1. **Score: XX/100** — your AI-assessed score\n2. **Top Findings** — 3 bullet points, most important risks or gaps for this role\n3. **Priority Actions** — ${rp.actions}\n\nKeep total output under 300 words.`);

    // Send with vision blocks if images are attached
    const imageAttachments = activeEvent.attachments.filter(
      (att) => att.metadata.base64Data && att.metadata.mediaType?.startsWith("image/")
    );

    if (imageAttachments.length > 0) {
      const contentBlocks: ContentBlock[] = [
        { type: "text", text: parts.join("") },
      ];
      for (const att of imageAttachments) {
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: att.metadata.mediaType!, data: att.metadata.base64Data! },
        });
      }
      send([{ role: "user", content: contentBlocks }]);
    } else {
      send([{ role: "user", content: parts.join("") }]);
    }
  };

  const handleApproveScore = (items: ReviewItem[]) => {
    const scoreItem = items.find((it) => it.label === "Score");
    const score = scoreItem ? Math.min(100, Math.max(0, parseInt(scoreItem.value) || 70)) : (pendingScore ?? 70);
    const summaryItem = items.find((it) => it.label === "Summary");
    const analysis = summaryItem ? summaryItem.value : text.slice(0, 200);
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
    // Build update payload — always save monitor score
    const update: Record<string, unknown> = {
      monitorScores: [...activeEvent.monitorScores, { date: new Date().toISOString().slice(0, 10), score, analysis, trust }],
    };

    // Also persist structured data from AI analysis if not already set
    if (fieldExtraction) {
      // Description — only overwrite if still the raw user input (not yet AI-enriched)
      if (fieldExtraction.executiveSummary && (!activeEvent.description || activeEvent.description === activeEvent.title || activeEvent.description.length < 50)) {
        update.description = fieldExtraction.executiveSummary;
      }
      // Cost
      if (fieldExtraction.suggestedCostRange && !activeEvent.costImpact) {
        update.costImpact = {
          estimated: Math.round((fieldExtraction.suggestedCostRange.low + fieldExtraction.suggestedCostRange.high) / 2),
          currency: "USD",
          confidence: "medium" as const,
          description: `AI-extracted: $${fieldExtraction.suggestedCostRange.low.toLocaleString()}\u2013$${fieldExtraction.suggestedCostRange.high.toLocaleString()}`,
        };
      }
      // Schedule
      if (fieldExtraction.suggestedScheduleDays && !activeEvent.scheduleImpact) {
        update.scheduleImpact = {
          daysAffected: fieldExtraction.suggestedScheduleDays,
          criticalPath: false,
          description: `AI-extracted: ${fieldExtraction.suggestedScheduleDays} working days`,
        };
      }
      // Contract references
      if (fieldExtraction.contractRefsFound.length > 0 && activeEvent.contractReferences.length === 0) {
        update.contractReferences = fieldExtraction.contractRefsFound.map((ref) => ({
          section: ref,
          clause: ref,
          summary: `Referenced in deep analysis: ${ref}`,
        }));
      }
      // Field record (if not already set)
      if (!activeEvent.fieldRecord) {
        update.fieldRecord = {
          observation: activeEvent.description || activeEvent.title,
          location: activeEvent.location || "",
          observer: "System — Deep Analysis",
          timestamp: new Date().toISOString(),
          output: text,
          trust,
        };
      }
    }

    updateEvent(activeEvent.id, update);
    addHistory(activeEvent.id, { action: "Monitor score recorded", tab: "tracking", detail: `Score: ${score}/100 (reviewed)` });
    setPendingScore(null);
    setScoreJustApproved(true);
  };

  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-6 mt-4">
      {/* Left: Tracking checklist + trends */}
      <div className="space-y-4">
        {/* Pipeline Progress — PM view */}
        {role === "pm" && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle>Pipeline Progress</SectionTitle>
            <div className="flex items-center gap-2 mt-3">
              {[
                { label: "Field Record", done: !!activeEvent.fieldRecord },
                { label: "Contract Position", done: !!activeEvent.rfiRecord },
                { label: "Stakeholder Update", done: activeEvent.communications.length > 0 },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  {i > 0 && <ArrowRight size={12} className="text-[var(--color-text-dim)]" />}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: step.done ? "rgba(34,197,94,0.15)" : "var(--color-surface)",
                      color: step.done ? "var(--color-semantic-green)" : "var(--color-text-dim)",
                    }}
                  >
                    {step.done ? <Check size={12} /> : <Circle size={12} />}
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracking checklist */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle>Tracking Checklist</SectionTitle>
          <div className="space-y-1 mt-3">
            {([
              { key: "field-record", done: !!activeEvent.fieldRecord, label: "Field Record pending", doneLabel: "Field Record submitted", target: modeIds.includes("summary") ? "summary" as EventTab : null },
              { key: "rfi", done: !!activeEvent.rfiRecord, label: "RFI pending", doneLabel: "RFI submitted", target: modeIds.includes("contract-position") ? "contract-position" as EventTab : null },
              ...activeEvent.stakeholderNotifications.map((sn) => ({
                key: sn.stakeholderId,
                done: sn.notified,
                label: `${sn.name} not briefed`,
                doneLabel: `${sn.name} briefed`,
                target: modeIds.includes("stakeholder-update") ? "stakeholder-update" as EventTab : null,
              })),
              { key: "notice", done: !!activeEvent.noticeDeadline, label: "Notice not issued", doneLabel: "Notice issued", target: modeIds.includes("contract-position") ? "contract-position" as EventTab : null },
            ] as Array<{ key: string; done: boolean; label: string; doneLabel: string; target: EventTab | null }>).map((item) =>
              item.done ? (
                <div key={item.key} className="flex items-center gap-3 px-2 py-1.5">
                  <Check size={16} className="text-[var(--color-semantic-green)] shrink-0" />
                  <span className="text-sm text-[var(--color-text-primary)]">{item.doneLabel}</span>
                </div>
              ) : item.target ? (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.target!)}
                  className="flex items-center gap-3 w-full text-left rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer group"
                >
                  <Circle size={16} className="text-[var(--color-text-dim)] shrink-0" />
                  <span className="text-sm text-[var(--color-text-dim)] flex-1">{item.label}</span>
                  <ArrowRight size={12} className="text-[var(--color-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <div key={item.key} className="flex items-center gap-3 px-2 py-1.5">
                  <Circle size={16} className="text-[var(--color-text-dim)] shrink-0" />
                  <span className="text-sm text-[var(--color-text-dim)]">{item.label}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Deep Analysis button */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <button
            onClick={handleScore}
            disabled={isStreaming}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? (<><Loader2 size={16} className="animate-spin" /> Analyzing...</>) : (<><Activity size={16} /> Run Deep Analysis</>)}
          </button>
        </div>

        {/* Score trend */}
        {activeEvent.monitorScores.length > 0 && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle icon={<BarChart3 size={12} />}>Score Trend</SectionTitle>
            <div className="space-y-2 mt-2">
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
          </div>
        </div>
      </div>

      {/* Right: Score + AI assessment */}
      <div className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 min-h-[500px] ${isComplete ? "animate-completion-flash" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>{text ? "Deep Analysis" : "Event Health Score"}</SectionTitle>
          {text && (<button onClick={reset} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"><RotateCcw size={14} /></button>)}
        </div>

        {/* AI output (when running or complete) */}
        {text ? (
          <ReasoningOutput text={text} isStreaming={isStreaming} variant="reasoning-engine" />
        ) : error ? (
          <div className="text-sm text-[var(--color-semantic-red)]">Error: {error}</div>
        ) : deterministicScore ? (
          /* Deterministic score card — always visible when no AI text */
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="text-5xl font-bold font-data"
                style={{
                  color: deterministicScore.composite >= 70
                    ? "var(--color-semantic-green)"
                    : deterministicScore.composite >= 40
                      ? "var(--color-semantic-yellow)"
                      : "var(--color-semantic-red)",
                }}
              >
                {deterministicScore.composite}
              </div>
              <div>
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold"
                  style={{
                    backgroundColor: GRADE_COLORS[deterministicScore.grade],
                    color: "var(--color-bg)",
                  }}
                >
                  {deterministicScore.grade}
                </span>
                <div className="text-xs text-[var(--color-text-dim)] mt-1">Event Health Grade</div>
              </div>
            </div>

            <ScoreFactorBreakdown
              score={deterministicScore}
              showDivergence={false}
              aiScore={null}
            />

            <div className="pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={handleScore}
                disabled={isStreaming}
                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Activity size={14} />
                <span>Run Deep Analysis with AI</span>
              </button>
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                AI will assess risk patterns, projections, and priority actions
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-[var(--color-text-dim)] text-sm">
            No event data available
          </div>
        )}

        {FLAGS.verificationGate && isComplete && trustResult && (
          <VerificationBanner result={trustResult} confidenceData={confidenceData} />
        )}
        {isComplete && <CompletionIndicator text={text} />}
        {isComplete && pendingScore !== null && (
          <ImpactReviewPanel
            title="Review Score Before Saving"
            items={[
              { label: "Score", value: String(pendingScore), editable: true },
              { label: "Summary", value: text.slice(0, 200), editable: true },
              { label: "Source", value: "AI-generated risk assessment", editable: false },
            ]}
            onApprove={handleApproveScore}
            onReject={() => { setPendingScore(null); setReviewDismissed(true); }}
          />
        )}

        {/* Next Step CTA — after score approved */}
        {scoreJustApproved && (() => {
          const hasEvidence = activeEvent.evidenceIds.length > 0;
          const hasContractPosition = !!activeEvent.rfiRecord;
          const hasDecision = !!activeEvent.decisionRecord || activeEvent.communications.length > 0;

          let nextLabel = "";
          let nextDescription = "";
          let nextAction: (() => void) | null = null;
          let nextIsLink = false;
          let nextHref = "";

          if (!hasEvidence) {
            nextLabel = "Review Evidence";
            nextDescription = "Link supporting documents to strengthen this event's position.";
            nextIsLink = true;
            nextHref = "/workspace";
          } else if (!hasContractPosition && modeIds.includes("contract-position")) {
            nextLabel = "Generate Contract Position";
            nextDescription = "Cross-reference contract clauses based on linked evidence.";
            nextAction = () => setActiveTab("contract-position");
          } else if (!hasDecision && modeIds.includes("stakeholder-update")) {
            nextLabel = "Generate Stakeholder Update";
            nextDescription = "Create role-adapted communications from this event.";
            nextAction = () => setActiveTab("stakeholder-update");
          } else {
            nextLabel = "Export Decision Package";
            nextDescription = "All stages complete. Export board-ready deliverables.";
            nextIsLink = true;
            nextHref = "/workspace/export";
          }

          return (
            <div className="mt-4 bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-[var(--radius-card)] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-accent)] mb-1.5">
                Score Saved — Next Step
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
                {nextDescription}
              </p>
              {nextIsLink ? (
                <Link href={nextHref} className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all cursor-pointer w-fit">
                  {nextLabel} <ArrowRight size={14} />
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
    </div>
  );
}
