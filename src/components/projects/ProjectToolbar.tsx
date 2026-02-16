"use client";

import { List, Grid3X3, Table2 } from "lucide-react";
import type { AttentionTier } from "@/lib/scoring/attention-score";
import { TIER_COLORS } from "@/lib/scoring/attention-score";

export type ViewMode = "priority" | "grid" | "table";
export type SortOption = "score" | "name" | "events" | "cost";

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  tierFilter: Set<AttentionTier>;
  onTierToggle: (tier: AttentionTier) => void;
}

const VIEWS: { id: ViewMode; icon: typeof List; label: string }[] = [
  { id: "priority", icon: List, label: "Priority" },
  { id: "grid", icon: Grid3X3, label: "Grid" },
  { id: "table", icon: Table2, label: "Table" },
];

const SORTS: { id: SortOption; label: string }[] = [
  { id: "score", label: "Attention Score" },
  { id: "name", label: "Name" },
  { id: "events", label: "Event Count" },
  { id: "cost", label: "Cost Exposure" },
];

const TIERS: AttentionTier[] = ["critical", "elevated", "monitoring", "stable"];

export default function ProjectToolbar({
  view,
  onViewChange,
  sort,
  onSortChange,
  tierFilter,
  onTierToggle,
}: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap mb-4">
      {/* View toggle */}
      <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] overflow-hidden">
        {VIEWS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all ${
              view === id
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
            title={label}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] focus:outline-none cursor-pointer"
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>

      {/* Tier filter chips */}
      <div className="flex items-center gap-1.5 ml-auto">
        {TIERS.map((t) => {
          const cfg = TIER_COLORS[t];
          const active = tierFilter.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => onTierToggle(t)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-all border ${
                active
                  ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "bg-transparent border-[var(--color-border)] text-[var(--color-text-dim)]"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
