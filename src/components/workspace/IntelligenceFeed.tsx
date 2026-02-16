"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, X, AlertTriangle, Clock, DollarSign, Users, FileText, Activity, Shield } from "lucide-react";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useEvents } from "@/lib/contexts/event-context";
import { useMemory } from "@/lib/contexts/memory-context";
import { resolveIntelligenceFeed, type InsightCard } from "@/lib/demo/v5/resolvers/intelligence-feed";
import { detectDrifts } from "@/lib/reality-sync/drift-detector";
import { aggregateSignals, type MorningBrief } from "@/lib/analysis/signal-aggregator";
import { FLAGS } from "@/lib/flags";

const TYPE_ICONS: Record<InsightCard["type"], typeof AlertTriangle> = {
  notice_expiring: Clock,
  cost_trending: DollarSign,
  stakeholder_gap: Users,
  schedule_drift: Activity,
  log_anomaly: AlertTriangle,
  new_constraint: FileText,
};

const IMPACT_BORDER: Record<InsightCard["impact"], string> = {
  high: "border-l-red-600",
  medium: "border-l-yellow-500",
  low: "border-l-slate-400",
};

const HEALTH_STYLE: Record<string, { color: string; label: string }> = {
  good: { color: "var(--color-semantic-green)", label: "Good" },
  caution: { color: "var(--color-semantic-yellow)", label: "Caution" },
  critical: { color: "var(--color-semantic-red)", label: "Critical" },
};

export default function IntelligenceFeed() {
  const router = useRouter();
  const { activeProject } = useActiveProject();
  const { events } = useEvents();
  const { allSuggestions: suggestions } = useMemory();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const allCards = useMemo(
    () => (FLAGS.intelligenceFeed ? resolveIntelligenceFeed(activeProject.id) : []),
    [activeProject.id],
  );
  const cards = allCards.filter((c) => !dismissed.has(c.id));

  // Signal aggregation: morning brief (must be before any early returns)
  const morningBrief: MorningBrief | null = useMemo(() => {
    if (!FLAGS.signalAggregation || !FLAGS.intelligenceFeed) return null;
    const driftResults = detectDrifts(events);
    return aggregateSignals({
      suggestions,
      driftResults,
      insightCards: allCards,
      events,
      projectId: activeProject.id,
    });
  }, [activeProject.id, suggestions, allCards, events]);

  if (!FLAGS.intelligenceFeed) return null;
  if (cards.length === 0 && !morningBrief) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
          Action Required
        </span>
        <span className="text-xs font-data text-[var(--color-text-dim)]">
          {cards.length} insight{cards.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Morning Brief Summary */}
      {morningBrief && morningBrief.signals.length > 0 && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-[var(--color-accent)]" />
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Morning Brief
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-data px-2 py-0.5 rounded-full border border-[var(--color-border)]"
                style={{
                  color: HEALTH_STYLE[morningBrief.overallHealth].color,
                }}
              >
                {HEALTH_STYLE[morningBrief.overallHealth].label}
              </span>
              <span className="text-xs font-data text-[var(--color-text-dim)]">
                {morningBrief.signals.length} signals · {morningBrief.actionCount} actions
              </span>
            </div>
          </div>
          {morningBrief.topRisk && (
            <div className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] rounded-[var(--radius-sm)] px-3 py-2">
              <span className="font-semibold text-[var(--color-semantic-red)]">Top risk: </span>
              {morningBrief.topRisk.headline}
              {morningBrief.topRisk.suggestedTab && (
                <span className="text-[var(--color-text-dim)]"> → {morningBrief.topRisk.suggestedTab} tab</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => {
          const Icon = TYPE_ICONS[card.type];
          const borderClass = IMPACT_BORDER[card.impact];

          return (
            <div
              key={card.id}
              className={`bg-[var(--color-card)] border border-[var(--color-border)] border-l-4 ${borderClass} shadow-sm rounded-[var(--radius-card)] p-5 flex flex-col`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={14} className="shrink-0 text-[var(--color-text-muted)]" />
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                    {card.headline}
                  </span>
                </div>
                <button
                  onClick={() => setDismissed((prev) => new Set(prev).add(card.id))}
                  className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
                  title="Dismiss"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Detail */}
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-3 flex-1">
                {card.detail}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] bg-transparent font-medium capitalize">
                    {card.impact}
                  </span>
                  <span className="text-xs font-data text-[var(--color-text-dim)]">
                    {card.confidence}% confidence
                  </span>
                </div>
                {card.relatedEventId && (
                  <button
                    onClick={() => router.push(`/workspace/events/${card.relatedEventId}`)}
                    className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
                  >
                    View Event <ArrowRight size={10} />
                  </button>
                )}
              </div>

              {/* Source */}
              <div className="text-xs font-data text-[var(--color-text-dim)] mt-1.5">
                {card.source}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
