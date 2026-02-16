"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, RotateCcw, MapPin, Camera, Beaker, Mic, MicOff, Paperclip, Mail, FileText as FileTextIcon, PenLine } from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import IntelligenceNudge from "@/components/shared/IntelligenceNudge";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import CompletionIndicator from "@/components/shared/CompletionIndicator";
import VerificationBanner from "@/components/verification/VerificationBanner";
import { computeTrustStatusForOutput, type TrustEvalResult } from "@/lib/validation/trust-evaluator";
import type { TrustState, EventAttachment } from "@/lib/models/decision-event";
import { useActiveProject } from "@/lib/contexts/project-context";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import { FLAGS } from "@/lib/flags";
import { searchDocuments } from "@/lib/demo/documents";
import { matchNudges } from "@/lib/demo/long-term-memory";
import { extractFieldEntities, type FieldExtraction } from "@/lib/extraction/field-extractor";
import ExtractedEntityChips from "@/components/shared/ExtractedEntityChips";
import { useStream } from "@/lib/hooks/use-stream";
import { useEvents } from "@/lib/contexts/event-context";
import WhatChangedBar from "@/components/events/WhatChangedBar";
import { snapshotEvent, computeDeltas, type Delta } from "@/lib/ui/delta";
import { useSpeechToText } from "@/lib/hooks/use-speech-to-text";
import AttachmentChip from "./AttachmentChip";
import { extractPdfText } from "@/lib/utils/pdf-extract";

const DEMO_OBSERVATION = `Date: 2/15/2026, 5:00am. Weather: Clear, 85°F+, light wind, dry humidity. Report No. 61.

Workforce — Prime: SM supervisor (1), laborers (8), foreman (3), operators (7), sweeper operator (1), mechanic (1), QC inspector (1). Total: 23. Subs: Magnum Oil Spreading (2 workers), Twinning Inspection (4 workers).

Equipment: Rollers (3), paver box (1), tack truck (1), skiploader (1), sand truck (1), sweeper (1), utility trucks (6).

Construction Activities: Start time 5:00am completing intersection on Old Conejo Rd as well as hand work between islands in crosswalk. Total barricade with traffic control set up and moved accordingly following the paving crew. All flaggers in all locations when needed. Once out of the intersection, crew completed the straightaway locations and areas where PRS will need to grind the following day. All tabs placed in completed paved locations. Twinning inspection along with Sully Miller QC testing compaction and coring. Samples collected at all locations needed. Sweeper working throughout the day for good housekeeping. All sidewalks blown off. All equipment parked in approved location per CTO inspection with delineation around equipment and stockpiles. Crew off location at 3:00pm, will return the following day to fix repair and complete Reino Rd.

Phase 2 utility relocation encountered an unmarked 12" DIP water main at STA 42+50 conflicting with storm drain alignment. Contractor submitted RFI-047 for 15-foot horizontal offset requiring CB-7 junction revision. Estimated $45,000 additional cost, 12 working days if approved by EOW.`;

export default function CaptureMode() {
  const { activeEvent, updateEvent, addHistory } = useEvents();
  const { activeProject } = useActiveProject();

  const [observation, setObservation] = useState("");
  const [location, setLocation] = useState("");
  const [observer, setObserver] = useState("");
  const [noticeRequired, setNoticeRequired] = useState(false);
  const [attachments, setAttachments] = useState<EventAttachment[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [dictationUsed, setDictationUsed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState<string | null>(null);
  const snapRef = useRef<ReturnType<typeof snapshotEvent> | null>(null);

  const onDictationFinal = useCallback((text: string) => {
    setObservation((prev) => {
      const separator = prev.trim() ? " " : "";
      return prev + separator + text;
    });
    setDictationUsed(true);
  }, []);
  const { isSupported: micSupported, isListening, interimText, error: micError, start: startDictation, stop: stopDictation } = useSpeechToText(onDictationFinal);

  const qualityPrompts = useMemo(() => {
    if (!dictationUsed || !observation.trim()) return [];
    const prompts: string[] = [];
    if (!/STA\s*\d|station|area|zone|phase|address/i.test(observation)) prompts.push("Add station/location");
    if (!/crew|manpower|equipment|operator|worker|labor/i.test(observation)) prompts.push("Add manpower/equipment impact");
    if (!/\b(today|yesterday|morning|afternoon|(\d{1,2}:\d{2})|\d{1,2}\s*(am|pm))\b/i.test(observation)) prompts.push("Add when this occurred");
    return prompts;
  }, [observation, dictationUsed]);

  useEffect(() => {
    if (activeEvent && !initialized) {
      setObservation(activeEvent.fieldRecord?.observation ?? "");
      setLocation(activeEvent.fieldRecord?.location ?? activeEvent.location ?? "");
      setObserver(activeEvent.fieldRecord?.observer ?? "");
      setNoticeRequired(activeEvent.fieldRecord?.noticeRequired ?? false);
      setAttachments(activeEvent.attachments ?? []);
      setInitialized(true);
    }
  }, [activeEvent, initialized]);

  const nudges = useMemo(() => matchNudges(observation), [observation]);
  const relevantDocs = useMemo(
    () => searchDocuments(observation || activeEvent?.description || "").map((d) => ({ title: `${d.title} — ${d.section}`, content: d.content })),
    [observation, activeEvent?.description]
  );

  const { text, isStreaming, error, confidenceData, send, reset } = useStream({
    tool: "field-report",
    context: { documents: relevantDocs },
  });

  const isComplete = !isStreaming && text.length > 0 && !error;

  const fieldExtraction: FieldExtraction | null = useMemo(
    () => (FLAGS.fieldExtraction && isComplete && text ? extractFieldEntities(text) : null),
    [isComplete, text],
  );

  const trustResult: TrustEvalResult | null = useMemo(() => {
    if (!isComplete || !text) return null;
    const badge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });
    return computeTrustStatusForOutput({ toolType: "field", outputText: text, freshnessLevel: badge.level });
  }, [isComplete, text, activeProject.sourceProfile.sources]);

  const handleAnalyze = () => {
    if (!observation.trim() && attachments.length === 0) return;
    const attachmentContext = attachments.length > 0
      ? `\n\nAttachments (${attachments.length}):\n${attachments.map((a) => `- [${a.kind}] ${a.title}: ${a.rawText.slice(0, 200)}`).join("\n")}`
      : "";
    const observationBlock = observation.trim()
      ? `Field Observation:\n${observation}`
      : `Field Observation (from ${attachments.length} attachment(s)):\n${attachments.map((a) => `- [${a.kind}] ${a.title}: ${a.rawText.slice(0, 200)}`).join("\n")}`;
    const userMessage = `${observationBlock}\n\nLocation: ${location || "Not specified"}\nObserver: ${observer || "Not specified"}\nDate/Time: ${new Date().toISOString()}${observation.trim() ? attachmentContext : ""}\n\nProduce a standardized Daily Construction Report (DCR) from this field observation. Extract all structured data (weather, workforce, equipment, visitors, bid items) and produce all required sections: Report Header, Workforce Summary, Equipment Utilized, Field Visitors, Bid Items, Construction Activities, Non-Compliances/Safety/Condition Changes, and Risk Intelligence (Probable Event Type, Contract Trigger Probability, Cost Exposure Analysis, Schedule Risk Assessment, Stakeholder Alert Priority, Recommended Immediate Actions, Source Citations).`;
    if (activeEvent) snapRef.current = snapshotEvent(activeEvent);
    send([{ role: "user", content: userMessage }]);
  };

  const handleSave = () => {
    if (!observation.trim() || !activeEvent || !text) return;
    const finalOutput = editedText ?? text;
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
      fieldRecord: { observation, location, observer, timestamp: new Date().toISOString(), noticeRequired, output: finalOutput, trust },
      attachments,
    });
    addHistory(activeEvent.id, {
      action: trustResult?.status === "verified" ? "Field observation recorded" : "Field observation recorded (needs review)",
      tab: "capture",
      detail: observation.slice(0, 100) + (observation.length > 100 ? "..." : ""),
    });
    if (snapRef.current) setDeltas(computeDeltas(snapRef.current, snapshotEvent(activeEvent)));
    setSaved(true);
  };

  const handleFileAdd = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.txt,.csv,.doc,.docx";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const id = `att-${Date.now()}`;
      const att: EventAttachment = {
        id,
        kind: "document",
        title: file.name,
        rawText: "",
        metadata: { type: file.type, size: String(file.size) },
        addedAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, att]);

      if (file.type === "application/pdf") {
        extractPdfText(file).then((text) => {
          if (text) {
            setAttachments((prev) =>
              prev.map((a) => a.id === id ? { ...a, rawText: text.slice(0, 50_000) } : a)
            );
          }
        });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const text = typeof reader.result === "string" ? reader.result : "";
          if (text) {
            setAttachments((prev) =>
              prev.map((a) => a.id === id ? { ...a, rawText: text.slice(0, 50_000) } : a)
            );
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const loadDemo = () => {
    setObservation(DEMO_OBSERVATION);
    setLocation("STA 42+50, Phase 2 Area B");
    setObserver("Field Crew — Garcia");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleAnalyze(); }
      if (e.key === "Escape" && text) { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!activeEvent) return null;

  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-6">
      {/* Left — Input */}
      <div className="space-y-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <div className="flex items-center justify-between mb-0">
            <SectionTitle icon={<Camera size={12} />}>Field Observation</SectionTitle>
            <div className="flex items-center gap-2">
              {isListening && <span className="text-xs text-[var(--color-semantic-green)] animate-pulse font-data">Listening...</span>}
              {micSupported ? (
                <button type="button" onClick={isListening ? stopDictation : startDictation} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all cursor-pointer ${isListening ? "bg-[var(--color-semantic-red-dim)] text-[var(--color-semantic-red)]" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]"}`} title={isListening ? "Stop dictation" : "Start dictation"}>
                  {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                  {isListening ? "Stop" : "Dictate"}
                </button>
              ) : (
                <span className="text-xs text-[var(--color-text-dim)]" title="Voice input not supported"><MicOff size={12} className="opacity-40" /></span>
              )}
            </div>
          </div>
          {micError && <div className="text-xs text-[var(--color-semantic-red)] mb-1">{micError}</div>}
          <textarea value={observation} onChange={(e) => setObservation(e.target.value)} className="w-full h-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-semantic-green)] focus:outline-none" placeholder="Describe what you observed in the field..." />
          {interimText && <div className="text-sm text-[var(--color-text-dim)] italic px-1 py-0.5">{interimText}</div>}
          {qualityPrompts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {qualityPrompts.map((prompt) => (<span key={prompt} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-data bg-[var(--color-semantic-yellow-dim)] text-[var(--color-semantic-yellow)]">+ {prompt}</span>))}
            </div>
          )}
          {!observation.trim() && (
            <button onClick={loadDemo} className="flex items-center gap-1.5 mt-2 text-sm text-[var(--color-semantic-green)] hover:text-[var(--color-text-primary)] transition-colors"><Beaker size={12} /> Load demo scenario</button>
          )}

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2 pl-8 pr-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-semantic-green)] focus:outline-none" placeholder="STA 42+50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Observer</label>
              <input value={observer} onChange={(e) => setObserver(e.target.value)} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2 px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-semantic-green)] focus:outline-none" placeholder="Name / crew" />
            </div>
          </div>

          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="checkbox" checked={noticeRequired} onChange={(e) => setNoticeRequired(e.target.checked)} className="accent-[var(--color-accent)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">Tag as Notice Required</span>
          </label>
        </div>

        {/* Attachments */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle icon={<Paperclip size={12} />}>Attachments</SectionTitle>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((a) => (
                <AttachmentChip key={a.id} attachment={a} onRemove={() => handleRemoveAttachment(a.id)} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={handleFileAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 transition-all cursor-pointer">
              <Paperclip size={12} /> Add File
            </button>
            <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-dim)] opacity-50 cursor-not-allowed">
              <Mail size={12} /> Import Email
              <span className="badge text-[8px] px-1 py-0 ml-1" style={{ backgroundColor: "var(--color-semantic-blue-dim)", color: "var(--color-semantic-blue)" }}>Soon</span>
            </button>
            <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-dim)] opacity-50 cursor-not-allowed">
              <FileTextIcon size={12} /> Import Report
              <span className="badge text-[8px] px-1 py-0 ml-1" style={{ backgroundColor: "var(--color-semantic-blue-dim)", color: "var(--color-semantic-blue)" }}>Soon</span>
            </button>
          </div>
        </div>

        {nudges.length > 0 && (
          <div className="space-y-2">
            <SectionTitle>Risk Control Layer</SectionTitle>
            {nudges.slice(0, 3).map((n) => (<IntelligenceNudge key={n.id} nudge={n} />))}
          </div>
        )}

        <button onClick={handleAnalyze} disabled={isStreaming || (!observation.trim() && attachments.length === 0)} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isStreaming ? (<><Loader2 size={16} className="animate-spin" /> Analyzing...</>) : (<><Send size={16} /> Analyze Observation</>)}
        </button>
      </div>

      {/* Right — Output */}
      <div className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 min-h-[500px] ${isComplete ? "animate-completion-flash" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Structured Risk Extraction</SectionTitle>
          {text && <button onClick={reset} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"><RotateCcw size={14} /></button>}
        </div>

        {text ? (
          isEditing ? (
            <textarea
              value={editedText ?? text}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full min-h-[300px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 text-sm text-[var(--color-text-primary)] font-mono leading-relaxed focus:border-[var(--color-accent)] focus:outline-none resize-y"
            />
          ) : (
            <ReasoningOutput text={editedText ?? text} isStreaming={isStreaming} />
          )
        ) : error ? (
          <div className="text-sm text-[var(--color-semantic-red)]">Error: {error}</div>
        ) : activeEvent.fieldRecord ? (
          <div className="space-y-3">
            <div className="text-sm text-[var(--color-semantic-green)] font-medium">Field record exists for this event</div>
            <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface)] rounded-[var(--radius-sm)] p-3">{activeEvent.fieldRecord.observation}</div>
            <div className="text-xs text-[var(--color-text-dim)] font-data">Recorded {new Date(activeEvent.fieldRecord.timestamp).toLocaleString()}</div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-[var(--color-text-dim)] text-sm">Describe a field observation to generate analysis</div>
        )}

        {isComplete && attachments.length > 0 && (
          <div className="text-xs font-data text-[var(--color-text-dim)] mt-2">
            Generated from: observation + {attachments.length} attachment{attachments.length !== 1 ? "s" : ""}
          </div>
        )}

        {FLAGS.verificationGate && isComplete && trustResult && <VerificationBanner result={trustResult} confidenceData={confidenceData} />}
        {FLAGS.fieldExtraction && isComplete && fieldExtraction && fieldExtraction.entities.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-bold uppercase tracking-[1px] text-[var(--color-text-muted)] mb-2">Extracted Entities</div>
            <ExtractedEntityChips entities={fieldExtraction.entities} />
            {fieldExtraction.suggestedCostRange && <div className="text-xs font-data text-[var(--color-text-dim)] mt-1.5">Suggested cost range: ${fieldExtraction.suggestedCostRange.low.toLocaleString()} – ${fieldExtraction.suggestedCostRange.high.toLocaleString()}</div>}
            {fieldExtraction.suggestedScheduleDays && <div className="text-xs font-data text-[var(--color-text-dim)]">Suggested schedule impact: {fieldExtraction.suggestedScheduleDays} days</div>}
          </div>
        )}
        {isComplete && <CompletionIndicator text={text} />}
        {isComplete && <WhatChangedBar deltas={deltas} />}
        {isComplete && !saved && (
          <div className="mt-3 flex items-center gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors cursor-pointer" style={{ backgroundColor: trustResult?.status === "verified" ? "var(--color-semantic-green)" : "var(--color-semantic-yellow)", color: "var(--color-bg)" }}>
              {trustResult?.status === "verified" ? "Save" : "Save (Needs Review)"}
            </button>
            <button
              onClick={() => { if (!isEditing) setEditedText(text); setIsEditing(!isEditing); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
            >
              <PenLine size={12} /> {isEditing ? "Preview" : "Edit"}
            </button>
          </div>
        )}
        {saved && <div className="mt-3 text-xs font-data text-[var(--color-semantic-green)]">Saved to event record{trustResult?.status !== "verified" && " — flagged for review"}</div>}
      </div>
    </div>
  );
}
