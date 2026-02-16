import type { CaseRecord, LessonRecord } from "@/lib/memory/types";

const NOW_ISO = new Date().toISOString();

/**
 * Pre-built cases & lessons injected when the user clicks "Import demo cases"
 * on the Knowledge Library page. DIFFERENT from the 2 seed cases
 * (Riverside notice + Highway 87 utility) already in memory-seed.ts.
 */

export const IMPORTABLE_CASES: CaseRecord[] = [
  {
    id: "case-import-compaction",
    sourceEventId: "hwy87-e-compaction-001",
    sourceProjectId: "highway-87-widening",
    projectName: "Highway 87 Widening",
    issueType: "quality",
    title: "Compaction failure from oversized lifts — 6 day rework",
    summary:
      "Contractor placed 18-inch lifts instead of 12-inch maximum per specification §301.2. Failed nuclear density tests on two consecutive days. Required removal and replacement of 240 LF of trench backfill. Inspector did not catch oversized lifts on first pass.",
    actionsPerformed: [
      "Nuclear density tests failed at 84% vs 95% required",
      "Inspector issued NCR with photographic documentation",
      "Contractor mobilized additional compaction equipment",
      "Re-excavated and replaced in 12-inch lifts with passing tests",
    ],
    outcome:
      "Full rework at contractor cost. $18K in delay costs borne by contractor. Added hold point for lift thickness verification to ITP.",
    clausesInvoked: ["§301.2", "§301.5", "§8.2.4"],
    costFinal: 18000,
    scheduleDaysFinal: 6,
    resolutionDays: 10,
    tags: ["compaction", "quality", "backfill", "rework", "trench"],
    closedAt: "2025-05-20T00:00:00Z",
    createdAt: NOW_ISO,
  },
  {
    id: "case-import-dewatering",
    sourceEventId: "scr-e-dewatering-001",
    sourceProjectId: "scr-bridge-rehab",
    projectName: "Santa Clara River Bridge Rehab",
    issueType: "environmental",
    title: "Dewatering plan inadequate — permit violation near-miss",
    summary:
      "Excavation for abutment footing intercepted perched groundwater at 8 feet. Existing dewatering plan assumed 14-foot depth to water table. Discharge into storm drain detected before SWPPP inspector intervened. Near-miss on NPDES violation.",
    actionsPerformed: [
      "Halted dewatering discharge within 2 hours",
      "Emergency turbidity testing — results below permit threshold",
      "Revised dewatering plan with settling tank and filter bag",
      "Filed updated NOI amendment with regional water board",
    ],
    outcome:
      "No violation issued. $8K for emergency dewatering equipment rental. 3-day delay while revised plan approved. SWPPP updated for remainder of project.",
    clausesInvoked: ["§5.1.3", "NPDES CGP", "SWPPP §3.2"],
    costFinal: 8000,
    scheduleDaysFinal: 3,
    resolutionDays: 5,
    tags: ["dewatering", "environmental", "permit", "groundwater", "SWPPP"],
    closedAt: "2025-08-10T00:00:00Z",
    createdAt: NOW_ISO,
  },
  {
    id: "case-import-fiber",
    sourceEventId: "ventura-e-fiber-001",
    sourceProjectId: "ventura-wtp",
    projectName: "Water Treatment Plant Upgrade",
    issueType: "utility",
    title: "Unmarked fiber optic line — emergency response and repair",
    summary:
      "Backhoe severed an unmarked AT&T fiber optic trunk line during excavation for process piping at the WTP site. No record in USA ticket response. Emergency repair crew dispatched within 4 hours. Temporary service restored in 12 hours, permanent splice completed in 48 hours.",
    actionsPerformed: [
      "Stopped all excavation in affected area immediately",
      "Notified AT&T emergency line and filed damage report",
      "Contractor documented pre-excavation potholing records",
      "AT&T confirmed line was not on USA response records",
      "Filed third-party damage claim for excavation delay costs",
    ],
    outcome:
      "AT&T accepted responsibility for unmapped line. $22K in delay and standby costs recovered through third-party claim. Added mandatory potholing protocol for all future crossings.",
    clausesInvoked: ["§7.3.1", "Gov Code §4216", "§12.4"],
    costFinal: 22000,
    scheduleDaysFinal: 4,
    resolutionDays: 14,
    tags: ["utility", "fiber-optic", "emergency", "USA-ticket", "third-party-claim"],
    closedAt: "2025-10-05T00:00:00Z",
    createdAt: NOW_ISO,
  },
];

export const IMPORTABLE_LESSONS: LessonRecord[] = [
  {
    id: "lesson-import-holdpoints",
    title: "Document hold point sign-offs with timestamped photos",
    pattern:
      "On quality-sensitive operations (compaction, concrete placement, welding), requiring timestamped photo documentation at each hold point reduces rework by 60% and eliminates disputes over inspector presence.",
    detail:
      "Highway 87 compaction failure: oversized lifts went undetected because inspector signed off without photographic evidence. After implementing photo hold points, zero compaction failures in remaining 1,200 LF of trench work.",
    caseIds: ["case-import-compaction"],
    issueTypes: ["quality", "compaction", "inspection", "rework"],
    confidence: 88,
    status: "approved",
    approvedAt: "2025-06-01T00:00:00Z",
    createdAt: "2025-05-25T00:00:00Z",
  },
  {
    id: "lesson-import-potholing",
    title: "Verify utility clearance with potholing before breaking ground",
    pattern:
      "On any excavation within 10 feet of a known or suspected utility, require vacuum potholing regardless of USA ticket response. The 30-minute potholing cost ($200-400) prevents $10K-50K emergency repair and delay events.",
    detail:
      "Water Treatment Plant: AT&T fiber was not on USA records. Post-incident potholing protocol caught 3 additional unmapped utilities before excavation reached them. Santa Clara River: similar near-miss with abandoned irrigation line avoided by potholing.",
    caseIds: ["case-import-fiber"],
    issueTypes: ["utility", "excavation", "prevention", "potholing"],
    confidence: 95,
    status: "approved",
    approvedAt: "2025-10-15T00:00:00Z",
    createdAt: "2025-10-10T00:00:00Z",
  },
];
