"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/lib/contexts/notification-context";
import NotificationCenter from "./NotificationCenter";
import { FLAGS } from "@/lib/flags";

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!FLAGS.deadlineEngine) return null;

  const badgeColor =
    unreadCount > 0 ? "var(--color-semantic-red)" : "transparent";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-all"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
            style={{ background: badgeColor }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationCenter onClose={() => setOpen(false)} />}
    </div>
  );
}
