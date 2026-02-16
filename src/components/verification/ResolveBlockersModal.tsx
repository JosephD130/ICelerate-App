"use client";

import { X, CheckCircle, ExternalLink, FileText, RefreshCw, PenLine } from "lucide-react";
import Link from "next/link";

interface Props {
  blockers: string[];
  onClose: () => void;
  onResolve?: () => void;
}

/** Map blocker text patterns to recommended actions. */
function getActions(blocker: string): Array<{ label: string; href?: string; icon: typeof FileText }> {
  const lower = blocker.toLowerCase();

  if (lower.includes("clause") || lower.includes("contract") || lower.includes("citation")) {
    return [
      { label: "Open Documents library", href: "/workspace/documents", icon: FileText },
      { label: "Attach clause evidence", icon: PenLine },
    ];
  }
  if (lower.includes("stale") || lower.includes("snapshot") || lower.includes("refresh")) {
    return [
      { label: "Refresh data connections", href: "/workspace/connect", icon: RefreshCw },
    ];
  }
  if (lower.includes("numeric") || lower.includes("range") || lower.includes("source")) {
    return [
      { label: "Convert to range + assumptions", icon: PenLine },
      { label: "Open Documents library", href: "/workspace/documents", icon: FileText },
    ];
  }
  return [{ label: "Review output manually", icon: PenLine }];
}

export default function ResolveBlockersModal({ blockers, onClose, onResolve }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] p-5"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderTopWidth: 3,
          borderTopColor: "var(--color-semantic-yellow)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-semantic-yellow)]">
            Resolve Blockers
          </span>
          <button
            onClick={onClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {blockers.map((blocker, i) => {
            const actions = getActions(blocker);
            return (
              <div
                key={i}
                className="rounded-[var(--radius-sm)] p-3"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                    style={{ borderColor: "var(--color-semantic-yellow)" }}
                  />
                  <span className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                    {blocker}
                  </span>
                </div>
                <div className="pl-6 space-y-1">
                  {actions.map((action, j) => {
                    const ActionIcon = action.icon;
                    if (action.href) {
                      return (
                        <Link
                          key={j}
                          href={action.href}
                          className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline"
                        >
                          <ActionIcon size={10} />
                          {action.label}
                          <ExternalLink size={8} />
                        </Link>
                      );
                    }
                    return (
                      <span
                        key={j}
                        className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)]"
                      >
                        <ActionIcon size={10} />
                        {action.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {onResolve && (
            <button
              onClick={() => { onResolve(); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--color-semantic-green)",
                color: "var(--color-bg)",
              }}
            >
              <CheckCircle size={12} />
              Mark Resolved
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm text-[var(--color-text-muted)] border border-[var(--color-border)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
