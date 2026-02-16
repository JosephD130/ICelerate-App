"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { useEvents } from "@/lib/contexts/event-context";
import { useMemory } from "@/lib/contexts/memory-context";
import { useRole } from "@/lib/contexts/role-context";
import { getRoleUiPolicy } from "@/lib/ui/risk-register-role";
import { generateFriendlyLabel } from "@/lib/models/event-labels";
import NoticeClockBadge from "@/components/shared/NoticeClockBadge";
import EventDrawer from "@/components/workspace/EventDrawer";
import type { DecisionEvent } from "@/lib/models/decision-event";
import { T } from "@/lib/terminology";
import { FLAGS } from "@/lib/flags";
import { applyDrillDown, type DrillDown } from "@/lib/ui/risk-register-helpers";

type SortCol = "id" | "title" | "status" | "cost" | "schedule" | "notice" | "evidence" | "stage";
type SortDir = "asc" | "desc";

const STAGE_LABEL: Record<string, string> = {
  "field-record": "Field Record",
  "spec-check": "Spec Check",
  "position": "Position",
  "issue-notice": "Issue Notice",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
  escalated: "Escalated",
};

interface Props {
  drillDown?: DrillDown;
}

export default function RiskLogTable({ drillDown = null }: Props) {
  const router = useRouter();
  const { events, selectEvent, setActiveTab } = useEvents();
  const { pendingEvidence, evidence } = useMemory();
  const { role } = useRole();
  const policy = useMemo(() => getRoleUiPolicy(role), [role]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortCol, setSortCol] = useState<SortCol>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [drawerEvent, setDrawerEvent] = useState<DecisionEvent | null>(null);

  const filtered = useMemo(() => {
    return applyDrillDown(events, drillDown)
      .filter((e) => filterStatus === "all" || e.status === filterStatus)
      .filter(
        (e) =>
          !searchQuery.trim() ||
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.friendlyLabel ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [events, drillDown, filterStatus, searchQuery]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "id":
          cmp = (a.friendlyLabel ?? a.id).localeCompare(b.friendlyLabel ?? b.id);
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "cost":
          cmp = (a.costImpact?.estimated ?? 0) - (b.costImpact?.estimated ?? 0);
          break;
        case "schedule":
          cmp = (a.scheduleImpact?.daysAffected ?? 0) - (b.scheduleImpact?.daysAffected ?? 0);
          break;
        case "evidence":
          cmp = (a.evidenceIds?.length ?? 0) - (b.evidenceIds?.length ?? 0);
          break;
        case "stage":
          cmp = (a.lifecycleStage ?? "").localeCompare(b.lifecycleStage ?? "");
          break;
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const toggleSort = useCallback((col: SortCol) => {
    setSortCol((prev) => {
      if (prev === col) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return col;
      }
      setSortDir("desc");
      return col;
    });
  }, []);

  const handleOpenEvent = useCallback((eventId: string) => {
    selectEvent(eventId);
    setDrawerEvent(null);
    router.push(`/workspace/events/${eventId}`);
  }, [selectEvent, router]);

  const handleDraftUpdate = useCallback((eventId: string) => {
    selectEvent(eventId);
    setActiveTab(FLAGS.governedRiskSystem ? "stakeholder-update" : "capture");
    setDrawerEvent(null);
    router.push(`/workspace/events/${eventId}`);
  }, [selectEvent, setActiveTab, router]);

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return null;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const canCreateRiskItem = pendingEvidence.length === 0 || events.some((e) => e.evidenceIds.length > 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] opacity-50" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search risk items..."
            className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] py-2 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <Filter size={14} className="text-[var(--color-text-dim)] opacity-50" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--color-text-secondary)] focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <span className="text-xs font-data text-[var(--color-text-dim)] ml-auto">
          {sorted.length} {sorted.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {([
                ["id", "ID"],
                ["title", "Title"],
                ["status", "Status"],
                ["cost", "Cost"],
                ["schedule", "Schedule"],
                ["notice", "Notice"],
                ["evidence", "Evidence"],
                ["stage", "Stage"],
              ] as [SortCol, string][]).map(([col, label]) => (
                <th
                  key={col}
                  onClick={() => col !== "notice" && toggleSort(col)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)] ${col !== "notice" ? "cursor-pointer hover:text-[var(--color-text-secondary)]" : ""} transition-colors`}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-[var(--color-text-dim)]">
                  No risk items match your filters
                </td>
              </tr>
            ) : (
              sorted.map((event) => (
                <tr
                  key={event.id}
                  onClick={() => setDrawerEvent(event)}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-data text-xs text-[var(--color-accent)]">
                    {event.friendlyLabel ?? generateFriendlyLabel(event.id)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-primary)] font-medium max-w-[240px] truncate">
                    {event.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)]">
                      {STATUS_LABEL[event.status] ?? event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-data text-xs text-[var(--color-text-secondary)]">
                    {event.costImpact ? `$${event.costImpact.estimated.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-data text-xs text-[var(--color-text-secondary)]">
                    {event.scheduleImpact ? `${event.scheduleImpact.daysAffected}d` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <NoticeClockBadge event={event} compact />
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const total = event.evidenceIds?.length ?? 0;
                      if (total === 0) return <span className="text-xs font-data text-[var(--color-text-dim)]">—</span>;
                      const approved = event.evidenceIds.filter(
                        (eid) => evidence.find((e) => e.id === eid)?.status === "approved"
                      ).length;
                      const color = approved === total
                        ? "var(--color-semantic-green)"
                        : approved > 0
                        ? "var(--color-semantic-yellow)"
                        : "var(--color-text-dim)";
                      return (
                        <span className="text-xs font-data font-semibold" style={{ color }}>
                          {approved}/{total}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-dim)]">
                    {STAGE_LABEL[event.lifecycleStage] ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Event Drawer */}
      <EventDrawer
        open={!!drawerEvent}
        event={drawerEvent}
        onClose={() => setDrawerEvent(null)}
        onOpenEvent={handleOpenEvent}
        onDraftUpdate={handleDraftUpdate}
      />
    </div>
  );
}
