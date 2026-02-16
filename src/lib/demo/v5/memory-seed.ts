// src/lib/demo/v5/memory-seed.ts
// Pre-seeds the MemoryStore with demo data on first mount.
// Sources from daily logs, pending + accepted suggestions, snapshots, cases, and lessons.

import type { MemoryStore } from "@/lib/memory/store";
import type {
  SourceObject,
  Suggestion,
  ProjectSnapshot,
  EventSnapshot,
  CaseRecord,
  LessonRecord,
  EvidenceItem,
} from "@/lib/memory/types";
import { DEMO_CALIBRATION_RECORDS } from "./calibration-seed";

const NOW_ISO = new Date().toISOString();

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

function simpleHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

// ═══════════════════════════════════════════════════
// Project-scoped seed: Sources + Suggestions + Snapshots
// ═══════════════════════════════════════════════════

const PROJECT_A = "p-mesa-stormdrain-2026";

const SOURCES_A: SourceObject[] = [
  {
    id: "src-a-log-0210",
    projectId: PROJECT_A,
    kind: "log",
    title: "Daily Log — Feb 10, 2026",
    rawText:
      "STA 41+00–43+00. Potholing operations with vac truck. Encountered unmarked 12\" DIP water main at STA 42+50. Work halted pending field engineering review. Surveyor flagged conflict with proposed storm drain alignment.",
    metadata: { date: "2026-02-10", author: "Foreman Rivera", shift: "day" },
    hash: simpleHash("A-L01-potholing"),
    ingestedAt: "2026-02-10T18:00:00Z",
  },
  {
    id: "src-a-log-0212",
    projectId: PROJECT_A,
    kind: "log",
    title: "Daily Log — Feb 12, 2026",
    rawText:
      "STA 42+00–43+50. Submitted RFI-047 for 15-ft horizontal offset. Backhoe on standby pending design revision approval. CB-7 junction redesign under review by Torres. Standby costs accruing.",
    metadata: { date: "2026-02-12", author: "Foreman Rivera", shift: "day" },
    hash: simpleHash("A-L03-rfi-standby"),
    ingestedAt: "2026-02-12T18:00:00Z",
  },
  {
    id: "src-a-contract",
    projectId: PROJECT_A,
    kind: "document",
    title: "General Conditions — City of Mesa",
    rawText:
      "§4.3.1 Changed Conditions: Contractor must provide written notice within 48 hours of discovery. §7.3.1 Differing Site Conditions: If subsurface conditions differ materially from contract documents, Contractor shall notify Engineer in writing. §12.4 Delay Claims: Extensions of time require contemporaneous documentation.",
    metadata: { category: "General Conditions", pages: "34" },
    hash: simpleHash("mesa-gc-contract"),
    ingestedAt: "2026-02-08T12:00:00Z",
  },
  {
    id: "src-a-email-torres",
    projectId: PROJECT_A,
    kind: "email",
    title: "RE: CB-7 Junction Revision — Torres",
    rawText:
      "The revised alignment introduces a 2-ft grade change at the CB-7 junction. I recommend the Type II diffuser spec for the outfall. Estimated additional cost: $45,000. Need director approval for scope change.",
    metadata: { from: "Torres", to: "PM", date: "2026-02-12" },
    hash: simpleHash("torres-cb7-email"),
    ingestedAt: "2026-02-12T20:00:00Z",
  },
];

const SUGGESTIONS_A: Suggestion[] = [
  // 3 pending — demonstrate review flow
  {
    id: "sug-notice-A-E1",
    projectId: PROJECT_A,
    eventId: "A-E1",
    type: "notice_risk",
    headline: 'Notice deadline approaching — "Unmarked 12\" DIP Water Main"',
    detail:
      "The 48-hour contractual notice window for the differing site condition is approaching. §4.3.1 requires written notice within 48 hours of discovery. Filing now preserves entitlement to time extension and additional compensation.",
    confidence: 92,
    rationale:
      "Event A-E1 has noticeRequired=true. §4.3.1 specifies a 48-hour notice window from discovery date 2026-02-10.",
    citations: [
      {
        sourceId: "src-a-contract",
        chunkRef: "§4.3.1",
        excerpt: '§4.3.1 Changed Conditions: written notice within 48 hours of discovery.',
      },
      {
        sourceId: "src-a-log-0210",
        excerpt: "Daily log Feb 10 references unmarked utility discovery.",
      },
    ],
    impact: "high",
    suggestedChanges: {
      action: "Submit written notice per §4.3.1",
      deadline: "2026-02-12T18:00:00Z",
    },
    status: "pending",
    createdAt: "2026-02-12T08:00:00Z",
  },
  {
    id: "sug-cost-A-E1",
    projectId: PROJECT_A,
    eventId: "A-E1",
    type: "cost_revision",
    headline: "Standby costs may increase exposure for utility conflict",
    detail:
      "Backhoe and mini excavator on standby for 2 days. Estimated standby cost ~$4,800. Current event estimate is $45,000. Revised exposure may be ~$49,800.",
    confidence: 80,
    rationale:
      "Daily logs show 16 standby-hours of equipment tied to A-E1. At $150/hr this adds ~$4,800 not reflected in cost estimate.",
    citations: [
      {
        sourceId: "src-a-log-0212",
        excerpt: "Backhoe on standby pending design revision approval.",
      },
    ],
    impact: "medium",
    suggestedChanges: {
      costExposure: { amount: 49800, notes: "Includes standby costs of ~$4,800" },
    },
    status: "pending",
    createdAt: "2026-02-12T10:00:00Z",
  },
  {
    id: "sug-stakeholder-A-E3",
    projectId: PROJECT_A,
    eventId: "A-E3",
    type: "stakeholder_action",
    headline: "Critical event unbriefed: Director Chen",
    detail:
      '"Stakeholder Update Gap" is medium severity with high-influence stakeholders not yet briefed. Field logs indicate a communication gap that may delay decision-making.',
    confidence: 88,
    rationale:
      "Daily logs reference stakeholder briefing gaps. Director Chen has high influence and needs to be informed.",
    citations: [
      {
        sourceId: "src-a-log-0212",
        excerpt: "Director not yet distributed decision package for utility conflict.",
      },
    ],
    impact: "high",
    suggestedChanges: {
      action: "Schedule stakeholder briefing",
      stakeholders: ["Director Chen"],
    },
    status: "pending",
    createdAt: "2026-02-12T12:00:00Z",
  },
  // 2 pre-accepted — show accepted state
  {
    id: "sug-contract-A-E2",
    projectId: PROJECT_A,
    eventId: "A-E2",
    type: "contract_reference",
    headline: "Clause §7.3.1 referenced in logs but not on event",
    detail:
      'Field logs reference §7.3.1 (Differing Site Conditions) in relation to RFI-047 but this clause is not listed in the event\'s document references.',
    confidence: 85,
    rationale: "Log text references §7.3.1 which is valid but missing from event A-E2 docRefs.",
    citations: [
      {
        sourceId: "src-a-log-0210",
        chunkRef: "§7.3.1",
        excerpt: "Conditions differ from contract documents — §7.3.1 triggered.",
      },
    ],
    impact: "medium",
    suggestedChanges: { addDocRefs: [{ docId: "mesa-gc", clauseRef: "§7.3.1" }] },
    status: "accepted",
    reviewedAt: "2026-02-12T14:30:00Z",
    createdAt: "2026-02-11T09:00:00Z",
  },
  {
    id: "sug-schedule-A-E1",
    projectId: PROJECT_A,
    eventId: "A-E1",
    type: "schedule_revision",
    headline: "Schedule impact understated by 3 days",
    detail:
      'Event estimates 12-day impact but linked task "Storm Drain Main Install" shows 15-day forecast variance from baseline. Task is on critical path.',
    confidence: 90,
    rationale:
      "Task A-T3 baseline finish is 2026-04-10, forecast finish is 2026-04-25 (15-day variance). Event records only 12 days.",
    citations: [
      {
        sourceId: "A-E1",
        excerpt: "Event states 12-day impact. Task A-T3 shows 15-day forecast variance.",
      },
    ],
    impact: "high",
    suggestedChanges: { scheduleImpact: { days: 15, notes: "Revised based on task A-T3" } },
    status: "accepted",
    reviewedAt: "2026-02-12T15:00:00Z",
    createdAt: "2026-02-11T10:00:00Z",
  },
];

const PRIOR_SNAPSHOT_A: ProjectSnapshot = {
  id: "snap-proj-p-mesa-stormdrain-2026-v0",
  projectId: PROJECT_A,
  date: "2026-02-08",
  version: 0,
  totalExposure: 55500,
  totalScheduleDays: 14,
  criticalPathDays: 10,
  contingencyUsedPct: 18,
  activeNoticeClocks: 0,
  misalignedEvents: 0,
  openEvents: 2,
  resolvedEvents: 0,
  deltasFromPrior: [],
  createdAt: "2026-02-08T20:00:00Z",
};

const PROJECT_SNAPSHOT_A: ProjectSnapshot = {
  id: "snap-proj-p-mesa-stormdrain-2026-v1",
  projectId: PROJECT_A,
  date: "2026-02-12",
  version: 1,
  totalExposure: 67500,
  totalScheduleDays: 17,
  criticalPathDays: 12,
  contingencyUsedPct: 22,
  activeNoticeClocks: 1,
  misalignedEvents: 1,
  openEvents: 3,
  resolvedEvents: 0,
  deltasFromPrior: [
    { field: "totalExposure", prior: 55500, current: 67500, direction: "up" },
    { field: "totalScheduleDays", prior: 14, current: 17, direction: "up" },
    { field: "activeNoticeClocks", prior: 0, current: 1, direction: "up" },
  ],
  createdAt: "2026-02-12T20:00:00Z",
};

const EVENT_SNAPSHOTS_A: EventSnapshot[] = [
  {
    id: "snap-evt-A-E1-v3",
    eventId: "A-E1",
    projectId: PROJECT_A,
    date: "2026-02-12",
    version: 3,
    status: "open",
    severity: "critical",
    costExposure: 45000,
    costConfidence: "medium",
    scheduleDays: 12,
    criticalPath: true,
    noticeDeadline: "2026-02-12T18:00:00Z",
    alignmentStatus: "drift",
    evidenceCount: 8,
    entitlementStrength: 65,
    createdAt: "2026-02-12T20:00:00Z",
  },
  {
    id: "snap-evt-A-E2-v2",
    eventId: "A-E2",
    projectId: PROJECT_A,
    date: "2026-02-12",
    version: 2,
    status: "open",
    severity: "high",
    costExposure: 12500,
    costConfidence: "low",
    scheduleDays: 5,
    criticalPath: false,
    alignmentStatus: "drift",
    evidenceCount: 5,
    entitlementStrength: 50,
    createdAt: "2026-02-12T20:00:00Z",
  },
];

// ═══════════════════════════════════════════════════
// Evidence Items (Governed Risk System)
// ═══════════════════════════════════════════════════

const EVIDENCE_A: EvidenceItem[] = [
  {
    id: "evi-gmail-torres-cb7",
    projectId: PROJECT_A,
    sourceType: "gmail",
    sourceLabel: "RE: CB-7 Junction Revision — Torres",
    rawContentPreview:
      "The revised alignment introduces a 2-ft grade change at the CB-7 junction. I recommend the Type II diffuser spec for the outfall. Estimated additional cost: $45,000. Need director approval for scope change.",
    extractedSignals: {
      noticeRisk: true,
      costDelta: 45000,
      scheduleDelta: 12,
      clauseRefs: ["§4.3.1", "§7.3.1"],
      confidenceScore: 88,
    },
    linkedRiskItemId: "A-E1",
    status: "approved",
    reviewedAt: "2026-02-12T15:00:00Z",
    createdAt: "2026-02-12T12:00:00Z",
    attachmentUrl: "/demo/field-report-sta-42-50.pdf",
    attachmentName: "CB-7-Revision-Memo.pdf",
    attachmentType: "application/pdf",
  },
  {
    id: "evi-procore-log-0212",
    projectId: PROJECT_A,
    sourceType: "procore",
    sourceLabel: "Daily Log — Feb 12 (Procore)",
    rawContentPreview:
      "STA 42+00–43+50. Submitted RFI-047 for 15-ft horizontal offset. Backhoe on standby pending design revision approval. CB-7 junction redesign under review. Standby costs accruing at $150/hr.",
    extractedSignals: {
      costDelta: 4800,
      scheduleDelta: 2,
      confidenceScore: 82,
    },
    linkedRiskItemId: "A-E1",
    status: "approved",
    reviewedAt: "2026-02-12T19:00:00Z",
    createdAt: "2026-02-12T18:00:00Z",
  },
  {
    id: "evi-upload-schedule-rev",
    projectId: PROJECT_A,
    sourceType: "upload",
    sourceLabel: "Schedule Update — Phase 2 Rev 3.xlsx",
    rawContentPreview:
      "Task A-T3 (Storm Drain Main Install) baseline finish 2026-04-10, forecast finish 2026-04-25. 15-day variance on critical path. Float consumed by utility conflict delay.",
    extractedSignals: {
      scheduleDelta: 15,
      confidenceScore: 95,
    },
    status: "pending",
    createdAt: "2026-02-13T09:00:00Z",
  },
  {
    id: "evi-field-photo-sta42",
    projectId: PROJECT_A,
    sourceType: "field",
    sourceLabel: "Field Photo — Unmarked Utility STA 42+50",
    rawContentPreview:
      "Photo documentation of exposed 12\" DIP water main at STA 42+50 conflicting with proposed storm drain alignment. Flagged by survey crew. GPS: 33.4152, -111.8315.",
    extractedSignals: {
      noticeRisk: true,
      clauseRefs: ["§7.3.1"],
      confidenceScore: 90,
    },
    linkedRiskItemId: "A-E1",
    status: "approved",
    reviewedAt: "2026-02-10T16:00:00Z",
    createdAt: "2026-02-10T14:30:00Z",
    attachmentUrl: "/demo/field-report-sta-42-50.pdf",
    attachmentName: "DFR-2026-0211.pdf",
    attachmentType: "application/pdf",
  },
  {
    id: "evi-gmail-chen-budget",
    projectId: PROJECT_A,
    sourceType: "gmail",
    sourceLabel: "FW: Q1 Budget Review — Director Chen",
    rawContentPreview:
      "The contingency drawdown for Phase 2 utility conflicts is approaching the 10% threshold. Please prepare a cost forecast update for the March board meeting. Include all pending change orders.",
    extractedSignals: {
      costDelta: 0,
      confidenceScore: 72,
    },
    status: "pending",
    createdAt: "2026-02-14T08:00:00Z",
  },
  {
    id: "evi-procore-rfi047-response",
    projectId: PROJECT_A,
    sourceType: "procore",
    sourceLabel: "RFI-047 Response — Contractor (Procore)",
    rawContentPreview:
      "Response to RFI-047: Confirmed 15-ft horizontal offset is feasible. Contractor requests 8 additional working days for revised CB-7 junction pour. Material cost increase: $12,400 for extended formwork. Awaiting engineer sign-off on revised alignment per §4.3.1.",
    extractedSignals: {
      noticeRisk: false,
      costDelta: 12400,
      scheduleDelta: 8,
      clauseRefs: ["§4.3.1"],
      confidenceScore: 91,
    },
    status: "pending",
    createdAt: "2026-02-13T11:20:00Z",
  },
];

// ═══════════════════════════════════════════════════
// Project B: Highway 87 Widening
// ═══════════════════════════════════════════════════

const PROJECT_B = "p-hwy87-widening-2026";

const SOURCES_B: SourceObject[] = [
  {
    id: "src-b-schedule",
    projectId: PROJECT_B,
    kind: "document",
    title: "Schedule Upload — Segment A Rev 2.xlsx",
    rawText:
      "Task B-205 (Rough Grade & Compaction) — baseline finish 2026-03-01, forecast finish 2026-03-03. 60% complete. Task B-210 (Subgrade Proof Roll) — 0% complete, critical path. Task B-220 (Culvert Extension at Sta 151+00) — 10% complete, critical path, forecast 2026-03-31.",
    metadata: { category: "Schedule", format: "xlsx" },
    hash: simpleHash("B-schedule-rev2"),
    ingestedAt: "2026-02-13T13:30:00Z",
  },
  {
    id: "src-b-cost",
    projectId: PROJECT_B,
    kind: "document",
    title: "Cost Tracker — Feb 2026.xlsx",
    rawText:
      "Earthwork pay item B-205 budget: $380,000. Spent to date: $248,000 (65%). Remaining: $132,000. Burn rate 22% above baseline plan. Production shortfall trending for 4 consecutive days.",
    metadata: { category: "Cost Tracking", format: "xlsx" },
    hash: simpleHash("B-cost-feb2026"),
    ingestedAt: "2026-02-13T13:31:00Z",
  },
  {
    id: "src-b-log-0213",
    projectId: PROJECT_B,
    kind: "log",
    title: "Daily Log — Feb 13, 2026",
    rawText:
      "STA 124+00–127+50. Earthwork production at 1,200 CY vs. planned 1,800 CY. Equipment: CAT D6 dozer, CAT 330 excavator. 3 rain days in past week (Feb 10, 11, 12) not documented for time extension. Foreman Watson noted utility clearance at Sta 151+00 still pending.",
    metadata: { date: "2026-02-13", author: "Foreman Watson", shift: "day" },
    hash: simpleHash("B-L-0213-production"),
    ingestedAt: "2026-02-13T18:00:00Z",
  },
  {
    id: "src-b-contract",
    projectId: PROJECT_B,
    kind: "document",
    title: "DOT Spec Book — Weather Delays & Documentation",
    rawText:
      "§108.06 Time Extensions: Extensions of time will be granted for delays beyond the Contractor's control, provided the Contractor submits documented impacts, maintains daily records, and files timely submissions. §105.17 Notice of Delay: Contractor must notify Engineer in writing within 72 hours of the occurrence of any delay for which a claim for additional time or compensation will be made.",
    metadata: { category: "Technical Specs", pages: "12" },
    hash: simpleHash("B-dot-specs"),
    ingestedAt: "2026-02-12T19:05:00Z",
  },
];

const SUGGESTIONS_B: Suggestion[] = [
  {
    id: "sug-notice-B-E2",
    projectId: PROJECT_B,
    eventId: "B-E2",
    type: "notice_risk",
    headline: "Rain day documentation gap — entitlement at risk",
    detail:
      "3 rain days (Feb 10–12) are logged but no time extension requests have been filed. §105.17 requires 72-hour notice for delay claims. Without timely documentation, the contractor may lose entitlement to weather-related time extensions.",
    confidence: 91,
    rationale:
      "Daily logs confirm 3 rain days. §105.17 requires 72-hour notice. No matching notice found in event B-E2 record.",
    citations: [
      {
        sourceId: "src-b-contract",
        chunkRef: "§105.17",
        excerpt: "Contractor must notify Engineer in writing within 72 hours of the occurrence of any delay.",
      },
      {
        sourceId: "src-b-log-0213",
        excerpt: "3 rain days in past week (Feb 10, 11, 12) not documented for time extension.",
      },
    ],
    impact: "high",
    suggestedChanges: {
      action: "File weather delay notice per §105.17",
      deadline: "2026-02-15T17:00:00Z",
    },
    status: "pending",
    createdAt: "2026-02-13T20:00:00Z",
  },
  {
    id: "sug-cost-B-E1",
    projectId: PROJECT_B,
    eventId: "B-E1",
    type: "cost_revision",
    headline: "Earthwork burn rate 22% above plan — exposure understated",
    detail:
      "Cost tracker shows earthwork pay item B-205 at 65% spend with only 60% completion. At current burn rate, the final cost may exceed budget by $20,500. Current event estimate is $12,000.",
    confidence: 82,
    rationale:
      "Cost tracker shows $248K spent of $380K budget at 60% complete. Linear projection: $413K final vs. $380K budget = $33K overrun. Current event records only $12K.",
    citations: [
      {
        sourceId: "src-b-cost",
        excerpt: "Earthwork pay item B-205 burn rate 22% above baseline plan.",
      },
      {
        sourceId: "src-b-schedule",
        excerpt: "Task B-205 60% complete, forecast finish delayed 2 days.",
      },
    ],
    impact: "medium",
    suggestedChanges: {
      costExposure: { amount: 20500, notes: "Revised based on burn rate analysis" },
    },
    status: "pending",
    createdAt: "2026-02-13T21:00:00Z",
  },
  {
    id: "sug-schedule-B-E1",
    projectId: PROJECT_B,
    eventId: "B-E1",
    type: "schedule_revision",
    headline: "Production trend may extend earthwork phase by 5 days",
    detail:
      "4-day production trend at 67% of planned output. If the trend continues, earthwork completion will slip from March 3 to March 8, pushing subgrade proof roll (B-210, critical path) by 5 days.",
    confidence: 78,
    rationale:
      "Daily production averaging 1,200 CY vs. planned 1,800 CY over 4 consecutive days. Remaining quantity requires 8 days at current rate vs. 5 days at plan rate.",
    citations: [
      {
        sourceId: "src-b-log-0213",
        excerpt: "Earthwork production at 1,200 CY vs. planned 1,800 CY.",
      },
    ],
    impact: "medium",
    suggestedChanges: {
      scheduleImpact: { days: 5, notes: "Based on 4-day production trend at 67% efficiency" },
    },
    status: "pending",
    createdAt: "2026-02-14T08:00:00Z",
  },
];

const EVIDENCE_B: EvidenceItem[] = [
  {
    id: "evi-b-schedule-production",
    projectId: PROJECT_B,
    sourceType: "upload",
    sourceLabel: "Schedule Upload — Segment A Rev 2.xlsx",
    rawContentPreview:
      "Task B-205 rough grade output 30% below plan over 4-day trend. Baseline finish 2026-03-01, forecast finish 2026-03-03. Subgrade proof roll (B-210) on critical path — any slip propagates to drainage phase.",
    extractedSignals: {
      scheduleDelta: 3,
      costDelta: 12000,
      confidenceScore: 87,
    },
    linkedRiskItemId: "B-E1",
    status: "pending",
    createdAt: "2026-02-13T13:30:00Z",
  },
  {
    id: "evi-b-log-rain-docs",
    projectId: PROJECT_B,
    sourceType: "upload",
    sourceLabel: "Daily Logs Upload — Feb 10–13 (CSV)",
    rawContentPreview:
      "3 rain days logged in Feb (10th, 11th, 12th) without corresponding time extension requests. §105.17 requires 72-hour written notice for delay claims. Gap exceeds notice window for Feb 10 rain day. Entitlement for 3 weather days may be forfeited.",
    extractedSignals: {
      noticeRisk: true,
      clauseRefs: ["§108.06", "§105.17"],
      confidenceScore: 91,
    },
    linkedRiskItemId: "B-E2",
    status: "pending",
    createdAt: "2026-02-13T13:32:00Z",
  },
  {
    id: "evi-b-cost-earthwork",
    projectId: PROJECT_B,
    sourceType: "upload",
    sourceLabel: "Cost Tracker Upload — Feb 2026.xlsx",
    rawContentPreview:
      "Earthwork pay item B-205 burn rate 22% above baseline. $248K spent of $380K budget at 60% completion. Projected overrun: $33K if trend continues. Equipment standby hours not separately tracked.",
    extractedSignals: {
      costDelta: 8500,
      confidenceScore: 78,
    },
    linkedRiskItemId: "B-E1",
    status: "pending",
    createdAt: "2026-02-13T13:31:00Z",
  },
  {
    id: "evi-b-contract-notice",
    projectId: PROJECT_B,
    sourceType: "upload",
    sourceLabel: "DOT Spec Book — §105.17 & §108.06",
    rawContentPreview:
      "§105.17 requires 72-hour written notice for delay claims. Current rain day gap (Feb 10) exceeds the notice window. §108.06 requires documented impacts and daily records for time extension consideration. 3 rain days without filed notices.",
    extractedSignals: {
      noticeRisk: true,
      scheduleDelta: 5,
      clauseRefs: ["§105.17"],
      confidenceScore: 85,
    },
    linkedRiskItemId: "B-E2",
    status: "pending",
    createdAt: "2026-02-13T14:00:00Z",
  },
];

const PROJECT_SNAPSHOT_B: ProjectSnapshot = {
  id: "snap-proj-p-hwy87-widening-2026-v0",
  projectId: PROJECT_B,
  date: "2026-02-13",
  version: 0,
  totalExposure: 17000,
  totalScheduleDays: 5,
  criticalPathDays: 5,
  contingencyUsedPct: 3,
  activeNoticeClocks: 1,
  misalignedEvents: 1,
  openEvents: 3,
  resolvedEvents: 0,
  deltasFromPrior: [],
  createdAt: "2026-02-13T20:00:00Z",
};

// ═══════════════════════════════════════════════════
// Global seed: Cases + Lessons (from prior projects)
// ═══════════════════════════════════════════════════

const SEED_CASES: CaseRecord[] = [
  {
    id: "case-riverside-notice",
    sourceEventId: "riverside-e-notice-001",
    sourceProjectId: "riverside-flood-control",
    projectName: "Riverside Flood Control",
    issueType: "notice",
    title: "Missed 48-hour notice on differing site condition",
    summary:
      "Subsurface rock encountered at Station 18+00 during trench excavation. Crew continued work for 3 days before notice was filed. Owner disputed $28K change order due to late notice under §4.3.1.",
    actionsPerformed: [
      "Field observation logged day-of, but notice not submitted",
      "PM discovered gap 3 days after discovery",
      "Late notice filed with supporting documentation",
      "Owner partially disputed — $28K in costs unrecoverable",
    ],
    outcome:
      "Partially resolved. $28K of $56K change order denied due to late notice. Remaining $28K approved with supporting logs.",
    clausesInvoked: ["§4.3.1", "§7.3.1", "§12.4"],
    costFinal: 28000,
    scheduleDaysFinal: 8,
    resolutionDays: 22,
    tags: ["notice", "differing-site", "utility", "claim", "subsurface"],
    closedAt: "2025-02-15T00:00:00Z",
    createdAt: NOW_ISO,
  },
  {
    id: "case-hwy87-utility",
    sourceEventId: "hwy87-e-utility-001",
    sourceProjectId: "highway-87-widening",
    projectName: "Highway 87 Widening",
    issueType: "utility",
    title: "Unmarked utility resolved with offset + protective sleeve",
    summary:
      "Unmarked 8-inch gas line encountered during median grading. Contractor proposed 10-foot horizontal offset with protective sleeve. Design revision approved in 4 days with collaborative stakeholder approach.",
    actionsPerformed: [
      "Field observation and immediate work halt",
      "Notice filed within 24 hours under §4.3.1",
      "RFI submitted for design revision",
      "Stakeholder briefing within 48 hours (owner, utility company, designer)",
      "Design revision approved with 10-ft offset + protective sleeve",
      "Encroachment permit from utility company took 23 business days — delayed work start by 30 calendar days",
      "Work resumed with revised alignment",
    ],
    outcome:
      "Resolved. $32K change order approved. 8-day schedule impact absorbed within float. Notice filed on time preserved full entitlement.",
    clausesInvoked: ["§4.3.1", "§7.3.1", "§105.17"],
    costFinal: 32000,
    scheduleDaysFinal: 8,
    resolutionDays: 8,
    tags: ["utility", "differing-site", "design-revision", "offset", "subsurface"],
    closedAt: "2025-09-20T00:00:00Z",
    createdAt: NOW_ISO,
  },
];

const SEED_LESSONS: LessonRecord[] = [
  {
    id: "lesson-notice-timing",
    title: "File notice within 24 hours, not 48",
    pattern:
      "On projects with differing site condition clauses (§4.3.1, §7.3.1), filing written notice within 24 hours instead of waiting until the contractual 48-hour deadline preserves stronger entitlement and demonstrates good faith.",
    detail:
      "Riverside Flood Control: missed 48-hour window cost $28K. Highway 87: notice filed within 24 hours preserved full $32K entitlement. The extra margin accounts for weekend/holiday gaps and ensures documentation is contemporaneous.",
    caseIds: ["case-riverside-notice", "case-hwy87-utility"],
    issueTypes: ["notice", "differing-site", "utility", "claim"],
    confidence: 92,
    status: "approved",
    approvedAt: "2025-12-01T00:00:00Z",
    createdAt: "2025-11-15T00:00:00Z",
  },
  {
    id: "lesson-stakeholder-early",
    title: "Brief stakeholders within 48 hours of critical events",
    pattern:
      "On high-severity events ($25K+ exposure or critical path impact), briefing all high-influence stakeholders within 48 hours reduces resolution time by 40% and prevents adversarial escalation.",
    detail:
      "Highway 87: early stakeholder briefing (owner + utility + designer within 48 hours) enabled collaborative resolution in 8 days. Riverside: delayed stakeholder communication led to adversarial posture and 22-day resolution. Pattern holds across both utility conflicts and notice situations.",
    caseIds: ["case-riverside-notice", "case-hwy87-utility"],
    issueTypes: ["stakeholder", "utility", "notice", "differing-site"],
    confidence: 85,
    status: "approved",
    approvedAt: "2025-12-01T00:00:00Z",
    createdAt: "2025-11-15T00:00:00Z",
  },
  {
    id: "lesson-encroachment-permits",
    title: "Request utility encroachment permits immediately — 15-30 day lead time",
    pattern:
      "When construction work falls within proximity of existing utilities, the utility owner's encroachment permit process takes 15-30 business days. Requesting the permit only after field discovery adds 30+ calendar days to the schedule. File permit applications as soon as utility conflicts are identified, even before design revisions are finalized.",
    detail:
      "Highway 87: Gas company encroachment permit took 23 business days. Work zone was idle for 30 calendar days waiting for permit clearance. On Riverside, no encroachment was needed (city-owned utilities). Current project has a water utility-owned main — permit requirements likely apply.",
    caseIds: ["case-hwy87-utility"],
    issueTypes: ["utility", "differing-site", "schedule", "permit"],
    confidence: 88,
    status: "approved",
    approvedAt: "2025-12-01T00:00:00Z",
    createdAt: "2025-11-15T00:00:00Z",
  },
];

// ═══════════════════════════════════════════════════
// Public seeding functions
// ═══════════════════════════════════════════════════

/**
 * Seed project-scoped memory (sources, suggestions, snapshots, evidence) for a single project.
 * Seeds each entity type independently so new entity types get seeded even if
 * sources were already seeded from a prior session.
 */
export function seedMemoryStore(store: MemoryStore, projectId: string): void {
  const hasSources = store.getSources(projectId).length > 0;
  const hasEvidence = store.getEvidence(projectId).length > 0;

  if (projectId === PROJECT_A) {
    if (!hasSources) {
      for (const source of SOURCES_A) store.addSource(source);
      for (const suggestion of SUGGESTIONS_A) store.addSuggestion(suggestion);
      store.addProjectSnapshot(PRIOR_SNAPSHOT_A);
      store.addProjectSnapshot(PROJECT_SNAPSHOT_A);
      for (const snap of EVENT_SNAPSHOTS_A) store.addEventSnapshot(snap);
    }
    if (!hasEvidence) {
      for (const evidence of EVIDENCE_A) store.addEvidence(evidence);
    }
    if (!store.hasCalibrations(projectId)) {
      for (const record of DEMO_CALIBRATION_RECORDS) store.addCalibration(record);
    }
  } else if (projectId === PROJECT_B) {
    if (!hasSources) {
      for (const source of SOURCES_B) store.addSource(source);
      for (const suggestion of SUGGESTIONS_B) store.addSuggestion(suggestion);
      store.addProjectSnapshot(PROJECT_SNAPSHOT_B);
    }
    if (!hasEvidence) {
      for (const evidence of EVIDENCE_B) store.addEvidence(evidence);
    }
  }
}

/**
 * Seed global long-term memory (cases + lessons).
 * Only seeds if the store has no cases yet.
 */
export function seedGlobalMemory(store: MemoryStore): void {
  if (store.isGlobalSeeded()) return;

  for (const caseRecord of SEED_CASES) {
    store.addCase(caseRecord);
  }

  for (const lesson of SEED_LESSONS) {
    store.addLesson(lesson);
  }
}
