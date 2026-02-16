"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { FLAGS } from "@/lib/flags";
import { analyzeConflicts, type ConflictAnalysis } from "@/lib/analysis/conflict-extractor";

interface PanelInput {
  id: string;
  label: string;
  text: string;
}

export default function ConflictAlert({ panels }: { panels: PanelInput[] }) {
  const analysis: ConflictAnalysis | null = useMemo(() => {
    const withText = panels.filter((p) => p.text);
    if (withText.length < 2) return null;
    return analyzeConflicts(withText);
  }, [panels]);

  if (!analysis) return null;
  if (analysis.positions.filter((p) => p.recommendation).length < 2) return null;

  if (analysis.aligned) {
    return (
      <div
        className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-[var(--radius-card)] border"
        style={{
          backgroundColor: "var(--color-semantic-green-dim)",
          borderColor: "var(--color-semantic-green)",
        }}
      >
        <CheckCircle size={14} style={{ color: "var(--color-semantic-green)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--color-semantic-green)" }}>
          Stakeholder alignment confirmed
        </span>
        <span className="text-xs text-[var(--color-text-muted)] ml-1">
          — {analysis.conflictSummary}
        </span>
      </div>
    );
  }

  return (
    <div
      className="mt-4 px-4 py-3 rounded-[var(--radius-card)] border"
      style={{
        backgroundColor: "var(--color-semantic-yellow-dim)",
        borderColor: "var(--color-semantic-yellow)",
      }}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--color-semantic-yellow)" }} />
        <div className="flex-1">
          <span className="text-sm font-semibold" style={{ color: "var(--color-semantic-yellow)" }}>
            Stakeholder misalignment detected
          </span>
          {FLAGS.enhancedConflict && (
            <span className="text-xs font-data text-[var(--color-text-dim)] ml-2">
              ({Math.round(analysis.conflictSeverity * 100)}% divergence)
            </span>
          )}
          <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {analysis.conflictSummary}
          </div>

          {FLAGS.enhancedConflict && (
            <>
              {/* Per-position detail */}
              <div className="mt-2 space-y-1.5">
                {analysis.positions
                  .filter((p) => p.recommendation)
                  .map((p) => (
                    <div
                      key={p.panelId}
                      className="flex items-start gap-2 text-xs bg-[var(--color-surface)] rounded-[var(--radius-sm)] px-2.5 py-1.5"
                    >
                      <span className="font-semibold text-[var(--color-text-primary)] w-28 shrink-0">
                        {p.panelLabel}
                      </span>
                      <span
                        className="font-data shrink-0"
                        style={{
                          color:
                            p.recommendation === "APPROVE"
                              ? "var(--color-semantic-green)"
                              : p.recommendation === "DELAY"
                              ? "var(--color-semantic-yellow)"
                              : p.recommendation === "ESCALATE"
                              ? "var(--color-semantic-red)"
                              : "var(--color-semantic-blue)",
                        }}
                      >
                        {p.recommendation}
                      </span>
                      {p.severity && (
                        <span className="text-[var(--color-text-dim)] font-data">
                          [{p.severity}]
                        </span>
                      )}
                      {p.rationale && (
                        <span className="text-[var(--color-text-muted)] truncate">
                          {p.rationale.slice(0, 100)}
                        </span>
                      )}
                    </div>
                  ))}
              </div>

              {/* Pivot point */}
              {analysis.pivotPoint && (
                <div className="mt-2 text-xs px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
                  Pivot point: {analysis.pivotPoint}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
