"use client";

import { CheckCircle, XCircle, ArrowUp } from "lucide-react";
import type { EntitlementAssessment } from "@/lib/contract/entitlement-rubric";

const STRENGTH_COLORS: Record<string, string> = {
  HIGH: "var(--color-semantic-green)",
  MEDIUM: "var(--color-semantic-yellow)",
  LOW: "var(--color-semantic-red)",
};

const STRENGTH_BG: Record<string, string> = {
  HIGH: "var(--color-semantic-green-dim)",
  MEDIUM: "var(--color-semantic-yellow-dim)",
  LOW: "var(--color-semantic-red-dim)",
};

export default function EntitlementCard({
  assessment,
}: {
  assessment: EntitlementAssessment;
}) {
  const color = STRENGTH_COLORS[assessment.strength];
  const bg = STRENGTH_BG[assessment.strength];

  return (
    <div
      className="mt-3 border rounded-[var(--radius-sm)] p-3"
      style={{ borderColor: color, backgroundColor: bg }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: color, color: "var(--color-bg)" }}
          >
            {assessment.strength}
          </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Entitlement Strength
          </span>
        </div>
        <span className="text-xs font-data" style={{ color }}>
          {assessment.score}/100
        </span>
      </div>

      <div className="space-y-1">
        {assessment.factors.map((f) => (
          <div key={f.id} className="flex items-start gap-1.5">
            {f.met ? (
              <CheckCircle
                size={11}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--color-semantic-green)" }}
              />
            ) : (
              <XCircle
                size={11}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--color-semantic-red)" }}
              />
            )}
            <div>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {f.label}
              </span>
              <span className="text-[10px] text-[var(--color-text-dim)] ml-1">
                — {f.evidence}
              </span>
            </div>
          </div>
        ))}
      </div>

      {assessment.missingForUpgrade.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
          <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            To strengthen position
          </div>
          {assessment.missingForUpgrade.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-1 text-xs text-[var(--color-accent)]"
            >
              <ArrowUp size={9} />
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
