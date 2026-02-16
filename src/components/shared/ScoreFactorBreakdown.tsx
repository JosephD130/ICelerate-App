"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ScoreFactor, DeterministicScore } from "@/lib/scoring/monitor-score";

const GRADE_COLORS: Record<string, string> = {
  A: "var(--color-semantic-green)",
  B: "var(--color-semantic-green)",
  C: "var(--color-semantic-yellow)",
  D: "var(--color-semantic-red)",
  F: "var(--color-semantic-red)",
};

const SEVERITY_COLORS: Record<string, string> = {
  ok: "var(--color-semantic-green)",
  warning: "var(--color-semantic-yellow)",
  critical: "var(--color-semantic-red)",
};

function FactorBar({ factor }: { factor: ScoreFactor }) {
  const color = SEVERITY_COLORS[factor.severity];
  return (
    <div className="flex items-center gap-3">
      <div className="w-[120px] shrink-0 text-xs text-[var(--color-text-secondary)] truncate">
        {factor.label}
      </div>
      <div className="flex-1 h-[4px] rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-600"
          style={{ width: `${factor.score}%`, backgroundColor: color }}
        />
      </div>
      <div
        className="w-8 text-right text-xs font-data"
        style={{ color }}
      >
        {factor.score}
      </div>
    </div>
  );
}

export default function ScoreFactorBreakdown({
  score,
  showDivergence,
  aiScore,
}: {
  score: DeterministicScore;
  showDivergence?: boolean;
  aiScore?: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const gradeColor = GRADE_COLORS[score.grade];
  const divergence =
    aiScore != null ? Math.abs(aiScore - score.composite) : 0;

  return (
    <div className="mt-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-[var(--color-text-secondary)] cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold"
            style={{
              backgroundColor: gradeColor,
              color: "var(--color-bg)",
            }}
          >
            {score.grade}
          </span>
          <span className="font-data">
            Data Score: {score.composite}/100
          </span>
          {showDivergence && divergence > 15 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-semantic-yellow-dim)] text-[var(--color-semantic-yellow)]">
              AI diverges by {divergence}pts
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {score.factors.map((f) => (
            <div key={f.id}>
              <FactorBar factor={f} />
              <div className="ml-[132px] text-xs text-[var(--color-text-dim)] mt-0.5">
                {f.detail}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
