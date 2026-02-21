"use client";

import { ClipboardList } from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import { useEvents } from "@/lib/contexts/event-context";

export default function AuditLogMode() {
  const { activeEvent } = useEvents();

  if (!activeEvent) return null;

  const history = [...activeEvent.history].reverse();

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={<ClipboardList size={12} />}>Audit Log</SectionTitle>
        <span className="text-xs font-data text-[var(--color-text-dim)]">
          {history.length} entries
        </span>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
                Mode
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--color-text-dim)]">
                  No activity recorded yet
                </td>
              </tr>
            ) : (
              history.map((entry, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-2.5 font-data text-xs text-[var(--color-text-dim)] whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-primary)] font-medium">
                    {entry.action}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-text-muted)] capitalize">
                    {entry.tab}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-text-dim)] max-w-[300px] truncate" title={entry.detail}>
                    {entry.detail}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
