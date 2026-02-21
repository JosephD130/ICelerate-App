"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Send, Loader2, RotateCcw, Clock, ArrowRight, Zap, Beaker, Brain, ChevronDown, ChevronUp, Check, PenLine,
} from "lucide-react";
import Link from "next/link";
import PersonaCard from "@/components/tools/translator/PersonaCard";
import ToneSliders, { type ToneSettings } from "@/components/tools/translator/ToneSliders";
import BriefingRoomSelector from "@/components/tools/translator/BriefingRoomSelector";
import SectionTitle from "@/components/shared/SectionTitle";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import CompletionIndicator from "@/components/shared/CompletionIndicator";
import VerificationBanner from "@/components/verification/VerificationBanner";
import ImpactReviewPanel, { type ReviewItem } from "@/components/shared/ImpactReviewPanel";
import { computeTrustStatusForOutput, type TrustEvalResult } from "@/lib/validation/trust-evaluator";
import type { TrustState } from "@/lib/models/decision-event";
import { useActiveProject } from "@/lib/contexts/project-context";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import { FLAGS } from "@/lib/flags";
import { personas, type BriefingRoom, getRoom, getPersona } from "@/lib/demo/personas";
import { searchDocuments } from "@/lib/demo/documents";
import { useStream } from "@/lib/hooks/use-stream";
import { useMultiStream } from "@/lib/hooks/use-multi-stream";
import { useEvents } from "@/lib/contexts/event-context";
import { useMemory } from "@/lib/contexts/memory-context";
import WhatChangedBar from "@/components/events/WhatChangedBar";
import { snapshotEvent, computeDeltas, type Delta } from "@/lib/ui/delta";
import { useRole } from "@/lib/contexts/role-context";

interface AudiencePreset {
  id: string;
  label: string;
  personaId: string;
  room: BriefingRoom;
  tone: ToneSettings;
  description: string;
  multiStakeholder: boolean;
}

const AUDIENCE_PRESETS: AudiencePreset[] = [
  { id: "city-council", label: "City Council", personaId: "chen", room: "city-hall", tone: { formality: 85, urgency: 40, optimism: 60 }, description: "Formal, budget-focused, politically aware", multiStakeholder: false },
  { id: "hoa-meeting", label: "HOA Meeting", personaId: "chen", room: "conference-room", tone: { formality: 60, urgency: 30, optimism: 70 }, description: "Reassuring, community-focused, plain language", multiStakeholder: false },
  { id: "decision-intelligence", label: "Decision Intelligence", personaId: "torres", room: "field-trailer", tone: { formality: 50, urgency: 50, optimism: 40 }, description: "Cross-stakeholder analysis with synthesis", multiStakeholder: true },
  { id: "emergency", label: "Emergency", personaId: "martinez", room: "jobsite", tone: { formality: 20, urgency: 95, optimism: 20 }, description: "Immediate action, critical info only", multiStakeholder: false },
  { id: "board-summary", label: "Board Summary", personaId: "rawlings", room: "conference-room", tone: { formality: 90, urgency: 35, optimism: 55 }, description: "Executive overview, financial focus", multiStakeholder: false },
];

const STAKEHOLDER_PANELS = personas.map((p) => ({
  id: p.id,
  label: p.name,
  emoji: p.emoji,
}));

export default function StakeholderUpdateMode() {
  const { activeEvent, updateEvent, addHistory, setActiveTab } = useEvents();
  const { activeProject } = useActiveProject();
  const { role } = useRole();
  const { store } = useMemory();

  // Auto-populated input from FULL pipeline context
  const autoInput = useMemo(() => {
    if (!activeEvent) return "";
    const parts: string[] = [];
    if (activeEvent.description) parts.push(activeEvent.description);
    if (activeEvent.fieldRecord?.observation) parts.push(`Field Observation:\n${activeEvent.fieldRecord.observation}`);
    if (activeEvent.fieldRecord?.output) parts.push(`Field Analysis:\n${activeEvent.fieldRecord.output}`);
    if (activeEvent.rfiRecord?.output) parts.push(`Contract Position Analysis:\n${activeEvent.rfiRecord.output}`);
    if (activeEvent.costImpact) parts.push(`Cost Exposure: $${activeEvent.costImpact.estimated.toLocaleString()} (${activeEvent.costImpact.confidence} confidence)`);
    if (activeEvent.scheduleImpact) parts.push(`Schedule Impact: ${activeEvent.scheduleImpact.daysAffected} days${activeEvent.scheduleImpact.criticalPath ? " (critical path)" : ""}`);
    return parts.join("\n\n");
  }, [activeEvent]);

  // Role-based default preset — PM and field both default to Decision Intelligence
  const defaultPreset = role === "stakeholder" ? "board-summary" : "decision-intelligence";

  const [input, setInput] = useState("");
  const [activePreset, setActivePreset] = useState<string>(defaultPreset);
  const [isMultiMode, setIsMultiMode] = useState(AUDIENCE_PRESETS.find((p) => p.id === defaultPreset)?.multiStakeholder ?? false);
  const [selectedPersona, setSelectedPersona] = useState("chen");
  const [room, setRoom] = useState<BriefingRoom>("city-hall");
  const [tone, setTone] = useState<ToneSettings>({ formality: 70, urgency: 50, optimism: 40 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pendingReview, setPendingReview] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [panelEdits, setPanelEdits] = useState<Record<string, string>>({});
  const [isEditingSingle, setIsEditingSingle] = useState(false);
  const [editedSingleText, setEditedSingleText] = useState<string | null>(null);
  const snapRef = useRef<ReturnType<typeof snapshotEvent> | null>(null);

  useEffect(() => {
    if (activeEvent && !initialized) {
      setInput(autoInput);
      setInitialized(true);
    }
  }, [activeEvent, initialized, autoInput]);

  const relevantDocs = useMemo(
    () => searchDocuments(input || activeEvent?.description || "").map((d) => ({ title: `${d.title} — ${d.section}`, content: d.content })),
    [input, activeEvent?.description]
  );

  const memoryContext = useMemo(() => ({
    cases: store.getCases(),
    lessons: store.getLessons(),
  }), [store]);

  // Multi-stakeholder stream (Decision Package pattern)
  const { panels, isActive: multiActive, sendAll, reset: multiReset } = useMultiStream(
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

  // Single-persona stream (Communication pattern)
  const persona = getPersona(selectedPersona);
  const roomConfig = getRoom(room);
  const { text: singleText, isStreaming: singleStreaming, error: singleError, confidenceData: singleConfidence, send: singleSend, reset: singleReset } = useStream({
    tool: "translator",
    context: {
      documents: relevantDocs,
      toolSpecific: {
        persona: persona ? { name: persona.name, role: persona.role, cares: persona.cares } : undefined,
        room: roomConfig ? { name: roomConfig.name, tone: roomConfig.tone, includes: roomConfig.includes, excludes: roomConfig.excludes, maxLength: roomConfig.maxLength } : undefined,
        tone: { formality: tone.formality, urgency: tone.urgency, optimism: tone.optimism },
      },
    },
  });

  const singleComplete = !singleStreaming && singleText.length > 0 && !singleError;
  const allMultiDone = panels.every((p) => !p.isStreaming && (p.text || p.error));
  const multiVelocity = allMultiDone && startTime ? Math.round((Date.now() - startTime) / 1000) : null;
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({});

  // Trigger synthesis after all 4 panels complete
  const synthesisTriggered = useRef(false);
  useEffect(() => {
    if (
      FLAGS.decisionSynthesis &&
      isMultiMode &&
      allMultiDone &&
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
  }, [allMultiDone, panels, input, synthesisText, synthesisStreaming, sendSynthesis, isMultiMode]);

  const applyPreset = (preset: AudiencePreset) => {
    setActivePreset(preset.id);
    setIsMultiMode(preset.multiStakeholder);
    setSelectedPersona(preset.personaId);
    setRoom(preset.room);
    setTone(preset.tone);
  };

  const trustResult: TrustEvalResult | null = useMemo(() => {
    if (isMultiMode) {
      if (!allMultiDone || !panels.some((p) => p.text)) return null;
      const combined = panels.map((p) => p.text).join("\n");
      const badge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });
      return computeTrustStatusForOutput({ toolType: "decision", outputText: combined, referencedDocChunks: relevantDocs.map((d) => d.title), freshnessLevel: badge.level });
    } else {
      if (!singleComplete || !singleText) return null;
      const badge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });
      return computeTrustStatusForOutput({ toolType: "communication", outputText: singleText, freshnessLevel: badge.level });
    }
  }, [isMultiMode, allMultiDone, panels, singleComplete, singleText, activeProject.sourceProfile.sources, relevantDocs]);

  // Multi: queue for review
  useEffect(() => {
    if (isMultiMode && allMultiDone && panels.some((p) => p.text) && input.trim() && activeEvent && !pendingReview && !reviewDismissed) {
      setPendingReview(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMultiDone]);

  const handleGenerate = () => {
    if (!input.trim() || !activeEvent) return;
    if (activeEvent) snapRef.current = snapshotEvent(activeEvent);
    synthesisTriggered.current = false;
    resetSynthesis();

    if (isMultiMode) {
      setStartTime(Date.now());
      sendAll((panelId, panelLabel) => {
        const p = personas.find((x) => x.id === panelId);
        return `Field Condition / Issue:\n${input}\n\nRun a STAKEHOLDER REASONING TRACK for: ${panelLabel} (${p?.role ?? "Stakeholder"})\nThis person cares about: ${p?.cares ?? "project outcomes"}\nReading level: ${p?.readingLevel ?? 7}/10\n\nProduce all required sections: Stakeholder Lens, Primary Concern Triggered (with severity rating), Recommended Position (APPROVE/DELAY/ESCALATE/SEEK CLARIFICATION with rationale, conditions, and timeline), Evidence Cited (from documents), Risk If Delayed (48-hour and 1-week consequences with dollar estimates), and finally the Adapted Communication calibrated to this stakeholder's role and reading level.`;
      });
    } else {
      if (!persona || !roomConfig) return;
      const userMessage = `Technical Update:\n${input}\n\nTarget Persona: ${persona.name} (${persona.role})\nCares about: ${persona.cares}\nReading level: ${persona.readingLevel}/10\n\nBriefing Room: ${roomConfig.name}\nRoom tone: ${roomConfig.tone}\nRoom max length: ${roomConfig.maxLength}\nRoom includes: ${roomConfig.includes.join(", ")}\nRoom excludes: ${roomConfig.excludes.join(", ")}\n\nTone Settings:\n- Formality: ${tone.formality}/100\n- Urgency: ${tone.urgency}/100\n- Optimism: ${tone.optimism}/100\n\nProvide:\n1. The adapted communication for this persona in this briefing room\n2. A "Jargon Map" section mapping technical terms to plain language\n3. A "Persona Reaction" section predicting how ${persona.name} will react\n4. A "Key Concerns" section listing what ${persona.name} will worry about most`;
      singleSend([{ role: "user", content: userMessage }]);
    }
  };

  const handleApproveMulti = (_items: ReviewItem[]) => {
    if (!activeEvent) return;
    const aggregateConfidence = panels.find((p) => p.confidenceData)?.confidenceData ?? null;
    const trust: TrustState | undefined = trustResult
      ? { trustStatus: trustResult.status, trustReason: trustResult.reason, evidenceRefs: { sourceIds: [], docChunkIds: relevantDocs.map((d) => d.title) }, evaluatedAt: new Date().toISOString(), confidenceBreakdown: aggregateConfidence?.confidence_breakdown, scoreOverwritten: aggregateConfidence?.score_overwritten }
      : undefined;
    updateEvent(activeEvent.id, {
      decisionRecord: { input, panels: panels.map((p) => ({ stakeholderId: p.id, output: panelEdits[p.id] ?? p.text, sent: false })), trust },
    });
    addHistory(activeEvent.id, { action: "Stakeholder position brief created", tab: "stakeholder-update", detail: `${panels.filter((p) => p.text).length} stakeholder panels generated` });
    if (snapRef.current) setDeltas(computeDeltas(snapRef.current, snapshotEvent(activeEvent)));
    setPendingReview(false);
  };

  const [singleSaved, setSingleSaved] = useState(false);
  const handleSaveSingle = () => {
    if (!activeEvent || !singleText || !persona || !roomConfig) return;
    const trust: TrustState | undefined = trustResult
      ? { trustStatus: trustResult.status, trustReason: trustResult.reason, evidenceRefs: { sourceIds: [], docChunkIds: [] }, evaluatedAt: new Date().toISOString(), confidenceBreakdown: singleConfidence?.confidence_breakdown, scoreOverwritten: singleConfidence?.score_overwritten }
      : undefined;
    updateEvent(activeEvent.id, {
      communications: [...activeEvent.communications, { room: roomConfig.name, persona: persona.name, output: editedSingleText ?? singleText, sentAt: new Date().toISOString(), trust }],
    });
    addHistory(activeEvent.id, { action: "Communication generated", tab: "stakeholder-update", detail: `${persona.name} — ${roomConfig.name}` });
    if (snapRef.current) setDeltas(computeDeltas(snapRef.current, snapshotEvent(activeEvent)));
    setSingleSaved(true);
  };

  const handleReset = () => {
    if (isMultiMode) { multiReset(); resetSynthesis(); synthesisTriggered.current = false; setStartTime(null); }
    else singleReset();
    setPendingReview(false);
    setReviewDismissed(false);
    setSingleSaved(false);
    setExpandedPanels({});
  };

  if (!activeEvent) return null;

  return (
    <div>
      {/* Audience presets strip */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {AUDIENCE_PRESETS.map((preset) => (
          <button key={preset.id} onClick={() => applyPreset(preset)} className={`shrink-0 px-4 py-2 rounded-[var(--radius-card)] text-sm font-medium transition-all border flex items-center gap-1.5 ${activePreset === preset.id ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-text-primary)]" : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/30"}`}>
            {preset.multiStakeholder && <Zap size={12} />}
            {preset.label}
          </button>
        ))}
      </div>

      {/* Multi velocity timer */}
      {isMultiMode && multiVelocity !== null && (
        <div className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] px-4 py-2 mb-4 w-fit ml-auto">
          <Zap size={16} className="text-[var(--color-accent)]" />
          <div>
            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Decision Velocity</div>
            <div className="flex items-center gap-2">
              <span className="font-data text-sm text-[var(--color-text-dim)] line-through">18 days</span>
              <ArrowRight size={12} className="text-[var(--color-accent)]" />
              <span className="font-data text-sm font-bold text-[var(--color-accent)]">{multiVelocity}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Input + Generate */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle>Technical Update</SectionTitle>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full h-28 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-accent)] focus:outline-none" placeholder="Enter update for stakeholders..." />
          {!input.trim() && <button onClick={() => setInput(autoInput)} className="flex items-center gap-1.5 mt-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors"><Beaker size={12} /> Load from event</button>}
        </div>
        <div className="flex flex-col gap-2 justify-end">
          <button onClick={handleGenerate} disabled={(isMultiMode ? multiActive : singleStreaming) || !input.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            {(isMultiMode ? multiActive : singleStreaming) ? (<><Loader2 size={16} className="animate-spin" /> Generating...</>) : (<><Send size={16} /> {isMultiMode ? "Generate Package" : "Translate"}</>)}
          </button>
          {(panels.some((p) => p.text) || singleText) && <button onClick={handleReset} className="flex items-center justify-center gap-1.5 py-2 px-4 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"><RotateCcw size={12} /> Reset</button>}
        </div>
      </div>

      {/* Advanced settings (single mode) */}
      {!isMultiMode && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] mb-4">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)]">
            Advanced Settings {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showAdvanced && (
            <div className="px-4 pb-4 space-y-4">
              <div><SectionTitle>Tone Calibration</SectionTitle><ToneSliders settings={tone} onChange={setTone} /></div>
              <div><SectionTitle>Target Persona</SectionTitle><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{personas.map((p) => (<PersonaCard key={p.id} persona={p} selected={selectedPersona === p.id} onSelect={() => { setSelectedPersona(p.id); setRoom(p.defaultRoom); setTone((prev) => ({ ...prev, formality: Math.round(p.defaultFormality * 100) })); setActivePreset(""); }} />))}</div></div>
              <div><SectionTitle>Briefing Room</SectionTitle><BriefingRoomSelector selected={room} onSelect={setRoom} /></div>
            </div>
          )}
        </div>
      )}

      {/* Output — multi-stakeholder panels */}
      {isMultiMode && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {panels.map((panel) => {
              const p = personas.find((x) => x.id === panel.id);
              const done = !panel.isStreaming && panel.text && !panel.error;
              const isExpanded = expandedPanels[panel.id] ?? false;

              // Extract key sections for collapsed view
              const displayText = (() => {
                const raw = panelEdits[panel.id] ?? panel.text;
                if (!raw || isExpanded || panel.isStreaming) return raw;
                // Show Primary Concern + Recommended Position only
                const sections = raw.split(/(?=^## )/m);
                const keySections = sections.filter((s) =>
                  /^## (Primary Concern|Recommended Position|Adapted Communication)/m.test(s)
                );
                return keySections.length > 0 ? keySections.join("\n") : raw;
              })();

              return (
                <div key={panel.id} className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 min-h-[250px] flex flex-col ${done ? "animate-completion-flash" : ""}`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{panel.emoji}</span>
                      <div><div className="text-xs font-semibold text-[var(--color-text-primary)]">{panel.label}</div><div className="text-xs text-[var(--color-text-muted)]">{p?.role}</div></div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {panel.isStreaming && (<><Loader2 size={12} className="animate-spin text-[var(--color-accent)]" /><span className="text-xs font-data text-[var(--color-accent)]">Streaming</span></>)}
                      {done && (
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
                          className="w-full min-h-[200px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 text-sm text-[var(--color-text-primary)] font-mono leading-relaxed focus:border-[var(--color-accent)] focus:outline-none resize-y"
                        />
                      ) : (
                        <ReasoningOutput text={displayText} isStreaming={panel.isStreaming} variant="reasoning-engine" />
                      )
                    ) : panel.error ? <div className="text-sm text-[var(--color-semantic-red)]">Error: {panel.error}</div> : <div className="flex items-center justify-center h-full text-[var(--color-text-dim)] text-xs">Awaiting generation...</div>}
                  </div>
                  {done && !isExpanded && editingPanelId !== panel.id && (
                    <button
                      onClick={() => setExpandedPanels((prev) => ({ ...prev, [panel.id]: true }))}
                      className="mt-2 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ChevronDown size={10} /> Read full analysis
                    </button>
                  )}
                  {done && isExpanded && editingPanelId !== panel.id && (
                    <button
                      onClick={() => setExpandedPanels((prev) => ({ ...prev, [panel.id]: false }))}
                      className="mt-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ChevronUp size={10} /> Collapse
                    </button>
                  )}
                  {done && <CompletionIndicator text={panel.text} />}
                </div>
              );
            })}
          </div>

          {/* Decision Synthesis Panel — 5th stream */}
          {FLAGS.decisionSynthesis && isMultiMode && (synthesisStreaming || synthesisText || synthesisError || synthesisThinking) && (
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

          {allMultiDone && panels.some((p) => p.text) && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-data text-[var(--color-text-dim)]">
              <Brain size={12} className="text-[var(--color-accent)]" />
              {panels.filter((p) => p.text).length} stakeholder perspectives generated
              {relevantDocs.length > 0 && <> from {relevantDocs.length} source section{relevantDocs.length !== 1 ? "s" : ""}</>}
            </div>
          )}
          {FLAGS.verificationGate && trustResult && <VerificationBanner result={trustResult} confidenceData={panels.find((p) => p.confidenceData)?.confidenceData ?? null} />}
          {allMultiDone && pendingReview && (
            <ImpactReviewPanel title="Review Stakeholder Position Brief" items={[
              { label: "Panels", value: `${panels.filter((p) => p.text).length} stakeholder outputs`, editable: false },
              { label: "Action", value: "Save to decision record", editable: false },
            ]} onApprove={handleApproveMulti} onReject={() => { setPendingReview(false); setReviewDismissed(true); }} />
          )}
        </>
      )}

      {/* Output — single persona */}
      {!isMultiMode && (
        <div className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 min-h-[400px] ${singleComplete ? "animate-completion-flash" : ""}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {persona && <span className="text-lg">{persona.emoji}</span>}
              <div>
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">{persona?.name ?? "Select a persona"}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{roomConfig?.emoji} {roomConfig?.name} &middot; <span className="font-data">F:{tone.formality} U:{tone.urgency} O:{tone.optimism}</span></div>
              </div>
            </div>
          </div>
          {singleText ? (
            isEditingSingle ? (
              <textarea
                value={editedSingleText ?? singleText}
                onChange={(e) => setEditedSingleText(e.target.value)}
                className="w-full min-h-[300px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 text-sm text-[var(--color-text-primary)] font-mono leading-relaxed focus:border-[var(--color-accent)] focus:outline-none resize-y"
              />
            ) : (
              <ReasoningOutput text={editedSingleText ?? singleText} isStreaming={singleStreaming} />
            )
          ) : singleError ? <div className="text-sm text-[var(--color-semantic-red)]">Error: {singleError}</div> : <div className="flex items-center justify-center h-[300px] text-[var(--color-text-dim)] text-sm">Select an audience and generate</div>}
          {FLAGS.verificationGate && singleComplete && trustResult && <VerificationBanner result={trustResult} confidenceData={singleConfidence} />}
          {singleComplete && <CompletionIndicator text={singleText} />}
          {singleComplete && !singleSaved && (
            <div className="mt-3 flex items-center gap-2">
              <button onClick={handleSaveSingle} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors cursor-pointer" style={{ backgroundColor: trustResult?.status === "verified" ? "var(--color-semantic-green)" : "var(--color-semantic-yellow)", color: "var(--color-bg)" }}>{trustResult?.status === "verified" ? "Save" : "Save (Needs Review)"}</button>
              <button
                onClick={() => { if (!isEditingSingle) setEditedSingleText(singleText); setIsEditingSingle(!isEditingSingle); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
              >
                <PenLine size={12} />
                {isEditingSingle ? "Preview" : "Edit"}
              </button>
            </div>
          )}
          {singleSaved && <div className="mt-3 text-xs font-data text-[var(--color-semantic-green)]">Saved to event record</div>}
        </div>
      )}

      {(isMultiMode ? allMultiDone && panels.some((p) => p.text) : singleComplete) && <WhatChangedBar deltas={deltas} />}

      {/* Post-save CTAs */}
      {(activeEvent.decisionRecord || (singleSaved && !isMultiMode)) && (
        <div className="mt-4 bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-[var(--radius-card)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check size={14} className="text-[var(--color-semantic-green)]" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {activeEvent.decisionRecord
                ? `Decision package saved (${activeEvent.decisionRecord.panels.length} stakeholder briefs)`
                : "Communication saved"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/workspace/export">
              <button className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all cursor-pointer">
                Export Board-Ready Package <ArrowRight size={14} />
              </button>
            </Link>
            {activeEvent.monitorScores.length === 0 && (
              <button
                onClick={() => setActiveTab("tracking")}
                className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
              >
                Score Event Health <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
