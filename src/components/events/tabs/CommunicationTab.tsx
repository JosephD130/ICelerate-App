"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Beaker,
} from "lucide-react";
import PersonaCard from "@/components/tools/translator/PersonaCard";
import ToneSliders, {
  type ToneSettings,
} from "@/components/tools/translator/ToneSliders";
import BriefingRoomSelector from "@/components/tools/translator/BriefingRoomSelector";
import IntelligenceNudge from "@/components/shared/IntelligenceNudge";
import SectionTitle from "@/components/shared/SectionTitle";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import CompletionIndicator from "@/components/shared/CompletionIndicator";
import VerificationBanner from "@/components/verification/VerificationBanner";
import { computeTrustStatusForOutput, type TrustEvalResult } from "@/lib/validation/trust-evaluator";
import type { TrustState } from "@/lib/models/decision-event";
import { useActiveProject } from "@/lib/contexts/project-context";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import FreshnessBanner from "@/components/shared/FreshnessBanner";
import { FLAGS } from "@/lib/flags";
import {
  personas,
  type BriefingRoom,
  getRoom,
  getPersona,
} from "@/lib/demo/personas";
import { searchDocuments } from "@/lib/demo/documents";
import { matchNudges } from "@/lib/demo/long-term-memory";
import { useStream } from "@/lib/hooks/use-stream";
import { useEvents } from "@/lib/contexts/event-context";
import WhatChangedBar from "@/components/events/WhatChangedBar";
import { snapshotEvent, computeDeltas, type Delta } from "@/lib/ui/delta";

interface AudiencePreset {
  id: string;
  label: string;
  personaId: string;
  room: BriefingRoom;
  tone: ToneSettings;
  description: string;
}

const AUDIENCE_PRESETS: AudiencePreset[] = [
  { id: "city-council", label: "City Council", personaId: "chen", room: "city-hall", tone: { formality: 85, urgency: 40, optimism: 60 }, description: "Formal, budget-focused, politically aware" },
  { id: "hoa-meeting", label: "HOA Meeting", personaId: "chen", room: "conference-room", tone: { formality: 60, urgency: 30, optimism: 70 }, description: "Reassuring, community-focused, plain language" },
  { id: "internal-pm", label: "Internal PM", personaId: "torres", room: "field-trailer", tone: { formality: 50, urgency: 50, optimism: 40 }, description: "Direct, technical, action-oriented" },
  { id: "emergency", label: "Emergency", personaId: "martinez", room: "jobsite", tone: { formality: 20, urgency: 95, optimism: 20 }, description: "Immediate action, critical info only" },
  { id: "board-summary", label: "Board Summary", personaId: "rawlings", room: "conference-room", tone: { formality: 90, urgency: 35, optimism: 55 }, description: "Executive overview, financial focus" },
];

export default function CommunicationTab() {
  const { activeEvent, updateEvent, addHistory } = useEvents();
  const { activeProject } = useActiveProject();

  const [input, setInput] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("chen");
  const [room, setRoom] = useState<BriefingRoom>("city-hall");
  const [tone, setTone] = useState<ToneSettings>({ formality: 70, urgency: 50, optimism: 40 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const snapRef = useRef<ReturnType<typeof snapshotEvent> | null>(null);

  useEffect(() => {
    if (activeEvent && !initialized) {
      setInput(activeEvent.description ?? "");
      setInitialized(true);
    }
  }, [activeEvent, initialized]);

  const persona = getPersona(selectedPersona);
  const roomConfig = getRoom(room);
  const nudges = useMemo(() => matchNudges(input), [input]);

  const relevantDocs = useMemo(
    () => searchDocuments(input || activeEvent?.description || "").map((d) => ({ title: `${d.title} — ${d.section}`, content: d.content })),
    [input, activeEvent?.description]
  );

  const { text, isStreaming, error, confidenceData, send, reset } = useStream({
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

  const isComplete = !isStreaming && text.length > 0 && !error;

  // Freshness check for communication output
  const freshnessBadge = useMemo(
    () => computeFreshnessBadge({ sources: activeProject.sourceProfile.sources }),
    [activeProject.sourceProfile.sources],
  );

  const trustResult: TrustEvalResult | null = useMemo(() => {
    if (!isComplete || !text) return null;
    return computeTrustStatusForOutput({
      toolType: "communication",
      outputText: text,
      freshnessLevel: freshnessBadge.level,
    });
  }, [isComplete, text, freshnessBadge.level]);

  const [saved, setSaved] = useState(false);

  const applyPreset = (preset: AudiencePreset) => {
    setActivePreset(preset.id);
    setSelectedPersona(preset.personaId);
    setRoom(preset.room);
    setTone(preset.tone);
  };

  const handleTranslate = () => {
    if (!input.trim() || !persona || !roomConfig) return;
    if (activeEvent) snapRef.current = snapshotEvent(activeEvent);
    const userMessage = `Technical Update:\n${input}\n\nTarget Persona: ${persona.name} (${persona.role})\nCares about: ${persona.cares}\nReading level: ${persona.readingLevel}/10\n\nBriefing Room: ${roomConfig.name}\nRoom tone: ${roomConfig.tone}\nRoom max length: ${roomConfig.maxLength}\nRoom includes: ${roomConfig.includes.join(", ")}\nRoom excludes: ${roomConfig.excludes.join(", ")}\n\nTone Settings:\n- Formality: ${tone.formality}/100\n- Urgency: ${tone.urgency}/100\n- Optimism: ${tone.optimism}/100\n\nProvide:\n1. The adapted communication for this persona in this briefing room\n2. A "Jargon Map" section mapping technical terms to plain language\n3. A "Persona Reaction" section predicting how ${persona.name} will react\n4. A "Key Concerns" section listing what ${persona.name} will worry about most`;
    send([{ role: "user", content: userMessage }]);
  };

  const handleSave = () => {
    if (!input.trim() || !persona || !roomConfig || !activeEvent || !text) return;
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
      communications: [
        ...activeEvent.communications,
        { room: roomConfig.name, persona: persona.name, output: text, sentAt: new Date().toISOString(), trust },
      ],
    });
    addHistory(activeEvent.id, {
      action: "Communication generated",
      tab: "communication",
      detail: `${persona.name} — ${roomConfig.name}`,
    });
    if (snapRef.current) {
      const afterEvent = {
        ...activeEvent,
        communications: [
          ...activeEvent.communications,
          { room: roomConfig.name, persona: persona.name, output: text, sentAt: new Date().toISOString(), trust },
        ],
      };
      setDeltas(computeDeltas(snapRef.current, snapshotEvent(afterEvent)));
    }
    setSaved(true);
  };

  const loadDemo = () => { setInput(activeEvent?.description || activeEvent?.fieldRecord?.observation || ""); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleTranslate(); }
      if (e.key === "Escape" && text) { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!activeEvent) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6">
      <div className="space-y-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle>Audience Preset</SectionTitle>
          <div className="grid grid-cols-1 gap-2">
            {AUDIENCE_PRESETS.map((preset) => (
              <button key={preset.id} onClick={() => applyPreset(preset)} className={`text-left px-3 py-2.5 rounded-[var(--radius-sm)] text-sm transition-all border ${activePreset === preset.id ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-text-primary)]" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/30"}`}>
                <div className="font-medium">{preset.label}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
          <SectionTitle>Technical Update</SectionTitle>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full h-28 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-accent)] focus:outline-none" placeholder="Enter a technical update or field condition..." />
          {!input.trim() && (<button onClick={loadDemo} className="flex items-center gap-1.5 mt-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors"><Beaker size={12} /> Load from event</button>)}
        </div>

        {nudges.length > 0 && (<div className="space-y-2"><SectionTitle>Risk Control Layer</SectionTitle>{nudges.slice(0, 3).map((n) => (<IntelligenceNudge key={n.id} nudge={n} />))}</div>)}

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)]">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)]">
            Advanced Settings {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showAdvanced && (
            <div className="px-4 pb-4 space-y-4">
              <div><SectionTitle>Tone Calibration</SectionTitle><ToneSliders settings={tone} onChange={setTone} /></div>
              <div><SectionTitle>Target Persona</SectionTitle><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{personas.map((p) => (<PersonaCard key={p.id} persona={p} selected={selectedPersona === p.id} onSelect={() => { setSelectedPersona(p.id); setRoom(p.defaultRoom); setTone((prev) => ({ ...prev, formality: Math.round(p.defaultFormality * 100) })); setActivePreset(null); }} />))}</div></div>
              <div><SectionTitle>Briefing Room</SectionTitle><BriefingRoomSelector selected={room} onSelect={setRoom} /></div>
            </div>
          )}
        </div>

        <button onClick={handleTranslate} disabled={isStreaming || !input.trim()} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isStreaming ? (<><Loader2 size={16} className="animate-spin" /> Translating...</>) : (<><Send size={16} /> Translate</>)}
        </button>
      </div>

      <div className="space-y-4">
        <div className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 min-h-[500px] ${isComplete ? "animate-completion-flash" : ""}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {persona && <span className="text-lg">{persona.emoji}</span>}
              <div>
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">{persona?.name ?? "Select a persona"}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{roomConfig?.emoji} {roomConfig?.name} &middot; <span className="font-data">F:{tone.formality} U:{tone.urgency} O:{tone.optimism}</span></div>
              </div>
            </div>
            {text && (<button onClick={reset} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"><RotateCcw size={14} /></button>)}
          </div>
          {text ? (<ReasoningOutput text={text} isStreaming={isStreaming} />) : error ? (<div className="text-sm text-[var(--color-semantic-red)]">Error: {error}</div>) : (<div className="flex items-center justify-center h-[400px] text-[var(--color-text-dim)] text-sm">Select an audience preset and click Translate</div>)}
          {FLAGS.freshnessWarnings && freshnessBadge.level !== "fresh" && (
            <FreshnessBanner badge={freshnessBadge} />
          )}
          {FLAGS.verificationGate && isComplete && trustResult && (
            <VerificationBanner result={trustResult} confidenceData={confidenceData} />
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

        {activeEvent.communications.length > 0 && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
            <SectionTitle>Previous Communications</SectionTitle>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeEvent.communications.map((c, i) => (
                <div key={i} className="bg-[var(--color-surface)] rounded-[var(--radius-sm)] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{c.persona} — {c.room}</span>
                    {c.sentAt && <span className="text-xs font-data text-[var(--color-text-dim)]">{new Date(c.sentAt).toLocaleString()}</span>}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{c.output.slice(0, 150)}...</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
