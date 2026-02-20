import type {
  PipelineConfig,
  PipelineStage,
  PipelineState,
  StageStatus,
} from "./types";
import type { DecisionEvent } from "@/lib/models/decision-event";
import { personas } from "@/lib/demo/personas";
import { searchDocuments } from "@/lib/demo/documents";
import { semanticSearchDocuments } from "@/lib/search/semantic-search";
import { stripConfidenceBlock } from "@/lib/confidence/validator";
import { FLAGS } from "@/lib/flags";

// ── Callback interface ──────────────────────────────────────

export interface OrchestratorCallbacks {
  onStateChange: (state: PipelineState) => void;
  onSaveStep: (stage: PipelineStage, data: Partial<DecisionEvent>) => void;
  onAddHistory: (entry: { action: string; tab: string; detail: string }) => void;
  getEvent: () => DecisionEvent;
}

// ── SSE stream parser ───────────────────────────────────────

async function executeStreamingCall(
  tool: string,
  messages: { role: string; content: string }[],
  context: Record<string, unknown>,
  signal: AbortSignal,
  onText?: (text: string) => void,
): Promise<string> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, messages, context }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let rawText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.text) {
          rawText += data.text;
          onText?.(stripConfidenceBlock(rawText));
        }
      } catch {
        /* skip malformed */
      }
    }
  }

  return stripConfidenceBlock(rawText);
}

// ── Per-stage helpers ───────────────────────────────────────

async function buildDocContext(query: string) {
  const docs = FLAGS.semanticSearch
    ? await semanticSearchDocuments(query)
    : searchDocuments(query);
  return docs.map((d) => ({
    title: `${d.title} — ${d.section}`,
    content: d.content,
  }));
}

async function stageFieldReport(
  event: DecisionEvent,
  input: string,
  signal: AbortSignal,
  onText: (t: string) => void,
) {
  const docs = await buildDocContext(input);
  return executeStreamingCall(
    "field-report",
    [
      {
        role: "user",
        content: `Field Observation:\n${input}\n\nLocation: ${event.location || "Not specified"}\nObserver: System Pipeline\nDate/Time: ${new Date().toISOString()}`,
      },
    ],
    { documents: docs },
    signal,
    onText,
  );
}

async function stageRfi(
  event: DecisionEvent,
  signal: AbortSignal,
  onText: (t: string) => void,
) {
  const desc = event.fieldRecord?.observation || event.description;
  const docs = await buildDocContext(desc);
  return executeStreamingCall(
    "rfi",
    [
      {
        role: "user",
        content: `Field Condition Description:\n${desc}\n\nLocation: ${event.location || "N/A"}\nUrgency: urgent`,
      },
    ],
    { documents: docs },
    signal,
    onText,
  );
}

async function stageDecisionPackage(
  event: DecisionEvent,
  signal: AbortSignal,
  onPanelText: (panelId: string, text: string) => void,
): Promise<{ id: string; label: string; text: string }[]> {
  const input = event.fieldRecord?.observation || event.description;
  const docs = await buildDocContext(input);
  const panels: { id: string; label: string; text: string }[] = [];

  for (const persona of personas) {
    const text = await executeStreamingCall(
      "decision-package",
      [
        {
          role: "user",
          content: `Field Condition:\n${input}\n\nStakeholder: ${persona.name} (${persona.role})\nCares about: ${persona.cares}\nReading level: ${persona.readingLevel}/10`,
        },
      ],
      { documents: docs },
      signal,
      (t) => onPanelText(persona.id, t),
    );
    panels.push({ id: persona.id, label: persona.name, text });
  }
  return panels;
}

async function stageTranslator(
  event: DecisionEvent,
  signal: AbortSignal,
  onPanelText: (panelId: string, text: string) => void,
): Promise<{ id: string; label: string; text: string }[]> {
  const input = event.fieldRecord?.observation || event.description;
  const docs = await buildDocContext(input);
  const results: { id: string; label: string; text: string }[] = [];

  for (const persona of personas) {
    const text = await executeStreamingCall(
      "translator",
      [
        {
          role: "user",
          content: `Technical Update:\n${input}\n\nTarget Persona: ${persona.name} (${persona.role})\nCares about: ${persona.cares}\nBriefing Room: ${persona.defaultRoom}\nFormality: ${persona.defaultFormality}`,
        },
      ],
      { documents: docs },
      signal,
      (t) => onPanelText(persona.id, t),
    );
    results.push({ id: persona.id, label: persona.name, text });
  }
  return results;
}

async function stageMonitor(
  event: DecisionEvent,
  signal: AbortSignal,
  onText: (t: string) => void,
) {
  const parts: string[] = [];
  if (event.fieldRecord) parts.push(`Field: ${event.fieldRecord.observation}`);
  if (event.rfiRecord?.output) parts.push(`RFI: ${event.rfiRecord.output.slice(0, 500)}`);
  if (event.decisionRecord)
    parts.push(`Decision: ${event.decisionRecord.panels.length} stakeholder panels`);
  parts.push(`Status: ${event.status}, Severity: ${event.severity}`);

  const docs = await buildDocContext(parts.join(" "));
  return executeStreamingCall(
    "pulse-log",
    [{ role: "user", content: `Analyze event health:\n\n${parts.join("\n")}` }],
    { documents: docs },
    signal,
    onText,
  );
}

// ── Main orchestrator ───────────────────────────────────────

export async function runPipeline(
  config: PipelineConfig,
  initialInput: string,
  eventId: string,
  callbacks: OrchestratorCallbacks,
  abortController: AbortController,
): Promise<PipelineState> {
  const state: PipelineState = {
    status: "running",
    currentStage: null,
    stages: config.stages.map((stage) => ({
      stage,
      status: "pending" as StageStatus,
      text: "",
    })),
    eventId,
    input: initialInput,
    startedAt: Date.now(),
  };

  callbacks.onStateChange({ ...state });

  let decisionPanels: { id: string; label: string; text: string }[] = [];

  for (let i = 0; i < config.stages.length; i++) {
    if (abortController.signal.aborted) {
      state.status = "cancelled";
      callbacks.onStateChange({ ...state });
      return state;
    }

    const stageName = config.stages[i];
    const event = callbacks.getEvent();

    // Skip completed stages
    if (config.skipCompleted) {
      const skip =
        (stageName === "field-report" && event.fieldRecord?.output) ||
        (stageName === "rfi" && event.rfiRecord?.output) ||
        (stageName === "decision-package" &&
          event.decisionRecord?.panels?.length) ||
        (stageName === "monitor" && event.monitorScores.length > 0);
      if (skip) {
        state.stages[i].status = "skipped";
        callbacks.onStateChange({ ...state });
        continue;
      }
    }

    state.currentStage = stageName;
    state.stages[i].status = "running";
    state.stages[i].startedAt = Date.now();
    callbacks.onStateChange({ ...state });

    try {
      const onText = (text: string) => {
        state.stages[i].status = "streaming";
        state.stages[i].text = text;
        callbacks.onStateChange({ ...state });
      };

      switch (stageName) {
        case "field-report": {
          const text = await stageFieldReport(event, initialInput, abortController.signal, onText);
          state.stages[i].text = text;
          if (config.autoSave) {
            callbacks.onSaveStep("field-report", {
              fieldRecord: {
                observation: initialInput,
                location: event.location || "",
                observer: "Pipeline",
                timestamp: new Date().toISOString(),
                output: text,
              },
            });
            callbacks.onAddHistory({
              action: "Field report (pipeline)",
              tab: "field",
              detail: initialInput.slice(0, 100),
            });
          }
          break;
        }

        case "rfi": {
          const text = await stageRfi(callbacks.getEvent(), abortController.signal, onText);
          state.stages[i].text = text;
          if (config.autoSave) {
            callbacks.onSaveStep("rfi", {
              rfiRecord: {
                description: event.fieldRecord?.observation || event.description,
                urgency: "urgent",
                output: text,
              },
            });
            callbacks.onAddHistory({
              action: "RFI generated (pipeline)",
              tab: "contract",
              detail: "Auto-generated from field report",
            });
          }
          break;
        }

        case "decision-package": {
          decisionPanels = await stageDecisionPackage(
            callbacks.getEvent(),
            abortController.signal,
            (pid, t) => {
              const existing = state.stages[i].panels || [];
              const idx = existing.findIndex((p) => p.id === pid);
              if (idx >= 0) existing[idx].text = t;
              else
                existing.push({
                  id: pid,
                  label: personas.find((p) => p.id === pid)?.name || pid,
                  text: t,
                });
              state.stages[i].panels = existing;
              state.stages[i].status = "streaming";
              callbacks.onStateChange({ ...state });
            },
          );
          state.stages[i].panels = decisionPanels;
          if (config.autoSave) {
            callbacks.onSaveStep("decision-package", {
              decisionRecord: {
                input: event.fieldRecord?.observation || event.description,
                panels: decisionPanels.map((p) => ({
                  stakeholderId: p.id,
                  output: p.text,
                  sent: false,
                })),
              },
            });
            callbacks.onAddHistory({
              action: "Decision package (pipeline)",
              tab: "decision",
              detail: `${decisionPanels.length} stakeholder panels`,
            });
          }
          break;
        }

        case "translator": {
          const trPanels = await stageTranslator(
            callbacks.getEvent(),
            abortController.signal,
            (pid, t) => {
              const existing = state.stages[i].panels || [];
              const idx = existing.findIndex((p) => p.id === pid);
              if (idx >= 0) existing[idx].text = t;
              else
                existing.push({
                  id: pid,
                  label: personas.find((p) => p.id === pid)?.name || pid,
                  text: t,
                });
              state.stages[i].panels = existing;
              callbacks.onStateChange({ ...state });
            },
          );
          if (config.autoSave) {
            const comms = trPanels.map((p) => ({
              room:
                personas.find((pr) => pr.id === p.id)?.defaultRoom ||
                "conference-room",
              persona: p.label,
              output: p.text,
              sentAt: new Date().toISOString(),
            }));
            callbacks.onSaveStep("translator", { communications: comms });
            callbacks.onAddHistory({
              action: "Communications (pipeline)",
              tab: "communication",
              detail: `${comms.length} stakeholder communications`,
            });
          }
          break;
        }

        case "monitor": {
          const text = await stageMonitor(callbacks.getEvent(), abortController.signal, onText);
          state.stages[i].text = text;
          if (config.autoSave) {
            const scoreMatch = text.match(/\*\*Score:\s*(\d{1,3})\/100\*\*/i);
            const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 70;
            const evt = callbacks.getEvent();
            callbacks.onSaveStep("monitor", {
              monitorScores: [
                ...evt.monitorScores,
                {
                  date: new Date().toISOString().slice(0, 10),
                  score,
                  analysis: text.slice(0, 200),
                },
              ],
            });
            callbacks.onAddHistory({
              action: "Health score (pipeline)",
              tab: "monitor",
              detail: `Score: ${score}/100`,
            });
          }
          break;
        }
      }

      state.stages[i].status = "completed";
      state.stages[i].completedAt = Date.now();
      callbacks.onStateChange({ ...state });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        state.status = "cancelled";
        state.stages[i].status = "error";
        state.stages[i].error = "Cancelled";
        callbacks.onStateChange({ ...state });
        return state;
      }
      state.stages[i].status = "error";
      state.stages[i].error =
        err instanceof Error ? err.message : "Unknown error";
      state.status = "error";
      state.error = state.stages[i].error;
      callbacks.onStateChange({ ...state });
      return state;
    }
  }

  state.status = "completed";
  state.currentStage = null;
  state.completedAt = Date.now();
  callbacks.onStateChange({ ...state });
  return state;
}
