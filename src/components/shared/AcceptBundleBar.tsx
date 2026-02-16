"use client";

import { CheckCircle, Info } from "lucide-react";
import type { Suggestion } from "@/lib/memory/types";
import { computeTrustStatus } from "@/components/trust/TrustBadge";

interface Props {
  suggestions: Suggestion[];
  onAcceptBundle: (ids: string[]) => void;
}

export default function AcceptBundleBar({ suggestions, onAcceptBundle }: Props) {
  const safeToAccept = suggestions.filter((s) => {
    if (s.status !== "pending" && s.status !== "edited") return false;
    if (s.type === "notice_risk") return false;
    const trust = computeTrustStatus(s);
    return trust.status !== "unverified";
  });

  const excluded = suggestions.filter((s) => {
    if (s.status !== "pending" && s.status !== "edited") return false;
    return s.type === "notice_risk" || computeTrustStatus(s).status === "unverified";
  });

  if (safeToAccept.length < 2) return null;

  return (
    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-card)] border border-[var(--color-border)]">
      <button
        onClick={() => onAcceptBundle(safeToAccept.map((s) => s.id))}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] transition-colors cursor-pointer"
      >
        <CheckCircle size={11} />
        Accept {safeToAccept.length} verified-safe items
      </button>
      {excluded.length > 0 && (
        <span className="flex items-center gap-1 text-xs font-data text-[var(--color-text-dim)]">
          <Info size={10} />
          Excludes {excluded.length} notice/unverified
        </span>
      )}
    </div>
  );
}
