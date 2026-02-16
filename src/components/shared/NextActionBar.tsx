"use client";

import { Zap, ArrowRight } from "lucide-react";
import type { NextAction } from "@/lib/next-action";
import type { EventTab } from "@/lib/contexts/event-context";

const URGENCY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  high: {
    text: "var(--color-semantic-red)",
    bg: "var(--color-semantic-red-dim)",
    border: "var(--color-semantic-red)",
  },
  medium: {
    text: "var(--color-semantic-yellow)",
    bg: "var(--color-semantic-yellow-dim)",
    border: "var(--color-semantic-yellow)",
  },
  low: {
    text: "var(--color-semantic-blue)",
    bg: "var(--color-semantic-blue-dim)",
    border: "var(--color-semantic-blue)",
  },
};

interface Props {
  action: NextAction;
  onNavigate: (tab: EventTab) => void;
}

export default function NextActionBar({ action, onNavigate }: Props) {
  const colors = URGENCY_COLORS[action.urgency] ?? URGENCY_COLORS.medium;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-card)] mb-4"
      style={{
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
      }}
    >
      <Zap size={13} style={{ color: colors.text }} className="shrink-0" />
      <span className="text-sm font-semibold" style={{ color: colors.text }}>
        {action.label}
      </span>
      <span className="text-[10px] text-[var(--color-text-dim)]">
        {action.reason}
      </span>
      <button
        onClick={() => onNavigate(action.tab)}
        className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
        style={{ color: colors.text, backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        Go <ArrowRight size={10} />
      </button>
    </div>
  );
}
