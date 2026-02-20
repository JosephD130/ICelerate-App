"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEvents } from "@/lib/contexts/event-context";
import { runPipeline, type OrchestratorCallbacks } from "@/lib/pipeline/orchestrator";
import type { PipelineState, PipelineConfig } from "@/lib/pipeline/types";
import { DEFAULT_CONFIG } from "@/lib/pipeline/types";

export function usePipeline() {
  const { activeEvent, updateEvent, addHistory } = useEvents();
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keep a ref to the latest activeEvent so the orchestrator always reads fresh data
  const eventRef = useRef(activeEvent);
  useEffect(() => {
    eventRef.current = activeEvent;
  }, [activeEvent]);

  const start = useCallback(
    async (input: string, config: PipelineConfig = DEFAULT_CONFIG) => {
      if (!activeEvent) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const callbacks: OrchestratorCallbacks = {
        onStateChange: (state) => setPipelineState({ ...state }),
        onSaveStep: (_stage, data) => {
          if (eventRef.current) updateEvent(eventRef.current.id, data);
        },
        onAddHistory: (entry) => {
          if (eventRef.current) addHistory(eventRef.current.id, entry);
        },
        getEvent: () => eventRef.current!,
      };

      await runPipeline(config, input, activeEvent.id, callbacks, controller);
    },
    [activeEvent, updateEvent, addHistory],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPipelineState((prev) =>
      prev ? { ...prev, status: "cancelled" } : null,
    );
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPipelineState(null);
  }, []);

  return {
    pipelineState,
    isRunning: pipelineState?.status === "running",
    start,
    cancel,
    reset,
  };
}
