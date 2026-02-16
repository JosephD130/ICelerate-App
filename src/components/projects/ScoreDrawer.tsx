"use client";

import { X, Shield, AlertTriangle, Clock, DollarSign, Radio } from "lucide-react";
import type { DemoProject } from "@/lib/demo/v5/projects";
import type { AttentionScore } from "@/lib/scoring/attention-score";
import { TIER_COLORS } from "@/lib/scoring/attention-score";

interface Props {
  project: DemoProject;
  score: AttentionScore;
  onClose: () => void;
}

const FACTOR_ICONS: Record<string, React.ReactNode> = {
  events: <Shield size={14} />,
  severity: <AlertTriangle size={14} />,
  notice: <Clock size={14} />,
  schedule: <Clock size={14} />,
  freshness: <Radio size={14} />,
  contingency: <DollarSign size={14} />,
};

export default function ScoreDrawer({ project, score, onClose }: Props) {
  const tier = TIER_COLORS[score.tier];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[400px] bg-[var(--color-navy)] border-l border-[var(--color-border)] flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center font-data font-bold text-sm shrink-0"
              style={{ backgroundColor: tier.bg, color: tier.color }}
            >
              {score.total}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {project.name}
              </h2>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: tier.bg, color: tier.color }}
              >
                {tier.label}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Factors */}
        <div className="px-5 py-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
            Score Breakdown
          </h3>

          {score.factors.map((f) => {
            const weighted = Math.round(f.score * f.weight);
            return (
              <div key={f.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: f.score >= 50 ? "var(--color-semantic-yellow)" : "var(--color-text-dim)" }}>
                      {FACTOR_ICONS[f.key] ?? <Shield size={14} />}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {f.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-data text-[var(--color-text-dim)]">
                      {Math.round(f.weight * 100)}% wt
                    </span>
                    <span className="text-sm font-data font-bold" style={{ color: tier.color }}>
                      {f.score}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${f.score}%`,
                      backgroundColor: f.score >= 75 ? "var(--color-semantic-red)" :
                        f.score >= 50 ? "var(--color-semantic-yellow)" :
                        f.score >= 25 ? "var(--color-semantic-blue)" :
                        "var(--color-semantic-green)",
                    }}
                  />
                </div>

                <p className="text-xs text-[var(--color-text-dim)]">
                  {f.detail} &middot; contributes {weighted} pts
                </p>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-auto px-5 py-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)]">Total Attention Score</span>
            <span className="font-data font-bold text-lg" style={{ color: tier.color }}>
              {score.total}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-dim)] mt-1">
            Deterministic score based on {score.factors.length} weighted factors. No AI involved.
          </p>
        </div>
      </div>
    </div>
  );
}
