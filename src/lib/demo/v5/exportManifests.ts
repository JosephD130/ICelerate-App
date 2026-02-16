// src/lib/demo/v5/exportManifests.ts
// Export manifest seed data for Export Studio — slide/sheet/section outlines per project.
// Each manifest defines the narrative skeleton for deck, workbook, and report exports.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportManifest = {
  projectId: string;

  deckSlides: Array<{
    slideNumber: number;
    title: string;
    type:
      | "title"
      | "status"
      | "events"
      | "timeline"
      | "contract"
      | "recommendations"
      | "sources";
    bulletPoints: string[];
    dataRefs?: string[]; // event IDs, doc IDs, task IDs, etc.
  }>;

  workbookSheets: Array<{
    sheetName: string;
    description: string;
    columns: string[];
  }>;

  reportSections: Array<{
    heading: string;
    type:
      | "header"
      | "summary"
      | "events"
      | "alignment"
      | "stakeholders"
      | "citations"
      | "sources";
    narrative: string;
  }>;
};

// ---------------------------------------------------------------------------
// Project A — Mesa Storm Drain
// ---------------------------------------------------------------------------

const mesaStormDrain: ExportManifest = {
  projectId: "p-mesa-stormdrain-2026",

  deckSlides: [
    {
      slideNumber: 1,
      title: "Phase 2 Storm Drain & Utility Relocation — Weekly Status",
      type: "title",
      bulletPoints: [
        "City of Mesa Public Works",
        "Contract Value: $4.2M | Contingency Remaining: $312K (7.4%)",
        "Report Period: Week of Feb 10, 2026",
        "Overall Completion: 68%",
      ],
    },
    {
      slideNumber: 2,
      title: "Project Status & Milestones",
      type: "status",
      bulletPoints: [
        "Utility Locate & Potholing phase active — potholing at STA 41+00 to 43+00 is 40% complete",
        "Utility Relocation Complete milestone forecast slipped from Apr 10 to Apr 24 (AT RISK)",
        "Storm Drain Complete milestone forecast slipped from May 22 to Jun 5 (AT RISK)",
        "Substantial Completion forecast: Jul 8 vs baseline Jun 26 — 12 calendar day variance",
        "Critical path runs through water main relocation (A-130) into storm drain excavation (A-140)",
      ],
      dataRefs: ["A-M1", "A-M2", "A-M3", "A-130", "A-140"],
    },
    {
      slideNumber: 3,
      title: "Top Events Requiring Attention",
      type: "events",
      bulletPoints: [
        'CRITICAL: Unmarked 12" DIP water main at STA 42+50 — excavation halted, standby costs accruing, $45K exposure, 12-day critical path impact',
        "HIGH: RFI-047 horizontal offset conflict at STA 41+80 to 42+20 — awaiting engineer response, $18.5K exposure, 4-day local delay",
        "MEDIUM: Stakeholder update gap — Dir. Chen and CFO Rawlings not briefed on utility halt; office narrative shows partial progress while field is fully stopped",
      ],
      dataRefs: ["A-E1", "A-E2", "A-E3"],
    },
    {
      slideNumber: 4,
      title: "Schedule & Timeline Impact",
      type: "timeline",
      bulletPoints: [
        "Water main relocation (A-130) blocked — cannot start until unmarked line resolved; baseline was Feb 19, now forecast Feb 24 at earliest",
        "Pressure test & tie-ins (A-132) pushed from Mar 7 to Mar 19 due to cascade",
        "Storm drain excavation (A-140) pushed from Mar 13 to Mar 25 — 12 working days of cascade delay",
        "Float consumed on critical path — no remaining buffer for additional disruptions in Phase 3 or Phase 4",
        "RFI-047 offset response needed within 5 business days to hold current forecast",
      ],
      dataRefs: ["A-130", "A-132", "A-140", "A-E1", "A-E2"],
    },
    {
      slideNumber: 5,
      title: "Contract Position & Notice Status",
      type: "contract",
      bulletPoints: [
        "Differing Site Conditions (GC \u00a77.3.1): Notice clock active — 48-hour written notice required; deadline Feb 14 at 11:59 PM",
        "Water Main Conflicts (SP \u00a712.4): 24-hour notification triggered; coordination with utility owner in progress",
        "Notice Requirements (GC \u00a77.3.2): Written notice preserves time and cost entitlement — must be filed before deadline to protect claim position",
        "Time Extensions (GC \u00a78.3.1): Schedule impact substantiation will be required for any time extension request",
        "Combined cost exposure across all risk items: $69,500 with $45K at medium confidence",
      ],
      dataRefs: ["A-D1", "A-D2", "A-E1"],
    },
    {
      slideNumber: 6,
      title: "Recommendations & Next Steps",
      type: "recommendations",
      bulletPoints: [
        "IMMEDIATE: File written notice under \u00a77.3.2 before Feb 14 deadline to preserve entitlement",
        "THIS WEEK: Brief Dir. Chen and CFO Rawlings on utility halt and cost exposure — close the narrative gap before it becomes political",
        "THIS WEEK: Expedite Eng. Martinez response on RFI-047 offset — every day without response adds to critical path risk",
        "ONGOING: Document all standby costs and remobilization impacts for potential change order substantiation",
        "PLANNING: Evaluate whether fiber duct bank relocation (A-131) can proceed independently to recover any parallel work",
      ],
      dataRefs: ["A-E1", "A-E2", "A-E3", "A-S1", "A-S2", "A-S3"],
    },
    {
      slideNumber: 7,
      title: "Sources & Citations",
      type: "sources",
      bulletPoints: [
        "General Conditions — Differing Site Conditions & Notice (A-D1): \u00a77.3.1, \u00a77.3.2, \u00a78.3.1",
        "Special Provisions — Utility Conflicts (A-D2): \u00a712.4, \u00a712.1",
        "Technical Specs — Trench Excavation & Pipe Installation (A-D3): \u00a7301.2, \u00a7301.4",
        "Baseline Schedule Summary (A-D4): Key milestones and sequencing constraints",
        "Field observations: STA 42+50 (Feb 12), STA 41+80 to 42+20 (Feb 10)",
      ],
      dataRefs: ["A-D1", "A-D2", "A-D3", "A-D4"],
    },
  ],

  workbookSheets: [
    {
      sheetName: "Events",
      description:
        "All active and recently resolved events with severity, status, alignment, and key metrics",
      columns: [
        "Event ID",
        "Title",
        "Severity",
        "Status",
        "Alignment",
        "Location",
        "Created",
        "Updated",
        "Cost Exposure ($)",
        "Schedule Impact (days)",
        "Critical Path",
        "Notice Required",
        "Notice Deadline",
      ],
    },
    {
      sheetName: "Cost Exposure",
      description:
        "Itemized cost exposure by event with confidence levels and contingency impact",
      columns: [
        "Event ID",
        "Title",
        "Exposure Amount ($)",
        "Confidence",
        "Notes",
        "Contingency Impact (%)",
        "Cumulative Exposure ($)",
        "Remaining Contingency ($)",
      ],
    },
    {
      sheetName: "Schedule Impact",
      description:
        "Task-level schedule variance with baseline vs forecast dates and critical path flags",
      columns: [
        "Task ID",
        "WBS",
        "Task Name",
        "Baseline Start",
        "Baseline Finish",
        "Forecast Start",
        "Forecast Finish",
        "Variance (days)",
        "% Complete",
        "Critical Path",
        "Linked Events",
      ],
    },
    {
      sheetName: "Notice Tracker",
      description:
        "Contract notice requirements, deadlines, and filing status for all active events",
      columns: [
        "Event ID",
        "Title",
        "Clause Reference",
        "Notice Window (hrs)",
        "Deadline",
        "Filed",
        "Filed Date",
        "Entitlement at Risk",
      ],
    },
    {
      sheetName: "Risk Matrix",
      description:
        "Risk register combining probability, impact, and mitigation status for each event",
      columns: [
        "Event ID",
        "Title",
        "Probability",
        "Cost Impact ($)",
        "Schedule Impact (days)",
        "Risk Score",
        "Mitigation Status",
        "Owner",
        "Next Action",
      ],
    },
    {
      sheetName: "Stakeholder Log",
      description:
        "Stakeholder notification status and communication gaps",
      columns: [
        "Stakeholder",
        "Role",
        "Org",
        "Influence",
        "Linked Events",
        "Last Briefed",
        "Briefing Gap (days)",
        "Comm Preference",
      ],
    },
  ],

  reportSections: [
    {
      heading: "Phase 2 Storm Drain & Utility Relocation — Weekly Status Report",
      type: "header",
      narrative:
        "City of Mesa Public Works | Contract Value: $4,200,000 | Contingency: $312,000 (7.4%) | Overall Completion: 68% | Report Date: February 13, 2026",
    },
    {
      heading: "Executive Summary",
      type: "summary",
      narrative:
        "Phase 2 utility relocation work is stalled at STA 42+50 following the discovery of an unmarked 12-inch ductile iron water main that was not shown on the as-built drawings. This is a critical path item with $45,000 in estimated cost exposure and a 12-day schedule impact that cascades through the water main relocation, pressure testing, and storm drain excavation tasks. A concurrent RFI (RFI-047) is pending engineer response on a horizontal offset conflict at STA 41+80 to 42+20, adding $18,500 in exposure. The 48-hour notice clock under \u00a77.3.2 is active and must be filed by February 14. Of immediate concern is the communication gap with Dir. Chen and CFO Rawlings, who have not been briefed on the field halt despite the office narrative indicating partial progress. Total cost exposure across all active events is $69,500 against $312,000 in remaining contingency.",
    },
    {
      heading: "Open Risk Items & Field Conditions",
      type: "events",
      narrative:
        "Three events are currently active. The unmarked water main at STA 42+50 (A-E1, critical) was discovered on February 12 during excavation operations. The line runs perpendicular to the proposed storm drain alignment at approximately 4 feet below existing grade. Excavation has been halted and standby costs are accruing. The water main relocation task (A-130) and all downstream tasks are blocked. Separately, RFI-047 (A-E2, high) identifies a horizontal offset conflict at STA 41+80 to 42+20 where the as-built alignment does not match the plan documents. This RFI was drafted on February 10 and is awaiting engineer response. If the response is received within 5 business days, the 4-day local delay is manageable. The stakeholder update gap (A-E3, medium) reflects the fact that the Director and CFO have not been informed of the field halt, creating a risk of approval lag and escalation friction if the narrative disconnect persists.",
    },
    {
      heading: "Alignment Status — Field / Contract / Office",
      type: "alignment",
      narrative:
        "The project is in HIGH RISK misalignment. Field reality shows work fully stopped in Area B with standby crews, but the office forecast still reflects partial progress assumptions. The contract position requires immediate notice filing under \u00a77.3.1 (Differing Site Conditions) and \u00a712.4 (Water Main Conflicts), with the 48-hour window expiring on February 14. The office narrative has not been updated to reflect the halt, meaning executive stakeholders are operating on stale information. Until the notice is filed and stakeholders are briefed, the project is exposed on both the contractual and political fronts.",
    },
    {
      heading: "Stakeholder Status & Communication",
      type: "stakeholders",
      narrative:
        "Dir. Chen (Public Works Director) and CFO Rawlings (Finance Director) have NOT been briefed on the utility halt or cost exposure. Eng. Martinez (City Engineer) is aware of the RFI-047 issue and is expected to respond. Foreman Rivera (Field Foreman) is on-site and managing standby operations. Maria Torres (HOA President) has not been contacted, though community impact is minimal at this stage. The communication gap with the Director and CFO is the most urgent non-technical risk on the project and should be resolved before end of business today.",
    },
    {
      heading: "Data Sources & Document References",
      type: "sources",
      narrative:
        "This report references the following project documents: General Conditions \u00a77.3.1 (Differing Site Conditions), \u00a77.3.2 (Notice Requirements), \u00a78.3.1 (Time Extensions); Special Provisions \u00a712.4 (Water Main Conflicts), \u00a712.1 (Utility Relocation); Technical Specs \u00a7301.2 (Trench Excavation), \u00a7301.4 (Pipe Installation); and the Baseline Schedule Summary. Field observations were recorded at STA 42+50 on February 12 and at STA 41+80 to 42+20 on February 10. Event data current as of February 13, 2026.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Project B — Highway 87 Widening
// ---------------------------------------------------------------------------

const hwy87Widening: ExportManifest = {
  projectId: "p-hwy87-widening-2026",

  deckSlides: [
    {
      slideNumber: 1,
      title: "Highway 87 Widening (Segment A) — Weekly Status",
      type: "title",
      bulletPoints: [
        "State DOT",
        "Contract Value: $6.8M | Contingency Remaining: $510K (7.5%)",
        "Report Period: Week of Feb 10, 2026",
        "Overall Completion: 42%",
      ],
    },
    {
      slideNumber: 2,
      title: "Project Status & Milestones",
      type: "status",
      bulletPoints: [
        "Earthwork & Subgrade phase active — rough grade and compaction at 60% complete but trending below plan",
        "Traffic Shift Complete milestone forecast slipped from Mar 20 to Mar 27 (AT RISK)",
        "Drainage Complete milestone forecast: May 10 vs baseline May 1 — 9 calendar day variance",
        "Final Acceptance forecast: Jul 18 vs baseline Jul 8 — 10 calendar day variance",
        "Critical path runs through earthwork (B-205) into proof roll (B-210) into culvert extension (B-220)",
      ],
      dataRefs: ["B-M1", "B-M2", "B-M3", "B-205", "B-210"],
    },
    {
      slideNumber: 3,
      title: "Top Events Requiring Attention",
      type: "events",
      bulletPoints: [
        "MEDIUM: 4-day production drop in earthwork — daily logs show reduced truck cycles and downtime at Sta 148+00 to 154+00, $12K exposure, 3-day critical path slip",
        "HIGH: Rain days not properly documented — weather events noted informally without labor/equipment impacts; 72-hour notice window for time extension approaching; entitlement at risk",
        "MEDIUM: Culvert extension at Sta 151+00 — utility clearance pending from utility owner; $5K standby risk; 2-day potential slip on critical path",
      ],
      dataRefs: ["B-E1", "B-E2", "B-E3"],
    },
    {
      slideNumber: 4,
      title: "Schedule & Timeline Impact",
      type: "timeline",
      bulletPoints: [
        "Rough grade & compaction (B-205) forecast finish slipped from Mar 1 to Mar 3 due to production shortfall",
        "Subgrade proof roll (B-210) pushed from Mar 2 to Mar 4 start — QA witness window may be missed",
        "Culvert extension (B-220) start pushed from Mar 10 to Mar 12 pending utility clearance confirmation",
        "Aggregate base placement (B-310) and downstream paving tasks absorb cascading delay",
        "Schedule upload not reflecting recent field production data — forecast confidence is reduced",
      ],
      dataRefs: ["B-205", "B-210", "B-220", "B-310"],
    },
    {
      slideNumber: 5,
      title: "Contract Position & Notice Status",
      type: "contract",
      bulletPoints: [
        "Notice of Delay (DOT \u00a7105.17): 72-hour notice window for rain-related time extension support — deadline Feb 15 at 5:00 PM",
        "Time Extensions (DOT \u00a7108.06): Requires documented daily impacts, labor/equipment records, and timely submission — current documentation is insufficient",
        "Risk is entitlement loss, not direct spend — if rain days are not properly documented, time extension claim may be denied",
        "Production drop does not trigger a formal notice but should be documented in daily logs for schedule substantiation",
        "Combined cost exposure: $17,000 with primary risk in schedule entitlement rather than direct costs",
      ],
      dataRefs: ["B-D1", "B-E2"],
    },
    {
      slideNumber: 6,
      title: "Recommendations & Next Steps",
      type: "recommendations",
      bulletPoints: [
        "IMMEDIATE: Complete rain day documentation with labor counts, equipment impacts, and hourly detail before Feb 15 notice deadline",
        "THIS WEEK: Reconcile daily log data with schedule upload — current disconnect reduces forecast reliability",
        "THIS WEEK: Confirm utility clearance at Sta 151+00 to protect culvert extension start date",
        "ONGOING: Monitor earthwork production daily — if 4-day trend continues, evaluate crew augmentation or extended shifts",
        "PLANNING: Coordinate QA Inspector Singh availability for proof roll witness to avoid scheduling gap",
      ],
      dataRefs: ["B-E1", "B-E2", "B-E3", "B-S1", "B-S2"],
    },
    {
      slideNumber: 7,
      title: "Sources & Citations",
      type: "sources",
      bulletPoints: [
        "DOT Spec Book — Weather Delays & Documentation (B-D1): \u00a7108.06, \u00a7105.17",
        "Weekly Status Email Thread (B-D2): Owner updates and commitments",
        "Daily log data: Segment A, Sta 148+00 to 154+00 (Feb 9\u201313)",
        "Schedule upload (XLSX): Last updated Feb 13 — coverage 95%",
        "Cost tracker upload (XLSX): Last updated Feb 13 — coverage 82%",
      ],
      dataRefs: ["B-D1", "B-D2"],
    },
  ],

  workbookSheets: [
    {
      sheetName: "Events",
      description:
        "All active and recently resolved events with severity, status, alignment, and key metrics",
      columns: [
        "Event ID",
        "Title",
        "Severity",
        "Status",
        "Alignment",
        "Location",
        "Created",
        "Updated",
        "Cost Exposure ($)",
        "Schedule Impact (days)",
        "Critical Path",
        "Notice Required",
        "Notice Deadline",
      ],
    },
    {
      sheetName: "Cost Exposure",
      description:
        "Itemized cost exposure by event with confidence levels and contingency impact",
      columns: [
        "Event ID",
        "Title",
        "Exposure Amount ($)",
        "Confidence",
        "Notes",
        "Contingency Impact (%)",
        "Cumulative Exposure ($)",
        "Remaining Contingency ($)",
      ],
    },
    {
      sheetName: "Schedule Impact",
      description:
        "Task-level schedule variance with baseline vs forecast dates and critical path flags",
      columns: [
        "Task ID",
        "WBS",
        "Task Name",
        "Baseline Start",
        "Baseline Finish",
        "Forecast Start",
        "Forecast Finish",
        "Variance (days)",
        "% Complete",
        "Critical Path",
        "Linked Events",
      ],
    },
    {
      sheetName: "Notice Tracker",
      description:
        "Contract notice requirements, deadlines, and filing status",
      columns: [
        "Event ID",
        "Title",
        "Clause Reference",
        "Notice Window (hrs)",
        "Deadline",
        "Filed",
        "Filed Date",
        "Entitlement at Risk",
      ],
    },
    {
      sheetName: "Risk Matrix",
      description:
        "Risk register combining probability, impact, and mitigation status for each event",
      columns: [
        "Event ID",
        "Title",
        "Probability",
        "Cost Impact ($)",
        "Schedule Impact (days)",
        "Risk Score",
        "Mitigation Status",
        "Owner",
        "Next Action",
      ],
    },
  ],

  reportSections: [
    {
      heading: "Highway 87 Widening (Segment A) — Weekly Status Report",
      type: "header",
      narrative:
        "State DOT | Contract Value: $6,800,000 | Contingency: $510,000 (7.5%) | Overall Completion: 42% | Report Date: February 13, 2026",
    },
    {
      heading: "Executive Summary",
      type: "summary",
      narrative:
        "Earthwork production on Segment A has dropped below plan over a 4-day period, with daily logs showing reduced truck cycles and equipment downtime between Sta 148+00 and 154+00. The schedule upload has not been updated to reflect the field slowdown, reducing forecast confidence. More urgently, rain days have been noted informally in logs but lack the labor/equipment impact documentation required under DOT \u00a7108.06 to support a time extension claim. The 72-hour notice window under \u00a7105.17 expires on February 15 — if documentation is not completed by that deadline, the project risks losing entitlement to weather-related time extensions. A separate utility clearance issue at Sta 151+00 for the culvert extension is being tracked but the field and office are aligned on that constraint. Combined cost exposure is $17,000, but the primary risk is schedule entitlement rather than direct costs.",
    },
    {
      heading: "Open Risk Items & Field Conditions",
      type: "events",
      narrative:
        "Three events are currently active. The earthwork production drop (B-E1, medium) has been observed over four consecutive days with reduced truck cycles at Sta 148+00 to 154+00. The schedule upload does not reflect this slowdown, and the proof roll and traffic shift milestones are at risk of a 3-day slip. The rain documentation gap (B-E2, high) is the most consequential issue — weather events were noted informally but the daily logs lack the granular labor and equipment impact data required by DOT spec \u00a7108.06 for time extension substantiation. The notice window under \u00a7105.17 expires February 15. The culvert clearance issue (B-E3, medium) at Sta 151+00 is a known constraint with the utility owner; the office narrative matches the field understanding, and standby risk is estimated at $5,000 if clearance is delayed.",
    },
    {
      heading: "Alignment Status — Field / Contract / Office",
      type: "alignment",
      narrative:
        "The project shows DRIFT between field conditions and the uploaded schedule. Daily logs capture the production shortfall, but the schedule file still reflects the original forecast, meaning the owner PM and QA inspector are working from optimistic dates. The rain documentation gap creates a contract compliance risk — informal notes do not meet the evidentiary standard for time extension claims. The culvert clearance issue is the one area where all three streams are aligned: field, contract, and office all recognize the utility constraint and are waiting on the same confirmation.",
    },
    {
      heading: "Stakeholder Status & Communication",
      type: "stakeholders",
      narrative:
        "DOT PM Alvarez is aware of the general production situation via weekly email updates but has not been formally briefed on the rain documentation gap or its entitlement implications. QA Inspector Singh needs advance coordination for the proof roll witness — if the slip materializes, the witness window must be rescheduled. GC PM Watson is managing the production recovery plan and is the primary point of contact for daily log remediation. Traffic Ops Lead Kim has not been engaged yet but will need updated closure schedules if the traffic shift milestone slips past March 27.",
    },
    {
      heading: "Data Sources & Document References",
      type: "sources",
      narrative:
        "This report references the DOT Spec Book \u00a7108.06 (Time Extensions) and \u00a7105.17 (Notice of Delay), the weekly status email thread with owner commitments, daily log data from Segment A covering February 9 through 13, the schedule upload (XLSX, 95% coverage, last updated February 13), and the cost tracker upload (XLSX, 82% coverage, last updated February 13). Event data current as of February 13, 2026.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Project C — Ventura Water Treatment Plant
// ---------------------------------------------------------------------------

const venturaWTP: ExportManifest = {
  projectId: "p-ventura-wtp-2026",

  deckSlides: [
    {
      slideNumber: 1,
      title: "Water Treatment Plant Upgrade — Weekly Status",
      type: "title",
      bulletPoints: [
        "City Utilities",
        "Contract Value: $3.3M | Contingency Remaining: $260K (7.9%)",
        "Report Period: Week of Feb 10, 2026",
        "Overall Completion: 25%",
      ],
    },
    {
      slideNumber: 2,
      title: "Project Status & Milestones",
      type: "status",
      bulletPoints: [
        "Submittals & Procurement phase active — chlorination skid submittal on 2nd resubmittal cycle, 45% complete",
        "Long Lead Equipment Received milestone forecast slipped from Apr 3 to Apr 10 (AT RISK)",
        "Controls Integration Complete milestone forecast: May 15 vs baseline May 8 — 7 calendar day variance",
        "Commissioning Complete forecast: Jun 12 vs baseline Jun 5 — 7 calendar day variance",
        "Critical path runs through submittal approval (C-110) into procurement (C-120) into skid install (C-210) into SCADA integration (C-310)",
      ],
      dataRefs: ["C-M1", "C-M2", "C-M3", "C-110", "C-120"],
    },
    {
      slideNumber: 3,
      title: "Top Events Requiring Attention",
      type: "events",
      bulletPoints: [
        "HIGH: Submittal revision loop on chlorination skid — 2nd resubmittal cycle with expanding reviewer comments; 7-day critical path impact; procurement start at risk",
        "HIGH: SCADA PLC firmware mismatch suspected — vendor notes indicate current firmware may be out of supported range; $22K exposure for update and revalidation; 4-day critical path impact",
      ],
      dataRefs: ["C-E1", "C-E2"],
    },
    {
      slideNumber: 4,
      title: "Schedule & Timeline Impact",
      type: "timeline",
      bulletPoints: [
        "Submittal approvals (C-110) forecast finish slipped from Feb 24 to Feb 27 — reviewer scope creep on comments",
        "Long-lead chlorination skid procurement (C-120) start delayed from Feb 24 to Feb 27; finish pushed from Apr 3 to Apr 10",
        "Skid install + piping tie-in (C-210) cascades from Apr 4 to Apr 11 start",
        "SCADA integration (C-310) compressed or pushed — firmware mismatch could add 4 days to an already shifted window",
        "Cumulative schedule risk: 7 days confirmed, up to 11 days if firmware issue materializes concurrently",
      ],
      dataRefs: ["C-110", "C-120", "C-210", "C-310"],
    },
    {
      slideNumber: 5,
      title: "Contract Position & Procurement Risk",
      type: "contract",
      bulletPoints: [
        "Submittals (\u00a701.33): Revision handling and resubmittal timelines defined — current loop exceeds typical review cadence",
        "SCADA Integration (\u00a713.10): Protocol requirements, I/O mapping, and acceptance criteria must be met; firmware compatibility is a prerequisite",
        "PLC Firmware Compatibility (VM-PLC): Vendor manual lists supported firmware ranges — current version needs verification against spec",
        "No formal notice requirements triggered, but extended general conditions cost risk increases with each week of submittal delay",
        "Combined cost exposure: $22,000 direct (firmware) plus extended GC risk from submittal delays",
      ],
      dataRefs: ["C-D1", "C-D2", "C-E1", "C-E2"],
    },
    {
      slideNumber: 6,
      title: "Recommendations & Next Steps",
      type: "recommendations",
      bulletPoints: [
        "IMMEDIATE: Schedule a focused submittal review meeting with Utilities PM Delgado to lock down remaining comments and prevent a 3rd resubmittal cycle",
        "THIS WEEK: Verify PLC firmware version against vendor compatibility matrix (VM-PLC) — if out of range, initiate firmware update procurement now",
        "THIS WEEK: Engage Controls Vendor Rep Ellis for firmware compatibility assessment and integration timeline impact",
        "ONGOING: Track long-lead equipment delivery status weekly once procurement starts — any slip cascades directly to install and commissioning",
        "PLANNING: Coordinate with Plant Ops Lead Nguyen on commissioning sequence and operator availability windows",
      ],
      dataRefs: ["C-E1", "C-E2", "C-S1", "C-S2", "C-S3"],
    },
  ],

  workbookSheets: [
    {
      sheetName: "Events",
      description:
        "All active events with severity, status, alignment, and key metrics",
      columns: [
        "Event ID",
        "Title",
        "Severity",
        "Status",
        "Alignment",
        "Location",
        "Created",
        "Updated",
        "Cost Exposure ($)",
        "Schedule Impact (days)",
        "Critical Path",
        "Notice Required",
      ],
    },
    {
      sheetName: "Cost Exposure",
      description:
        "Itemized cost exposure with confidence levels and contingency impact",
      columns: [
        "Event ID",
        "Title",
        "Exposure Amount ($)",
        "Confidence",
        "Notes",
        "Contingency Impact (%)",
        "Cumulative Exposure ($)",
        "Remaining Contingency ($)",
      ],
    },
    {
      sheetName: "Schedule Impact",
      description:
        "Task-level schedule variance with baseline vs forecast and critical path flags",
      columns: [
        "Task ID",
        "WBS",
        "Task Name",
        "Baseline Start",
        "Baseline Finish",
        "Forecast Start",
        "Forecast Finish",
        "Variance (days)",
        "% Complete",
        "Critical Path",
        "Linked Events",
      ],
    },
    {
      sheetName: "Submittal Tracker",
      description:
        "Submittal status, revision count, and review cycle duration for procurement-critical items",
      columns: [
        "Submittal ID",
        "Item Description",
        "Revision Number",
        "Submitted Date",
        "Review Due",
        "Status",
        "Reviewer Comments",
        "Days in Review",
        "Linked Task",
      ],
    },
    {
      sheetName: "Risk Matrix",
      description:
        "Risk register with probability, impact, and mitigation status",
      columns: [
        "Event ID",
        "Title",
        "Probability",
        "Cost Impact ($)",
        "Schedule Impact (days)",
        "Risk Score",
        "Mitigation Status",
        "Owner",
        "Next Action",
      ],
    },
  ],

  reportSections: [
    {
      heading: "Water Treatment Plant Upgrade — Weekly Status Report",
      type: "header",
      narrative:
        "City Utilities | Contract Value: $3,300,000 | Contingency: $260,000 (7.9%) | Overall Completion: 25% | Report Date: February 13, 2026",
    },
    {
      heading: "Executive Summary",
      type: "summary",
      narrative:
        "The project is in the Submittals & Procurement phase, and the chlorination skid submittal has entered a second resubmittal cycle. Reviewer comments have expanded in scope with each cycle, pushing the approval date from the February 24 baseline to an estimated February 27 and delaying the procurement start for the long-lead chlorination skid. This 7-day cascade runs through the entire critical path: skid procurement, installation, SCADA integration, and commissioning. Separately, an emerging SCADA PLC firmware mismatch has been flagged based on vendor compatibility notes. If the current PLC firmware is outside the supported range, the project faces a $22,000 exposure for firmware update and revalidation testing, plus an additional 4 days of critical path compression. Both issues are on the critical path, and if they overlap, total schedule risk could reach 11 days. No formal notices are required at this stage, but the extended general conditions cost risk grows with each additional week of submittal delay.",
    },
    {
      heading: "Open Risk Items & Field Conditions",
      type: "events",
      narrative:
        "Two events are currently active. The submittal revision loop (C-E1, high) on the chlorination skid is the primary schedule driver. The submittal was first submitted on February 10 and returned with comments that expanded beyond the original review scope. A revised submittal was resubmitted, and a second round of comments has been received. Each cycle adds approximately 3 to 4 days, and the procurement window for the long-lead skid cannot open until approval is granted. The SCADA PLC firmware mismatch (C-E2, high) was identified on February 13 based on vendor manual notes indicating the currently installed PLC firmware may fall outside the supported range for the specified SCADA integration protocol. If confirmed, a firmware update and full revalidation of the I/O mapping and protocol testing would be required before the integration phase can proceed. Cost exposure is estimated at $22,000 with low confidence pending verification.",
    },
    {
      heading: "Alignment Status — Field / Contract / Office",
      type: "alignment",
      narrative:
        "The project shows DRIFT on both active events. The submittal revision loop is a process issue where the reviewer and the contractor are not aligned on comment scope — the spec (\u00a701.33) defines resubmittal timelines, but the expanding comments suggest the review criteria are shifting. The SCADA firmware issue represents a potential technical misalignment between the specified integration requirements (\u00a713.10) and the installed hardware capability — this needs to be confirmed through direct verification with the vendor. The office forecast accounts for the submittal delay but does not yet incorporate the firmware risk, meaning the current 7-day variance could be optimistic.",
    },
    {
      heading: "Stakeholder Status & Communication",
      type: "stakeholders",
      narrative:
        "Utilities PM Delgado is aware of the submittal delays and has been engaged in the review process. Plant Ops Lead Nguyen has been briefed on the procurement timeline shift and its implications for the commissioning window. Controls Vendor Rep Ellis needs to be formally engaged on the firmware compatibility question — this has not yet happened and is the most urgent communication gap. GC Superintendent Morgan is tracking the submittal cycle and preparing for accelerated installation once the skid is received.",
    },
    {
      heading: "Data Sources & Document References",
      type: "sources",
      narrative:
        "This report references the Spec Section on Controls & SCADA Requirements (\u00a713.10 SCADA Integration, \u00a701.33 Submittals) and the Vendor Manual on PLC Firmware Compatibility (VM-PLC). Native project data at 100% coverage as of February 13. Vendor manuals and specs uploaded at 75% coverage as of February 12. Event data current as of February 13, 2026.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Project D — Santa Clara River Bridge Rehab
// ---------------------------------------------------------------------------

const scrBridgeRehab: ExportManifest = {
  projectId: "p-scr-bridge-rehab-2026",

  deckSlides: [
    {
      slideNumber: 1,
      title: "Santa Clara River Bridge Rehab — Weekly Status",
      type: "title",
      bulletPoints: [
        "County Public Works",
        "Contract Value: $5.1M | Contingency Remaining: $400K (7.8%)",
        "Report Period: Week of Feb 10, 2026",
        "Overall Completion: 34%",
      ],
    },
    {
      slideNumber: 2,
      title: "Project Status & Milestones",
      type: "status",
      bulletPoints: [
        "Deck Removal & Prep phase approaching — weekend closure #1 setup scheduled for Mar 14\u201315",
        "Bearing Replacement Complete milestone forecast slipped from Apr 18 to Apr 28 (10 calendar days)",
        "Deck Pour Complete milestone forecast: May 15 vs baseline May 2 — 13 calendar day variance",
        "Full Reopen forecast: Jun 20 vs baseline Jun 6 — 14 calendar day variance",
        "Critical path runs through deck demo (D-120) into bearing replacement (D-210) into deck pour (D-310)",
      ],
      dataRefs: ["D-M1", "D-M2", "D-M3", "D-120", "D-210"],
    },
    {
      slideNumber: 3,
      title: "Top Events Requiring Attention",
      type: "events",
      bulletPoints: [
        "CRITICAL: Inspection hold conflict at Bridge Span 2 bearing seats — inspector email suggests proceeding past a spec-required hold point; $38K exposure if work proceeds without proper acceptance; 6-day critical path impact",
        "MEDIUM: Public escalation risk — community email volume increasing on weekend closure details; Public Affairs not aligned on detour messaging; political pressure risk",
        "HIGH: Partial schedule coverage — only 60% of tasks imported; critical path assumptions uncertain; downstream striping and reopen tasks missing from forecast",
      ],
      dataRefs: ["D-E1", "D-E2", "D-E3"],
    },
    {
      slideNumber: 4,
      title: "Schedule & Timeline Impact",
      type: "timeline",
      bulletPoints: [
        "Deck demo section 1 (D-120) forecast slipped from Mar 16 to Mar 18 start, Mar 26 to Mar 31 finish",
        "Bearing replacement (D-210) pushed from Mar 27 to Apr 1 start — 6-day potential additional slip if hold point is not resolved",
        "Deck pour (D-310) pushed from Apr 24 to May 5 — cumulative cascade from upstream delays",
        "Downstream tasks (joints, striping, reopen) not in imported schedule — actual completion date likely later than current forecast",
        "Schedule coverage at 60% — forecast confidence is LOW; critical path may shift once remaining tasks are imported",
      ],
      dataRefs: ["D-120", "D-210", "D-310", "D-E3"],
    },
    {
      slideNumber: 5,
      title: "Contract Position & Inspection Compliance",
      type: "contract",
      bulletPoints: [
        "Hold Points (\u00a705.40): Spec requires inspector sign-off before proceeding past defined stages — Span 2 bearing seats are a defined hold point",
        "Nonconformance (\u00a701.77): If work proceeds past a hold point without acceptance, corrective action workflow triggers — potential tear-out and rework",
        "Inspector email (EMAIL-INS) suggests proceeding, but email directives do not override spec hold point requirements — formal clarification needed",
        "Community complaint emails (EMAIL-PUB) increasing — risk of political pressure on closure windows, which could constrain weekend work schedule",
        "Cost exposure: $38,000 on inspection hold conflict; reputational/political risk on public escalation; no direct spend on schedule coverage gap",
      ],
      dataRefs: ["D-D1", "D-D2", "D-D3", "D-E1"],
    },
    {
      slideNumber: 6,
      title: "Recommendations & Next Steps",
      type: "recommendations",
      bulletPoints: [
        "IMMEDIATE: Request formal written clarification from Bridge Inspector Patel on hold point at Span 2 — do NOT proceed on email directive alone",
        "IMMEDIATE: Coordinate with Public Affairs Ruiz on detour messaging before weekend closure #1 on Mar 14 — current messaging gaps are escalation risk",
        "THIS WEEK: Complete schedule import — add downstream striping, joint work, and reopen tasks to get accurate critical path and completion forecast",
        "THIS WEEK: Brief County PM Howard on inspection hold conflict and schedule uncertainty — he is operating from an incomplete picture",
        "PLANNING: Develop contingency plan for weekend closure schedule if public pressure forces reduced closure windows",
      ],
      dataRefs: ["D-E1", "D-E2", "D-E3", "D-S1", "D-S2", "D-S3"],
    },
    {
      slideNumber: 7,
      title: "Sources & Citations",
      type: "sources",
      bulletPoints: [
        "Bridge Rehab Specs (D-D1): \u00a705.40 Hold Points, \u00a701.77 Nonconformance",
        "Inspector Direction Email Thread (D-D2): EMAIL-INS — directives and clarifications",
        "Community Complaint Emails (D-D3): EMAIL-PUB — public concerns and escalation signals",
        "Partial schedule import: 60% coverage, last updated Feb 13",
        "Email thread sync: 78% coverage, last updated Feb 13",
        "Field notes (native): 55% coverage, last updated Feb 13",
      ],
      dataRefs: ["D-D1", "D-D2", "D-D3"],
    },
  ],

  workbookSheets: [
    {
      sheetName: "Events",
      description:
        "All active events with severity, status, alignment, and key metrics",
      columns: [
        "Event ID",
        "Title",
        "Severity",
        "Status",
        "Alignment",
        "Location",
        "Created",
        "Updated",
        "Cost Exposure ($)",
        "Schedule Impact (days)",
        "Critical Path",
        "Notice Required",
      ],
    },
    {
      sheetName: "Cost Exposure",
      description:
        "Itemized cost exposure by event with confidence levels and contingency impact",
      columns: [
        "Event ID",
        "Title",
        "Exposure Amount ($)",
        "Confidence",
        "Notes",
        "Contingency Impact (%)",
        "Cumulative Exposure ($)",
        "Remaining Contingency ($)",
      ],
    },
    {
      sheetName: "Schedule Impact",
      description:
        "Task-level schedule variance with baseline vs forecast — note: partial schedule coverage",
      columns: [
        "Task ID",
        "WBS",
        "Task Name",
        "Baseline Start",
        "Baseline Finish",
        "Forecast Start",
        "Forecast Finish",
        "Variance (days)",
        "% Complete",
        "Critical Path",
        "Linked Events",
        "Coverage Flag",
      ],
    },
    {
      sheetName: "Notice Tracker",
      description:
        "Inspection holds, formal clarification requests, and compliance documentation status",
      columns: [
        "Event ID",
        "Title",
        "Clause Reference",
        "Hold Type",
        "Clarification Requested",
        "Clarification Received",
        "Resolution Status",
        "Compliance Risk",
      ],
    },
    {
      sheetName: "Risk Matrix",
      description:
        "Risk register with probability, impact, and mitigation — includes public/political risk",
      columns: [
        "Event ID",
        "Title",
        "Probability",
        "Cost Impact ($)",
        "Schedule Impact (days)",
        "Reputational Risk",
        "Risk Score",
        "Mitigation Status",
        "Owner",
        "Next Action",
      ],
    },
    {
      sheetName: "Public Affairs Tracker",
      description:
        "Community communications, complaint trends, and public messaging status",
      columns: [
        "Date",
        "Communication Type",
        "Topic",
        "Source",
        "Sentiment",
        "Response Status",
        "Assigned To",
        "Escalation Risk",
      ],
    },
  ],

  reportSections: [
    {
      heading: "Santa Clara River Bridge Rehab — Weekly Status Report",
      type: "header",
      narrative:
        "County Public Works | Contract Value: $5,100,000 | Contingency: $400,000 (7.8%) | Overall Completion: 34% | Report Date: February 13, 2026",
    },
    {
      heading: "Executive Summary",
      type: "summary",
      narrative:
        "The bridge rehab project faces a critical compliance issue at Bridge Span 2 where an inspector email directive appears to conflict with a spec-required hold point at the bearing seats. If work proceeds past this hold point without formal acceptance under \u00a705.40, the project is exposed to $38,000 in potential tear-out and rework costs, plus a 6-day critical path delay. This must be resolved through formal written clarification before any work proceeds at this location. Concurrently, community email volume is increasing ahead of the first weekend closure on March 14, and Public Affairs has not been aligned on detour messaging details — this creates a reputational and political risk that could constrain the closure schedule. The project is also operating with only 60% schedule coverage, meaning the critical path assumptions are uncertain and the forecast completion date of July 24 is likely optimistic. Downstream tasks including striping, joint work, and reopen have not been imported, and the actual path to reopening the bridge is not fully modeled.",
    },
    {
      heading: "Open Risk Items & Field Conditions",
      type: "events",
      narrative:
        "Three events are currently active. The inspection hold conflict (D-E1, critical) at Bridge Span 2 is the highest-priority issue. An inspector email suggests proceeding past the bearing seat hold point, but \u00a705.40 requires formal sign-off before work can advance past defined stages. Email directives do not constitute formal acceptance, and proceeding on this basis would trigger the nonconformance workflow under \u00a701.77 if the inspector later challenges the acceptance. The $38,000 exposure includes potential tear-out of any work performed without proper hold point clearance, plus standby costs while the hold is resolved. The public escalation risk (D-E2, medium) is driven by increasing community complaints about the weekend closure and detour routes. Public Affairs has not been fully briefed on the detour details, creating a messaging vacuum that could be filled by political pressure. The schedule coverage gap (D-E3, high) is a planning risk — with only 60% of tasks imported, the project is making critical path assumptions based on incomplete data. The forecast shows a 21-day variance from baseline to completion, but this number has low confidence.",
    },
    {
      heading: "Alignment Status — Field / Contract / Office",
      type: "alignment",
      narrative:
        "The project is in HIGH RISK misalignment on the inspection hold conflict — the inspector's email directive and the spec hold point requirement are in direct contradiction, and the field team does not have clear direction on which to follow. The office narrative assumes the hold will be resolved quickly, but no formal clarification has been requested. On the public affairs front, the field closure plan and the public messaging are in DRIFT — the contractor knows the closure schedule, but the community has not received aligned messaging from Public Affairs. The schedule coverage gap creates a systemic alignment problem: with 40% of tasks missing, the field, contract, and office are all making different assumptions about downstream work sequencing.",
    },
    {
      heading: "Stakeholder Status & Communication",
      type: "stakeholders",
      narrative:
        "County PM Howard is aware of the general project status but has not been formally briefed on the inspection hold conflict or the schedule coverage gap. Bridge Inspector Patel issued the email directive that conflicts with the spec hold point and needs to provide formal written clarification. Public Affairs Ruiz has not been fully engaged on the weekend closure messaging and is the critical path for resolving the public escalation risk before March 14. GC PM Sato is aware of all three issues and is the primary field contact for coordination on the hold point and schedule completion.",
    },
    {
      heading: "Data Sources & Document References",
      type: "sources",
      narrative:
        "This report references Bridge Rehab Specs \u00a705.40 (Hold Points) and \u00a701.77 (Nonconformance), the Inspector Direction Email Thread (EMAIL-INS), and the Community Complaint Emails (EMAIL-PUB). Data sources include partial schedule import (60% coverage, last updated February 13), email thread sync (78% coverage, last updated February 13), inspection reports and contract documents (uploaded, 70% coverage), and native field notes (55% coverage, last updated February 13). Event data current as of February 13, 2026. Note: forecast confidence is reduced due to partial schedule coverage.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const DEMO_EXPORT_MANIFESTS_V5: ExportManifest[] = [
  mesaStormDrain,
  hwy87Widening,
  venturaWTP,
  scrBridgeRehab,
];

export const EXPORT_MANIFEST_BY_PROJECT: Record<string, ExportManifest> =
  Object.fromEntries(
    DEMO_EXPORT_MANIFESTS_V5.map((m) => [m.projectId, m]),
  );
