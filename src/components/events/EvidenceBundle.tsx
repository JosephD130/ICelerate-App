"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Users, ListChecks, Paperclip, BookOpen } from "lucide-react";
import { useEvents } from "@/lib/contexts/event-context";
import { useActiveProject } from "@/lib/contexts/project-context";
import { resolveEvidenceBundle } from "@/lib/demo/v5/resolvers";
import { v4ToV5EventId } from "@/lib/demo/v5/resolvers/id-map";
import type { DailyLog } from "@/lib/demo/v5/dailyLogs";

export default function EvidenceBundle() {
  const { activeEvent } = useEvents();
  const { activeProject } = useActiveProject();
  const [expanded, setExpanded] = useState(false);

  if (!activeEvent) return null;

  // Map V4 event ID to V5 for resolver lookup
  const v5EventId = v4ToV5EventId(activeEvent.id, activeProject.id) ?? activeEvent.id;
  const bundle = resolveEvidenceBundle(activeProject.id, v5EventId);

  if (!bundle || bundle.totalItems === 0) return null;

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)]">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface)] transition-colors rounded-[var(--radius-card)]"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} className="text-[var(--color-accent)]" /> : <ChevronRight size={14} className="text-[var(--color-text-dim)]" />}
          <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
            Evidence Bundle
          </span>
          <span className="text-xs font-data text-[var(--color-text-dim)]">
            {bundle.totalItems} items
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-data text-[var(--color-text-dim)]">
          {bundle.logs.length > 0 && <span>{bundle.logs.length} logs</span>}
          {bundle.clauses.length > 0 && <span>{bundle.clauses.length} clauses</span>}
          {bundle.tasks.length > 0 && <span>{bundle.tasks.length} tasks</span>}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--color-border)]">
          {/* Field Logs */}
          {bundle.logs.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={12} className="text-[var(--color-semantic-green)]" />
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                  Field Logs ({bundle.logs.length})
                </span>
              </div>
              <div className="space-y-2">
                {bundle.logs.map((log: DailyLog) => (
                  <div key={log.id} className="bg-[var(--color-surface)] rounded-[var(--radius-sm)] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-data text-[var(--color-accent)]">{log.date}</span>
                      <span className="text-xs text-[var(--color-text-dim)]">{log.author} · {log.shift}</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">{log.location}</div>
                    <ul className="space-y-0.5">
                      {log.workPerformed.slice(0, 2).map((w, i) => (
                        <li key={i} className="text-sm text-[var(--color-text-secondary)] leading-relaxed">• {w}</li>
                      ))}
                      {log.workPerformed.length > 2 && (
                        <li className="text-xs text-[var(--color-text-dim)]">+{log.workPerformed.length - 2} more</li>
                      )}
                    </ul>
                    {log.constraints.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-[var(--color-border)]">
                        {log.constraints.slice(0, 1).map((c, i) => (
                          <div key={i} className="text-xs text-[var(--color-semantic-yellow)]">⚠ {c}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contract Clauses */}
          {bundle.clauses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText size={12} className="text-[var(--color-semantic-blue)]" />
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                  Contract Clauses ({bundle.clauses.length})
                </span>
              </div>
              <div className="space-y-2">
                {bundle.clauses.map((clause, i) => (
                  <div key={i} className="bg-[var(--color-surface)] rounded-[var(--radius-sm)] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{clause.ref}</span>
                      {clause.noticeWindowHours && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-semantic-red-dim)", color: "var(--color-semantic-red)" }}>
                          {clause.noticeWindowHours}h notice
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-0.5">{clause.heading}</div>
                    <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">{clause.summary}</div>
                    <div className="text-[10px] text-[var(--color-text-dim)] mt-1">{clause.docTitle}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affected Tasks */}
          {bundle.tasks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ListChecks size={12} className="text-[var(--color-semantic-yellow)]" />
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                  Affected Tasks ({bundle.tasks.length})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-left text-[var(--color-text-dim)] border-b border-[var(--color-border)]">
                      <th className="pb-1 pr-3 font-data">WBS</th>
                      <th className="pb-1 pr-3">Task</th>
                      <th className="pb-1 pr-3">Phase</th>
                      <th className="pb-1 pr-3 font-data text-right">Variance</th>
                      <th className="pb-1 font-data text-right">Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.tasks.map((task) => (
                      <tr key={task.id} className="border-b border-[var(--color-border)]/50">
                        <td className="py-1.5 pr-3 font-data text-[var(--color-text-muted)]">{task.wbs}</td>
                        <td className="py-1.5 pr-3 text-[var(--color-text-secondary)]">
                          {task.name}
                          {task.criticalPath && (
                            <span className="ml-1 text-[10px] px-1 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-semantic-red-dim)", color: "var(--color-semantic-red)" }}>CP</span>
                          )}
                        </td>
                        <td className="py-1.5 pr-3 text-[var(--color-text-dim)]">{task.phaseName}</td>
                        <td className="py-1.5 pr-3 font-data text-right" style={{ color: task.varianceDays > 0 ? "var(--color-semantic-red)" : "var(--color-semantic-green)" }}>
                          {task.varianceDays > 0 ? `+${task.varianceDays}d` : `${task.varianceDays}d`}
                        </td>
                        <td className="py-1.5 font-data text-right text-[var(--color-text-muted)]">{task.percentComplete}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stakeholders */}
          {bundle.stakeholders.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Users size={12} className="text-[var(--color-semantic-purple)]" />
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                  Stakeholders ({bundle.stakeholders.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {bundle.stakeholders.map((s) => (
                  <div key={s.id} className="bg-[var(--color-surface)] rounded-[var(--radius-sm)] px-3 py-2">
                    <div className="text-sm text-[var(--color-text-primary)] font-medium">{s.name}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">{s.role}{s.org ? ` · ${s.org}` : ""}</div>
                    <span className="text-[10px] font-data uppercase tracking-wider" style={{
                      color: s.influence === "high" ? "var(--color-semantic-red)" : s.influence === "medium" ? "var(--color-semantic-yellow)" : "var(--color-text-dim)"
                    }}>
                      {s.influence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {bundle.attachments.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Paperclip size={12} className="text-[var(--color-text-muted)]" />
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                  Attachments ({bundle.attachments.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {bundle.attachments.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                    <span className="text-[10px] uppercase font-data text-[var(--color-text-dim)]">{a.type}</span>
                    {a.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
