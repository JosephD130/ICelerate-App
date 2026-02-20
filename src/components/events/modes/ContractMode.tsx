"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Loader2, RotateCcw, MapPin, FileText, Pin, Beaker, ArrowDown } from "lucide-react";
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
import { searchDocuments, getAllDocuments } from "@/lib/demo/documents";
import { matchNudges } from "@/lib/demo/long-term-memory";
import { matchClauses, type ClauseMatch } from "@/lib/contract/clause-matcher";
import { assessEntitlement } from "@/lib/contract/entitlement-rubric";
import EntitlementCard from "@/components/shared/EntitlementCard";
import { useStream } from "@/lib/hooks/use-stream";
import { useEvents } from "@/lib/contexts/event-context";
import WhatChangedBar from "@/components/events/WhatChangedBar";
import { snapshotEvent, computeDeltas, type Delta } from "@/lib/ui/delta";

export default function ContractMode() {
  const { activeEvent, updateEvent, addHistory } = useEvents();
  const { activeProject } = useActiveProject();

  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "critical">("urgent");
  const [initialized, setInitialized] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [saved, setSaved] = useState(false);
  const snapRef = useRef<ReturnType<typeof snapshotEvent> | null>(null);
  const autoTriggerRef = useRef(false);

  useEffect(() => {
    if (activeEvent && !initialized) {
      if (activeEvent.rfiRecord?.description) {
        setDescription(activeEvent.rfiRecord.description);
        setUrgency((activeEvent.rfiRecord.urgency as "routine" | "urgent" | "critical") ?? "urgent");
      } else if (activeEvent.description && activeEvent.description.length > 50) {
        // Use AI-enriched executive summary when available
        setDescription(activeEvent.description);
        setAutoPopulated(true);
      } else if (activeEvent.fieldRecord?.observation) {
        // Fall back to raw field observation
        setDescription(activeEvent.fieldRecord.observation);
        setAutoPopulated(true);
      }
      // Severity preselection
      if (!activeEvent.rfiRecord) {
        if (activeEvent.severity === "critical") setUrgency("critical");
        else if (activeEvent.severity === "high") setUrgency("urgent");
      }
      setInitialized(true);
    }
  }, [activeEvent, initialized]);

  // Auto-trigger generation when populated from field record
  useEffect(() => {
    if (autoPopulated && initialized && description.trim() && activeEvent && !activeEvent.rfiRecord && !autoTriggerRef.current) {
      autoTriggerRef.current = true;
      const timer = setTimeout(() => {
        handleGenerate();
      }, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPopulated, initialized, description]);

  const nudges = useMemo(() => matchNudges(description || activeEvent?.description || ""), [description, activeEvent?.description]);

  const eventSearchQuery = [activeEvent?.title, activeEvent?.description, activeEvent?.trigger, description].filter(Boolean).join(" ");

  const relevantDocs = useMemo(
    () => searchDocuments(eventSearchQuery).map((d) => ({ title: `${d.title} — ${d.section}`, content: d.content, section: d.section })),
    [eventSearchQuery]
  );

  const clauseMatches: ClauseMatch[] = useMemo(
    () => (FLAGS.clauseMatching ? matchClauses(eventSearchQuery, getAllDocuments()) : []),
    [eventSearchQuery],
  );

  const entitlement = useMemo(
    () => FLAGS.entitlementRubric && activeEvent ? assessEntitlement(activeEvent, clauseMatches) : null,
    [activeEvent, clauseMatches],
  );

  const { text, isStreaming, error, confidenceData, send, reset } = useStream({
    tool: "rfi",
    context: { documents: relevantDocs.map((d) => ({ title: d.title, content: d.content })) },
  });

  const isComplete = !isStreaming && text.length > 0 && !error;

  const trustResult: TrustEvalResult | null = useMemo(() => {
    if (!isComplete || !text) return null;
    const badge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });
    return computeTrustStatusForOutput({ toolType: "contract", outputText: text, referencedDocChunks: relevantDocs.map((d) => d.section), freshnessLevel: badge.level });
  }, [isComplete, text, activeProject.sourceProfile.sources, relevantDocs]);

  const handleImportFromCapture = () => {
    if (activeEvent?.fieldRecord?.observation) {
      setDescription(activeEvent.fieldRecord.observation);
    }
  };

  const handleGenerate = () => {
    if (!description.trim() || !activeEvent) return;
    const userMessage = `Field Condition Description:\n${description}\n\nLocation: ${activeEvent.location || "Not specified"}\nUrgency: ${urgency}\n\nAnalyze this condition and produce all required sections: Verdict, Relevant Spec Sections, Generated RFI, Notice Window (with deadline and days remaining), Failure Consequence (rights at risk if notice not sent), Entitlement Strength (HIGH/MEDIUM/LOW with factors for and against), and Supporting Clauses table.`;
    if (activeEvent) snapRef.current = snapshotEvent(activeEvent);
    send([{ role: "user", content: userMessage }]);
  };

  const handleSave = () => {
    if (!description.trim() || !activeEvent || !text) return;
    const trust: TrustState | undefined = trustResult
      ? { trustStatus: trustResult.status, trustReason: trustResult.reason, evidenceRefs: { sourceIds: [], docChunkIds: relevantDocs.map((d) => d.section) }, evaluatedAt: new Date().toISOString(), confidenceBreakdown: confidenceData?.confidence_breakdown, scoreOverwritten: confidenceData?.score_overwritten }
      : undefined;
    updateEvent(activeEvent.id, { rfiRecord: { description, urgency, output: text, trust } });
    addHistory(activeEvent.id, { action: trustResult?.status === "verified" ? "RFI generated" : "RFI generated (needs review)", tab: "contract", detail: `Urgency: ${urgency} — ${description.slice(0, 80)}...` });
    if (snapRef.current) setDeltas(computeDeltas(snapRef.current, snapshotEvent(activeEvent)));
    setSaved(true);
  };

  const loadDemo = () => {
    setDescription(`Encountered an unmarked 12" DIP water main at STA 42+50 that conflicts with the proposed storm drain alignment. The contractor is requesting a 15-foot horizontal offset which will require a design revision to the CB-7 junction structure.`);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleGenerate(); }
      if (e.key === "Escape" && text) { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!activeEvent) return null;

  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-6">
      <div className="space-y-4">
        {/* Notice section for notice-contract events */}
        {activeEvent.eventType === "notice-contract" && activeEvent.noticeDeadline && (
          <div className="bg-[var(--color-semantic-red-dim)] border border-[var(--color-semantic-red)] rounded-[var(--radius-card)] p-4">
            <SectionTitle>Notice Deadline</SectionTitle>
            <div className="text-sm font-data text-[var(--color-semantic-red)] font-bold">{new Date(activeEvent.noticeDeadline).toLocaleDateString()}</div>
            {activeEvent.noticeClockDays && <div className="text-xs text-[var(--color-semantic-red)] mt-1">{activeEvent.noticeClockDays}-day notice window</div>}
          </div>
        )}

        {activeEvent.contractReferences.length > 0 && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle icon={<Pin size={12} />}>Attached References</SectionTitle>
            <div className="space-y-2">
              {activeEvent.contractReferences.map((ref, i) => (
                <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-semantic-blue)]/20 rounded-[var(--radius-sm)] p-2.5">
                  <div className="text-sm font-medium text-[var(--color-semantic-blue)]">{ref.section} — {ref.clause}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{ref.summary}</div>
                  {ref.noticeDays && <span className="badge text-[10px] mt-1" style={{ backgroundColor: "var(--color-semantic-red-dim)", color: "var(--color-semantic-red)" }}>{ref.noticeDays}-day notice</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<FileText size={12} />}>RFI Description</SectionTitle>
            {autoPopulated && (
              <span className="text-xs font-data text-[var(--color-semantic-green)]">Populated from field record</span>
            )}
            {!autoPopulated && activeEvent.fieldRecord && !description.trim() && (
              <button onClick={handleImportFromCapture} className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer">
                <ArrowDown size={10} /> Import from Capture
              </button>
            )}
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-32 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-semantic-blue)] focus:outline-none" placeholder="Describe the field condition or contract question..." />
          {!description.trim() && <button onClick={loadDemo} className="flex items-center gap-1.5 mt-2 text-sm text-[var(--color-semantic-blue)] hover:text-[var(--color-text-primary)] transition-colors"><Beaker size={12} /> Load demo scenario</button>}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
                <input value={activeEvent.location ?? ""} readOnly className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2 pl-8 pr-3 text-sm text-[var(--color-text-dim)]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Urgency</label>
              <div className="flex gap-1">
                {(["routine", "urgent", "critical"] as const).map((u) => (
                  <button key={u} onClick={() => setUrgency(u)} className={`flex-1 py-2 rounded-[var(--radius-sm)] text-[10px] font-medium capitalize transition-all ${urgency === u ? u === "critical" ? "bg-[var(--color-semantic-red-dim)] text-[var(--color-semantic-red)] border border-[var(--color-semantic-red)]" : u === "urgent" ? "bg-[var(--color-semantic-yellow-dim)] text-[var(--color-semantic-yellow)] border border-[var(--color-semantic-yellow)]" : "bg-[var(--color-semantic-green-dim)] text-[var(--color-semantic-green)] border border-[var(--color-semantic-green)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"}`}>{u}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {nudges.length > 0 && (<div className="space-y-2"><SectionTitle>Risk Control Layer</SectionTitle>{nudges.slice(0, 3).map((n) => (<IntelligenceNudge key={n.id} nudge={n} />))}</div>)}

        {FLAGS.clauseMatching && clauseMatches.length > 0 ? (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle>Matched Clauses</SectionTitle>
            <div className="space-y-2">
              {clauseMatches.slice(0, 6).map((c) => (
                <div key={c.docId} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-2.5">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium text-[var(--color-semantic-blue)]">{c.section}</span><span className="text-xs font-data text-[var(--color-text-dim)]">{c.matchScore}%</span></div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{c.matchReasons.join(" · ")}</div>
                </div>
              ))}
            </div>
          </div>
        ) : relevantDocs.length > 0 ? (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle>Documents in Context</SectionTitle>
            <div className="space-y-1.5">{relevantDocs.slice(0, 8).map((d, i) => (<div key={i} className="text-sm text-[var(--color-text-secondary)] py-1 px-2 bg-[var(--color-surface)] rounded-[var(--radius-sm)]">{d.title}</div>))}</div>
          </div>
        ) : null}

        <button onClick={handleGenerate} disabled={isStreaming || !description.trim()} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isStreaming ? (<><Loader2 size={16} className="animate-spin" /> Analyzing Specs...</>) : (<><Search size={16} /> Generate RFI</>)}
        </button>
      </div>

      <div className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 min-h-[500px] ${isComplete ? "animate-completion-flash" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Contract Intelligence Output</SectionTitle>
          {text && <button onClick={reset} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"><RotateCcw size={14} /></button>}
        </div>
        {text ? (<ReasoningOutput text={text} isStreaming={isStreaming} variant="reasoning-engine" />) : error ? (<div className="text-sm text-[var(--color-semantic-red)]">Error: {error}</div>) : activeEvent.rfiRecord ? (<div className="space-y-3"><div className="text-sm text-[var(--color-semantic-blue)] font-medium">Previous RFI output</div><div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap bg-[var(--color-surface)] rounded-[var(--radius-sm)] p-3">{activeEvent.rfiRecord.output}</div></div>) : (<div className="flex items-center justify-center h-[400px] text-[var(--color-text-dim)] text-sm">Describe a field condition to generate a spec-referenced RFI</div>)}
        {FLAGS.verificationGate && isComplete && trustResult && <VerificationBanner result={trustResult} confidenceData={confidenceData} />}
        {FLAGS.entitlementRubric && isComplete && entitlement && <EntitlementCard assessment={entitlement} />}
        {isComplete && <CompletionIndicator text={text} />}
        {isComplete && <WhatChangedBar deltas={deltas} />}
        {isComplete && !saved && (
          <div className="mt-3 flex items-center gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors cursor-pointer" style={{ backgroundColor: trustResult?.status === "verified" ? "var(--color-semantic-green)" : "var(--color-semantic-yellow)", color: "var(--color-bg)" }}>
              {trustResult?.status === "verified" ? "Save" : "Save (Needs Review)"}
            </button>
          </div>
        )}
        {saved && <div className="mt-3 text-xs font-data text-[var(--color-semantic-green)]">Saved to event record{trustResult?.status !== "verified" && " — flagged for review"}</div>}
      </div>
    </div>
  );
}
