"use client";

import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { FreshnessBadge } from "@/lib/provenance/freshness";
import { T } from "@/lib/terminology";

const CONFIG = {
  fresh: {
    icon: CheckCircle,
    color: "var(--color-semantic-green)",
    bg: "var(--color-semantic-green-dim)",
    border: "var(--color-semantic-green)",
  },
  stale: {
    icon: Clock,
    color: "var(--color-semantic-yellow)",
    bg: "var(--color-semantic-yellow-dim)",
    border: "var(--color-semantic-yellow)",
  },
  old: {
    icon: AlertTriangle,
    color: "var(--color-semantic-red)",
    bg: "var(--color-semantic-red-dim)",
    border: "var(--color-semantic-red)",
  },
};

export default function FreshnessBanner({
  badge,
  compact = false,
}: {
  badge: FreshnessBadge;
  compact?: boolean;
}) {
  if (badge.level === "fresh" && compact) return null;

  const cfg = CONFIG[badge.level];
  const Icon = cfg.icon;

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-data"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        <Icon size={10} />
        {badge.reason}
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-2 px-3 py-2 rounded-[var(--radius-sm)] border mt-3"
      style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      <Icon size={13} className="mt-0.5 shrink-0" style={{ color: cfg.color }} />
      <div>
        <div className="text-xs font-semibold" style={{ color: cfg.color }}>
          {badge.level === "fresh"
            ? "Sources Current"
            : badge.level === "stale"
              ? T.FRESHNESS
              : "Source Data Outdated"}
        </div>
        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          {badge.reason}
          {badge.oldestSourceLabel && badge.oldestSourceAgeDays !== undefined && (
            <> — oldest: {badge.oldestSourceLabel} ({badge.oldestSourceAgeDays}d)</>
          )}
        </div>
      </div>
    </div>
  );
}
