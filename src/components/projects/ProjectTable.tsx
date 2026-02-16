"use client";

import { useState } from "react";
import { ArrowRight, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import type { ScoredProject } from "@/lib/scoring/role-priority";
import { TIER_COLORS } from "@/lib/scoring/attention-score";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";

type SortKey = "score" | "name" | "events" | "cost" | "schedule";

interface Props {
  items: ScoredProject[];
  ctaLabel: string;
  currentProjectId: string;
  onSelect: (projectId: string) => void;
  onCta: (projectId: string, topEventId: string | null) => void;
  onShowScore: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
}

export default function ProjectTable({ items, ctaLabel, currentProjectId, onSelect, onCta, onShowScore, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...items].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "score":
        cmp = b.score.total - a.score.total;
        break;
      case "name":
        cmp = a.project.name.localeCompare(b.project.name);
        break;
      case "events":
        cmp =
          b.project.events.filter((e) => e.status !== "resolved").length -
          a.project.events.filter((e) => e.status !== "resolved").length;
        break;
      case "cost":
        cmp =
          b.project.events.reduce((s, e) => s + e.costExposure.amount, 0) -
          a.project.events.reduce((s, e) => s + e.costExposure.amount, 0);
        break;
      case "schedule": {
        const aDays = a.project.events
          .filter((e) => e.scheduleImpact.criticalPath && e.status !== "resolved")
          .reduce((s, e) => s + e.scheduleImpact.days, 0);
        const bDays = b.project.events
          .filter((e) => e.scheduleImpact.criticalPath && e.status !== "resolved")
          .reduce((s, e) => s + e.scheduleImpact.days, 0);
        cmp = bDays - aDays;
        break;
      }
    }
    return sortAsc ? -cmp : cmp;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  };

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[var(--color-surface)] text-xs font-bold uppercase tracking-[1px] text-[var(--color-text-muted)]">
            <th className="px-4 py-2.5 cursor-pointer hover:text-[var(--color-text-secondary)]" onClick={() => handleSort("name")}>
              <span className="flex items-center gap-1">Project <SortIcon col="name" /></span>
            </th>
            <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--color-text-secondary)] text-center w-20" onClick={() => handleSort("score")}>
              <span className="flex items-center justify-center gap-1">Score <SortIcon col="score" /></span>
            </th>
            <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--color-text-secondary)] text-center w-24" onClick={() => handleSort("events")}>
              <span className="flex items-center justify-center gap-1">Open Risks <SortIcon col="events" /></span>
            </th>
            <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--color-text-secondary)] text-right w-28" onClick={() => handleSort("cost")}>
              <span className="flex items-center justify-end gap-1">Cost Exposure <SortIcon col="cost" /></span>
            </th>
            <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--color-text-secondary)] text-center w-28" onClick={() => handleSort("schedule")}>
              <span className="flex items-center justify-center gap-1">Schedule Risk <SortIcon col="schedule" /></span>
            </th>
            <th className="px-3 py-2.5 text-center w-24">Freshness</th>
            <th className="px-3 py-2.5 w-32"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ project, score }) => {
            const tier = TIER_COLORS[score.tier];
            const openEvents = project.events.filter((e) => e.status !== "resolved").length;
            const totalCost = project.events.reduce((s, e) => s + e.costExposure.amount, 0);
            const critDays = project.events
              .filter((e) => e.scheduleImpact.criticalPath && e.status !== "resolved")
              .reduce((s, e) => s + e.scheduleImpact.days, 0);
            const freshness = computeFreshnessBadge({ sources: project.sourceProfile.sources });
            const freshColor =
              freshness.level === "fresh" ? "var(--color-semantic-green)" :
              freshness.level === "stale" ? "var(--color-semantic-yellow)" :
              "var(--color-semantic-red)";
            const isCurrent = project.id === currentProjectId;

            return (
              <tr
                key={project.id}
                className={`border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)] cursor-pointer ${
                  isCurrent ? "bg-[var(--color-accent-dim)]" : ""
                }`}
                onClick={() => onSelect(project.id)}
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">{project.name}</div>
                  <div className="text-xs text-[var(--color-text-dim)]">{project.owner}</div>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex flex-col items-center">
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] font-data font-bold text-xs"
                      style={{ backgroundColor: tier.bg, color: tier.color }}
                    >
                      {score.total}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onShowScore(project.id); }}
                      className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-accent)] mt-0.5 transition-colors"
                    >
                      Why?
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-data text-sm text-[var(--color-text-secondary)]">
                  {openEvents}
                </td>
                <td className="px-3 py-3 text-right font-data text-sm text-[var(--color-text-secondary)]">
                  ${totalCost.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-center font-data text-sm text-[var(--color-text-secondary)]">
                  {critDays > 0 ? `${critDays}d crit` : "—"}
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: freshColor }}
                    title={freshness.reason}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onCta(project.id, score.topEventId); }}
                      className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
                    >
                      {ctaLabel} <ArrowRight size={10} />
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                        className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] hover:bg-[var(--color-semantic-red)]/10 transition-all"
                        title="Delete project"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
