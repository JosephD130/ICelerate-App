export type NotificationSeverity = "critical" | "warning" | "info";

export type NotificationCategory =
  | "notice_deadline"
  | "cost_threshold"
  | "stakeholder_gap"
  | "pipeline_complete"
  | "drift_detected";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  body: string;
  eventId?: string;
  actionLabel?: string;
  actionPath?: string;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  hoursRemaining?: number;
  source: "deadline-engine" | "intelligence-feed" | "pipeline";
}

export interface DeadlineThreshold {
  hours: number;
  severity: NotificationSeverity;
  label: string;
  browserNotify: boolean;
}

export const DEADLINE_THRESHOLDS: DeadlineThreshold[] = [
  { hours: 0, severity: "critical", label: "OVERDUE", browserNotify: true },
  { hours: 6, severity: "critical", label: "6 hours", browserNotify: true },
  { hours: 24, severity: "warning", label: "24 hours", browserNotify: true },
  { hours: 72, severity: "info", label: "3 days", browserNotify: false },
];
