"use client";

import { useState, useCallback, useRef } from "react";
import type { ConfidenceData } from "@/lib/confidence/types";
import { stripConfidenceBlock } from "@/lib/confidence/validator";

/** A single content block — text or base64 image for Claude vision. */
export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

/** A message that accepts plain string or multipart content blocks. */
export type StreamMessage = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

interface StreamOptions {
  tool: string;
  context?: {
    projectId?: string;
    documents?: { title: string; content: string }[];
    longTermMemory?: { cases: unknown[]; lessons: unknown[] };
    toolSpecific?: Record<string, unknown>;
  };
}

interface StreamResult {
  text: string;
  isStreaming: boolean;
  error: string | null;
  usage: { inputTokens: number; outputTokens: number } | null;
  confidenceData: ConfidenceData | null;
  thinkingText: string | null;
  send: (messages: StreamMessage[]) => void;
  reset: () => void;
}

export function useStream(options: StreamOptions): StreamResult {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null);
  const [confidenceData, setConfidenceData] = useState<ConfidenceData | null>(null);
  const [thinkingText, setThinkingText] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rawTextRef = useRef("");

  const send = useCallback(
    async (messages: StreamMessage[]) => {
      // Abort any existing stream
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setText("");
      rawTextRef.current = "";
      setIsStreaming(true);
      setError(null);
      setUsage(null);
      setConfidenceData(null);
      setThinkingText(null);

      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool: options.tool,
            messages,
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
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.text) {
                rawTextRef.current += data.text;
                // Strip confidence block defensively during streaming
                setText(stripConfidenceBlock(rawTextRef.current));
              }
              if (data.confidence) {
                setConfidenceData(data.confidence);
              }
              if (data.thinking_delta) {
                setThinkingText((prev) => (prev ?? "") + data.thinking_delta);
              }
              if (data.thinking) {
                setThinkingText(data.thinking);
              }
              if (data.done) {
                setUsage(data.usage || null);
              }
              if (data.error) {
                setError(data.error);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        // Final strip after stream completes to catch any partial block
        setText(stripConfidenceBlock(rawTextRef.current));
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [options.tool, options.context]
  );

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setText("");
    rawTextRef.current = "";
    setIsStreaming(false);
    setError(null);
    setUsage(null);
    setConfidenceData(null);
    setThinkingText(null);
  }, []);

  return { text, isStreaming, error, usage, confidenceData, thinkingText, send, reset };
}
