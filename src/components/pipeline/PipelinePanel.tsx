"use client";

import { useState } from "react";
import { Play, Square, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { usePipeline } from "@/lib/hooks/use-pipeline";
import { useEvents } from "@/lib/contexts/event-context";
import PipelineProgressBar from "./PipelineProgressBar";
import { STAGE_META } from "@/lib/pipeline/types";

export default function PipelinePanel() {
  const { activeEvent } = useEvents();
  const { pipelineState, isRunning, start, cancel, reset } = usePipeline();
  const [input, setInput] = useState(
    activeEvent?.description || activeEvent?.fieldRecord?.observation || "",
  );
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  if (!activeEvent) return null;

  const handleStart = () => {
    if (!input.trim()) return;
    start(input);
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-[var(--color-accent)]" />
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          Agentic Pipeline
        </span>
        <span className="text-[10px] text-[var(--color-text-dim)] ml-auto">
          Field Report → RFI → Decision Package → Communications → Health Score
        </span>
      </div>

      {/* Input + controls */}
      {!pipelineState && (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)] focus:outline-none resize-none mb-3"
            rows={3}
            placeholder="Describe the field condition to analyze through the full pipeline..."
          />
          <button
            onClick={handleStart}
            disabled={!input.trim()}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40"
          >
            <Play size={14} />
            Run Full Pipeline
          </button>
        </>
      )}

      {/* Progress */}
      {pipelineState && (
        <div className="space-y-3">
          <PipelineProgressBar state={pipelineState} />

          {/* Cancel button */}
          {isRunning && (
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 text-xs text-[var(--color-semantic-red)] hover:bg-[var(--color-semantic-red-dim)] px-2 py-1 rounded-[var(--radius-sm)] transition-colors"
            >
              <Square size={12} />
              Stop Pipeline
            </button>
          )}

          {/* Stage outputs (expandable) */}
          <div className="space-y-1">
            {pipelineState.stages
              .filter((s) => s.status === "completed" || s.status === "streaming")
              .map((s) => {
                const meta = STAGE_META[s.stage];
                const isExpanded = expandedStage === s.stage;
                const hasMultiPanel = s.panels && s.panels.length > 0;

                return (
                  <div key={s.stage}>
                    <button
                      onClick={() =>
                        setExpandedStage(isExpanded ? null : s.stage)
                      }
                      className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface)] transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown size={12} className="text-[var(--color-text-dim)]" />
                      ) : (
                        <ChevronRight size={12} className="text-[var(--color-text-dim)]" />
                      )}
                      <span
                        className="text-xs font-semibold"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-dim)] ml-auto">
                        {s.status === "streaming"
                          ? "Streaming..."
                          : hasMultiPanel
                            ? `${s.panels!.length} panels`
                            : `${s.text.length} chars`}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="ml-6 mt-1 max-h-48 overflow-y-auto">
                        {hasMultiPanel ? (
                          s.panels!.map((p) => (
                            <div key={p.id} className="mb-2">
                              <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase mb-0.5">
                                {p.label}
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap line-clamp-6">
                                {p.text.slice(0, 500)}
                                {p.text.length > 500 && "..."}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap line-clamp-6">
                            {s.text.slice(0, 500)}
                            {s.text.length > 500 && "..."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Reset when done */}
          {(pipelineState.status === "completed" ||
            pipelineState.status === "error" ||
            pipelineState.status === "cancelled") && (
            <button
              onClick={reset}
              className="text-xs text-[var(--color-accent)] hover:underline mt-2"
            >
              Run Another Pipeline
            </button>
          )}
        </div>
      )}
    </div>
  );
}
