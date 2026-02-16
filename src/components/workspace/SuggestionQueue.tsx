"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle, Plus, ChevronDown, ChevronRight, List } from "lucide-react";
import { useMemory } from "@/lib/contexts/memory-context";
import { useEvents } from "@/lib/contexts/event-context";
import { SUGGESTION_ACTIONS, INTENT_KEY, type SuggestionActionIntent } from "@/lib/suggestion-actions";
import SuggestionCard from "@/components/shared/SuggestionCard";
import FreshnessBar from "@/components/shared/FreshnessBar";
import AcceptBundleBar from "@/components/shared/AcceptBundleBar";
import { resolveFreshness } from "@/lib/freshness";
import { useActiveProject } from "@/lib/contexts/project-context";
import { FLAGS } from "@/lib/flags";
import { T } from "@/lib/terminology";
import {
  getMorningReviewSuggestions,
  filterByChips,
  REVIEW_CHIPS,
  type ReviewChip,
} from "@/lib/memory/morning-review";

import type { RoleUiPolicy } from "@/lib/ui/risk-register-role";
import { useRole } from "@/lib/contexts/role-context";

interface Props {
  rolePolicy?: RoleUiPolicy;
  onCreateEvent?: () => void;
  onScrollToEvents?: () => void;
}

export default function SuggestionQueue({ rolePolicy, onCreateEvent, onScrollToEvents }: Props) {
  const {
    pendingSuggestions,
    acceptSuggestion,
    acceptMultipleSuggestions,
    editSuggestionStructured,
    rejectSuggestion,
  } = useMemory();
  const { events } = useEvents();
  const { activeProject } = useActiveProject();
  const { role } = useRole();
  const router = useRouter();

  function handleAcceptAndRoute(id: string) {
    const suggestion = pendingSuggestions.find((s) => s.id === id);
    if (!suggestion) return;

    // 1. Accept (existing logic — merges overrides, updates event)
    acceptSuggestion(id);

    // 2. Build action intent for Decision Outputs page
    const config = SUGGESTION_ACTIONS[suggestion.type];
    const event = events.find(
      (e) => e.id === (suggestion.editorOverrides?.linkedEventId ?? suggestion.eventId),
    );
    const intent: SuggestionActionIntent = {
      prompt: config.buildPrompt(suggestion, event),
      suggestionType: suggestion.type,
      suggestionHeadline: suggestion.editorOverrides?.headline ?? suggestion.headline,
      eventTitle: event?.title,
      actionLabel: config.actionLabel,
    };

    // 3. Store intent + navigate to Decision Outputs
    localStorage.setItem(INTENT_KEY, JSON.stringify(intent));
    router.push("/workspace/export");
  }

  const startsCollapsed = rolePolicy?.morningReview.collapsed ?? false;
  const [reviewMode, setReviewMode] = useState<"morning" | "all">("morning");
  const [collapsed, setCollapsed] = useState(startsCollapsed);
  const [activeChips, setActiveChips] = useState<Set<ReviewChip>>(
    new Set<ReviewChip>(["notice", "drift"]),
  );

  if (!FLAGS.memoryLayer) return null;

  function toggleChip(chip: ReviewChip) {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  }

  const CHIP_LABELS: Record<ReviewChip, string> = {
    notice: "Notice",
    drift: "Drift",
    cost: "Cost",
    schedule: "Schedule",
  };

  // Compute visible suggestions
  const roleVisibleTypes = rolePolicy?.morningReview.visibleTypes;
  const roleFiltered = roleVisibleTypes
    ? pendingSuggestions.filter((s) => roleVisibleTypes.includes(s.type))
    : pendingSuggestions;

  let visibleSuggestions = roleFiltered;
  if (reviewMode === "morning") {
    const filtered = filterByChips(roleFiltered, activeChips);
    visibleSuggestions = getMorningReviewSuggestions(filtered, 5);
  }

  const title = reviewMode === "morning"
    ? (rolePolicy?.morningReview.title ?? T.ACTION_REQUIRED)
    : T.ALL_OPEN;
  const sublabel = rolePolicy?.morningReview.sublabel;

  // Field role: count suggestions missing evidence
  const evidenceMissingCount = role === "field" && reviewMode === "morning"
    ? visibleSuggestions.filter((s) => s.citations.length === 0).length
    : 0;

  return (
    <div className="mb-6">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>

        <Sparkles size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
          {title}
        </span>

        {pendingSuggestions.length > 0 ? (
          <>
            <span className="text-xs font-data text-[var(--color-text-muted)]">
              {visibleSuggestions.length}
              {reviewMode === "morning" && pendingSuggestions.length > visibleSuggestions.length
                ? ` of ${pendingSuggestions.length}`
                : ""}{" "}
              pending
            </span>
            {evidenceMissingCount > 0 && (
              <span className="text-xs text-[var(--color-semantic-yellow)]">
                {evidenceMissingCount} need evidence
              </span>
            )}
          </>
        ) : (
          <span className="flex items-center gap-1 text-sm font-data text-[var(--color-semantic-green)]">
            <CheckCircle size={12} /> All reviewed
          </span>
        )}

        {/* + New Risk button */}
        {onCreateEvent && (
          <button
            onClick={onCreateEvent}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer"
          >
            <Plus size={12} /> New Risk
          </button>
        )}

        {/* Mode toggle */}
        {FLAGS.safeUx && (
          <div className="flex ml-auto rounded-[var(--radius-pill)] border border-[var(--color-border)] overflow-hidden">
            <button
              onClick={() => setReviewMode("morning")}
              className="px-2.5 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor:
                  reviewMode === "morning" ? "var(--color-accent-dim)" : "transparent",
                color:
                  reviewMode === "morning"
                    ? "var(--color-accent)"
                    : "var(--color-text-dim)",
              }}
            >
              {rolePolicy?.morningReview.title ?? T.ACTION_REQUIRED}
            </button>
            <button
              onClick={() => setReviewMode("all")}
              className="px-2.5 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor:
                  reviewMode === "all" ? "var(--color-accent-dim)" : "transparent",
                color:
                  reviewMode === "all"
                    ? "var(--color-accent)"
                    : "var(--color-text-dim)",
              }}
            >
              {T.ALL_OPEN}
            </button>
          </div>
        )}
      </div>

      {/* Sublabel */}
      {sublabel && !collapsed && (
        <p className="text-xs text-[var(--color-text-dim)] mb-3 ml-6">
          {sublabel}
        </p>
      )}

      {/* Collapsed state — show count only */}
      {collapsed && (
        <p className="text-xs text-[var(--color-text-dim)] ml-6 mb-2">
          {visibleSuggestions.length} item{visibleSuggestions.length !== 1 ? "s" : ""} pending review
        </p>
      )}

      {/* Expanded content */}
      {!collapsed && (
        <>
          {/* Filter chips — morning mode only */}
          {FLAGS.safeUx && reviewMode === "morning" && pendingSuggestions.length > 0 && (
            <div className="flex gap-1.5 mb-3">
              {REVIEW_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip)}
                  className="px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-semibold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: activeChips.has(chip)
                      ? "var(--color-accent-dim)"
                      : "var(--color-surface)",
                    color: activeChips.has(chip)
                      ? "var(--color-accent)"
                      : "var(--color-text-dim)",
                    border: `1px solid ${activeChips.has(chip) ? "var(--color-accent)" : "var(--color-border)"}`,
                  }}
                >
                  {CHIP_LABELS[chip]}
                </button>
              ))}
            </div>
          )}

          {/* Source freshness */}
          {FLAGS.freshnessWarnings && (
            <FreshnessBar warnings={resolveFreshness(activeProject.sourceProfile)} />
          )}

          {/* Accept bundle */}
          {FLAGS.safeUx && reviewMode === "morning" && (rolePolicy?.morningReview.allowAccept ?? true) && (
            <AcceptBundleBar
              suggestions={visibleSuggestions}
              onAcceptBundle={acceptMultipleSuggestions}
            />
          )}

          {visibleSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleSuggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  onAccept={handleAcceptAndRoute}
                  onEditStructured={editSuggestionStructured}
                  onReject={rejectSuggestion}
                  events={events}
                  allowAccept={rolePolicy?.morningReview.allowAccept ?? true}
                  allowEdit={rolePolicy?.morningReview.allowEdit ?? true}
                  allowReject={rolePolicy?.morningReview.allowReject ?? true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 text-center">
              {pendingSuggestions.length === 0 ? (
                <>
                  <p className="text-sm text-[var(--color-text-dim)] mb-3">
                    {role === "field"
                      ? "No items need your input right now. Head to the field tab to log observations."
                      : FLAGS.governedRiskSystem
                        ? "No pending items. Add a new risk item or review the risk log."
                        : "No pending items. Add a new risk or review open events."}
                  </p>
                  {role !== "field" && (
                    <div className="flex items-center justify-center gap-3">
                      {onCreateEvent && (
                        <button
                          onClick={onCreateEvent}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] transition-colors cursor-pointer"
                        >
                          <Plus size={12} /> New Risk
                        </button>
                      )}
                      {onScrollToEvents && (
                        <button
                          onClick={onScrollToEvents}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                        >
                          <List size={12} /> {FLAGS.governedRiskSystem ? "View risk log" : "View open events"}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-dim)]">
                  No suggestions match the current filters.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
