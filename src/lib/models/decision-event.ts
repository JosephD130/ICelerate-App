// DecisionEvent — unified data model normalizing all tool outputs

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type EventStatus = "open" | "in-progress" | "resolved" | "escalated";
export type Altitude = "ground" | "50ft" | "200ft";
export type PipelineStation = "capture" | "analyze" | "decide" | "communicate";

export type LifecycleStage = "field-record" | "spec-check" | "position" | "issue-notice";

export type EventType = "notice-contract" | "drift-variance" | "cost-schedule";

export interface EventAttachment {
  id: string;
  kind: "photo" | "document" | "email" | "field-report";
  title: string;
  rawText: string;
  metadata: Record<string, string>;
  addedAt: string;
}

export interface CostImpact {
  estimated: number;
  currency: string;
  confidence: "high" | "medium" | "low";
  description: string;
}

export interface ScheduleImpact {
  daysAffected: number;
  criticalPath: boolean;
  description: string;
}

export interface ContractReference {
  section: string;
  clause: string;
  summary: string;
  noticeDays?: number;
}

export interface StakeholderNotification {
  stakeholderId: string;
  name: string;
  role: string;
  notified: boolean;
  notifiedAt?: string;
  method?: string;
}

export interface VelocityMetrics {
  detectedAt: string;
  decidedAt?: string;
  communicatedAt?: string;
  totalMinutes?: number;
  traditionalDays: number;
}

export type AlignmentStatus = "synced" | "drift" | "misaligned";

export interface FieldRecord {
  observation: string;
  location: string;
  observer: string;
  timestamp: string;
  noticeRequired?: boolean;
  output?: string;
  trust?: TrustState;
}

export interface RfiRecord {
  description: string;
  urgency: string;
  output: string;
  trust?: TrustState;
}

export interface DecisionPanel {
  stakeholderId: string;
  output: string;
  sent: boolean;
  sentAt?: string;
}

export interface DecisionRecord {
  input: string;
  panels: DecisionPanel[];
  trust?: TrustState;
}

export interface CommunicationRecord {
  room: string;
  persona: string;
  output: string;
  sentAt?: string;
  trust?: TrustState;
}

export interface MonitorScore {
  date: string;
  score: number;
  analysis: string;
  trust?: TrustState;
}

export interface TrustState {
  trustStatus: "verified" | "needs_review" | "unverified";
  trustReason: string;
  evidenceRefs: {
    sourceIds: string[];
    docChunkIds: string[];
  };
  evaluatedAt: string;
  confidenceBreakdown?: {
    evidence_score: number;
    freshness_score: number;
    fit_score: number;
    composite: number;
  };
  scoreOverwritten?: boolean;
}

export interface HistoryEntry {
  action: string;
  tab: string;
  timestamp: string;
  detail: string;
}

export interface DecisionEvent {
  id: string;
  title: string;
  description: string;
  trigger: string;
  station: PipelineStation;
  severity: Severity;
  status: EventStatus;
  altitude: Altitude;
  alignmentStatus: AlignmentStatus;

  location?: string;
  stationNumber?: string;

  costImpact?: CostImpact;
  scheduleImpact?: ScheduleImpact;

  contractReferences: ContractReference[];
  noticeDeadline?: string;
  noticeClockDays?: number;

  stakeholderNotifications: StakeholderNotification[];

  velocity: VelocityMetrics;

  // Event workspace records
  fieldRecord?: FieldRecord;
  rfiRecord?: RfiRecord;
  decisionRecord?: DecisionRecord;
  communications: CommunicationRecord[];
  monitorScores: MonitorScore[];
  history: HistoryEntry[];

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  toolSource: string;
  parentEventId?: string;
  tags: string[];

  // Event flow simplification fields
  eventType?: EventType;
  attachments: EventAttachment[];
  friendlyLabel?: string;

  // Governed risk system fields
  lifecycleStage: LifecycleStage;
  evidenceIds: string[];
}

export function createDecisionEvent(
  partial: Partial<DecisionEvent> &
    Pick<DecisionEvent, "title" | "trigger" | "station" | "severity">
): DecisionEvent {
  const now = new Date().toISOString();
  const id = `de-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    description: "",
    status: "open",
    altitude: "ground",
    alignmentStatus: "drift" as AlignmentStatus,
    contractReferences: [],
    stakeholderNotifications: [],
    velocity: {
      detectedAt: now,
      traditionalDays: 18,
    },
    communications: [],
    monitorScores: [],
    history: [
      {
        action: "Event created",
        tab: "overview",
        timestamp: now,
        detail: partial.title ?? "New event",
      },
    ],
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
    toolSource: "manual",
    tags: [],
    attachments: [],
    lifecycleStage: "field-record",
    evidenceIds: [],
    ...partial,
    friendlyLabel: partial.friendlyLabel ?? generateFriendlyLabelFromId(id),
  };
}

/**
 * Generate a friendly label from a raw event ID.
 * de-1708967234517-a4b2k9 → EV-20240226-A4B2
 */
function generateFriendlyLabelFromId(rawId: string): string {
  const parts = rawId.split("-");
  const ts = Number(parts[1]);
  const hash = (parts[2] ?? "0000").slice(0, 4).toUpperCase();
  if (isNaN(ts)) return `RI-${hash}`;
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `RI-${y}${m}${day}-${hash}`;
}
