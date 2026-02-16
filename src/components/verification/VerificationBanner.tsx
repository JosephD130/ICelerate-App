"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, ShieldX, ListChecks } from "lucide-react";
import type { TrustEvalResult, TrustStatus } from "@/lib/validation/trust-evaluator";
import type { ConfidenceData } from "@/lib/confidence/types";
import SubscoreBar from "@/components/shared/SubscoreBar";
import ResolveBlockersModal from "./ResolveBlockersModal";
import { FLAGS } from "@/lib/flags";

const STATUS_CONFIG: Record<
  TrustStatus,
  { Icon: typeof ShieldCheck; color: string; bg: string; border: string; label: string }
> = {
  verified: {
    Icon: ShieldCheck,
    color: "var(--color-semantic-green)",
    bg: "var(--color-semantic-green-dim)",
    border: "var(--color-semantic-green)",
    label: "Validated",
  },
  needs_review: {
    Icon: AlertTriangle,
    color: "var(--color-semantic-yellow)",
    bg: "var(--color-semantic-yellow-dim)",
    border: "var(--color-semantic-yellow)",
    label: "Pending Review",
  },
  unverified: {
    Icon: ShieldX,
    color: "var(--color-semantic-red)",
    bg: "var(--color-semantic-red-dim)",
    border: "var(--color-semantic-red)",
    label: "Insufficient Documentation",
  },
};

interface Props {
  result: TrustEvalResult;
  confidenceData?: ConfidenceData | null;
  onResolve?: () => void;
}

export default function VerificationBanner({ result, confidenceData, onResolve }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const config = STATUS_CONFIG[result.status];
  const { Icon } = config;

  return (
    <>
      <div
        className="mt-3 flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)]"
        style={{
          backgroundColor: config.bg,
          borderLeft: `3px solid ${config.border}`,
        }}
      >
        <Icon size={13} style={{ color: config.color }} className="shrink-0" />
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        <span className="text-xs font-data" style={{ color: config.color }}>
          {result.reason}
        </span>

        {result.blockers.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="ml-auto flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
            style={{
              color: config.color,
              backgroundColor: "rgba(255,255,255,0.08)",
              border: `1px solid ${config.border}`,
            }}
          >
            <ListChecks size={10} />
            Resolve ({result.blockers.length})
          </button>
        )}
      </div>

      {FLAGS.confidenceScoring && confidenceData?.confidence_breakdown && (
        <div className="mt-2 grid grid-cols-3 gap-3 px-3">
          <SubscoreBar label="Evidence" value={confidenceData.confidence_breakdown.evidence_score} />
          <SubscoreBar label="Freshness" value={confidenceData.confidence_breakdown.freshness_score} />
          <SubscoreBar label="Fit" value={confidenceData.confidence_breakdown.fit_score} />
        </div>
      )}

      {FLAGS.confidenceScoring && confidenceData?.score_overwritten && (
        <div className="mt-1 px-3 text-xs font-data text-[var(--color-semantic-yellow)]">
          Evidence score recomputed by server
        </div>
      )}

      {FLAGS.confidenceScoring && confidenceData?.missing_evidence && confidenceData.missing_evidence.length > 0 && (
        <div className="mt-1 px-3 space-y-0.5">
          {confidenceData.missing_evidence.map((item, i) => (
            <div key={i} className="text-xs font-data text-[var(--color-text-dim)]">
              Missing: {item}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ResolveBlockersModal
          blockers={result.blockers}
          onClose={() => setModalOpen(false)}
          onResolve={onResolve}
        />
      )}
    </>
  );
}
