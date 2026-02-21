"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import {
  GanttChart,
  ChevronDown,
  ChevronRight,
  Diamond,
  Eye,
  EyeOff,
  Zap,
  Table2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useEvents } from "@/lib/contexts/event-context";
import { FLAGS } from "@/lib/flags";
import { resolveEventImpact } from "@/lib/demo/v5/resolvers";
import { v4ToV5EventId } from "@/lib/demo/v5/resolvers/id-map";
import type { Task, Phase, Milestone, Event } from "@/lib/demo/v5/projects";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;

function toDate(iso: string) {
  return new Date(iso + "T00:00:00");
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonth(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/** Generate an array of Mondays between start and end (inclusive of end week). */
function getWeeks(start: Date, end: Date): Date[] {
  const weeks: Date[] = [];
  // Find first Monday on or before start
  const d = new Date(start);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
  while (d <= end) {
    weeks.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return weeks;
}

/** Get distinct months spanned by the weeks array */
function getMonths(weeks: Date[]): { label: string; startIdx: number; span: number }[] {
  if (weeks.length === 0) return [];
  const months: { label: string; startIdx: number; span: number }[] = [];
  let currentKey = "";
  for (let i = 0; i < weeks.length; i++) {
    const key = `${weeks[i].getFullYear()}-${weeks[i].getMonth()}`;
    if (key !== currentKey) {
      months.push({ label: formatMonth(weeks[i]), startIdx: i, span: 1 });
      currentKey = key;
    } else {
      months[months.length - 1].span++;
    }
  }
  return months;
}

import { SEVERITY_DOT_COLORS as SEVERITY_COLORS } from "@/lib/ui/semantic";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function TimelineContent() {
  const { activeProject } = useActiveProject();
  const { phases, tasks, milestones, events } = activeProject;

  /* --- State --- */
  const [viewMode, setViewMode] = useState<"forecast" | "baseline">("forecast");
  const [showCritical, setShowCritical] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const { activeEvent, events: decisionEvents, selectEvent } = useEvents();
  const [impactMode, setImpactMode] = useState(false);
  const [viewTab, setViewTab] = useState<"gantt" | "plan">("gantt");
  const searchParams = useSearchParams();

  // Deep-link: auto-enable impact mode from URL param
  useEffect(() => {
    if (!FLAGS.timelineDeepLink) return;
    const linkedId = searchParams.get("eventId");
    const modeParam = searchParams.get("mode");
    if (linkedId) {
      const found = decisionEvents.find((e) => e.id === linkedId);
      if (found) {
        selectEvent(found.id);
        setImpactMode(true);
      }
    } else if (modeParam === "impact") {
      setImpactMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Impact mode data
  const impact = useMemo(() => {
    if (!impactMode || !activeEvent) return null;
    const v5Id = v4ToV5EventId(activeEvent.id, activeProject.id) ?? activeEvent.id;
    return resolveEventImpact(activeProject.id, v5Id);
  }, [impactMode, activeEvent, activeProject.id]);

  const toggleCollapse = (phaseId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  /* --- Build event lookup by taskId --- */
  const eventsByTask = useMemo(() => {
    const map: Record<string, Event[]> = {};
    for (const ev of events) {
      for (const tid of ev.taskIds) {
        (map[tid] ??= []).push(ev);
      }
    }
    return map;
  }, [events]);

  /* --- Compute timeline range from data --- */
  const { timelineStart, weeks, months, colWidth, totalWidth } = useMemo(() => {
    let minDate = Infinity;
    let maxDate = -Infinity;

    for (const t of tasks) {
      const starts = [toDate(t.baselineStart), toDate(t.forecastStart)];
      const ends = [toDate(t.baselineFinish), toDate(t.forecastFinish)];
      for (const d of starts) minDate = Math.min(minDate, d.getTime());
      for (const d of ends) maxDate = Math.max(maxDate, d.getTime());
    }
    for (const m of milestones) {
      minDate = Math.min(minDate, toDate(m.dateBaseline).getTime(), toDate(m.dateForecast).getTime());
      maxDate = Math.max(maxDate, toDate(m.dateBaseline).getTime(), toDate(m.dateForecast).getTime());
    }

    // Add 1-week buffer on each side
    const start = new Date(minDate - 7 * DAY_MS);
    const end = new Date(maxDate + 7 * DAY_MS);
    const w = getWeeks(start, end);
    const m2 = getMonths(w);
    const cw = 80; // pixels per week column
    return {
      timelineStart: w[0] ?? start,
      weeks: w,
      months: m2,
      colWidth: cw,
      totalWidth: w.length * cw,
    };
  }, [tasks, milestones]);

  /* --- Position helpers --- */
  function dateToX(iso: string): number {
    const days = daysBetween(timelineStart, toDate(iso));
    return (days / 7) * colWidth;
  }

  function barStyle(start: string, finish: string) {
    const left = dateToX(start);
    const right = dateToX(finish);
    const width = Math.max(right - left, 4);
    return { left, width };
  }

  /* --- Today line --- */
  const todayX = dateToX(new Date().toISOString().slice(0, 10));

  /* --- Sorted phases --- */
  const sortedPhases = useMemo(
    () => [...phases].sort((a, b) => a.order - b.order),
    [phases],
  );

  /* --- Tasks grouped by phase --- */
  const tasksByPhase = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      (map[t.phaseId] ??= []).push(t);
    }
    return map;
  }, [tasks]);

  /* --- Build rows for rendering --- */
  type Row =
    | { type: "phase"; phase: Phase; isCollapsed: boolean }
    | { type: "task"; task: Task }
    | { type: "milestone"; milestone: Milestone };

  const rows = useMemo(() => {
    const result: Row[] = [];
    for (const phase of sortedPhases) {
      const isCollapsed = collapsed.has(phase.id);
      result.push({ type: "phase", phase, isCollapsed });
      if (!isCollapsed) {
        const phaseTasks = tasksByPhase[phase.id] ?? [];
        for (const task of phaseTasks) {
          result.push({ type: "task", task });
        }
      }
    }
    // Milestones as their own section at the bottom
    for (const ms of milestones) {
      result.push({ type: "milestone", milestone: ms });
    }
    return result;
  }, [sortedPhases, tasksByPhase, milestones, collapsed]);

  const ROW_HEIGHT = 36;
  const LABEL_WIDTH = typeof window !== "undefined" && window.innerWidth < 640 ? 140 : 260;

  return (
    <div className="max-w-full mx-auto">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-semantic-purple-dim)",
              color: "var(--color-semantic-purple)",
            }}
          >
            <GanttChart size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Timeline
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {activeProject.name} — {tasks.length} tasks, {milestones.length} milestones
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Baseline / Forecast toggle */}
          <div
            className="flex rounded-[var(--radius-input)] overflow-hidden border"
            style={{ borderColor: "var(--color-border)" }}
          >
            {(["forecast", "baseline"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors"
                style={{
                  backgroundColor:
                    viewMode === mode
                      ? "var(--color-accent-dim)"
                      : "var(--color-surface)",
                  color:
                    viewMode === mode
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Critical path toggle */}
          <button
            onClick={() => setShowCritical((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-input)] border text-xs font-semibold uppercase tracking-wide transition-colors"
            style={{
              borderColor: showCritical
                ? "var(--color-semantic-red)"
                : "var(--color-border)",
              backgroundColor: showCritical
                ? "var(--color-semantic-red-dim)"
                : "var(--color-surface)",
              color: showCritical
                ? "var(--color-semantic-red)"
                : "var(--color-text-muted)",
            }}
          >
            {showCritical ? <Eye size={12} /> : <EyeOff size={12} />}
            Critical Path
          </button>

          {/* Impact Mode toggle */}
          <button
            onClick={() => setImpactMode((p) => !p)}
            disabled={!activeEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-input)] border text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-30"
            style={{
              borderColor: impactMode && activeEvent
                ? "var(--color-accent)"
                : "var(--color-border)",
              backgroundColor: impactMode && activeEvent
                ? "var(--color-accent-dim)"
                : "var(--color-surface)",
              color: impactMode && activeEvent
                ? "var(--color-accent)"
                : "var(--color-text-muted)",
            }}
          >
            <Zap size={12} />
            Impact
          </button>
        </div>
      </div>

      {/* ---- View tabs ---- */}
      <div className="flex items-center gap-1 mb-4">
        {(["gantt", "plan"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setViewTab(tab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-input)] text-xs font-semibold uppercase tracking-wide transition-colors"
            style={{
              backgroundColor: viewTab === tab ? "var(--color-accent-dim)" : "transparent",
              color: viewTab === tab ? "var(--color-accent)" : "var(--color-text-muted)",
            }}
          >
            {tab === "gantt" ? <GanttChart size={12} /> : <Table2 size={12} />}
            {tab}
          </button>
        ))}
        {impactMode && impact && (
          <div className="ml-auto flex items-center gap-3 text-xs font-data">
            <span className="text-[var(--color-accent)]">{impact.directTaskIds.length} direct</span>
            <span className="text-[var(--color-semantic-yellow)]">{impact.downstreamTaskIds.length} downstream</span>
            <span className="text-[var(--color-text-muted)]">${impact.totalCostExposure.toLocaleString()} | {impact.totalScheduleDays}d</span>
          </div>
        )}
      </div>

      {viewTab === "gantt" && (<>
      {/* ---- Legend ---- */}
      <div
        className="flex items-center justify-end gap-5 mb-2 px-2 text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-2 rounded-sm"
            style={{ backgroundColor: "var(--color-semantic-blue)", opacity: 0.6 }}
          />
          Standard Task
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-2 rounded-sm"
            style={{ backgroundColor: "var(--color-semantic-red)", opacity: 0.6 }}
          />
          Critical Path
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-2 rounded-sm"
            style={{ backgroundColor: "var(--color-border)", opacity: 0.4 }}
          />
          {viewMode === "forecast" ? "Baseline" : "Forecast"} (ghost)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--color-semantic-red)" }}
          />
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--color-semantic-yellow)" }}
          />
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--color-semantic-blue)" }}
          />
          Event Markers
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rotate-45"
            style={{ backgroundColor: "var(--color-semantic-blue)" }}
          />
          Milestone
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-0 h-3"
            style={{ borderLeft: "2px dashed var(--color-accent)" }}
          />
          Today
        </span>
      </div>

      {/* ---- Gantt chart ---- */}
      <div
        className="border rounded-[var(--radius-card)] overflow-hidden"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        <div className="overflow-x-auto">
          <div style={{ display: "flex", minWidth: LABEL_WIDTH + totalWidth }}>
            {/* ========= LEFT: Labels ========= */}
            <div
              className="shrink-0 z-10"
              style={{
                width: LABEL_WIDTH,
                backgroundColor: "var(--color-card)",
                borderRight: "1px solid var(--color-border)",
              }}
            >
              {/* Header spacer (month + week rows) */}
              <div
                className="flex items-end px-3 text-xs font-semibold uppercase tracking-[1px]"
                style={{
                  height: 52,
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                Task
              </div>

              {/* Row labels */}
              {rows.map((row) => {
                if (row.type === "phase") {
                  return (
                    <div
                      key={row.phase.id}
                      className="flex items-center gap-1.5 px-3 cursor-pointer select-none font-semibold"
                      style={{
                        height: ROW_HEIGHT,
                        color: "var(--color-text-primary)",
                        backgroundColor: "var(--color-surface)",
                        borderBottom: "1px solid var(--color-border)",
                        fontSize: 12,
                      }}
                      onClick={() => toggleCollapse(row.phase.id)}
                    >
                      {row.isCollapsed ? (
                        <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
                      ) : (
                        <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />
                      )}
                      {row.phase.name}
                    </div>
                  );
                }
                if (row.type === "task") {
                  return (
                    <div
                      key={row.task.id}
                      className="flex items-center gap-2 px-3 pl-7 truncate"
                      style={{
                        height: ROW_HEIGHT,
                        borderBottom: "1px solid var(--color-border)",
                        fontSize: 11,
                        borderLeft: impact?.directTaskIds.includes(row.task.id)
                          ? "3px solid var(--color-accent)"
                          : impact?.downstreamTaskIds.includes(row.task.id)
                          ? "3px solid var(--color-semantic-yellow)"
                          : undefined,
                        backgroundColor: impact?.directTaskIds.includes(row.task.id)
                          ? "rgba(255, 107, 53, 0.05)"
                          : impact?.downstreamTaskIds.includes(row.task.id)
                          ? "rgba(245, 158, 11, 0.03)"
                          : undefined,
                      }}
                    >
                      <span
                        className="font-data shrink-0"
                        style={{
                          fontSize: 10,
                          color: "var(--color-text-dim)",
                          minWidth: 36,
                        }}
                      >
                        {row.task.wbs}
                      </span>
                      <span
                        className="truncate"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {row.task.name}
                      </span>
                    </div>
                  );
                }
                /* milestone */
                return (
                  <div
                    key={row.milestone.id}
                    className="flex items-center gap-2 px-3 truncate"
                    style={{
                      height: ROW_HEIGHT,
                      borderBottom: "1px solid var(--color-border)",
                      fontSize: 11,
                    }}
                  >
                    <Diamond
                      size={10}
                      style={{
                        color:
                          row.milestone.status === "hit"
                            ? "var(--color-semantic-green)"
                            : row.milestone.status === "missed"
                              ? "var(--color-semantic-red)"
                              : row.milestone.status === "at_risk"
                                ? "var(--color-semantic-yellow)"
                                : "var(--color-semantic-blue)",
                        fill:
                          row.milestone.status === "hit"
                            ? "var(--color-semantic-green)"
                            : row.milestone.status === "missed"
                              ? "var(--color-semantic-red)"
                              : row.milestone.status === "at_risk"
                                ? "var(--color-semantic-yellow)"
                                : "var(--color-semantic-blue)",
                      }}
                    />
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {row.milestone.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ========= RIGHT: Timeline area ========= */}
            <div className="relative" style={{ width: totalWidth }}>
              {/* --- Month headers --- */}
              <div
                className="flex"
                style={{
                  height: 24,
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="text-xs font-semibold uppercase tracking-wide flex items-center justify-center"
                    style={{
                      width: m.span * colWidth,
                      color: "var(--color-text-muted)",
                      borderRight: "1px solid var(--color-border)",
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* --- Week headers --- */}
              <div
                className="flex"
                style={{
                  height: 28,
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {weeks.map((w, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-data flex items-center justify-center"
                    style={{
                      width: colWidth,
                      color: "var(--color-text-dim)",
                      borderRight: "1px solid var(--color-border)",
                    }}
                  >
                    {formatDate(w)}
                  </div>
                ))}
              </div>

              {/* --- Grid lines (vertical per week) --- */}
              <div className="absolute inset-0" style={{ top: 52 }}>
                {weeks.map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0"
                    style={{
                      left: i * colWidth,
                      width: 1,
                      backgroundColor: "var(--color-border)",
                      opacity: 0.4,
                    }}
                  />
                ))}
              </div>

              {/* --- Today line --- */}
              {todayX > 0 && todayX < totalWidth && (
                <div
                  className="absolute z-20"
                  style={{
                    left: todayX,
                    top: 0,
                    bottom: 0,
                    width: 0,
                    borderLeft: "2px dashed var(--color-accent)",
                    opacity: 0.7,
                  }}
                >
                  <div
                    className="absolute text-[10px] font-semibold uppercase px-1 rounded"
                    style={{
                      top: 2,
                      left: 4,
                      backgroundColor: "var(--color-accent)",
                      color: "#fff",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Today
                  </div>
                </div>
              )}

              {/* --- Data rows --- */}
              {rows.map((row, rowIdx) => {
                const top = rowIdx * ROW_HEIGHT;

                /* Phase summary bar */
                if (row.type === "phase") {
                  const phaseTasks = tasksByPhase[row.phase.id] ?? [];
                  if (phaseTasks.length === 0) {
                    return (
                      <div
                        key={row.phase.id}
                        className="absolute w-full"
                        style={{
                          top: 52 + top,
                          height: ROW_HEIGHT,
                          backgroundColor: "var(--color-surface)",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      />
                    );
                  }
                  const startKey = viewMode === "forecast" ? "forecastStart" : "baselineStart";
                  const endKey = viewMode === "forecast" ? "forecastFinish" : "baselineFinish";
                  const earliest = phaseTasks.reduce(
                    (min, t) => (t[startKey] < min ? t[startKey] : min),
                    phaseTasks[0][startKey],
                  );
                  const latest = phaseTasks.reduce(
                    (max, t) => (t[endKey] > max ? t[endKey] : max),
                    phaseTasks[0][endKey],
                  );
                  const { left, width } = barStyle(earliest, latest);
                  const avgComplete =
                    phaseTasks.reduce((s, t) => s + t.percentComplete, 0) /
                    phaseTasks.length;

                  return (
                    <div
                      key={row.phase.id}
                      className="absolute w-full"
                      style={{
                        top: 52 + top,
                        height: ROW_HEIGHT,
                        backgroundColor: "var(--color-surface)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {/* Phase bar (thin) */}
                      <div
                        className="absolute rounded-sm"
                        style={{
                          left,
                          top: ROW_HEIGHT / 2 - 3,
                          width,
                          height: 6,
                          backgroundColor: "var(--color-border)",
                        }}
                      >
                        <div
                          className="h-full rounded-sm"
                          style={{
                            width: `${avgComplete}%`,
                            backgroundColor: "var(--color-accent)",
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                  );
                }

                /* Task bar */
                if (row.type === "task") {
                  const task = row.task;
                  const primary = viewMode === "forecast"
                    ? barStyle(task.forecastStart, task.forecastFinish)
                    : barStyle(task.baselineStart, task.baselineFinish);
                  const ghost = viewMode === "forecast"
                    ? barStyle(task.baselineStart, task.baselineFinish)
                    : barStyle(task.forecastStart, task.forecastFinish);

                  const isCritical = task.criticalPath && showCritical;
                  const taskEvents = eventsByTask[task.id] ?? [];
                  const barH = 18;
                  const barTop = (ROW_HEIGHT - barH) / 2;

                  return (
                    <div
                      key={task.id}
                      className="absolute w-full"
                      style={{
                        top: 52 + top,
                        height: ROW_HEIGHT,
                        borderBottom: "1px solid var(--color-border)",
                        borderLeft: impact?.directTaskIds.includes(task.id)
                          ? "3px solid var(--color-accent)"
                          : impact?.downstreamTaskIds.includes(task.id)
                          ? "3px solid var(--color-semantic-yellow)"
                          : undefined,
                        backgroundColor: impact?.directTaskIds.includes(task.id)
                          ? "rgba(255, 107, 53, 0.05)"
                          : impact?.downstreamTaskIds.includes(task.id)
                          ? "rgba(245, 158, 11, 0.03)"
                          : undefined,
                      }}
                    >
                      {/* Ghost bar (other view) */}
                      <div
                        className="absolute rounded-sm"
                        style={{
                          left: ghost.left,
                          top: barTop + 2,
                          width: ghost.width,
                          height: barH - 4,
                          backgroundColor: "var(--color-border)",
                          opacity: 0.25,
                        }}
                      />

                      {/* Primary bar */}
                      <div
                        className="absolute rounded-sm group"
                        style={{
                          left: primary.left,
                          top: barTop,
                          width: primary.width,
                          height: barH,
                          backgroundColor: isCritical
                            ? "var(--color-semantic-red-dim)"
                            : "var(--color-semantic-blue-dim)",
                          border: `1.5px solid ${
                            isCritical
                              ? "var(--color-semantic-red)"
                              : "var(--color-semantic-blue)"
                          }`,
                          overflow: "hidden",
                        }}
                      >
                        {/* Fill by percentComplete */}
                        <div
                          className="h-full"
                          style={{
                            width: `${task.percentComplete}%`,
                            backgroundColor: isCritical
                              ? "var(--color-semantic-red)"
                              : "var(--color-semantic-blue)",
                            opacity: 0.5,
                            transition: "width 0.4s ease",
                          }}
                        />

                        {/* Percent label inside bar */}
                        {primary.width > 40 && (
                          <span
                            className="absolute font-data"
                            style={{
                              right: 4,
                              top: "50%",
                              transform: "translateY(-50%)",
                              fontSize: 9,
                              color: isCritical
                                ? "var(--color-semantic-red)"
                                : "var(--color-semantic-blue)",
                              fontWeight: 700,
                            }}
                          >
                            {task.percentComplete}%
                          </span>
                        )}

                        {/* Tooltip on hover */}
                        <div
                          className="hidden group-hover:block absolute z-30 px-2 py-1.5 rounded-[var(--radius-sm)] text-[10px] whitespace-nowrap pointer-events-none"
                          style={{
                            bottom: "calc(100% + 4px)",
                            left: 0,
                            backgroundColor: "var(--color-tooltip-bg)",
                            border: "1px solid var(--color-tooltip-border)",
                            color: "var(--color-tooltip-text)",
                          }}
                        >
                          <div className="font-semibold">{task.name}</div>
                          <div style={{ color: "var(--color-text-muted)" }}>
                            {viewMode === "forecast"
                              ? `${formatDate(toDate(task.forecastStart))} - ${formatDate(toDate(task.forecastFinish))}`
                              : `${formatDate(toDate(task.baselineStart))} - ${formatDate(toDate(task.baselineFinish))}`}
                            {" | "}
                            {task.percentComplete}% complete
                            {task.criticalPath && " | CP"}
                          </div>
                        </div>
                      </div>

                      {/* Event markers */}
                      {taskEvents.map((ev, ei) => {
                        const evX = primary.left + primary.width + 4 + ei * 12;
                        return (
                          <div
                            key={ev.id}
                            className="absolute rounded-full group/ev"
                            style={{
                              left: evX,
                              top: ROW_HEIGHT / 2 - 4,
                              width: 8,
                              height: 8,
                              backgroundColor: SEVERITY_COLORS[ev.severity] ?? "var(--color-text-dim)",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              className="hidden group-hover/ev:block absolute z-30 px-2 py-1 rounded-[var(--radius-sm)] text-[10px] whitespace-nowrap pointer-events-none"
                              style={{
                                bottom: "calc(100% + 6px)",
                                left: -4,
                                backgroundColor: "var(--color-tooltip-bg)",
                                border: "1px solid var(--color-tooltip-border)",
                                color: "var(--color-tooltip-text)",
                              }}
                            >
                              <span
                                className="font-semibold capitalize"
                                style={{ color: SEVERITY_COLORS[ev.severity] }}
                              >
                                {ev.severity}
                              </span>
                              {" "}
                              {ev.title}
                              {ev.scheduleImpact.days > 0 && (
                                <span style={{ color: "var(--color-text-muted)" }}>
                                  {" "}(+{ev.scheduleImpact.days}d)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                /* Milestone diamond */
                if (row.type === "milestone") {
                  const ms = row.milestone;
                  const dateStr = viewMode === "forecast" ? ms.dateForecast : ms.dateBaseline;
                  const ghostDateStr = viewMode === "forecast" ? ms.dateBaseline : ms.dateForecast;
                  const x = dateToX(dateStr);
                  const ghostX = dateToX(ghostDateStr);
                  const msColor =
                    ms.status === "hit"
                      ? "var(--color-semantic-green)"
                      : ms.status === "missed"
                        ? "var(--color-semantic-red)"
                        : ms.status === "at_risk"
                          ? "var(--color-semantic-yellow)"
                          : "var(--color-semantic-blue)";

                  return (
                    <div
                      key={ms.id}
                      className="absolute w-full"
                      style={{
                        top: 52 + top,
                        height: ROW_HEIGHT,
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {/* Ghost diamond */}
                      {Math.abs(ghostX - x) > 2 && (
                        <div
                          className="absolute"
                          style={{
                            left: ghostX - 5,
                            top: ROW_HEIGHT / 2 - 5,
                            width: 10,
                            height: 10,
                            transform: "rotate(45deg)",
                            border: "1.5px solid var(--color-border)",
                            opacity: 0.35,
                          }}
                        />
                      )}

                      {/* Primary diamond */}
                      <div
                        className="absolute group/ms"
                        style={{
                          left: x - 6,
                          top: ROW_HEIGHT / 2 - 6,
                          width: 12,
                          height: 12,
                          transform: "rotate(45deg)",
                          backgroundColor: msColor,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          className="hidden group-hover/ms:block absolute z-30 px-2 py-1 rounded-[var(--radius-sm)] text-[10px] whitespace-nowrap pointer-events-none"
                          style={{
                            bottom: "calc(100% + 8px)",
                            left: -4,
                            transform: "rotate(-45deg)",
                            backgroundColor: "var(--color-tooltip-bg)",
                            border: "1px solid var(--color-tooltip-border)",
                            color: "var(--color-tooltip-text)",
                          }}
                        >
                          <div className="font-semibold">{ms.name}</div>
                          <div style={{ color: "var(--color-text-muted)" }}>
                            {formatDate(toDate(dateStr))}
                            {" | "}
                            <span className="capitalize">{ms.status.replace("_", " ")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Slippage connector line */}
                      {Math.abs(ghostX - x) > 2 && (
                        <div
                          className="absolute"
                          style={{
                            left: Math.min(ghostX, x),
                            top: ROW_HEIGHT / 2,
                            width: Math.abs(x - ghostX),
                            height: 0,
                            borderTop: "1px dashed var(--color-text-dim)",
                            opacity: 0.5,
                          }}
                        />
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      </>)}

      {viewTab === "plan" && (
        <div className="border rounded-[var(--radius-card)] overflow-hidden" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-[1px]" style={{ color: "var(--color-text-muted)" }}>WBS</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-[1px]" style={{ color: "var(--color-text-muted)" }}>Task</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-[1px]" style={{ color: "var(--color-text-muted)" }}>Phase</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-[1px] font-data" style={{ color: "var(--color-text-muted)" }}>Baseline</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-[1px] font-data" style={{ color: "var(--color-text-muted)" }}>Forecast</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-[1px] font-data" style={{ color: "var(--color-text-muted)" }}>Var</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-[1px] font-data" style={{ color: "var(--color-text-muted)" }}>%</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-[1px]" style={{ color: "var(--color-text-muted)" }}>CP</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-[1px]" style={{ color: "var(--color-text-muted)" }}>Events</th>
                </tr>
              </thead>
              <tbody>
                {sortedPhases.map((phase) => {
                  const phaseTasks = tasksByPhase[phase.id] ?? [];
                  return [
                    <tr key={phase.id} style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
                      <td colSpan={9} className="px-3 py-2 font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                        {phase.name}
                      </td>
                    </tr>,
                    ...phaseTasks.map((task) => {
                      const variance = daysBetween(toDate(task.baselineFinish), toDate(task.forecastFinish));
                      const taskEvts = eventsByTask[task.id] ?? [];
                      const isDirect = impact?.directTaskIds.includes(task.id);
                      const isDownstream = impact?.downstreamTaskIds.includes(task.id);
                      const isComplete = task.percentComplete === 100;
                      const isAtRisk = variance > 0 && task.criticalPath;

                      return (
                        <tr
                          key={task.id}
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                            borderLeft: isDirect
                              ? "3px solid var(--color-accent)"
                              : isDownstream
                              ? "3px solid var(--color-semantic-yellow)"
                              : undefined,
                            backgroundColor: isDirect
                              ? "rgba(255, 107, 53, 0.05)"
                              : isDownstream
                              ? "rgba(245, 158, 11, 0.03)"
                              : isComplete
                              ? "rgba(34, 197, 94, 0.03)"
                              : isAtRisk
                              ? "rgba(239, 68, 68, 0.03)"
                              : undefined,
                          }}
                        >
                          <td className="px-3 py-1.5 font-data" style={{ color: "var(--color-text-dim)" }}>{task.wbs}</td>
                          <td className="px-3 py-1.5" style={{ color: "var(--color-text-secondary)" }}>{task.name}</td>
                          <td className="px-3 py-1.5" style={{ color: "var(--color-text-dim)", fontSize: 10 }}>{phase.name}</td>
                          <td className="px-3 py-1.5 font-data" style={{ color: "var(--color-text-muted)" }}>
                            {formatDate(toDate(task.baselineStart))} — {formatDate(toDate(task.baselineFinish))}
                          </td>
                          <td className="px-3 py-1.5 font-data" style={{ color: "var(--color-text-primary)" }}>
                            {formatDate(toDate(task.forecastStart))} — {formatDate(toDate(task.forecastFinish))}
                          </td>
                          <td className="px-3 py-1.5 font-data text-right" style={{ color: variance > 0 ? "var(--color-semantic-red)" : variance < 0 ? "var(--color-semantic-green)" : "var(--color-text-dim)" }}>
                            {variance > 0 ? `+${variance}d` : variance < 0 ? `${variance}d` : "0d"}
                          </td>
                          <td className="px-3 py-1.5 font-data text-right" style={{ color: isComplete ? "var(--color-semantic-green)" : "var(--color-text-muted)" }}>
                            {task.percentComplete}%
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {task.criticalPath && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "var(--color-semantic-red-dim)", color: "var(--color-semantic-red)" }}>CP</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            {taskEvts.map((ev) => (
                              <span key={ev.id} className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: SEVERITY_COLORS[ev.severity] ?? "var(--color-text-dim)" }} title={ev.title} />
                            ))}
                          </td>
                        </tr>
                      );
                    }),
                  ];
                })}
                {/* Milestones section */}
                <tr style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
                  <td colSpan={9} className="px-3 py-2 font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                    Milestones
                  </td>
                </tr>
                {milestones.map((ms) => {
                  const slip = daysBetween(toDate(ms.dateBaseline), toDate(ms.dateForecast));
                  return (
                    <tr key={ms.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td className="px-3 py-1.5 font-data" style={{ color: "var(--color-text-dim)" }}>MS</td>
                      <td className="px-3 py-1.5 font-semibold" style={{ color: "var(--color-text-secondary)" }}>{ms.name}</td>
                      <td className="px-3 py-1.5" style={{ color: "var(--color-text-dim)", fontSize: 10 }}>—</td>
                      <td className="px-3 py-1.5 font-data" style={{ color: "var(--color-text-muted)" }}>{formatDate(toDate(ms.dateBaseline))}</td>
                      <td className="px-3 py-1.5 font-data" style={{ color: "var(--color-text-primary)" }}>{formatDate(toDate(ms.dateForecast))}</td>
                      <td className="px-3 py-1.5 font-data text-right" style={{ color: slip > 0 ? "var(--color-semantic-red)" : "var(--color-semantic-green)" }}>
                        {slip > 0 ? `+${slip}d` : "0d"}
                      </td>
                      <td className="px-3 py-1.5 font-data text-right" style={{ color: "var(--color-text-dim)" }}>—</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize" style={{
                          backgroundColor: ms.status === "at_risk" ? "var(--color-semantic-yellow-dim)" : ms.status === "hit" ? "var(--color-semantic-green-dim)" : ms.status === "missed" ? "var(--color-semantic-red-dim)" : "var(--color-semantic-blue-dim)",
                          color: ms.status === "at_risk" ? "var(--color-semantic-yellow)" : ms.status === "hit" ? "var(--color-semantic-green)" : ms.status === "missed" ? "var(--color-semantic-red)" : "var(--color-semantic-blue)",
                        }}>{ms.status.replace("_", " ")}</span>
                      </td>
                      <td className="px-3 py-1.5"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense>
      <TimelineContent />
    </Suspense>
  );
}
