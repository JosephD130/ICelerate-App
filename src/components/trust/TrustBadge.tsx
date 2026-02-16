"use client";

import type { Suggestion } from "@/lib/memory/types";
import { T } from "@/lib/terminology";

export type TrustStatus = "verified" | "needs_review" | "unverified";

const TRUST_CONFIG: Record<TrustStatus, { dot: string; label: string; text: string; bg: string }> = {
  verified: {
    dot: "var(--color-semantic-green)",
    label: T.TRUST.verified,
    text: "var(--color-semantic-green)",
    bg: "var(--color-semantic-green-dim)",
  },
  needs_review: {
    dot: "var(--color-semantic-yellow)",
    label: T.TRUST.needs_review,
    text: "var(--color-semantic-yellow)",
    bg: "var(--color-semantic-yellow-dim)",
  },
  unverified: {
    dot: "var(--color-text-dim)",
    label: T.TRUST.unverified,
    text: "var(--color-text-dim)",
    bg: "var(--color-surface)",
  },
};

export function computeTrustStatus(suggestion: Suggestion): { status: TrustStatus; reason: string } {
  if (suggestion.status === "accepted") {
    return { status: "verified", reason: "Reviewed and applied" };
  }
  if (
    (suggestion.status === "pending" || suggestion.status === "edited") &&
    suggestion.confidence >= 65 &&
    suggestion.citations.length > 0
  ) {
    return {
      status: "needs_review",
      reason: `${suggestion.citations.length} source${suggestion.citations.length !== 1 ? "s" : ""} cited`,
    };
  }
  if (suggestion.citations.length === 0) {
    return { status: "unverified", reason: "Missing citations" };
  }
  return { status: "unverified", reason: "Low confidence" };
}

interface TrustBadgeProps {
  status: TrustStatus;
  reason?: string;
  size?: "sm" | "md";
  compositeScore?: number;
}

export default function TrustBadge({ status, reason, size = "md", compositeScore }: TrustBadgeProps) {
  const config = TRUST_CONFIG[status];

  if (size === "sm") {
    return (
      <span
        className="inline-flex items-center gap-1 shrink-0"
        title={reason ?? config.label}
      >
        <span
          className="inline-block w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: config.dot }}
        />
        {reason && (
          <span className="text-[10px] font-data" style={{ color: config.text }}>
            {reason}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className="inline-flex flex-col items-start gap-0.5 shrink-0"
    >
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-semibold"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        <span
          className="inline-block w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: config.dot }}
        />
        {config.label}
        {compositeScore !== undefined && (
          <span className="font-data ml-0.5">
            {Math.round(compositeScore * 100)}%
          </span>
        )}
      </span>
      {reason && (
        <span className="text-[10px] font-data pl-0.5" style={{ color: config.text }}>
          {reason}
        </span>
      )}
    </span>
  );
}
