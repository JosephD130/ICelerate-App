"use client";

import { ArrowRight, AlertTriangle, Clock, DollarSign, Shield, Radio, Trash2 } from "lucide-react";
import type { DemoProject } from "@/lib/demo/v5/projects";
import type { AttentionScore } from "@/lib/scoring/attention-score";
import { TIER_COLORS } from "@/lib/scoring/attention-score";

interface Props {
  project: DemoProject;
  score: AttentionScore;
  isCurrent: boolean;
  ctaLabel: string;
  onSelect: () => void;
  onCta: () => void;
  onShowScore: () => void;
  onDelete?: () => void;
  variant?: "priority" | "grid";
}

const FACTOR_ICONS: Record<string, React.ReactNode> = {
  events: <Shield size={11} />,
  severity: <AlertTriangle size={11} />,
  notice: <Clock size={11} />,
  schedule: <Clock size={11} />,
  freshness: <Radio size={11} />,
  contingency: <DollarSign size={11} />,
};

export default function ProjectCard({
  project,
  score,
  isCurrent,
  ctaLabel,
  onSelect,
  onCta,
  onShowScore,
  onDelete,
  variant = "grid",
}: Props) {
  const tier = TIER_COLORS[score.tier];
  const topFactors = score.factors.slice(0, 3);
  const openEvents = project.events.filter((e) => e.status !== "resolved").length;
  const currentPhase = project.phases[project.phases.length - 1]?.name ?? "—";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={`w-full text-left bg-[var(--color-card)] border rounded-[var(--radius-card)] transition-all group hover:border-[var(--color-accent)]/30 cursor-pointer ${
        isCurrent
          ? "border-[var(--color-accent)]/40 ring-1 ring-[var(--color-accent)]/20"
          : "border-[var(--color-border)]"
      } ${variant === "priority" ? "px-5 py-4 flex items-center gap-5" : "p-4 flex flex-col"}`}
    >
      {/* Score badge */}
      <div className={`flex flex-col items-center shrink-0 ${variant === "priority" ? "" : "mb-3"}`}>
        <div
          className={`flex items-center justify-center font-data font-bold text-sm ${
            variant === "priority" ? "w-12 h-12 rounded-[var(--radius-sm)]" : "w-10 h-10 rounded-[var(--radius-sm)]"
          }`}
          style={{ backgroundColor: tier.bg, color: tier.color }}
        >
          {score.total}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShowScore(); }}
          className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-accent)] mt-0.5 transition-colors"
        >
          Why?
        </button>
      </div>

      {/* Main content */}
      <div className={variant === "priority" ? "flex-1 min-w-0" : ""}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
            {project.name}
          </h3>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: tier.bg, color: tier.color }}
          >
            {tier.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--color-text-dim)] mb-2">
          <span>{project.owner}</span>
          <span className="font-data">{project.percentComplete}%</span>
          <span className="font-data">{currentPhase}</span>
        </div>

        {/* Top signals */}
        <div className={`space-y-1 ${variant === "priority" ? "" : "mb-3"}`}>
          {topFactors.map((f) => (
            <div key={f.key} className="flex items-center gap-1.5 text-xs">
              <span style={{ color: f.score >= 50 ? "var(--color-semantic-yellow)" : "var(--color-text-dim)" }}>
                {FACTOR_ICONS[f.key] ?? <Shield size={11} />}
              </span>
              <span className="text-[var(--color-text-secondary)]">{f.label}:</span>
              <span className="font-data text-[var(--color-text-muted)]">{f.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side (priority) / Bottom (grid) */}
      <div className={`flex items-center gap-2 ${variant === "priority" ? "shrink-0" : "mt-auto pt-2 border-t border-[var(--color-border)]"}`}>
        {/* Badge stack */}
        <span className="text-xs font-data text-[var(--color-text-dim)]">
          {openEvents} open
        </span>
        <span className="text-xs font-data text-[var(--color-text-dim)]">
          ${(project.events.reduce((s, e) => s + e.costExposure.amount, 0) / 1000).toFixed(0)}K exp
        </span>

        {/* CTA — role-specific route */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCta(); }}
          className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
        >
          {ctaLabel} <ArrowRight size={10} />
        </button>

        {/* Delete — user-created projects only */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] hover:bg-[var(--color-semantic-red)]/10 transition-all opacity-0 group-hover:opacity-100"
            title="Delete project"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
