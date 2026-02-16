"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Plus,
  Search,
  Filter,
  Clock,
  ChevronDown,
  ChevronRight,
  Download,
  FileWarning,
  ArrowDown,
} from "lucide-react";
import { useEvents } from "@/lib/contexts/event-context";
import { createDecisionEvent, type DecisionEvent } from "@/lib/models/decision-event";
import { useActiveProject } from "@/lib/contexts/project-context";
import { STATUS_COLORS } from "@/lib/ui/semantic";
import { getSeverityBorderClass } from "@/lib/ui/severity-border";
import ProjectHealthSummary from "@/components/workspace/ProjectHealthSummary";
import IntelligenceFeed from "@/components/workspace/IntelligenceFeed";
import SuggestionQueue from "@/components/workspace/SuggestionQueue";
import NoticeClocksStrip from "@/components/workspace/NoticeClocksStrip";
import TopRisksSummary from "@/components/workspace/TopRisksSummary";
import EventDrawer from "@/components/workspace/EventDrawer";
import NoticeClockBadge from "@/components/shared/NoticeClockBadge";
import CreateEventModal from "@/components/events/CreateEventModal";
import StartHereBanner from "@/components/workspace/StartHereBanner";
import EvidenceInbox from "@/components/workspace/EvidenceInbox";
import RiskLogTable from "@/components/workspace/RiskLogTable";
import CalibrationSummary from "@/components/workspace/CalibrationSummary";
import { FLAGS } from "@/lib/flags";
import { T } from "@/lib/terminology";
import DrilldownBar from "@/components/risk-register/DrilldownBar";
import {
  type DrillDown,
  type SortKey,
  applyDrillDown,
  applySortKey,
  resolveNoticeClocks,
} from "@/lib/ui/risk-register-helpers";
import { useRole } from "@/lib/contexts/role-context";
import {
  getRoleUiPolicy,
  shouldClearDrillDown,
  drillDownUnavailableMessage,
} from "@/lib/ui/risk-register-role";
import { getRoleDefaults } from "@/lib/ui/role-defaults";
import { useExportContext } from "@/lib/contexts/export-context";
import { useMemory } from "@/lib/contexts/memory-context";
import { generateAutoLinkedEvidence } from "@/lib/evidence/auto-link";

export default function AlignmentRegisterPage() {
  const router = useRouter();
  const { events, selectEvent, setActiveTab, createEvent } = useEvents();
  const { activeProject } = useActiveProject();
  const { role } = useRole();
  const policy = useMemo(() => getRoleUiPolicy(role), [role]);
  const roleDefaults = useMemo(() => getRoleDefaults(role), [role]);
  const { setScope, setLastAction } = useExportContext();
  const { addEvidence } = useMemory();
  const eventListRef = useRef<HTMLDivElement>(null);
  const eventSearchRef = useRef<HTMLInputElement>(null);
  const [selectedEventForDrawer, setSelectedEventForDrawer] = useState<DecisionEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasUserCustomized, setHasUserCustomized] = useState(false);

  // Governed risk system: two-tab layout (defer localStorage read to avoid hydration mismatch)
  const [controlTab, setControlTab] = useState<"review" | "risk-log">("review");
  useEffect(() => {
    const saved = localStorage.getItem("icelerate-control-tab") as "review" | "risk-log" | null;
    if (saved && saved !== controlTab) setControlTab(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const switchControlTab = useCallback((tab: "review" | "risk-log") => {
    setControlTab(tab);
    localStorage.setItem("icelerate-control-tab", tab);
  }, []);

  // Intent-based redirect from /projects CTA routing
  useEffect(() => {
    const target = localStorage.getItem("icelerate-workspace-target");
    if (target) {
      localStorage.removeItem("icelerate-workspace-target");
      if (target === "export") {
        router.push("/workspace/export");
      } else if (target === "event") {
        const eventId = localStorage.getItem("icelerate-top-event");
        localStorage.removeItem("icelerate-top-event");
        if (eventId) {
          router.push(`/workspace/events/${eventId}`);
        }
      }
    }
  }, [router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [showResolved, setShowResolved] = useState(false);
  const [drillDown, setDrillDown] = useState<DrillDown>(null);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [drillDownBanner, setDrillDownBanner] = useState<string | null>(null);

  // Apply role defaults + clear incompatible drill-downs on role change
  useEffect(() => {
    if (drillDown && shouldClearDrillDown(drillDown, policy)) {
      setDrillDownBanner(drillDownUnavailableMessage(drillDown));
      setDrillDown(null);
      setTimeout(() => setDrillDownBanner(null), 4000);
    }
    if (!hasUserCustomized) {
      setSortKey(roleDefaults.defaultListSort);
      setDrillDown(roleDefaults.defaultDriverMode);
      setFilterStatus("all");
      setFilterSeverity("all");
      setSearchQuery("");
    }
    setHasUserCustomized(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Notice clocks (deterministic)
  const noticeClocks = useMemo(() => resolveNoticeClocks(events), [events]);

  const filtered = useMemo(() => {
    const base = events
      .filter((e) => filterStatus === "all" || e.status === filterStatus)
      .filter((e) => filterSeverity === "all" || e.severity === filterSeverity)
      .filter(
        (e) =>
          !searchQuery.trim() ||
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.location ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    return applySortKey(applyDrillDown(base, drillDown), sortKey);
  }, [events, filterStatus, filterSeverity, searchQuery, drillDown, sortKey]);

  const openFiltered = useMemo(() => filtered.filter((e) => e.status !== "resolved"), [filtered]);
  const resolvedFiltered = useMemo(() => filtered.filter((e) => e.status === "resolved"), [filtered]);

  const handleEventClick = (event: DecisionEvent) => {
    setSelectedEventForDrawer(event);
  };

  const handleDrawerOpenEvent = useCallback((eventId: string) => {
    selectEvent(eventId);
    setSelectedEventForDrawer(null);
    router.push(`/workspace/events/${eventId}`);
  }, [selectEvent, router]);

  const handleDrawerDraftUpdate = useCallback((eventId: string) => {
    selectEvent(eventId);
    setActiveTab(FLAGS.eventFlowSimplification ? "stakeholder-update" : "communication");
    setSelectedEventForDrawer(null);
    router.push(`/workspace/events/${eventId}`);
  }, [selectEvent, setActiveTab, router]);

  const handleCreateEvent = useCallback(() => {
    if (FLAGS.eventFlowSimplification || FLAGS.governedRiskSystem) {
      setShowCreateModal(true);
      return;
    }
    const event = createDecisionEvent({
      title: (policy.primaryCta === "new_field_record" ? "Field Record \u2014 " : "New Risk Item \u2014 ") + new Date().toLocaleTimeString(),
      trigger: policy.primaryCta === "new_field_record" ? "Field observation" : "Manual entry",
      station: "capture",
      severity: "medium",
      description: "",
      location: activeProject.name,
    });
    createEvent(event);
    router.push(`/workspace/events/${event.id}`);
  }, [policy.primaryCta, activeProject.name, createEvent, router]);

  const handleModalCreated = useCallback((event: ReturnType<typeof createDecisionEvent>) => {
    createEvent(event);
    if (FLAGS.autoEvidenceLink) {
      const syntheticItems = generateAutoLinkedEvidence(event, activeProject.id);
      for (const item of syntheticItems) {
        addEvidence(item);
      }
    }
    setShowCreateModal(false);
    router.push(`/workspace/events/${event.id}`);
  }, [createEvent, router, activeProject.id, addEvidence]);

  const scrollToEvents = useCallback(() => {
    eventListRef.current?.scrollIntoView({ behavior: "smooth" });
    // Focus search input after scroll for keyboard accessibility
    setTimeout(() => eventSearchRef.current?.focus(), 400);
  }, []);

  const handleDrill = useCallback((dd: DrillDown) => {
    setDrillDown(dd);
    setHasUserCustomized(true);
    // Auto-switch to Risk Log tab so filtered items are visible
    if (dd !== null && FLAGS.governedRiskSystem) switchControlTab("risk-log");
    if (dd === "cost") {
      setScope("cost");
      setLastAction("viewed_cost_drivers");
    } else if (dd === "schedule") {
      setScope("schedule");
      setLastAction("viewed_schedule_drivers");
    } else if (dd === "notice") {
      setScope("notice");
      setLastAction("reviewed_notice_clocks");
    } else {
      setScope("all");
    }
  }, [setScope, setLastAction, switchControlTab]);

  const handleScheduleCta = useCallback(() => {
    if (FLAGS.governedRiskSystem) {
      handleDrill("schedule");
    } else {
      router.push("/workspace/timeline?mode=impact");
    }
  }, [router, handleDrill]);

  const handleNoticeCta = useCallback(() => {
    if (FLAGS.governedRiskSystem) {
      handleDrill("notice");
    } else {
      setDrillDown("notice");
      setScope("notice");
      setLastAction("reviewed_notice_clocks");
      scrollToEvents();
    }
  }, [scrollToEvents, setScope, setLastAction, handleDrill]);

  const isReadonly = policy.eventListMode === "readonly";

  const renderEventRow = (event: DecisionEvent, isResolved = false) => {
    const status = STATUS_COLORS[event.status] ?? STATUS_COLORS.open;
    const borderClass = getSeverityBorderClass(event.severity, event.status);
    const date = new Date(event.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <button
        key={event.id}
        onClick={() => handleEventClick(event)}
        className={`w-full bg-[var(--color-card)] border border-[var(--color-border)] border-l-4 ${borderClass} rounded-[var(--radius-card)] px-5 py-4 text-left hover:border-[var(--color-accent)]/30 transition-all group ${isResolved ? "opacity-60" : ""}`}
      >
        {/* Primary line: title + chips */}
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex-1 min-w-0">
            <span className="text-base font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1" title={event.title}>
              {event.title}
            </span>
          </div>

          {/* Field badge — "Needs Field Record" */}
          {policy.showFieldBadges && !event.fieldRecord && !isResolved && (
            <span className="shrink-0 flex items-center gap-1 border border-[var(--color-semantic-yellow)] text-[var(--color-semantic-yellow)] bg-[var(--color-semantic-yellow-dim)] text-[10px] px-2 py-0.5 rounded-full font-semibold">
              <FileWarning size={10} /> Needs Field Record
            </span>
          )}

          {/* Neutral outlined severity chip */}
          <span className="shrink-0 border border-[var(--color-border)] text-[var(--color-text-muted)] bg-transparent text-xs px-2 py-0.5 rounded-full capitalize">
            {event.severity}
          </span>

          {/* Neutral outlined status chip */}
          <span className="shrink-0 border border-[var(--color-border)] text-[var(--color-text-muted)] bg-transparent text-xs px-2 py-0.5 rounded-full">
            {status.label}
          </span>
        </div>

        {/* Secondary meta line */}
        <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
          {policy.list.showCostMeta && event.costImpact && event.costImpact.estimated > 0 && (
            <span className="font-data">${event.costImpact.estimated.toLocaleString()}</span>
          )}

          {policy.list.showScheduleMeta && event.scheduleImpact && (
            <span className="flex items-center gap-1 font-data">
              <Clock size={12} />
              {event.scheduleImpact.daysAffected}d
            </span>
          )}

          {event.location && (
            <span className="font-data max-w-[160px] truncate" title={event.location ?? ""}>
              {event.stationNumber ? `@ ${event.stationNumber}` : event.location}
            </span>
          )}

          {/* Notice Clock */}
          {policy.list.showNoticeMeta && <NoticeClockBadge event={event} compact />}

          <span className="font-data ml-auto shrink-0">
            {date}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {T.REGISTER}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {policy.helperSubtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={FLAGS.governedRiskSystem ? () => switchControlTab("risk-log") : scrollToEvents}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-[var(--radius-input)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/30 transition-all cursor-pointer"
          >
            <ArrowDown size={14} />
            {FLAGS.governedRiskSystem ? "View Risk Log" : "View Risk Items"}
          </button>
          {policy.primaryCta === "export_board_ready" ? (
            <button
              className="btn-primary flex items-center gap-2 text-sm"
              onClick={() => { setLastAction("export_board_ready"); router.push("/workspace/export"); }}
            >
              <Download size={16} />
              {policy.ctaLabel}
            </button>
          ) : (
            <button
              className="btn-primary flex items-center gap-2 text-sm"
              onClick={handleCreateEvent}
            >
              <Plus size={16} />
              {policy.ctaLabel}
            </button>
          )}
        </div>
      </div>

      {/* Tab switcher (governed risk system) */}
      {FLAGS.governedRiskSystem && (
        <div className="flex items-center gap-1 mb-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-1 w-fit">
          <button
            onClick={() => switchControlTab("review")}
            className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-all ${
              controlTab === "review"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {T.REVIEW}
          </button>
          <button
            onClick={() => switchControlTab("risk-log")}
            className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-all ${
              controlTab === "risk-log"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {T.RISK_LOG}
          </button>
        </div>
      )}

      {/* Drill-down indicator (outside tab conditional so it's visible on both tabs) */}
      <DrilldownBar
        drill={drillDown}
        matchCount={filtered.filter((e) => e.status !== "resolved").length}
        onClear={() => {
          setDrillDown(null);
          setHasUserCustomized(true);
          if (FLAGS.governedRiskSystem) switchControlTab("review");
        }}
      />

      {/* Drill-down cleared banner (role switch) */}
      {drillDownBanner && (
        <div className="mb-3 px-3 py-2 text-xs text-[var(--color-text-dim)] bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          {drillDownBanner}
        </div>
      )}

      {/* ─── Review tab (governed) OR legacy full layout ─── */}
      {(!FLAGS.governedRiskSystem || controlTab === "review") && (
        <>
          {/* Project Health Summary */}
          <ProjectHealthSummary
            activeDrill={drillDown}
            onDrill={handleDrill}
            showKpis={policy.showKpis}
            onScheduleCta={handleScheduleCta}
            onNoticeCta={handleNoticeCta}
          />

          {/* Notice Clock Strip — suppressed when safeUx merges content into StartHereBanner */}
          {!FLAGS.safeUx && policy.showKpis.notice && noticeClocks.length > 0 && (
            <NoticeClocksStrip
              items={noticeClocks}
              onItemClick={(id) => {
                const event = events.find((e) => e.id === id);
                if (event) setSelectedEventForDrawer(event);
              }}
              onViewAll={() => { handleDrill("notice"); scrollToEvents(); }}
            />
          )}

          {/* Start Here — deterministic directional banner */}
          {FLAGS.safeUx && (
            <StartHereBanner
              noticeClocks={noticeClocks}
              events={events}
              showNoticeClocks={policy.showKpis.notice}
              onDrillNotice={() => { handleDrill("notice"); scrollToEvents(); }}
              onScrollToEvents={FLAGS.governedRiskSystem ? () => switchControlTab("risk-log") : scrollToEvents}
              onNoticeItemClick={(id) => {
                const event = events.find((e) => e.id === id);
                if (event) setSelectedEventForDrawer(event);
              }}
            />
          )}

          {/* Evidence Inbox (governed only, between StartHere and Suggestions) */}
          {FLAGS.governedRiskSystem && <EvidenceInbox />}

          {/* Top Risks Summary (exec role only) */}
          {policy.showTopRisksSummary && (
            <TopRisksSummary
              events={events}
              onViewAll={scrollToEvents}
              onOpenEvent={(id) => {
                const event = events.find((e) => e.id === id);
                if (event) setSelectedEventForDrawer(event);
              }}
            />
          )}

          {/* Intelligence Feed / Suggestion Queue */}
          {FLAGS.memoryLayer ? (
            <SuggestionQueue
              rolePolicy={policy}
              onCreateEvent={policy.primaryCta !== "export_board_ready" ? handleCreateEvent : undefined}
              onScrollToEvents={FLAGS.governedRiskSystem ? () => switchControlTab("risk-log") : scrollToEvents}
            />
          ) : (
            <IntelligenceFeed />
          )}

          {/* Calibration Summary (governed + PM only) */}
          {FLAGS.governedRiskSystem && FLAGS.calibrationEngine && <CalibrationSummary />}

          {/* "Go to Risk Log" CTA (governed only) */}
          {FLAGS.governedRiskSystem && (
            <div className="mt-6 text-center">
              <button
                onClick={() => switchControlTab("risk-log")}
                className="btn-primary inline-flex items-center gap-2 text-sm px-6"
              >
                <ArrowDown size={14} />
                Go to {T.RISK_LOG}
              </button>
            </div>
          )}
        </>
      )}

      {/* ─── Risk Log tab (governed) ─── */}
      {FLAGS.governedRiskSystem && controlTab === "risk-log" && (
        <RiskLogTable drillDown={drillDown} />
      )}

      {/* ─── Legacy event list (non-governed only) ─── */}
      {!FLAGS.governedRiskSystem && (
        <>
          {/* Event List Section */}
          <div ref={eventListRef}>
          <div className="pt-2 border-t border-[var(--color-border)] mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                All Risk Items
              </span>
              <span className="text-xs font-data text-[var(--color-text-dim)]">
                {openFiltered.length + resolvedFiltered.length < events.length
                  ? `(${openFiltered.length + resolvedFiltered.length} of ${events.length})`
                  : `(${events.length})`}
              </span>
              <span className="text-xs text-[var(--color-text-dim)] ml-auto">
                sorted by {sortKey}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-dim)] mt-1">
              All logged issues, risks, and notices for this project.
            </p>
          </div>

          {/* Search + Filters (hidden for exec role) */}
          {policy.showOperationalFilters && (
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] opacity-50" />
                <input
                  ref={eventSearchRef}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setHasUserCustomized(true); }}
                  placeholder="Search risk items..."
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] py-2 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <Filter size={14} className="text-[var(--color-text-dim)] opacity-50" />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setHasUserCustomized(true); }}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--color-text-secondary)] focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => { setFilterSeverity(e.target.value); setHasUserCustomized(true); }}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--color-text-secondary)] focus:outline-none"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={sortKey}
                onChange={(e) => { setSortKey(e.target.value as SortKey); setHasUserCustomized(true); }}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--color-text-secondary)] focus:outline-none"
              >
                <option value="newest">Newest</option>
                <option value="severity">Severity</option>
                <option value="cost">Cost</option>
                <option value="schedule">Schedule</option>
              </select>
              <span className="text-xs text-[var(--color-text-dim)] font-data ml-auto">
                {openFiltered.length} open · {resolvedFiltered.length} resolved
              </span>
            </div>
          )}
          </div>

          {/* Event List */}
          <div className="space-y-3">
            {openFiltered.length === 0 && resolvedFiltered.length === 0 && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-10 text-center">
                <Shield size={32} className="mx-auto mb-3 text-[var(--color-text-dim)] opacity-40" />
                <p className="text-base text-[var(--color-text-secondary)] mb-1">
                  {events.length === 0 ? "No risk items yet" : "No risk items match your filters"}
                </p>
                <p className="text-sm text-[var(--color-text-dim)] mb-4">
                  {events.length === 0
                    ? "Create a new risk item to get started."
                    : `${events.length} item${events.length !== 1 ? "s" : ""} hidden by current filters.`}
                </p>
                {events.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("all");
                      setFilterSeverity("all");
                      setDrillDown(null);
                    }}
                    className="text-sm font-medium text-[var(--color-accent)] hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {openFiltered.map((event) => renderEventRow(event))}

            {/* Resolved toggle */}
            {resolvedFiltered.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowResolved(!showResolved)}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  {showResolved ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  {showResolved ? "Hide" : "Show"} resolved ({resolvedFiltered.length})
                </button>

                {showResolved && (
                  <div className="space-y-3 mt-3">
                    {resolvedFiltered.map((event) => renderEventRow(event, true))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Read-only indicator for exec role */}
          {isReadonly && (
            <div className="mt-4 text-center text-xs text-[var(--color-text-dim)]">
              Executive view — events are read-only. Switch to PM role for full editing.
            </div>
          )}
        </>
      )}

      {/* Event preview drawer */}
      <EventDrawer
        open={!!selectedEventForDrawer}
        event={selectedEventForDrawer}
        onClose={() => setSelectedEventForDrawer(null)}
        onOpenEvent={handleDrawerOpenEvent}
        onDraftUpdate={handleDrawerDraftUpdate}
      />

      {/* Guided event creation modal (flag-gated) */}
      {(FLAGS.eventFlowSimplification || FLAGS.governedRiskSystem) && (
        <CreateEventModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleModalCreated}
        />
      )}
    </div>
  );
}
