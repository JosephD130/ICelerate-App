// src/lib/demo/v5/projects.ts
// Four coherent demo projects for ICelerate V5 (universal: connected / upload / native / mixed)
// - Includes phases, tasks (with deps), milestones, events (linked to tasks), stakeholders, and document stubs.
// - Dates are ISO (YYYY-MM-DD). Costs are USD.
// - Use `sourceProfile` to drive Connect/Data UI and "coverage meters".

export type SourceProfile = {
  mode: "connected" | "uploaded" | "native" | "mixed";
  sources: Array<{
    kind:
      | "project_system"
      | "schedule_file"
      | "cost_file"
      | "daily_logs"
      | "email"
      | "documents";
    label: string; // universal, not vendor-named
    status: "connected" | "uploaded" | "native" | "disconnected";
    lastSyncAt: string; // ISO datetime
    coverage: number; // 0-100
  }>;
};

export type Stakeholder = {
  id: string;
  name: string;
  role: string;
  org?: string;
  influence: "high" | "medium" | "low";
  commPreference?: "email" | "phone" | "meeting" | "memo";
};

export type DocStub = {
  id: string;
  title: string;
  category: "General Conditions" | "Special Provisions" | "Technical Specs" | "Schedule" | "Cost" | "Emails";
  tags: string[];
  clauses: Array<{
    ref: string;
    heading: string;
    noticeWindowHours?: number;
    summary: string;
  }>;
};

export type Phase = {
  id: string;
  name: string;
  order: number;
};

export type Task = {
  id: string;
  phaseId: string;
  wbs: string;
  name: string;
  baselineStart: string;
  baselineFinish: string;
  forecastStart: string;
  forecastFinish: string;
  percentComplete: number;
  predecessors: string[];
  criticalPath: boolean;
};

export type Milestone = {
  id: string;
  name: string;
  dateBaseline: string;
  dateForecast: string;
  status: "upcoming" | "at_risk" | "hit" | "missed";
};

export type Event = {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  alignmentStatus: "synced" | "drift" | "high_risk";
  location: string;
  createdAt: string;
  updatedAt: string;
  summary: string;

  costExposure: {
    amount: number;
    notes: string;
    confidence: "low" | "medium" | "high";
  };
  scheduleImpact: {
    days: number;
    notes: string;
    criticalPath: boolean;
  };

  taskIds: string[];
  stakeholderIds: string[];
  docRefs: Array<{ docId: string; clauseRefs: string[] }>;

  noticeRequired: boolean;
  noticeDeadlineAt?: string;
};

export type DemoProject = {
  id: string;
  name: string;
  owner: string;
  contractValue: number;
  contingency: number;
  percentComplete: number;
  startDate: string;
  endDateBaseline: string;
  endDateForecast: string;

  sourceProfile: SourceProfile;

  phases: Phase[];
  tasks: Task[];
  milestones: Milestone[];
  stakeholders: Stakeholder[];
  documents: DocStub[];
  events: Event[];

  exportHints: {
    execDeckFocusEventIds: string[];
    publicBriefFocusEventIds: string[];
    weeklyReportFocusEventIds: string[];
  };
};

export const DEMO_PROJECTS_V5: DemoProject[] = [
  // ---------------------------------------------------------------------------
  // PROJECT A — Connected (rich schedule/logs/events/docs)
  // ---------------------------------------------------------------------------
  {
    id: "p-mesa-stormdrain-2026",
    name: "Phase 2 Storm Drain & Utility Relocation",
    owner: "City of Mesa Public Works",
    contractValue: 4200000,
    contingency: 312000,
    percentComplete: 68,
    startDate: "2026-02-03",
    endDateBaseline: "2026-06-26",
    endDateForecast: "2026-07-08",

    sourceProfile: {
      mode: "connected",
      sources: [
        {
          kind: "project_system",
          label: "Project System",
          status: "connected",
          lastSyncAt: "2026-02-13T15:10:00-08:00",
          coverage: 92,
        },
        {
          kind: "daily_logs",
          label: "Field Logs",
          status: "connected",
          lastSyncAt: "2026-02-13T15:10:00-08:00",
          coverage: 88,
        },
        {
          kind: "documents",
          label: "Contract & Specs",
          status: "uploaded",
          lastSyncAt: "2026-02-12T18:40:00-08:00",
          coverage: 80,
        },
      ],
    },

    phases: [
      { id: "a-ph1", name: "Mobilization & Traffic Control", order: 1 },
      { id: "a-ph2", name: "Utility Locate & Potholing", order: 2 },
      { id: "a-ph3", name: "Utility Relocation", order: 3 },
      { id: "a-ph4", name: "Storm Drain Installation", order: 4 },
      { id: "a-ph5", name: "Paving & Restoration", order: 5 },
      { id: "a-ph6", name: "Closeout", order: 6 },
    ],

    tasks: [
      {
        id: "A-101",
        phaseId: "a-ph1",
        wbs: "1.01",
        name: "Mobilize crews, equipment, trailers",
        baselineStart: "2026-02-03",
        baselineFinish: "2026-02-05",
        forecastStart: "2026-02-03",
        forecastFinish: "2026-02-05",
        percentComplete: 100,
        predecessors: [],
        criticalPath: false,
      },
      {
        id: "A-110",
        phaseId: "a-ph1",
        wbs: "1.02",
        name: "Traffic control setup (Phase 2 Area B)",
        baselineStart: "2026-02-04",
        baselineFinish: "2026-02-07",
        forecastStart: "2026-02-04",
        forecastFinish: "2026-02-07",
        percentComplete: 95,
        predecessors: ["A-101"],
        criticalPath: true,
      },
      {
        id: "A-120",
        phaseId: "a-ph2",
        wbs: "2.01",
        name: "Utility tickets + mark-outs (STA 40+00–45+00)",
        baselineStart: "2026-02-06",
        baselineFinish: "2026-02-10",
        forecastStart: "2026-02-06",
        forecastFinish: "2026-02-10",
        percentComplete: 80,
        predecessors: ["A-110"],
        criticalPath: true,
      },
      {
        id: "A-121",
        phaseId: "a-ph2",
        wbs: "2.02",
        name: "Pothole crossings + verify depth (STA 41+00–43+00)",
        baselineStart: "2026-02-11",
        baselineFinish: "2026-02-15",
        forecastStart: "2026-02-11",
        forecastFinish: "2026-02-18",
        percentComplete: 40,
        predecessors: ["A-120"],
        criticalPath: true,
      },
      {
        id: "A-122",
        phaseId: "a-ph2",
        wbs: "2.03",
        name: "As-builts verification + conflicts log",
        baselineStart: "2026-02-13",
        baselineFinish: "2026-02-18",
        forecastStart: "2026-02-13",
        forecastFinish: "2026-02-20",
        percentComplete: 35,
        predecessors: ["A-121"],
        criticalPath: true,
      },
      {
        id: "A-130",
        phaseId: "a-ph3",
        wbs: "3.01",
        name: "Relocate 12-inch water main at STA 42+50",
        baselineStart: "2026-02-19",
        baselineFinish: "2026-03-06",
        forecastStart: "2026-02-24",
        forecastFinish: "2026-03-18",
        percentComplete: 0,
        predecessors: ["A-122"],
        criticalPath: true,
      },
      {
        id: "A-131",
        phaseId: "a-ph3",
        wbs: "3.02",
        name: "Relocate fiber duct bank (STA 41+00–43+00)",
        baselineStart: "2026-02-24",
        baselineFinish: "2026-03-10",
        forecastStart: "2026-02-24",
        forecastFinish: "2026-03-12",
        percentComplete: 10,
        predecessors: ["A-122"],
        criticalPath: false,
      },
      {
        id: "A-132",
        phaseId: "a-ph3",
        wbs: "3.03",
        name: "Pressure test + tie-ins",
        baselineStart: "2026-03-07",
        baselineFinish: "2026-03-12",
        forecastStart: "2026-03-19",
        forecastFinish: "2026-03-24",
        percentComplete: 0,
        predecessors: ["A-130"],
        criticalPath: true,
      },
      {
        id: "A-140",
        phaseId: "a-ph4",
        wbs: "4.01",
        name: "Excavate trench + shoring (Storm drain)",
        baselineStart: "2026-03-13",
        baselineFinish: "2026-03-24",
        forecastStart: "2026-03-25",
        forecastFinish: "2026-04-08",
        percentComplete: 0,
        predecessors: ["A-132"],
        criticalPath: true,
      },
      {
        id: "A-141",
        phaseId: "a-ph4",
        wbs: "4.02",
        name: "Install RCP + structures",
        baselineStart: "2026-03-20",
        baselineFinish: "2026-04-18",
        forecastStart: "2026-04-09",
        forecastFinish: "2026-05-08",
        percentComplete: 0,
        predecessors: ["A-140"],
        criticalPath: true,
      },
      {
        id: "A-142",
        phaseId: "a-ph4",
        wbs: "4.03",
        name: "Backfill + compaction tests",
        baselineStart: "2026-04-01",
        baselineFinish: "2026-04-22",
        forecastStart: "2026-05-09",
        forecastFinish: "2026-05-28",
        percentComplete: 0,
        predecessors: ["A-141"],
        criticalPath: true,
      },
    ],

    milestones: [
      {
        id: "A-M1",
        name: "Utility Relocation Complete",
        dateBaseline: "2026-04-10",
        dateForecast: "2026-04-24",
        status: "at_risk",
      },
      {
        id: "A-M2",
        name: "Storm Drain Complete",
        dateBaseline: "2026-05-22",
        dateForecast: "2026-06-05",
        status: "at_risk",
      },
      {
        id: "A-M3",
        name: "Substantial Completion",
        dateBaseline: "2026-06-26",
        dateForecast: "2026-07-08",
        status: "upcoming",
      },
    ],

    stakeholders: [
      { id: "A-S1", name: "Dir. Chen", role: "Public Works Director", org: "City of Mesa", influence: "high", commPreference: "meeting" },
      { id: "A-S2", name: "Eng. Martinez", role: "City Engineer", org: "City of Mesa", influence: "high", commPreference: "email" },
      { id: "A-S3", name: "CFO Rawlings", role: "Finance Director", org: "City of Mesa", influence: "high", commPreference: "memo" },
      { id: "A-S4", name: "Maria Torres", role: "HOA President", org: "Mesa HOA", influence: "medium", commPreference: "email" },
      { id: "A-S5", name: "Foreman Rivera", role: "Field Foreman", org: "GC", influence: "medium", commPreference: "phone" },
    ],

    documents: [
      {
        id: "A-D1",
        title: "General Conditions — Differing Site Conditions & Notice",
        category: "General Conditions",
        tags: ["notice", "claims", "differing-site-conditions"],
        clauses: [
          { ref: "§7.3.1", heading: "Differing Site Conditions", noticeWindowHours: 48, summary: "Requires prompt notification and documentation when subsurface/utility conditions differ materially." },
          { ref: "§7.3.2", heading: "Notice Requirements", noticeWindowHours: 48, summary: "Written notice within 48 hours to preserve time/cost entitlement." },
          { ref: "§8.3.1", heading: "Time Extensions", summary: "Defines requirements for schedule impact substantiation and approval." },
        ],
      },
      {
        id: "A-D2",
        title: "Special Provisions — Utility Conflicts",
        category: "Special Provisions",
        tags: ["utilities", "relocation", "conflicts"],
        clauses: [
          { ref: "§12.4", heading: "Water Main Conflicts", noticeWindowHours: 24, summary: "Defines coordination steps and immediate notifications for water main conflicts." },
          { ref: "§12.1", heading: "Utility Relocation", summary: "Defines responsibility boundaries and coordination requirements with owners." },
        ],
      },
      {
        id: "A-D3",
        title: "Technical Specs — Trench Excavation & Pipe Installation",
        category: "Technical Specs",
        tags: ["trench", "pipe", "installation"],
        clauses: [
          { ref: "§301.2", heading: "Trench Excavation", summary: "Shoring, safe slopes, and excavation tolerances." },
          { ref: "§301.4", heading: "Pipe Installation", summary: "Bedding, alignment, and inspection requirements." },
        ],
      },
      {
        id: "A-D4",
        title: "Baseline Schedule Summary (Extract)",
        category: "Schedule",
        tags: ["baseline", "milestones"],
        clauses: [{ ref: "SCH-1", heading: "Key Milestones", summary: "Baseline milestones and sequencing constraints." }],
      },
    ],

    events: [
      {
        id: "A-E1",
        title: 'Unmarked 12" DIP Water Main at STA 42+50',
        severity: "critical",
        status: "open",
        alignmentStatus: "high_risk",
        location: "STA 42+50 · Phase 2 Area B",
        createdAt: "2026-02-12",
        updatedAt: "2026-02-13",
        summary: "Field encountered unmarked 12-inch DIP line; excavation halted; standby costs accruing; notice clock active.",
        costExposure: { amount: 45000, notes: "Standby + remobilization risk; potential rework if alignment changes.", confidence: "medium" },
        scheduleImpact: { days: 12, notes: "Blocks water main relocation task and cascades to storm drain excavation.", criticalPath: true },
        taskIds: ["A-130", "A-132", "A-140"],
        stakeholderIds: ["A-S1", "A-S2", "A-S3", "A-S5"],
        docRefs: [
          { docId: "A-D1", clauseRefs: ["§7.3.1", "§7.3.2"] },
          { docId: "A-D2", clauseRefs: ["§12.4"] },
        ],
        noticeRequired: true,
        noticeDeadlineAt: "2026-02-14T23:59:00-08:00",
      },
      {
        id: "A-E2",
        title: "RFI-047: Horizontal Offset Conflict — Storm Drain Alignment",
        severity: "high",
        status: "in_progress",
        alignmentStatus: "drift",
        location: "STA 41+80–42+20",
        createdAt: "2026-02-10",
        updatedAt: "2026-02-13",
        summary: "Alignment shown conflicts with utility as-built offsets; RFI drafted, awaiting engineer response.",
        costExposure: { amount: 18500, notes: "Survey + redesign time; minor standby on affected segment.", confidence: "high" },
        scheduleImpact: { days: 4, notes: "Local delay; manageable if response within 5 business days.", criticalPath: false },
        taskIds: ["A-122", "A-140"],
        stakeholderIds: ["A-S2", "A-S5"],
        docRefs: [{ docId: "A-D3", clauseRefs: ["§301.4"] }],
        noticeRequired: false,
      },
      {
        id: "A-E3",
        title: "Stakeholder Update Gap — Director not briefed on utility halt",
        severity: "medium",
        status: "open",
        alignmentStatus: "drift",
        location: "Project-wide",
        createdAt: "2026-02-13",
        updatedAt: "2026-02-13",
        summary: "Office narrative indicates partial progress, but field is fully halted in Area B; briefing not sent.",
        costExposure: { amount: 6000, notes: "Risk is escalation, not direct spend; misalignment increases claim friction.", confidence: "medium" },
        scheduleImpact: { days: 0, notes: "Indirect—risk of approval lag.", criticalPath: false },
        taskIds: ["A-130"],
        stakeholderIds: ["A-S1", "A-S3"],
        docRefs: [{ docId: "A-D1", clauseRefs: ["§8.3.1"] }],
        noticeRequired: false,
      },
    ],

    exportHints: {
      execDeckFocusEventIds: ["A-E1", "A-E2"],
      publicBriefFocusEventIds: ["A-E1"],
      weeklyReportFocusEventIds: ["A-E1", "A-E3"],
    },
  },

  // ---------------------------------------------------------------------------
  // PROJECT B — Uploaded spreadsheets (schedule + cost + logs)
  // ---------------------------------------------------------------------------
  {
    id: "p-hwy87-widening-2026",
    name: "Highway 87 Widening — Segment A (MP 12.4–15.1)",
    owner: "State DOT",
    contractValue: 6800000,
    contingency: 510000,
    percentComplete: 42,
    startDate: "2026-02-10",
    endDateBaseline: "2026-07-08",
    endDateForecast: "2026-07-18",

    sourceProfile: {
      mode: "uploaded",
      sources: [
        {
          kind: "schedule_file",
          label: "Schedule Upload (XLSX)",
          status: "uploaded",
          lastSyncAt: "2026-02-13T13:30:00-08:00",
          coverage: 95,
        },
        {
          kind: "cost_file",
          label: "Cost Tracker Upload (XLSX)",
          status: "uploaded",
          lastSyncAt: "2026-02-13T13:31:00-08:00",
          coverage: 82,
        },
        {
          kind: "daily_logs",
          label: "Daily Logs Upload (CSV)",
          status: "uploaded",
          lastSyncAt: "2026-02-13T13:32:00-08:00",
          coverage: 70,
        },
        {
          kind: "documents",
          label: "Contract & Specs",
          status: "uploaded",
          lastSyncAt: "2026-02-12T19:05:00-08:00",
          coverage: 65,
        },
      ],
    },

    phases: [
      { id: "b-ph1", name: "Clearing & Grubbing", order: 1 },
      { id: "b-ph2", name: "Earthwork & Subgrade", order: 2 },
      { id: "b-ph3", name: "Drainage & Culvert Extensions", order: 3 },
      { id: "b-ph4", name: "Base & Paving", order: 4 },
      { id: "b-ph5", name: "Striping & Safety Devices", order: 5 },
      { id: "b-ph6", name: "Closeout", order: 6 },
    ],

    tasks: [
      {
        id: "B-205",
        phaseId: "b-ph2",
        wbs: "2.05",
        name: "Rough grade & compaction (Segment A)",
        baselineStart: "2026-02-20",
        baselineFinish: "2026-03-01",
        forecastStart: "2026-02-20",
        forecastFinish: "2026-03-03",
        percentComplete: 60,
        predecessors: [],
        criticalPath: true,
      },
      {
        id: "B-210",
        phaseId: "b-ph2",
        wbs: "2.10",
        name: "Subgrade proof roll (QA witness)",
        baselineStart: "2026-03-02",
        baselineFinish: "2026-03-04",
        forecastStart: "2026-03-04",
        forecastFinish: "2026-03-06",
        percentComplete: 0,
        predecessors: ["B-205"],
        criticalPath: true,
      },
      {
        id: "B-220",
        phaseId: "b-ph3",
        wbs: "3.20",
        name: "Culvert extension at Sta 151+00",
        baselineStart: "2026-03-10",
        baselineFinish: "2026-03-26",
        forecastStart: "2026-03-12",
        forecastFinish: "2026-03-31",
        percentComplete: 10,
        predecessors: ["B-210"],
        criticalPath: true,
      },
      {
        id: "B-310",
        phaseId: "b-ph4",
        wbs: "4.10",
        name: "Aggregate base placement",
        baselineStart: "2026-04-18",
        baselineFinish: "2026-05-10",
        forecastStart: "2026-04-25",
        forecastFinish: "2026-05-20",
        percentComplete: 0,
        predecessors: ["B-220"],
        criticalPath: true,
      },
      {
        id: "B-410",
        phaseId: "b-ph4",
        wbs: "4.20",
        name: "Paving lift 1",
        baselineStart: "2026-05-12",
        baselineFinish: "2026-05-30",
        forecastStart: "2026-05-22",
        forecastFinish: "2026-06-08",
        percentComplete: 0,
        predecessors: ["B-310"],
        criticalPath: true,
      },
    ],

    milestones: [
      { id: "B-M1", name: "Traffic Shift Complete", dateBaseline: "2026-03-20", dateForecast: "2026-03-27", status: "at_risk" },
      { id: "B-M2", name: "Drainage Complete", dateBaseline: "2026-05-01", dateForecast: "2026-05-10", status: "upcoming" },
      { id: "B-M3", name: "Final Acceptance", dateBaseline: "2026-07-08", dateForecast: "2026-07-18", status: "upcoming" },
    ],

    stakeholders: [
      { id: "B-S1", name: "DOT PM Alvarez", role: "Owner PM", org: "State DOT", influence: "high", commPreference: "email" },
      { id: "B-S2", name: "QA Inspector Singh", role: "QA Inspector", org: "State DOT", influence: "medium", commPreference: "phone" },
      { id: "B-S3", name: "GC PM Watson", role: "GC Project Manager", org: "GC", influence: "high", commPreference: "meeting" },
      { id: "B-S4", name: "Traffic Ops Lead Kim", role: "Traffic Operations", org: "County", influence: "medium", commPreference: "memo" },
    ],

    documents: [
      {
        id: "B-D1",
        title: "DOT Spec Book — Weather Delays & Documentation",
        category: "Technical Specs",
        tags: ["weather", "documentation", "time-extension"],
        clauses: [
          { ref: "§108.06", heading: "Time Extensions", summary: "Requires documented impacts, daily records, and timely submissions." },
          { ref: "§105.17", heading: "Notice of Delay", noticeWindowHours: 72, summary: "Notice within 72 hours for claim consideration." },
        ],
      },
      {
        id: "B-D2",
        title: "Weekly Status Email Thread (Extract)",
        category: "Emails",
        tags: ["status", "narrative"],
        clauses: [{ ref: "EMAIL-1", heading: "Owner Updates", summary: "Owner updates and commitments made in writing." }],
      },
    ],

    events: [
      {
        id: "B-E1",
        title: "Production Drop — Earthwork output below plan (4-day trend)",
        severity: "medium",
        status: "open",
        alignmentStatus: "drift",
        location: "Segment A · Sta 148+00–154+00",
        createdAt: "2026-02-12",
        updatedAt: "2026-02-13",
        summary: "Daily logs show reduced truck cycles and downtime; schedule upload not updated; risk to proof roll and traffic shift.",
        costExposure: { amount: 12000, notes: "Inefficiency + potential standby if QA window missed.", confidence: "medium" },
        scheduleImpact: { days: 3, notes: "Likely slip of proof roll and downstream culvert start.", criticalPath: true },
        taskIds: ["B-205", "B-210"],
        stakeholderIds: ["B-S1", "B-S3"],
        docRefs: [{ docId: "B-D2", clauseRefs: ["EMAIL-1"] }],
        noticeRequired: false,
      },
      {
        id: "B-E2",
        title: "Rain Days Not Properly Documented (claim risk)",
        severity: "high",
        status: "in_progress",
        alignmentStatus: "drift",
        location: "Project-wide",
        createdAt: "2026-02-11",
        updatedAt: "2026-02-13",
        summary: "Weather events noted informally; missing labor/equipment impacts; notice window approaching for time extension support.",
        costExposure: { amount: 0, notes: "Primary risk is entitlement loss, not direct spend.", confidence: "high" },
        scheduleImpact: { days: 0, notes: "Indirect—risk of losing time extension.", criticalPath: false },
        taskIds: ["B-205"],
        stakeholderIds: ["B-S1", "B-S2", "B-S3"],
        docRefs: [{ docId: "B-D1", clauseRefs: ["§105.17", "§108.06"] }],
        noticeRequired: true,
        noticeDeadlineAt: "2026-02-15T17:00:00-08:00",
      },
      {
        id: "B-E3",
        title: "Culvert Extension: Utility clearance pending",
        severity: "medium",
        status: "open",
        alignmentStatus: "synced",
        location: "Sta 151+00",
        createdAt: "2026-02-13",
        updatedAt: "2026-02-13",
        summary: "Utility clearance identified early; office narrative matches field constraint; waiting on utility owner confirmation.",
        costExposure: { amount: 5000, notes: "Potential minor standby depending on clearance response time.", confidence: "low" },
        scheduleImpact: { days: 2, notes: "Could move culvert start by 2 days if not cleared.", criticalPath: true },
        taskIds: ["B-220"],
        stakeholderIds: ["B-S3", "B-S1"],
        docRefs: [],
        noticeRequired: false,
      },
    ],

    exportHints: {
      execDeckFocusEventIds: ["B-E1", "B-E2"],
      publicBriefFocusEventIds: [],
      weeklyReportFocusEventIds: ["B-E1", "B-E2", "B-E3"],
    },
  },

  // ---------------------------------------------------------------------------
  // PROJECT C — Native-only (data entered inside ICelerate)
  // ---------------------------------------------------------------------------
  {
    id: "p-ventura-wtp-2026",
    name: "Water Treatment Plant Upgrade — Chlorination & SCADA",
    owner: "City Utilities",
    contractValue: 3300000,
    contingency: 260000,
    percentComplete: 25,
    startDate: "2026-02-10",
    endDateBaseline: "2026-06-19",
    endDateForecast: "2026-06-26",

    sourceProfile: {
      mode: "native",
      sources: [
        {
          kind: "project_system",
          label: "Native Project Data",
          status: "native",
          lastSyncAt: "2026-02-13T15:05:00-08:00",
          coverage: 100,
        },
        {
          kind: "documents",
          label: "Vendor Manuals & Specs",
          status: "uploaded",
          lastSyncAt: "2026-02-12T17:25:00-08:00",
          coverage: 75,
        },
      ],
    },

    phases: [
      { id: "c-ph1", name: "Submittals & Procurement", order: 1 },
      { id: "c-ph2", name: "Site Prep & Temporary Systems", order: 2 },
      { id: "c-ph3", name: "Chlorination Equipment Install", order: 3 },
      { id: "c-ph4", name: "SCADA & Controls Integration", order: 4 },
      { id: "c-ph5", name: "Commissioning", order: 5 },
      { id: "c-ph6", name: "Training & Closeout", order: 6 },
    ],

    tasks: [
      {
        id: "C-110",
        phaseId: "c-ph1",
        wbs: "1.10",
        name: "Submittal approvals (skid, pumps, valves)",
        baselineStart: "2026-02-10",
        baselineFinish: "2026-02-24",
        forecastStart: "2026-02-10",
        forecastFinish: "2026-02-27",
        percentComplete: 45,
        predecessors: [],
        criticalPath: true,
      },
      {
        id: "C-120",
        phaseId: "c-ph1",
        wbs: "1.20",
        name: "Procure long-lead chlorination skid",
        baselineStart: "2026-02-24",
        baselineFinish: "2026-04-03",
        forecastStart: "2026-02-27",
        forecastFinish: "2026-04-10",
        percentComplete: 10,
        predecessors: ["C-110"],
        criticalPath: true,
      },
      {
        id: "C-210",
        phaseId: "c-ph3",
        wbs: "3.10",
        name: "Install skid + piping tie-in",
        baselineStart: "2026-04-04",
        baselineFinish: "2026-04-22",
        forecastStart: "2026-04-11",
        forecastFinish: "2026-04-29",
        percentComplete: 0,
        predecessors: ["C-120"],
        criticalPath: true,
      },
      {
        id: "C-310",
        phaseId: "c-ph4",
        wbs: "4.10",
        name: "SCADA integration + testing",
        baselineStart: "2026-04-23",
        baselineFinish: "2026-05-08",
        forecastStart: "2026-04-30",
        forecastFinish: "2026-05-15",
        percentComplete: 0,
        predecessors: ["C-210"],
        criticalPath: true,
      },
      {
        id: "C-410",
        phaseId: "c-ph5",
        wbs: "5.10",
        name: "Commissioning",
        baselineStart: "2026-05-09",
        baselineFinish: "2026-06-05",
        forecastStart: "2026-05-16",
        forecastFinish: "2026-06-12",
        percentComplete: 0,
        predecessors: ["C-310"],
        criticalPath: true,
      },
    ],

    milestones: [
      { id: "C-M1", name: "Long Lead Equipment Received", dateBaseline: "2026-04-03", dateForecast: "2026-04-10", status: "at_risk" },
      { id: "C-M2", name: "Controls Integration Complete", dateBaseline: "2026-05-08", dateForecast: "2026-05-15", status: "upcoming" },
      { id: "C-M3", name: "Commissioning Complete", dateBaseline: "2026-06-05", dateForecast: "2026-06-12", status: "upcoming" },
    ],

    stakeholders: [
      { id: "C-S1", name: "Utilities PM Delgado", role: "Owner PM", org: "City Utilities", influence: "high", commPreference: "email" },
      { id: "C-S2", name: "Plant Ops Lead Nguyen", role: "Operations Lead", org: "City Utilities", influence: "high", commPreference: "meeting" },
      { id: "C-S3", name: "Controls Vendor Rep Ellis", role: "Vendor Rep", org: "Controls Vendor", influence: "medium", commPreference: "phone" },
      { id: "C-S4", name: "GC Superintendent Morgan", role: "Superintendent", org: "GC", influence: "medium", commPreference: "phone" },
    ],

    documents: [
      {
        id: "C-D1",
        title: "Spec Section — Controls & SCADA Requirements (Extract)",
        category: "Technical Specs",
        tags: ["scada", "controls", "integration", "testing"],
        clauses: [
          { ref: "§13.10", heading: "SCADA Integration", summary: "Defines protocol requirements, I/O mapping, testing, and acceptance criteria." },
          { ref: "§01.33", heading: "Submittals", summary: "Defines revision handling and resubmittal timelines." },
        ],
      },
      {
        id: "C-D2",
        title: "Vendor Manual — PLC Firmware Compatibility Notes",
        category: "Technical Specs",
        tags: ["plc", "firmware", "compatibility"],
        clauses: [{ ref: "VM-PLC", heading: "Firmware Compatibility", summary: "Lists supported firmware ranges and integration constraints." }],
      },
    ],

    events: [
      {
        id: "C-E1",
        title: "Submittal Revision Loop — Chlorination skid (2nd resubmittal)",
        severity: "high",
        status: "in_progress",
        alignmentStatus: "drift",
        location: "Admin · Submittals",
        createdAt: "2026-02-11",
        updatedAt: "2026-02-13",
        summary: "Reviewer comments keep expanding scope; approvals slipping; procurement at risk.",
        costExposure: { amount: 0, notes: "Primary risk is schedule slip and extended general conditions.", confidence: "medium" },
        scheduleImpact: { days: 7, notes: "Shifts procurement start and downstream install.", criticalPath: true },
        taskIds: ["C-110", "C-120"],
        stakeholderIds: ["C-S1", "C-S2"],
        docRefs: [{ docId: "C-D1", clauseRefs: ["§01.33"] }],
        noticeRequired: false,
      },
      {
        id: "C-E2",
        title: "SCADA Integration Risk — PLC firmware mismatch suspected",
        severity: "high",
        status: "open",
        alignmentStatus: "drift",
        location: "Control Room · PLC",
        createdAt: "2026-02-13",
        updatedAt: "2026-02-13",
        summary: "Vendor notes indicate current PLC firmware may be out of supported range; needs verification before integration phase.",
        costExposure: { amount: 22000, notes: "Potential firmware update + revalidation testing.", confidence: "low" },
        scheduleImpact: { days: 4, notes: "Could compress testing window or push integration.", criticalPath: true },
        taskIds: ["C-310"],
        stakeholderIds: ["C-S2", "C-S3", "C-S4"],
        docRefs: [{ docId: "C-D2", clauseRefs: ["VM-PLC"] }, { docId: "C-D1", clauseRefs: ["§13.10"] }],
        noticeRequired: false,
      },
    ],

    exportHints: {
      execDeckFocusEventIds: ["C-E1", "C-E2"],
      publicBriefFocusEventIds: [],
      weeklyReportFocusEventIds: ["C-E1"],
    },
  },

  // ---------------------------------------------------------------------------
  // PROJECT D — Mixed messy data (emails + partial schedule + docs)
  // ---------------------------------------------------------------------------
  {
    id: "p-scr-bridge-rehab-2026",
    name: "Santa Clara River Bridge Rehab — Deck & Bearings",
    owner: "County Public Works",
    contractValue: 5100000,
    contingency: 400000,
    percentComplete: 34,
    startDate: "2026-02-17",
    endDateBaseline: "2026-07-03",
    endDateForecast: "2026-07-24",

    sourceProfile: {
      mode: "mixed",
      sources: [
        {
          kind: "schedule_file",
          label: "Partial Schedule Import",
          status: "uploaded",
          lastSyncAt: "2026-02-13T14:05:00-08:00",
          coverage: 60,
        },
        {
          kind: "email",
          label: "Email Thread Sync",
          status: "connected",
          lastSyncAt: "2026-02-13T14:15:00-08:00",
          coverage: 78,
        },
        {
          kind: "documents",
          label: "Inspection Reports + Contract",
          status: "uploaded",
          lastSyncAt: "2026-02-12T16:55:00-08:00",
          coverage: 70,
        },
        {
          kind: "daily_logs",
          label: "Field Notes",
          status: "native",
          lastSyncAt: "2026-02-13T15:00:00-08:00",
          coverage: 55,
        },
      ],
    },

    phases: [
      { id: "d-ph1", name: "Traffic Control & Access", order: 1 },
      { id: "d-ph2", name: "Deck Removal & Prep", order: 2 },
      { id: "d-ph3", name: "Bearing Replacement", order: 3 },
      { id: "d-ph4", name: "Deck Pour & Cure", order: 4 },
      { id: "d-ph5", name: "Joints, Striping, Reopen", order: 5 },
      { id: "d-ph6", name: "Closeout", order: 6 },
    ],

    tasks: [
      {
        id: "D-110",
        phaseId: "d-ph1",
        wbs: "1.10",
        name: "Weekend closure #1 setup + detours",
        baselineStart: "2026-03-14",
        baselineFinish: "2026-03-15",
        forecastStart: "2026-03-14",
        forecastFinish: "2026-03-15",
        percentComplete: 0,
        predecessors: [],
        criticalPath: true,
      },
      {
        id: "D-120",
        phaseId: "d-ph2",
        wbs: "2.10",
        name: "Demo deck section 1",
        baselineStart: "2026-03-16",
        baselineFinish: "2026-03-26",
        forecastStart: "2026-03-18",
        forecastFinish: "2026-03-31",
        percentComplete: 0,
        predecessors: ["D-110"],
        criticalPath: true,
      },
      {
        id: "D-210",
        phaseId: "d-ph3",
        wbs: "3.10",
        name: "Bearing replacement (all supports)",
        baselineStart: "2026-03-27",
        baselineFinish: "2026-04-18",
        forecastStart: "2026-04-01",
        forecastFinish: "2026-04-28",
        percentComplete: 0,
        predecessors: ["D-120"],
        criticalPath: true,
      },
      {
        id: "D-310",
        phaseId: "d-ph4",
        wbs: "4.10",
        name: "Deck pour + cure",
        baselineStart: "2026-04-24",
        baselineFinish: "2026-05-02",
        forecastStart: "2026-05-05",
        forecastFinish: "2026-05-15",
        percentComplete: 0,
        predecessors: ["D-210"],
        criticalPath: true,
      },
    ],

    milestones: [
      { id: "D-M1", name: "Bearing Replacement Complete", dateBaseline: "2026-04-18", dateForecast: "2026-04-28", status: "upcoming" },
      { id: "D-M2", name: "Deck Pour Complete", dateBaseline: "2026-05-02", dateForecast: "2026-05-15", status: "upcoming" },
      { id: "D-M3", name: "Reopen Fully", dateBaseline: "2026-06-06", dateForecast: "2026-06-20", status: "upcoming" },
    ],

    stakeholders: [
      { id: "D-S1", name: "County PM Howard", role: "Owner PM", org: "County PW", influence: "high", commPreference: "memo" },
      { id: "D-S2", name: "Bridge Inspector Patel", role: "Inspector", org: "County PW", influence: "high", commPreference: "email" },
      { id: "D-S3", name: "Public Affairs Ruiz", role: "Public Affairs", org: "County", influence: "medium", commPreference: "email" },
      { id: "D-S4", name: "GC PM Sato", role: "GC Project Manager", org: "GC", influence: "high", commPreference: "meeting" },
    ],

    documents: [
      {
        id: "D-D1",
        title: "Bridge Rehab Specs — Inspection Holds & Acceptance",
        category: "Technical Specs",
        tags: ["inspection", "acceptance", "hold-points"],
        clauses: [
          { ref: "§05.40", heading: "Hold Points", summary: "Requires inspector sign-off before proceeding past defined stages." },
          { ref: "§01.77", heading: "Nonconformance", summary: "Defines corrective action workflow and documentation requirements." },
        ],
      },
      {
        id: "D-D2",
        title: "Email Thread — Inspector Direction vs Field Plan (Extract)",
        category: "Emails",
        tags: ["direction", "conflict", "inspection"],
        clauses: [{ ref: "EMAIL-INS", heading: "Inspector Direction", summary: "Email directives and clarifications (may conflict with plan/spec interpretations)." }],
      },
      {
        id: "D-D3",
        title: "Community Complaint Emails (Extract)",
        category: "Emails",
        tags: ["public", "complaints", "closures"],
        clauses: [{ ref: "EMAIL-PUB", heading: "Public Concerns", summary: "Community impacts, closure windows, and escalation risk." }],
      },
    ],

    events: [
      {
        id: "D-E1",
        title: "Inspection Hold Conflict — proceed direction contradicts spec hold point",
        severity: "critical",
        status: "open",
        alignmentStatus: "high_risk",
        location: "Bridge Span 2 · Bearing seats",
        createdAt: "2026-02-12",
        updatedAt: "2026-02-13",
        summary: "Inspector email suggests proceeding past a defined hold point; spec requires sign-off. Needs formal clarification to avoid rework/stop-work.",
        costExposure: { amount: 38000, notes: "Potential tear-out if work proceeds without acceptance; standby risk.", confidence: "medium" },
        scheduleImpact: { days: 6, notes: "Could slip bearing replacement start if hold not cleared.", criticalPath: true },
        taskIds: ["D-120", "D-210"],
        stakeholderIds: ["D-S1", "D-S2", "D-S4"],
        docRefs: [
          { docId: "D-D1", clauseRefs: ["§05.40", "§01.77"] },
          { docId: "D-D2", clauseRefs: ["EMAIL-INS"] },
        ],
        noticeRequired: false,
      },
      {
        id: "D-E2",
        title: "Public Escalation Risk — weekend closure messaging gaps",
        severity: "medium",
        status: "open",
        alignmentStatus: "drift",
        location: "Weekend Closure #1 · Detour Routes",
        createdAt: "2026-02-13",
        updatedAt: "2026-02-13",
        summary: "Community email volume increasing; public affairs not aligned on detour details; risk of last-minute political pressure.",
        costExposure: { amount: 0, notes: "Reputational/political risk; may force schedule constraints.", confidence: "medium" },
        scheduleImpact: { days: 0, notes: "Indirect—risk of closure window restriction.", criticalPath: false },
        taskIds: ["D-110"],
        stakeholderIds: ["D-S3", "D-S1", "D-S4"],
        docRefs: [{ docId: "D-D3", clauseRefs: ["EMAIL-PUB"] }],
        noticeRequired: false,
      },
      {
        id: "D-E3",
        title: "Partial schedule coverage — critical path assumptions uncertain",
        severity: "high",
        status: "in_progress",
        alignmentStatus: "drift",
        location: "Project-wide",
        createdAt: "2026-02-13",
        updatedAt: "2026-02-13",
        summary: "Only partial schedule imported; dependencies missing for downstream striping/reopen tasks; forecast confidence reduced.",
        costExposure: { amount: 0, notes: "Primary risk is planning blind spots; needs schedule completion.", confidence: "high" },
        scheduleImpact: { days: 3, notes: "Forecast likely optimistic due to missing tasks.", criticalPath: false },
        taskIds: ["D-210", "D-310"],
        stakeholderIds: ["D-S1", "D-S4"],
        docRefs: [],
        noticeRequired: false,
      },
    ],

    exportHints: {
      execDeckFocusEventIds: ["D-E1", "D-E3"],
      publicBriefFocusEventIds: ["D-E2"],
      weeklyReportFocusEventIds: ["D-E1", "D-E2", "D-E3"],
    },
  },
];

// Convenience maps
export const DEMO_PROJECT_BY_ID: Record<string, DemoProject> = Object.fromEntries(
  DEMO_PROJECTS_V5.map((p) => [p.id, p]),
);
