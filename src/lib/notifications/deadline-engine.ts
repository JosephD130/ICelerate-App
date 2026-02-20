import type { DecisionEvent } from "@/lib/models/decision-event";
import type { AppNotification } from "./types";
import { DEADLINE_THRESHOLDS } from "./types";

/** Scan events and produce notifications for approaching/overdue deadlines. */
export function scanDeadlines(
  events: DecisionEvent[],
  existingIds: Set<string>,
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = Date.now();

  for (const event of events) {
    if (event.status === "resolved") continue;

    // Check contractReferences with noticeDays
    for (const ref of event.contractReferences) {
      if (!ref.noticeDays || ref.noticeDays <= 0) continue;

      const deadlineMs =
        new Date(event.createdAt).getTime() +
        ref.noticeDays * 24 * 60 * 60 * 1000;
      const hoursRemaining = (deadlineMs - now) / (1000 * 60 * 60);

      for (const threshold of DEADLINE_THRESHOLDS) {
        if (
          hoursRemaining <= threshold.hours ||
          (threshold.hours === 0 && hoursRemaining <= 0)
        ) {
          const notifId = `deadline-${event.id}-${ref.section}-${threshold.hours}h`;
          if (existingIds.has(notifId)) continue;

          notifications.push({
            id: notifId,
            category: "notice_deadline",
            severity: threshold.severity,
            title:
              hoursRemaining <= 0
                ? `OVERDUE: Notice for "${event.title}"`
                : `Notice deadline in ${threshold.label}`,
            body: `${ref.section}${ref.clause ? ` — ${ref.clause}` : ""}: ${ref.noticeDays}-day notice window ${hoursRemaining <= 0 ? "has expired. Entitlement may be waived." : "is closing. File notice to preserve rights."}`,
            eventId: event.id,
            actionLabel: "View Event",
            actionPath: `/workspace/events/${event.id}`,
            createdAt: new Date().toISOString(),
            hoursRemaining: Math.round(hoursRemaining),
            source: "deadline-engine",
          });
          break; // One notification per reference per scan
        }
      }
    }

    // Check explicit noticeDeadline field
    if (event.noticeDeadline) {
      const deadlineMs = new Date(event.noticeDeadline).getTime();
      const hoursRemaining = (deadlineMs - now) / (1000 * 60 * 60);

      for (const threshold of DEADLINE_THRESHOLDS) {
        if (
          hoursRemaining <= threshold.hours ||
          (threshold.hours === 0 && hoursRemaining <= 0)
        ) {
          const notifId = `notice-${event.id}-${threshold.hours}h`;
          if (existingIds.has(notifId)) continue;

          notifications.push({
            id: notifId,
            category: "notice_deadline",
            severity: threshold.severity,
            title:
              hoursRemaining <= 0
                ? `OVERDUE: "${event.title}" notice deadline`
                : `Notice deadline approaching for "${event.title}"`,
            body: `${Math.abs(Math.round(hoursRemaining))} hours ${hoursRemaining <= 0 ? "past" : "until"} deadline.`,
            eventId: event.id,
            actionLabel: "View Event",
            actionPath: `/workspace/events/${event.id}`,
            createdAt: new Date().toISOString(),
            hoursRemaining: Math.round(hoursRemaining),
            source: "deadline-engine",
          });
          break;
        }
      }
    }
  }

  return notifications;
}

/** Fire a browser notification. */
export function fireBrowserNotification(notification: AppNotification): void {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  )
    return;
  new Notification(notification.title, {
    body: notification.body,
    icon: "/Logo-ICelerate.png",
    tag: notification.id,
  });
}
