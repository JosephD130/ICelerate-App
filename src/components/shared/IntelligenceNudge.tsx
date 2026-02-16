"use client";

import { Lightbulb, AlertTriangle, TrendingUp, Brain } from "lucide-react";
import type { Nudge } from "@/lib/demo/long-term-memory";

const NUDGE_ICONS: Record<Nudge["type"], React.ReactNode> = {
  warning: <AlertTriangle size={14} />,
  suggestion: <Lightbulb size={14} />,
  pattern: <TrendingUp size={14} />,
  insight: <Brain size={14} />,
};

const NUDGE_COLORS: Record<Nudge["type"], { text: string; bg: string }> = {
  warning: { text: "var(--color-semantic-yellow)", bg: "var(--color-semantic-yellow-dim)" },
  suggestion: { text: "var(--color-semantic-blue)", bg: "var(--color-semantic-blue-dim)" },
  pattern: { text: "var(--color-semantic-green)", bg: "var(--color-semantic-green-dim)" },
  insight: { text: "var(--color-semantic-purple)", bg: "var(--color-semantic-purple-dim)" },
};

export default function IntelligenceNudge({ nudge }: { nudge: Nudge }) {
  const colors = NUDGE_COLORS[nudge.type];

  return (
    <div
      className="flex gap-2.5 p-3 rounded-[var(--radius-input)] border"
      style={{
        backgroundColor: colors.bg,
        borderColor: `color-mix(in srgb, ${colors.text} 30%, transparent)`,
      }}
    >
      <div className="shrink-0 mt-0.5" style={{ color: colors.text }}>
        {NUDGE_ICONS[nudge.type]}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
          {nudge.message}
        </p>
        <p className="text-xs mt-1 font-data" style={{ color: colors.text }}>
          {nudge.source}
        </p>
      </div>
    </div>
  );
}
