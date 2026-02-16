"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CompletionIndicatorProps {
  text: string;
}

export default function CompletionIndicator({ text }: CompletionIndicatorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Check size={12} className="text-[var(--color-semantic-green)]" />
        <span className="text-[10px] font-data text-[var(--color-semantic-green)]">
          Complete
        </span>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-all"
      >
        {copied ? (
          <>
            <Check size={12} className="text-[var(--color-semantic-green)]" />
            Copied
          </>
        ) : (
          <>
            <Copy size={12} />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
