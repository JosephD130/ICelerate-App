"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import StreamingCursor from "./StreamingCursor";

interface Props {
  text: string;
  isStreaming: boolean;
  variant?: "default" | "reasoning-engine";
  className?: string;
  thinkingText?: string | null;
  isThinking?: boolean;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="reasoning-h1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="reasoning-h2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="reasoning-h3">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="reasoning-p">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="reasoning-strong">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="reasoning-ul">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="reasoning-ol">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="reasoning-li">{children}</li>
  ),
  table: ({ children }) => (
    <div className="reasoning-table-wrap">
      <table className="reasoning-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="reasoning-thead">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="reasoning-th">{children}</th>
  ),
  td: ({ children }) => (
    <td className="reasoning-td">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="reasoning-blockquote">{children}</blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="reasoning-code-block">
          <code>{children}</code>
        </pre>
      );
    }
    return <code className="reasoning-code-inline">{children}</code>;
  },
  hr: () => <hr className="reasoning-hr" />,
};

export default function ReasoningOutput({
  text,
  isStreaming,
  variant = "default",
  className = "",
  thinkingText,
  isThinking,
}: Props) {
  const [showThinking, setShowThinking] = useState(false);
  const thinkingRef = useRef<HTMLDivElement>(null);

  // Auto-expand while thinking is streaming, auto-collapse when main text starts
  useEffect(() => {
    if (isThinking) setShowThinking(true);
  }, [isThinking]);

  useEffect(() => {
    if (text && !isThinking && showThinking) setShowThinking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, isThinking]);

  // Auto-scroll thinking panel to bottom
  useEffect(() => {
    if (showThinking && thinkingRef.current) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
    }
  }, [thinkingText, showThinking]);

  return (
    <div className={`reasoning-output ${className}`}>
      {variant === "reasoning-engine" && (
        <div className="reasoning-engine-badge">
          <span className="reasoning-engine-dot" />
          OPUS 4.6 REASONING ENGINE
        </div>
      )}

      {/* Thinking trace panel */}
      {thinkingText && (
        <div className="mb-3">
          <button
            onClick={() => setShowThinking(!showThinking)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer"
          >
            <Brain size={12} />
            <span>Model Reasoning {isThinking ? "(thinking...)" : ""}</span>
            {showThinking ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {showThinking && (
            <div
              ref={thinkingRef}
              className="mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 max-h-48 overflow-y-auto"
            >
              <pre className="text-xs text-[var(--color-text-dim)] font-mono whitespace-pre-wrap leading-relaxed">
                {thinkingText}
              </pre>
              {isThinking && <StreamingCursor />}
            </div>
          )}
        </div>
      )}

      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
      {isStreaming && <StreamingCursor />}
    </div>
  );
}
