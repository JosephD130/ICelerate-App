import type {
  DecisionEvent,
  AlignmentStatus,
} from "@/lib/models/decision-event";

// Helper: adds new required fields with defaults
type PartialNew = Partial<
  Pick<
    DecisionEvent,
    "alignmentStatus" | "communications" | "monitorScores" | "history" | "fieldRecord" | "rfiRecord" | "decisionRecord" | "attachments" | "friendlyLabel" | "eventType" | "lifecycleStage" | "evidenceIds"
  >
>;
function withDefaults(
  event: Omit<DecisionEvent, "alignmentStatus" | "communications" | "monitorScores" | "history" | "attachments" | "lifecycleStage" | "evidenceIds"> & PartialNew
): DecisionEvent {
  return {
    alignmentStatus: "drift" as AlignmentStatus,
    communications: [],
    monitorScores: [],
    history: [
      {
        action: "Event created",
        tab: "overview",
        timestamp: event.createdAt,
        detail: event.trigger,
      },
    ],
    attachments: [],
    lifecycleStage: "field-record",
    evidenceIds: [],
    ...event,
  };
}

export const demoDecisionEvents: DecisionEvent[] = [
  withDefaults({
    id: "de-001",
    title: 'Unmarked 12" DIP Water Main at STA 42+50',
    description:
      "Field crew encountered an unmarked 12-inch ductile iron water main conflicting with the proposed storm drain alignment at STA 42+50.",
    trigger: "Field observation during excavation",
    station: "capture",
    severity: "critical",
    status: "open",
    altitude: "ground",
    alignmentStatus: "misaligned",
    location: "STA 42+50, Phase 2 Area B",
    stationNumber: "42+50",
    costImpact: {
      estimated: 45000,
      currency: "USD",
      confidence: "medium",
      description:
        "Design revision to CB-7 junction + 15-foot offset realignment",
    },
    scheduleImpact: {
      daysAffected: 12,
      criticalPath: true,
      description:
        "Revision must be approved by EOW or 8 days of float consumed",
    },
    contractReferences: [
      {
        section: "§7.3.1",
        clause: "Differing Site Conditions",
        summary:
          "Concealed condition differs materially from Contract Documents",
        noticeDays: 2,
      },
      {
        section: "§12.4",
        clause: "Water Main Conflicts",
        summary: "Minimum 10-foot horizontal clearance required",
      },
    ],
    stakeholderNotifications: [
      {
        stakeholderId: "chen",
        name: "Director Chen",
        role: "Public Works Director",
        notified: false,
      },
      {
        stakeholderId: "rawlings",
        name: "CFO Rawlings",
        role: "Finance Director",
        notified: false,
      },
      {
        stakeholderId: "torres",
        name: "Engineer Torres",
        role: "City Engineer",
        notified: true,
        notifiedAt: "2026-02-10T14:30:00Z",
        method: "phone",
      },
      {
        stakeholderId: "martinez",
        name: "Foreman Martinez",
        role: "Superintendent",
        notified: true,
        notifiedAt: "2026-02-10T09:15:00Z",
        method: "field",
      },
    ],
    velocity: {
      detectedAt: "2026-02-10T08:45:00Z",
      traditionalDays: 18,
    },
    fieldRecord: {
      observation:
        'Encountered unmarked 12" DIP water main at STA 42+50 conflicting with proposed storm drain alignment. Main is approximately 4 feet below existing grade, running perpendicular to our alignment. No indication of this utility in the plans or pot-holing results.',
      location: "STA 42+50, Phase 2 Area B",
      observer: "Foreman Martinez",
      timestamp: "2026-02-10T08:45:00Z",
      noticeRequired: true,
    },
    history: [
      {
        action: "Event created",
        tab: "overview",
        timestamp: "2026-02-10T08:45:00Z",
        detail: "Field observation during excavation",
      },
      {
        action: "Field observation recorded",
        tab: "field",
        timestamp: "2026-02-10T08:50:00Z",
        detail: 'Unmarked 12" DIP water main documented with photos',
      },
      {
        action: "Contract references attached",
        tab: "contract",
        timestamp: "2026-02-10T09:30:00Z",
        detail: "§7.3.1 Differing Site Conditions, §12.4 Water Main Conflicts",
      },
      {
        action: "Engineer Torres notified",
        tab: "communication",
        timestamp: "2026-02-10T14:30:00Z",
        detail: "Notified via phone — confirmed field visit",
      },
    ],
    createdAt: "2026-02-10T08:45:00Z",
    updatedAt: "2026-02-10T15:00:00Z",
    createdBy: "field-crew",
    toolSource: "field-report",
    tags: ["utility-conflict", "water-main", "critical-path"],
  }),
  withDefaults({
    id: "de-002",
    title: "RFI-047: 15-Foot Horizontal Offset Request",
    description:
      "Contractor submitted RFI-047 requesting 15-foot horizontal offset to avoid unmarked water main. Requires design revision to CB-7 junction structure.",
    trigger: "Contractor RFI submission",
    station: "analyze",
    severity: "high",
    status: "open",
    altitude: "50ft",
    alignmentStatus: "drift",
    location: "STA 42+50 to STA 44+00",
    stationNumber: "42+50",
    costImpact: {
      estimated: 45000,
      currency: "USD",
      confidence: "medium",
      description:
        "Includes design revision, re-survey, and modified CB-7 structure",
    },
    scheduleImpact: {
      daysAffected: 12,
      criticalPath: true,
      description: "Critical path delay if not resolved by EOW Friday",
    },
    contractReferences: [
      {
        section: "§12.4",
        clause: "Water Main Conflicts",
        summary:
          "10-foot minimum horizontal clearance; 18-inch minimum vertical",
      },
      {
        section: "§501.1",
        clause: "Concrete Structures",
        summary: "CB-7 junction structure per plan configuration",
      },
    ],
    stakeholderNotifications: [
      {
        stakeholderId: "torres",
        name: "Engineer Torres",
        role: "City Engineer",
        notified: true,
        notifiedAt: "2026-02-10T16:00:00Z",
        method: "email",
      },
    ],
    velocity: {
      detectedAt: "2026-02-10T10:00:00Z",
      traditionalDays: 18,
    },
    rfiRecord: {
      description:
        "15-foot horizontal offset to avoid unmarked water main at STA 42+50. Requires CB-7 junction structure redesign.",
      urgency: "critical",
      output: "",
    },
    createdAt: "2026-02-10T10:00:00Z",
    updatedAt: "2026-02-10T16:00:00Z",
    createdBy: "pm",
    toolSource: "rfi",
    parentEventId: "de-001",
    tags: ["rfi", "design-revision", "CB-7"],
  }),
  withDefaults({
    id: "de-003",
    title: "Type II Diffuser Spec Evaluation",
    description:
      "Evaluating Type II energy dissipator specification for revised outfall location due to storm drain realignment.",
    trigger: "Design revision requirement",
    station: "analyze",
    severity: "medium",
    status: "in-progress",
    altitude: "50ft",
    alignmentStatus: "drift",
    location: "Outfall structure — revised location",
    costImpact: {
      estimated: 8500,
      currency: "USD",
      confidence: "low",
      description: "Material and installation cost delta for revised outfall",
    },
    scheduleImpact: {
      daysAffected: 3,
      criticalPath: false,
      description: "Parallel activity — does not extend critical path",
    },
    contractReferences: [
      {
        section: "§601.2",
        clause: "Energy Dissipators",
        summary: "Type II required where discharge velocity exceeds 6 fps",
      },
    ],
    stakeholderNotifications: [
      {
        stakeholderId: "torres",
        name: "Engineer Torres",
        role: "City Engineer",
        notified: true,
        notifiedAt: "2026-02-10T16:00:00Z",
        method: "email",
      },
    ],
    velocity: {
      detectedAt: "2026-02-10T14:00:00Z",
      traditionalDays: 18,
    },
    createdAt: "2026-02-10T14:00:00Z",
    updatedAt: "2026-02-10T16:30:00Z",
    createdBy: "pm",
    toolSource: "rfi",
    parentEventId: "de-001",
    tags: ["spec-evaluation", "outfall", "diffuser"],
  }),
  withDefaults({
    id: "de-004",
    title: "Soft Soil Condition — STA 43+00",
    description:
      "Trench excavation at STA 43+00 encountered saturated clay below grade. Shoring required per §301.2. Additional dewatering costs anticipated.",
    trigger: "Field excavation observation",
    station: "capture",
    severity: "medium",
    status: "open",
    altitude: "ground",
    alignmentStatus: "drift",
    location: "STA 43+00",
    stationNumber: "43+00",
    costImpact: {
      estimated: 12000,
      currency: "USD",
      confidence: "medium",
      description: "Shoring rental + dewatering for 200 LF of trench",
    },
    scheduleImpact: {
      daysAffected: 4,
      criticalPath: false,
      description: "Adds time to trench operations but parallel path available",
    },
    contractReferences: [
      {
        section: "§301.2",
        clause: "Trench Excavation",
        summary: "Unstable/saturated soils require shoring or trench boxes",
      },
      {
        section: "§7.3.1",
        clause: "Differing Site Conditions",
        summary:
          "May qualify as differing condition if not shown in geotech report",
        noticeDays: 2,
      },
    ],
    stakeholderNotifications: [
      {
        stakeholderId: "martinez",
        name: "Foreman Martinez",
        role: "Superintendent",
        notified: true,
        notifiedAt: "2026-02-11T07:00:00Z",
        method: "field",
      },
    ],
    velocity: {
      detectedAt: "2026-02-11T06:30:00Z",
      traditionalDays: 18,
    },
    fieldRecord: {
      observation:
        "Saturated clay encountered at STA 43+00, approximately 6 feet below existing grade. Trench walls unstable — shoring required per §301.2 before pipe installation can proceed.",
      location: "STA 43+00",
      observer: "Foreman Martinez",
      timestamp: "2026-02-11T06:30:00Z",
    },
    createdAt: "2026-02-11T06:30:00Z",
    updatedAt: "2026-02-11T08:00:00Z",
    createdBy: "field-crew",
    toolSource: "field-report",
    tags: ["soil", "shoring", "dewatering"],
  }),
  withDefaults({
    id: "de-005",
    title: "Rain Delay — Feb 11",
    description:
      "0.4 inches of rainfall suspended operations from 10:00 AM to 2:00 PM. Trench backfill operations halted — moisture content exceeded spec limits.",
    trigger: "Weather event",
    station: "capture",
    severity: "low",
    status: "resolved",
    altitude: "ground",
    alignmentStatus: "synced",
    location: "Project-wide",
    costImpact: {
      estimated: 3200,
      currency: "USD",
      confidence: "high",
      description: "4 hours of standby time for 8-person crew",
    },
    scheduleImpact: {
      daysAffected: 0.5,
      criticalPath: false,
      description: "Half-day lost; not on critical path",
    },
    contractReferences: [
      {
        section: "§8.3.1",
        clause: "Time Extensions",
        summary: "Weather delays may qualify for time extension",
      },
    ],
    stakeholderNotifications: [],
    velocity: {
      detectedAt: "2026-02-11T10:00:00Z",
      decidedAt: "2026-02-11T10:15:00Z",
      communicatedAt: "2026-02-11T10:30:00Z",
      totalMinutes: 30,
      traditionalDays: 1,
    },
    history: [
      {
        action: "Event created",
        tab: "overview",
        timestamp: "2026-02-11T10:00:00Z",
        detail: "Weather event — rain delay",
      },
      {
        action: "Field observation recorded",
        tab: "field",
        timestamp: "2026-02-11T10:05:00Z",
        detail: "0.4 inches rainfall, operations suspended",
      },
      {
        action: "Decision made",
        tab: "decision",
        timestamp: "2026-02-11T10:15:00Z",
        detail: "Standby approved, resume when moisture allows",
      },
      {
        action: "Communication sent",
        tab: "communication",
        timestamp: "2026-02-11T10:30:00Z",
        detail: "Internal PM notification — resolved in 30 minutes",
      },
      {
        action: "Event resolved",
        tab: "overview",
        timestamp: "2026-02-11T14:00:00Z",
        detail: "Operations resumed at 2:00 PM",
      },
    ],
    createdAt: "2026-02-11T10:00:00Z",
    updatedAt: "2026-02-11T14:00:00Z",
    createdBy: "field-crew",
    toolSource: "field-report",
    tags: ["weather", "rain", "delay"],
  }),
  withDefaults({
    id: "de-006",
    title: "Stakeholder Communication Gap — Director Chen",
    description:
      "Director Chen has not been briefed on the unmarked water main or associated cost/schedule impacts. Last stakeholder update was 3 days ago.",
    trigger: "Drift detection — office narrative stale",
    station: "communicate",
    severity: "high",
    status: "open",
    altitude: "200ft",
    alignmentStatus: "misaligned",
    costImpact: undefined,
    scheduleImpact: undefined,
    contractReferences: [],
    stakeholderNotifications: [
      {
        stakeholderId: "chen",
        name: "Director Chen",
        role: "Public Works Director",
        notified: false,
      },
    ],
    velocity: {
      detectedAt: "2026-02-12T08:00:00Z",
      traditionalDays: 18,
    },
    createdAt: "2026-02-12T08:00:00Z",
    updatedAt: "2026-02-12T08:00:00Z",
    createdBy: "system",
    toolSource: "drift-detector",
    parentEventId: "de-001",
    tags: ["communication-gap", "stakeholder", "drift"],
  }),
  withDefaults({
    id: "de-007",
    title: "Subcontractor Schedule Delay — Electrical",
    description:
      "Electrical subcontractor reporting 3-day delay on conduit installation at STA 41+00 to STA 43+00 due to material delivery.",
    trigger: "Subcontractor notification",
    station: "capture",
    severity: "medium",
    status: "open",
    altitude: "ground",
    alignmentStatus: "drift",
    location: "STA 41+00 to STA 43+00",
    stationNumber: "41+00",
    costImpact: {
      estimated: 0,
      currency: "USD",
      confidence: "high",
      description: "No direct cost — absorbed by subcontractor",
    },
    scheduleImpact: {
      daysAffected: 3,
      criticalPath: false,
      description:
        "3-day delay on parallel electrical work; does not affect storm drain critical path",
    },
    contractReferences: [
      {
        section: "§8.3.1",
        clause: "Time Extensions",
        summary: "Material delivery delay — subcontractor responsibility",
      },
    ],
    stakeholderNotifications: [
      {
        stakeholderId: "martinez",
        name: "Foreman Martinez",
        role: "Superintendent",
        notified: true,
        notifiedAt: "2026-02-12T07:00:00Z",
        method: "phone",
      },
    ],
    velocity: {
      detectedAt: "2026-02-12T06:45:00Z",
      traditionalDays: 18,
    },
    createdAt: "2026-02-12T06:45:00Z",
    updatedAt: "2026-02-12T07:30:00Z",
    createdBy: "subcontractor",
    toolSource: "field-report",
    tags: ["subcontractor", "delay", "electrical", "material"],
  }),
];
