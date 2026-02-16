"use client";

import {
  X, Radio, FileText, GitBranch, MessageSquare, Activity, Eye, Clock,
} from "lucide-react";
import type { DecisionEvent } from "@/lib/models/decision-event";

const TAB_ICONS: Record<string, React.ReactNode> = {
  field: <Radio size={14} />,
  contract: <FileText size={14} />,
  decision: <GitBranch size={14} />,
  communication: <MessageSquare size={14} />,
  monitor: <Activity size={14} />,
  overview: <Eye size={14} />,
  history: <Clock size={14} />,
  capture: <Radio size={14} />,
  exposure: <Activity size={14} />,
  "stakeholder-update": <MessageSquare size={14} />,
  "decision-outputs": <GitBranch size={14} />,
  activity: <Clock size={14} />,
};

const TAB_COLORS: Record<string, string> = {
  field: "var(--color-semantic-green)",
  contract: "var(--color-semantic-blue)",
  decision: "var(--color-semantic-purple)",
  communication: "var(--color-accent)",
  monitor: "var(--color-semantic-yellow)",
  overview: "var(--color-text-secondary)",
  history: "var(--color-text-muted)",
  capture: "var(--color-semantic-green)",
  exposure: "var(--color-semantic-yellow)",
  "stakeholder-update": "var(--color-accent)",
  "decision-outputs": "var(--color-semantic-purple)",
  activity: "var(--color-text-muted)",
};

interface Props {
  open: boolean;
  onClose: () => void;
  event: DecisionEvent;
}

export default function ActivityDrawer({ open, onClose, event }: Props) {
  const history = [...event.history].reverse();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      )}

      <div
        className="fixed right-0 top-0 z-50 h-full w-[380px] flex flex-col overflow-y-auto transition-transform duration-200 ease-in-out"
        style={{
          background: "var(--color-card)",
          borderLeft: "1px solid var(--color-border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="text-xs font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
            Activity — {history.length} entries
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 px-5 py-4">
          {history.length === 0 ? (
            <div className="text-sm text-[var(--color-text-dim)] text-center py-8">
              No activity yet. Actions taken in other modes will appear here.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[var(--color-border)]" />
              <div className="space-y-1">
                {history.map((entry, i) => {
                  const color = TAB_COLORS[entry.tab] ?? "var(--color-text-muted)";
                  const icon = TAB_ICONS[entry.tab] ?? <Clock size={12} />;
                  const date = new Date(entry.timestamp);
                  return (
                    <div key={i} className="flex items-start gap-2.5 relative">
                      <div
                        className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10 border"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                          borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                          color,
                        }}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">
                          {entry.action}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                          {entry.detail}
                        </div>
                        <div className="text-[10px] font-data text-[var(--color-text-dim)] mt-1">
                          {date.toLocaleDateString()} {date.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
