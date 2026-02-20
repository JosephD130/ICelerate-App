"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { AppNotification } from "@/lib/notifications/types";
import {
  scanDeadlines,
  fireBrowserNotification,
} from "@/lib/notifications/deadline-engine";
import { DEADLINE_THRESHOLDS } from "@/lib/notifications/types";
import { useEvents } from "@/lib/contexts/event-context";
import { FLAGS } from "@/lib/flags";

const SCAN_INTERVAL_MS = 60_000;

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  requestBrowserPermission: () => Promise<void>;
  browserPermission: NotificationPermission | "unsupported";
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { events } = useEvents();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | "unsupported"
  >(
    typeof window !== "undefined" && typeof Notification !== "undefined"
      ? Notification.permission
      : "unsupported",
  );
  const knownIdsRef = useRef<Set<string>>(new Set());

  // Periodic deadline scan
  useEffect(() => {
    if (!FLAGS.deadlineEngine) return;

    const scan = () => {
      const existingIds = knownIdsRef.current;
      const newNotifs = scanDeadlines(events, existingIds);

      if (newNotifs.length > 0) {
        for (const n of newNotifs) knownIdsRef.current.add(n.id);

        // Browser notifications for critical deadlines
        for (const n of newNotifs) {
          if (n.severity === "critical") {
            const threshold = DEADLINE_THRESHOLDS.find(
              (t) =>
                n.hoursRemaining !== undefined && n.hoursRemaining <= t.hours,
            );
            if (threshold?.browserNotify) {
              fireBrowserNotification(n);
            }
          }
        }

        setNotifications((prev) => [...newNotifs, ...prev].slice(0, 50));
      }
    };

    scan();
    const interval = setInterval(scan, SCAN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [events]);

  const unreadCount = notifications.filter(
    (n) => !n.readAt && !n.dismissedAt,
  ).length;

  const addNotification = useCallback((n: AppNotification) => {
    knownIdsRef.current.add(n.id);
    setNotifications((prev) => [n, ...prev].slice(0, 50));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
  }, []);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || now })),
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, dismissedAt: new Date().toISOString() } : n,
      ),
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setBrowserPermission("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setBrowserPermission(result);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markRead,
        markAllRead,
        dismiss,
        clearAll,
        requestBrowserPermission,
        browserPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
