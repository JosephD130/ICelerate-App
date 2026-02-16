"use client";

import {
  Radio,
  FileText,
  GitBranch,
  MessageSquare,
  Activity,
  Eye,
  Clock,
} from "lucide-react";
import { useEvents } from "@/lib/contexts/event-context";

const TAB_ICONS: Record<string, React.ReactNode> = {
  field: <Radio size={14} />,
  contract: <FileText size={14} />,
  decision: <GitBranch size={14} />,
  communication: <MessageSquare size={14} />,
  monitor: <Activity size={14} />,
  overview: <Eye size={14} />,
  history: <Clock size={14} />,
};

const TAB_COLORS: Record<string, string> = {
  field: "var(--color-semantic-green)",
  contract: "var(--color-semantic-blue)",
  decision: "var(--color-semantic-purple)",
  communication: "var(--color-accent)",
  monitor: "var(--color-semantic-yellow)",
  overview: "var(--color-text-secondary)",
  history: "var(--color-text-muted)",
};

export default function HistoryTab() {
  const { activeEvent } = useEvents();
  if (!activeEvent) return null;

  const history = [...activeEvent.history].reverse();

  return (
    <div className="max-w-3xl">
      <div className="text-xs font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-4">
        Audit Trail — {history.length} entries
      </div>

      {history.length === 0 ? (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-8 text-center text-[var(--color-text-dim)] text-sm">
          No history entries yet. Actions taken in other tabs will appear here.
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-[var(--color-border)]" />

          <div className="space-y-1">
            {history.map((entry, i) => {
              const color = TAB_COLORS[entry.tab] ?? "var(--color-text-muted)";
              const icon = TAB_ICONS[entry.tab] ?? <Clock size={14} />;
              const date = new Date(entry.timestamp);

              return (
                <div key={i} className="flex items-start gap-3 relative pl-1">
                  {/* Icon dot */}
                  <div
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 z-10 border-2"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                      borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                      color,
                    }}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">
                        {entry.action}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="badge text-[10px]"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                            color,
                          }}
                        >
                          {entry.tab}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {entry.detail}
                    </div>
                    <div className="text-xs font-data text-[var(--color-text-dim)] mt-1.5">
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
  );
}
