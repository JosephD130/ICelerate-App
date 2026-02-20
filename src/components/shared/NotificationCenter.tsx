"use client";

import {
  CheckCheck,
  X,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/lib/contexts/notification-context";
import type { AppNotification, NotificationSeverity } from "@/lib/notifications/types";

const SEVERITY_CONFIG: Record<
  NotificationSeverity,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  critical: {
    icon: <AlertCircle size={14} />,
    color: "var(--color-semantic-red)",
    bg: "var(--color-semantic-red-dim)",
  },
  warning: {
    icon: <AlertTriangle size={14} />,
    color: "var(--color-semantic-yellow)",
    bg: "var(--color-semantic-yellow-dim)",
  },
  info: {
    icon: <Info size={14} />,
    color: "var(--color-semantic-blue)",
    bg: "var(--color-semantic-blue-dim)",
  },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function NotificationCard({
  notification,
  onDismiss,
  onRead,
}: {
  notification: AppNotification;
  onDismiss: () => void;
  onRead: () => void;
}) {
  const config = SEVERITY_CONFIG[notification.severity];
  const isUnread = !notification.readAt && !notification.dismissedAt;

  return (
    <div
      className={`flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-[var(--color-surface)] ${
        isUnread ? "border-l-2" : "border-l-2 border-l-transparent opacity-70"
      }`}
      style={isUnread ? { borderLeftColor: config.color } : undefined}
      onClick={onRead}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: config.bg, color: config.color }}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">
          {notification.title}
        </div>
        <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
          {notification.body}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-[var(--color-text-dim)]">
            {timeAgo(notification.createdAt)}
          </span>
          {notification.actionPath && (
            <Link
              href={notification.actionPath}
              className="flex items-center gap-0.5 text-[9px] text-[var(--color-accent)] hover:underline"
            >
              <ExternalLink size={8} />
              {notification.actionLabel || "View"}
            </Link>
          )}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="p-0.5 text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function NotificationCenter({
  onClose,
}: {
  onClose: () => void;
}) {
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
    requestBrowserPermission,
    browserPermission,
  } = useNotifications();

  const visible = notifications.filter((n) => !n.dismissedAt);

  return (
    <div className="absolute right-0 top-full mt-2 w-[360px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-[var(--color-accent)]" />
          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-semantic-red-dim)] text-[var(--color-semantic-red)]">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[9px] text-[var(--color-text-dim)] hover:text-[var(--color-accent)] px-1.5 py-0.5 rounded transition-colors"
            >
              <CheckCheck size={10} />
              Mark all read
            </button>
          )}
          {visible.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-[9px] text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] px-1.5 py-0.5 rounded transition-colors"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-[var(--color-border)]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-dim)]">
            <Bell size={24} className="mb-2 opacity-40" />
            <span className="text-xs">No notifications</span>
          </div>
        ) : (
          visible.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onDismiss={() => dismiss(n.id)}
              onRead={() => markRead(n.id)}
            />
          ))
        )}
      </div>

      {/* Browser notification toggle */}
      {browserPermission !== "unsupported" && (
        <div className="border-t border-[var(--color-border)] px-3 py-2 flex items-center justify-between">
          <span className="text-[9px] text-[var(--color-text-dim)]">
            Browser notifications
          </span>
          {browserPermission === "granted" ? (
            <span className="text-[9px] text-[var(--color-semantic-green)]">
              Enabled
            </span>
          ) : (
            <button
              onClick={requestBrowserPermission}
              className="text-[9px] text-[var(--color-accent)] hover:underline"
            >
              Enable
            </button>
          )}
        </div>
      )}
    </div>
  );
}
