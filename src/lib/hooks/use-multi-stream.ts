"use client";

import { useState, useCallback, useRef } from "react";
import type { ConfidenceData } from "@/lib/confidence/types";
import { stripConfidenceBlock } from "@/lib/confidence/validator";
import type { ContentBlock } from "@/lib/hooks/use-stream";

interface StreamPanel {
  id: string;
  label: string;
  emoji: string;
  text: string;
  isStreaming: boolean;
  error: string | null;
  startedAt?: number;
  completedAt?: number;
  confidenceData: ConfidenceData | null;
}

interface MultiStreamOptions {
  tool: string;
  context?: {
    projectId?: string;
    documents?: { title: string; content: string }[];
    longTermMemory?: { cases: unknown[]; lessons: unknown[] };
    toolSpecific?: Record<string, unknown>;
  };
}

export function useMultiStream(
  panelConfigs: { id: string; label: string; emoji: string }[],
  options: MultiStreamOptions
) {
  const [panels, setPanels] = useState<StreamPanel[]>(
    panelConfigs.map((p) => ({
      ...p,
      text: "",
      isStreaming: false,
      error: null,
      confidenceData: null,
    }))
  );
  const [isActive, setIsActive] = useState(false);
  const abortRefs = useRef<Map<string, AbortController>>(new Map());
  const rawTextRefs = useRef<Map<string, string>>(new Map());

  const sendAll = useCallback(
    (buildMessage: (panelId: string, panelLabel: string) => string | ContentBlock[]) => {
      // Abort existing streams
      Array.from(abortRefs.current.values()).forEach((ctrl) => ctrl.abort());
      abortRefs.current.clear();
      rawTextRefs.current.clear();

      setIsActive(true);
      setPanels((prev) =>
        prev.map((p) => ({
          ...p,
          text: "",
          isStreaming: true,
          error: null,
          startedAt: Date.now(),
          completedAt: undefined,
          confidenceData: null,
        }))
      );

      // Launch streams with staggered delays
      panelConfigs.forEach((config, index) => {
        rawTextRefs.current.set(config.id, "");

        setTimeout(() => {
        const controller = new AbortController();
        abortRefs.current.set(config.id, controller);

        const message = buildMessage(config.id, config.label);

        (async () => {
          try {
            const res = await fetch("/api/claude", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool: options.tool,
                messages: [{ role: "user", content: message }],
                context: options.context,
              }),
              signal: controller.signal,
            });

            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || `HTTP ${res.status}`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let buffer = "";

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
                    const raw = (rawTextRefs.current.get(config.id) ?? "") + data.text;
                    rawTextRefs.current.set(config.id, raw);
                    const stripped = stripConfidenceBlock(raw);
                    setPanels((prev) =>
                      prev.map((p) =>
                        p.id === config.id
                          ? { ...p, text: stripped }
                          : p
                      )
                    );
                  }
                  if (data.confidence) {
                    setPanels((prev) =>
                      prev.map((p) =>
                        p.id === config.id
                          ? { ...p, confidenceData: data.confidence }
                          : p
                      )
                    );
                  }
                } catch {
                  // Skip malformed
                }
              }
            }

            // Final strip after stream completes
            const finalRaw = rawTextRefs.current.get(config.id) ?? "";
            const finalText = stripConfidenceBlock(finalRaw);
            setPanels((prev) =>
              prev.map((p) =>
                p.id === config.id
                  ? { ...p, text: finalText, isStreaming: false, completedAt: Date.now() }
                  : p
              )
            );
          } catch (err) {
            if (err instanceof Error && err.name !== "AbortError") {
              setPanels((prev) =>
                prev.map((p) =>
                  p.id === config.id
                    ? { ...p, isStreaming: false, error: err.message }
                    : p
                )
              );
            }
          } finally {
            abortRefs.current.delete(config.id);
            // Check if all done
            setPanels((prev) => {
              const allDone = prev.every((p) => !p.isStreaming || p.id === config.id);
              if (allDone) setIsActive(false);
              return prev;
            });
          }
        })();
        }, index * 500);
      });
    },
    [panelConfigs, options.tool, options.context]
  );

  const reset = useCallback(() => {
    Array.from(abortRefs.current.values()).forEach((ctrl) => ctrl.abort());
    abortRefs.current.clear();
    rawTextRefs.current.clear();
    setIsActive(false);
    setPanels(
      panelConfigs.map((p) => ({
        ...p,
        text: "",
        isStreaming: false,
        error: null,
        confidenceData: null,
      }))
    );
  }, [panelConfigs]);

  return { panels, isActive, sendAll, reset };
}
