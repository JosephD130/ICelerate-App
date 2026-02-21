"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, RotateCcw, MapPin, Camera, Beaker, Mic, MicOff } from "lucide-react";
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
import { searchDocuments } from "@/lib/demo/documents";
import { matchNudges } from "@/lib/demo/long-term-memory";
import { extractFieldEntities, type FieldExtraction } from "@/lib/extraction/field-extractor";
import ExtractedEntityChips from "@/components/shared/ExtractedEntityChips";
import { useStream, type ContentBlock } from "@/lib/hooks/use-stream";
import { useEvents } from "@/lib/contexts/event-context";
import { useMemory } from "@/lib/contexts/memory-context";
import WhatChangedBar from "@/components/events/WhatChangedBar";
import { snapshotEvent, computeDeltas, type Delta } from "@/lib/ui/delta";
import { useSpeechToText } from "@/lib/hooks/use-speech-to-text";

const DEMO_OBSERVATION =
  'During excavation at STA 42+50 for the 36" storm drain line, crew encountered an unmarked 12" ductile iron water main running east-west approximately 4 feet below grade. The water main conflicts with our proposed storm drain alignment. Crew has stopped work in this area. No damage to the water main. Contractor superintendent Martinez is on site.';

export default function FieldTab() {
  const { activeEvent, updateEvent, addHistory } = useEvents();
  const { activeProject } = useActiveProject();
  const { store } = useMemory();

  const [observation, setObservation] = useState("");
  const [location, setLocation] = useState("");
  const [observer, setObserver] = useState("");
  const [noticeRequired, setNoticeRequired] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [dictationUsed, setDictationUsed] = useState(false);
  const [saved, setSaved] = useState(false);
  const snapRef = useRef<ReturnType<typeof snapshotEvent> | null>(null);

  // Voice dictation
  const onDictationFinal = useCallback((text: string) => {
    setObservation((prev) => {
      const separator = prev.trim() ? " " : "";
      return prev + separator + text;
    });
    setDictationUsed(true);
  }, []);
  const { isSupported: micSupported, isListening, interimText, error: micError, start: startDictation, stop: stopDictation } = useSpeechToText(onDictationFinal);

  // Quality prompts — lightweight regex checks after dictation stops
  const qualityPrompts = useMemo(() => {
    if (!dictationUsed || !observation.trim()) return [];
    const prompts: string[] = [];
    if (!/STA\s*\d|station|area|zone|phase|address/i.test(observation)) {
      prompts.push("Add station/location");
    }
    if (!/crew|manpower|equipment|operator|worker|labor/i.test(observation)) {
      prompts.push("Add manpower/equipment impact");
    }
    if (!/\b(today|yesterday|morning|afternoon|(\d{1,2}:\d{2})|\d{1,2}\s*(am|pm))\b/i.test(observation)) {
      prompts.push("Add when this occurred");
    }
    return prompts;
  }, [observation, dictationUsed]);

  // Sync initial values from active event once
  useEffect(() => {
    if (activeEvent && !initialized) {
      setObservation(activeEvent.fieldRecord?.observation ?? "");
      setLocation(activeEvent.fieldRecord?.location ?? activeEvent.location ?? "");
      setObserver(activeEvent.fieldRecord?.observer ?? "");
      setNoticeRequired(activeEvent.fieldRecord?.noticeRequired ?? false);
      setInitialized(true);
    }
  }, [activeEvent, initialized]);

  const nudges = useMemo(() => matchNudges(observation), [observation]);
  const relevantDocs = useMemo(
    () =>
      searchDocuments(observation || activeEvent?.description || "")
        .map((d) => ({ title: `${d.title} — ${d.section}`, content: d.content })),
    [observation, activeEvent?.description]
  );

  const linkedEvidence = useMemo(() => {
    if (!activeEvent) return [];
    return store.getEvidence(activeProject.id)
      .filter(e => e.linkedRiskItemId === activeEvent.id && e.status === "approved");
  }, [activeEvent, activeProject.id, store]);

  const { text, isStreaming, error, confidenceData, send, reset } = useStream({
    tool: "field-report",
    context: {
      documents: relevantDocs,
      longTermMemory: { cases: store.getCases(), lessons: store.getLessons() },
      toolSpecific: {
        tags: ["utility", "differing-site", "subsurface"],
        issueTypes: ["utility", "notice", "differing-site"],
        evidence: linkedEvidence,
        attachments: activeEvent?.attachments,
        costImpact: activeEvent?.costImpact,
        scheduleImpact: activeEvent?.scheduleImpact,
        contractReferences: activeEvent?.contractReferences,
      },
    },
  });

  const isComplete = !isStreaming && text.length > 0 && !error;

  // Field entity extraction from AI output
  const fieldExtraction: FieldExtraction | null = useMemo(
    () => (FLAGS.fieldExtraction && isComplete && text ? extractFieldEntities(text) : null),
    [isComplete, text],
  );

  const trustResult: TrustEvalResult | null = useMemo(() => {
    if (!isComplete || !text) return null;
    const badge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });
    return computeTrustStatusForOutput({
      toolType: "field",
      outputText: text,
      freshnessLevel: badge.level,
    });
  }, [isComplete, text, activeProject.sourceProfile.sources]);

  const handleAnalyze = () => {
    if (!observation.trim()) return;

    const parts: string[] = [
      `Field Observation:\n${observation}`,
      `\nLocation: ${location || "Not specified"}`,
      `Observer: ${observer || "Not specified"}`,
      `Date/Time: ${new Date().toISOString()}`,
    ];

    if (linkedEvidence.length > 0) {
      parts.push(`\n## Linked Evidence (${linkedEvidence.length} items)`);
      for (const evi of linkedEvidence) {
        parts.push(`- ${evi.sourceLabel} (${evi.sourceType}): ${evi.rawContentPreview}`);
      }
    }

    if (activeEvent?.attachments?.length) {
      parts.push(`\n## Uploaded Documents`);
      for (const att of activeEvent.attachments) {
        parts.push(`### ${att.title}\n${att.rawText}`);
      }
    }

    parts.push(`\nExtract structured risk intelligence from this field observation and all provided evidence/documents. Produce all required sections: Probable Event Type, Contract Trigger Probability, Cost Exposure Analysis, Schedule Risk Assessment, Impacted Cost Categories, Tasks Most Exposed, Stakeholder Alert Priority, Recommended Immediate Actions, Executive Summary, and Source Citations.`);

    if (activeEvent) snapRef.current = snapshotEvent(activeEvent);

    // Build multipart content blocks if images are attached
    const imageAttachments = (activeEvent?.attachments ?? []).filter(
      (att) => att.metadata.base64Data && att.metadata.mediaType?.startsWith("image/")
    );

    if (imageAttachments.length > 0) {
      const contentBlocks: ContentBlock[] = [
        { type: "text", text: parts.join("\n") },
      ];
      for (const att of imageAttachments) {
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: att.metadata.mediaType!,
            data: att.metadata.base64Data!,
          },
        });
      }
      send([{ role: "user", content: contentBlocks }]);
    } else {
      send([{ role: "user", content: parts.join("\n") }]);
    }
  };

  const handleSave = () => {
    if (!observation.trim() || !activeEvent || !text) return;
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
      description: fieldExtraction?.executiveSummary || observation,
      fieldRecord: {
        observation,
        location,
        observer,
        timestamp: new Date().toISOString(),
        noticeRequired,
        output: text,
        trust,
      },
      // Persist extracted cost/schedule/contract data from AI output
      ...(fieldExtraction?.suggestedCostRange && {
        costImpact: {
          estimated: Math.round(
            (fieldExtraction.suggestedCostRange.low + fieldExtraction.suggestedCostRange.high) / 2
          ),
          currency: "USD",
          confidence: "medium" as const,
          description: `Field-extracted: $${fieldExtraction.suggestedCostRange.low.toLocaleString()}\u2013$${fieldExtraction.suggestedCostRange.high.toLocaleString()}`,
        },
      }),
      ...(fieldExtraction?.suggestedScheduleDays && {
        scheduleImpact: {
          daysAffected: fieldExtraction.suggestedScheduleDays,
          criticalPath: false,
          description: `Field-extracted: ${fieldExtraction.suggestedScheduleDays} working days`,
        },
      }),
      ...(fieldExtraction?.contractRefsFound && fieldExtraction.contractRefsFound.length > 0 && {
        contractReferences: fieldExtraction.contractRefsFound.map((ref) => ({
          section: ref,
          clause: ref,
          summary: `Referenced in field analysis: ${ref}`,
        })),
      }),
    });
    addHistory(activeEvent.id, {
      action: trustResult?.status === "verified"
        ? "Field observation recorded"
        : "Field observation recorded (needs review)",
      tab: "field",
      detail: observation.slice(0, 100) + (observation.length > 100 ? "..." : ""),
    });
    if (snapRef.current) {
      setDeltas(computeDeltas(snapRef.current, snapshotEvent(activeEvent)));
    }
    setSaved(true);
  };

  const loadDemo = () => {
    setObservation(DEMO_OBSERVATION);
    setLocation("STA 42+50, Phase 2 Area B");
    setObserver("Field Crew — Garcia");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleAnalyze();
      }
      if (e.key === "Escape" && text) {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!activeEvent) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6">
      {/* Left — Input */}
      <div className="space-y-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <div className="flex items-center justify-between mb-0">
            <SectionTitle icon={<Camera size={12} />}>
              Field Observation
            </SectionTitle>
            <div className="flex items-center gap-2">
              {isListening && (
                <span className="text-xs text-[var(--color-semantic-green)] animate-pulse font-data">
                  Listening...
                </span>
              )}
              {micSupported ? (
                <button
                  type="button"
                  onClick={isListening ? stopDictation : startDictation}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all cursor-pointer ${
                    isListening
                      ? "bg-[var(--color-semantic-red-dim)] text-[var(--color-semantic-red)]"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]"
                  }`}
                  title={isListening ? "Stop dictation" : "Start dictation"}
                >
                  {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                  {isListening ? "Stop" : "Dictate"}
                </button>
              ) : (
                <span className="text-xs text-[var(--color-text-dim)]" title="Voice input not supported in this browser">
                  <MicOff size={12} className="opacity-40" />
                </span>
              )}
            </div>
          </div>
          {micError && (
            <div className="text-xs text-[var(--color-semantic-red)] mb-1">{micError}</div>
          )}
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full h-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-semantic-green)] focus:outline-none"
            placeholder="Describe what you observed in the field..."
          />
          {interimText && (
            <div className="text-sm text-[var(--color-text-dim)] italic px-1 py-0.5">
              {interimText}
            </div>
          )}

          {qualityPrompts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {qualityPrompts.map((prompt) => (
                <span
                  key={prompt}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-data bg-[var(--color-semantic-yellow-dim)] text-[var(--color-semantic-yellow)]"
                >
                  + {prompt}
                </span>
              ))}
            </div>
          )}

          {!observation.trim() && (
            <button
              onClick={loadDemo}
              className="flex items-center gap-1.5 mt-2 text-sm text-[var(--color-semantic-green)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Beaker size={12} />
              Load demo scenario
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
                />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2 pl-8 pr-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-semantic-green)] focus:outline-none"
                  placeholder="STA 42+50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                Observer
              </label>
              <input
                value={observer}
                onChange={(e) => setObserver(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2 px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-semantic-green)] focus:outline-none"
                placeholder="Name / crew"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={noticeRequired}
              onChange={(e) => setNoticeRequired(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">
              Tag as Notice Required
            </span>
          </label>
        </div>

        {nudges.length > 0 && (
          <div className="space-y-2">
            <SectionTitle>Risk Control Layer</SectionTitle>
            {nudges.slice(0, 3).map((n) => (
              <IntelligenceNudge key={n.id} nudge={n} />
            ))}
          </div>
        )}

        {relevantDocs.length > 0 && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle>Documents in Context</SectionTitle>
            <div className="space-y-1.5">
              {relevantDocs.slice(0, 5).map((d, i) => (
                <div
                  key={i}
                  className="text-sm text-[var(--color-text-secondary)] py-1 px-2 bg-[var(--color-surface)] rounded-[var(--radius-sm)]"
                >
                  {d.title}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={isStreaming || !observation.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStreaming ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send size={16} />
              Analyze Observation
            </>
          )}
        </button>
      </div>

      {/* Right — Output */}
      <div
        className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 min-h-[500px] ${
          isComplete ? "animate-completion-flash" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Structured Risk Extraction</SectionTitle>
          {text && (
            <button
              onClick={reset}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {text ? (
          <ReasoningOutput text={text} isStreaming={isStreaming} />
        ) : error ? (
          <div className="text-sm text-[var(--color-semantic-red)]">
            Error: {error}
          </div>
        ) : activeEvent.fieldRecord ? (
          <div className="space-y-3">
            <div className="text-sm text-[var(--color-semantic-green)] font-medium">
              Field record exists for this event
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface)] rounded-[var(--radius-sm)] p-3">
              {activeEvent.fieldRecord.observation}
            </div>
            <div className="text-xs text-[var(--color-text-dim)] font-data">
              Recorded {new Date(activeEvent.fieldRecord.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-[var(--color-text-dim)] text-sm">
            Describe a field observation to generate analysis
          </div>
        )}

        {FLAGS.verificationGate && isComplete && trustResult && (
          <VerificationBanner result={trustResult} confidenceData={confidenceData} />
        )}
        {FLAGS.fieldExtraction && isComplete && fieldExtraction && fieldExtraction.entities.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-bold uppercase tracking-[1px] text-[var(--color-text-muted)] mb-2">Extracted Entities</div>
            <ExtractedEntityChips entities={fieldExtraction.entities} />
            {fieldExtraction.suggestedCostRange && (
              <div className="text-xs font-data text-[var(--color-text-dim)] mt-1.5">
                Suggested cost range: ${fieldExtraction.suggestedCostRange.low.toLocaleString()} – ${fieldExtraction.suggestedCostRange.high.toLocaleString()}
              </div>
            )}
            {fieldExtraction.suggestedScheduleDays && (
              <div className="text-xs font-data text-[var(--color-text-dim)]">
                Suggested schedule impact: {fieldExtraction.suggestedScheduleDays} days
              </div>
            )}
          </div>
        )}
        {isComplete && <CompletionIndicator text={text} />}
        {isComplete && <WhatChangedBar deltas={deltas} />}
        {isComplete && !saved && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: trustResult?.status === "verified"
                  ? "var(--color-semantic-green)"
                  : "var(--color-semantic-yellow)",
                color: "var(--color-bg)",
              }}
            >
              {trustResult?.status === "verified" ? "Save" : "Save (Needs Review)"}
            </button>
          </div>
        )}
        {saved && (
          <div className="mt-3 text-xs font-data text-[var(--color-semantic-green)]">
            Saved to event record
            {trustResult?.status !== "verified" && " — flagged for review"}
          </div>
        )}
      </div>
    </div>
  );
}
