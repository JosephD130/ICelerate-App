"use client";

import { useEffect, useState, useRef } from "react";
import { X, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useNotifications } from "@/lib/contexts/notification-context";
import type { AppNotification, NotificationSeverity } from "@/lib/notifications/types";
import { FLAGS } from "@/lib/flags";

const SEVERITY_STYLE: Record<
  NotificationSeverity,
  { icon: React.ReactNode; border: string; color: string }
> = {
  critical: {
    icon: <AlertCircle size={14} />,
    border: "var(--color-semantic-red)",
    color: "var(--color-semantic-red)",
  },
  warning: {
    icon: <AlertTriangle size={14} />,
    border: "var(--color-semantic-yellow)",
    color: "var(--color-semantic-yellow)",
  },
  info: {
    icon: <Info size={14} />,
    border: "var(--color-semantic-blue)",
    color: "var(--color-semantic-blue)",
  },
};

const AUTO_DISMISS_MS: Record<NotificationSeverity, number | null> = {
  info: 8000,
  warning: 12000,
  critical: null, // manual dismiss only
};

interface ToastItem {
  notification: AppNotification;
  exiting: boolean;
}

export default function ToastStack() {
  const { notifications } = useNotifications();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const shownRef = useRef<Set<string>>(new Set());

  // Watch for new notifications and spawn toasts
  useEffect(() => {
    if (!FLAGS.deadlineEngine) return;

    for (const n of notifications) {
      if (shownRef.current.has(n.id)) continue;
      shownRef.current.add(n.id);

      setToasts((prev) => {
        const next = [{ notification: n, exiting: false }, ...prev];
        return next.slice(0, 3); // max 3 visible
      });

      // Auto-dismiss
      const delay = AUTO_DISMISS_MS[n.severity];
      if (delay) {
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) =>
              t.notification.id === n.id ? { ...t, exiting: true } : t,
            ),
          );
          setTimeout(() => {
            setToasts((prev) =>
              prev.filter((t) => t.notification.id !== n.id),
            );
          }, 300);
        }, delay);
      }
    }
  }, [notifications]);

  const dismissToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.notification.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.notification.id !== id));
    }, 300);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const style = SEVERITY_STYLE[toast.notification.severity];
        return (
          <div
            key={toast.notification.id}
            className={`pointer-events-auto bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-lg p-3 max-w-[340px] transition-all duration-300 ${
              toast.exiting
                ? "opacity-0 translate-x-4"
                : "opacity-100 translate-x-0"
            }`}
            style={{ borderLeftWidth: 3, borderLeftColor: style.border }}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0" style={{ color: style.color }}>
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">
                  {toast.notification.title}
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                  {toast.notification.body}
                </div>
              </div>
              <button
                onClick={() => dismissToast(toast.notification.id)}
                className="p-0.5 text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
