// src/lib/demo/v5/dailyLogs.ts
// Daily log seed data for all 4 demo projects.
// Logs are Feb 8-13, 2026, 6-8 per project, linked to events via relatedEventIds.

export type DailyLog = {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  shift: "day" | "night";
  author: string;
  role: string;
  location: string;

  weather: {
    conditions: "clear" | "cloudy" | "rain" | "wind" | "fog";
    tempFHigh: number;
    tempFLow: number;
    lostTimeHoursWeather: number;
  };

  labor: Array<{
    trade: string;
    headcount: number;
    hours: number;
  }>;

  equipment: Array<{
    name: string;
    count: number;
    hoursRun: number;
    status: "running" | "standby" | "down";
  }>;

  workPerformed: string[];
  constraints: string[];
  safety: string[];
  inspections: string[];
  deliveries: string[];

  relatedEventIds: string[];

  attachments?: Array<{
    type: "photo" | "email" | "pdf";
    title: string;
    ref: string;
  }>;
};

export const DEMO_DAILY_LOGS_V5: DailyLog[] = [
  // ===========================================================================
  // PROJECT A — Phase 2 Storm Drain & Utility Relocation (p-mesa-stormdrain-2026)
  // Events: A-E1 (unmarked water main), A-E2 (RFI offset), A-E3 (briefing gap)
  // ===========================================================================

  // A-L01 — Feb 10: Potholing, alignment mismatch flagged
  {
    id: "A-L01",
    projectId: "p-mesa-stormdrain-2026",
    date: "2026-02-10",
    shift: "day",
    author: "Foreman Rivera",
    role: "Field Foreman",
    location: "STA 41+00 – 43+00",

    weather: {
      conditions: "clear",
      tempFHigh: 72,
      tempFLow: 48,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Laborer", headcount: 4, hours: 8 },
      { trade: "Operator", headcount: 2, hours: 8 },
      { trade: "Survey Tech", headcount: 1, hours: 4 },
    ],

    equipment: [
      { name: "Vac Truck", count: 1, hoursRun: 6, status: "running" },
      { name: "Mini Excavator", count: 1, hoursRun: 5, status: "running" },
      { name: "Pickup (Survey)", count: 1, hoursRun: 4, status: "running" },
    ],

    workPerformed: [
      "Potholed 6 utility crossings between STA 41+00 and STA 43+00.",
      "Verified horizontal and vertical alignment for each crossing against plan sheets.",
      "Flagged alignment mismatch at STA 41+80-42+20 — plan shows 6-ft offset, field shows 3.2 ft.",
      "Marked pothole locations with paint and GPS coordinates for survey crew.",
    ],
    constraints: [
      "Storm drain alignment conflicts with utility as-builts at STA 41+80-42+20; RFI drafted.",
    ],
    safety: [
      "Tailgate briefing held. Topic: excavation safety near live utilities.",
      "All crew wearing Class 2 vests in active traffic zone.",
    ],
    inspections: [],
    deliveries: [],

    relatedEventIds: ["A-E2"],

    attachments: [
      { type: "photo", title: "Pothole #3 at STA 42+00 showing offset", ref: "IMG_4201.jpg" },
    ],
  },

  // A-L02 — Feb 11: Discovery of unmarked 12" DIP water main
  {
    id: "A-L02",
    projectId: "p-mesa-stormdrain-2026",
    date: "2026-02-11",
    shift: "day",
    author: "Foreman Rivera",
    role: "Field Foreman",
    location: "STA 42+20 – 42+70",

    weather: {
      conditions: "cloudy",
      tempFHigh: 68,
      tempFLow: 50,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Laborer", headcount: 4, hours: 8 },
      { trade: "Operator", headcount: 2, hours: 6 },
      { trade: "Pipe Layer", headcount: 3, hours: 2 },
    ],

    equipment: [
      { name: "Vac Truck", count: 1, hoursRun: 5, status: "running" },
      { name: "Excavator CAT 320", count: 1, hoursRun: 3, status: "standby" },
      { name: "Loader", count: 1, hoursRun: 2, status: "standby" },
    ],

    workPerformed: [
      "Continued potholing at STA 42+20. Encountered unmarked 12-inch DIP water main at STA 42+50.",
      "Stopped excavation immediately per safety protocol — line is live and under pressure.",
      "Called City of Mesa water utility for emergency locate. Confirmed line not shown on any record drawings.",
      "Photographed and surveyed line position: 4.8 ft depth, running N-S, directly in storm drain alignment.",
    ],
    constraints: [
      "Excavation halted at STA 42+20 through STA 42+70 until utility conflict resolved.",
      "Pipe crew and excavator on standby — accruing standby costs.",
      "Cannot proceed with storm drain installation in Area B until water main relocated or alignment revised.",
    ],
    safety: [
      "Near-miss documented: vac truck nozzle contacted pipe crown. No breach. Crew backed off immediately.",
      "Established 10-ft exclusion zone around exposed water main.",
    ],
    inspections: [
      "City utility inspector responded same day — confirmed 12-inch DIP, unknown installation date.",
    ],
    deliveries: [],

    relatedEventIds: ["A-E1"],

    attachments: [
      { type: "photo", title: "Unmarked 12\" DIP exposed at STA 42+50", ref: "IMG_4218.jpg" },
      { type: "photo", title: "Exclusion zone setup", ref: "IMG_4220.jpg" },
      { type: "email", title: "City utility emergency locate confirmation", ref: "EMAIL_UTIL_0211.pdf" },
    ],
  },

  // A-L03 — Feb 12: Standby day, documentation, notice prep
  {
    id: "A-L03",
    projectId: "p-mesa-stormdrain-2026",
    date: "2026-02-12",
    shift: "day",
    author: "Foreman Rivera",
    role: "Field Foreman",
    location: "STA 42+20 – 42+70 (hold zone)",

    weather: {
      conditions: "clear",
      tempFHigh: 74,
      tempFLow: 46,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Laborer", headcount: 2, hours: 8 },
      { trade: "Operator", headcount: 1, hours: 4 },
      { trade: "Survey Tech", headcount: 1, hours: 6 },
    ],

    equipment: [
      { name: "Excavator CAT 320", count: 1, hoursRun: 0, status: "standby" },
      { name: "Loader", count: 1, hoursRun: 0, status: "standby" },
      { name: "Pickup (Survey)", count: 1, hoursRun: 6, status: "running" },
    ],

    workPerformed: [
      "Full survey of exposed water main — documented depth, alignment, diameter, and material.",
      "Prepared differing site conditions documentation package per §7.3.1.",
      "Drafted written notice of differing site conditions (48-hr clock started Feb 12).",
      "Reviewed conflict zone with survey crew to verify plan vs. as-built discrepancy.",
    ],
    constraints: [
      "Excavation still halted in hold zone STA 42+20 through 42+70.",
      "Excavator and loader remain on standby — day 2 of standby costs.",
      "RFI-047 (alignment offset) still awaiting engineer response.",
    ],
    safety: [
      "Exclusion zone maintained around exposed DIP.",
      "Barricades and caution tape inspected, in good condition.",
    ],
    inspections: [
      "City utility inspector returned — provided partial record drawing showing 8-inch line (not 12-inch as found).",
    ],
    deliveries: [],

    relatedEventIds: ["A-E1", "A-E2"],

    attachments: [
      { type: "pdf", title: "Differing site conditions notice — draft", ref: "NOTICE_DSC_DRAFT_0212.pdf" },
      { type: "photo", title: "Survey stake-out of water main alignment", ref: "IMG_4235.jpg" },
    ],
  },

  // A-L04 — Feb 12 night: Limited night work on unaffected area
  {
    id: "A-L04",
    projectId: "p-mesa-stormdrain-2026",
    date: "2026-02-12",
    shift: "night",
    author: "Night Lead Gomez",
    role: "Night Shift Foreman",
    location: "STA 39+00 – 41+00",

    weather: {
      conditions: "clear",
      tempFHigh: 74,
      tempFLow: 44,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Laborer", headcount: 3, hours: 6 },
      { trade: "Operator", headcount: 1, hours: 6 },
      { trade: "Traffic Control", headcount: 2, hours: 6 },
    ],

    equipment: [
      { name: "Loader", count: 1, hoursRun: 5, status: "running" },
      { name: "Light Plant", count: 2, hoursRun: 6, status: "running" },
      { name: "Arrow Board", count: 1, hoursRun: 6, status: "running" },
    ],

    workPerformed: [
      "Advanced traffic control setup for Phase 2 Area A (unaffected by hold zone).",
      "Stockpiled bedding material at STA 39+50 staging area for future storm drain work.",
      "Hauled spoils from potholing operations to off-site disposal (12 CY).",
    ],
    constraints: [
      "Night work limited to areas west of STA 41+00 to avoid hold zone.",
    ],
    safety: [
      "Night lighting adequate per OSHA standards. Light plants positioned at 200-ft intervals.",
      "Traffic control in place — no incidents.",
    ],
    inspections: [],
    deliveries: [
      "12 CY Class II aggregate base delivered to STA 39+50 staging area.",
    ],

    relatedEventIds: [],
  },

  // A-L05 — Feb 13 morning: Notice submitted, waiting, minor work continues
  {
    id: "A-L05",
    projectId: "p-mesa-stormdrain-2026",
    date: "2026-02-13",
    shift: "day",
    author: "Foreman Rivera",
    role: "Field Foreman",
    location: "STA 42+20 – 42+70 (hold zone) / STA 39+00 – 41+00",

    weather: {
      conditions: "cloudy",
      tempFHigh: 66,
      tempFLow: 49,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Laborer", headcount: 3, hours: 8 },
      { trade: "Operator", headcount: 2, hours: 4 },
      { trade: "Pipe Layer", headcount: 3, hours: 6 },
    ],

    equipment: [
      { name: "Excavator CAT 320", count: 1, hoursRun: 0, status: "standby" },
      { name: "Loader", count: 1, hoursRun: 4, status: "running" },
      { name: "Vac Truck", count: 1, hoursRun: 3, status: "running" },
    ],

    workPerformed: [
      "Submitted formal written notice of differing site conditions to City of Mesa per §7.3.2 — 48-hr deadline met.",
      "Redirected pipe crew to STA 39+00-41+00 for advance storm drain bedding prep.",
      "Placed 45 LF of 6-inch aggregate bedding in trench section STA 39+50-40+20.",
      "Additional potholing at STA 40+50 — no conflicts found.",
    ],
    constraints: [
      "Hold zone STA 42+20-42+70 remains active — day 3 of standby on excavator.",
      "No response yet from Eng. Martinez on RFI-047.",
      "Director Chen has not been briefed on utility halt or cost exposure.",
    ],
    safety: [
      "Tailgate briefing: working adjacent to live traffic on Alma School Rd.",
      "Spotter assigned for loader operations near pedestrian sidewalk.",
    ],
    inspections: [
      "City inspector verified bedding material gradation at STA 39+50 — approved.",
    ],
    deliveries: [
      "24-inch RCP pipe sections delivered (6 joints) — staged at STA 39+00.",
    ],

    relatedEventIds: ["A-E1", "A-E3"],

    attachments: [
      { type: "pdf", title: "Submitted DSC notice — signed", ref: "NOTICE_DSC_FINAL_0213.pdf" },
      { type: "email", title: "Notice transmittal to City of Mesa", ref: "EMAIL_NOTICE_0213.pdf" },
    ],
  },

  // A-L06 — Feb 8: Pre-event baseline day (early work)
  {
    id: "A-L06",
    projectId: "p-mesa-stormdrain-2026",
    date: "2026-02-08",
    shift: "day",
    author: "Foreman Rivera",
    role: "Field Foreman",
    location: "STA 40+00 – 41+00",

    weather: {
      conditions: "clear",
      tempFHigh: 70,
      tempFLow: 45,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Laborer", headcount: 4, hours: 8 },
      { trade: "Operator", headcount: 2, hours: 8 },
      { trade: "Traffic Control", headcount: 2, hours: 8 },
    ],

    equipment: [
      { name: "Excavator CAT 320", count: 1, hoursRun: 7, status: "running" },
      { name: "Loader", count: 1, hoursRun: 6, status: "running" },
      { name: "Water Truck", count: 1, hoursRun: 4, status: "running" },
    ],

    workPerformed: [
      "Completed utility ticket verification for STA 40+00-41+00 segment.",
      "Began trench excavation for storm drain at STA 40+00 — first 80 LF opened.",
      "Installed temporary shoring at STA 40+00 per trench safety plan.",
      "Traffic control operational on Alma School Rd — no lane closures required in this segment.",
    ],
    constraints: [
      "Awaiting mark-outs from telecom utility for STA 41+00 and beyond.",
    ],
    safety: [
      "Tailgate briefing: trench entry/exit procedures and shoring inspection.",
      "Competent person on-site for trench operations.",
    ],
    inspections: [],
    deliveries: [
      "Shoring frames delivered — 4 sets aluminum hydraulic.",
    ],

    relatedEventIds: [],
  },

  // A-L07 — Feb 9: Sunday — no work (project doesn't work weekends)
  // Skipped — using Feb 9 as a gap day. Next log on Feb 10 (A-L01).

  // A-L07 — Feb 13 late update: PM notes on briefing gap
  {
    id: "A-L07",
    projectId: "p-mesa-stormdrain-2026",
    date: "2026-02-13",
    shift: "day",
    author: "PM Jacobs",
    role: "Project Manager",
    location: "Project-wide (Office)",

    weather: {
      conditions: "cloudy",
      tempFHigh: 66,
      tempFLow: 49,
      lostTimeHoursWeather: 0,
    },

    labor: [],

    equipment: [],

    workPerformed: [
      "Reviewed DSC notice package prepared by field — approved for transmittal.",
      "Updated project schedule forecast: A-130 (water main relocation) shifted to 2/24 start pending resolution.",
      "Prepared cost exposure summary: $45K estimated for standby + remobilization.",
      "Note: Director Chen and CFO Rawlings have NOT been briefed on this issue — need to schedule update.",
    ],
    constraints: [
      "Stakeholder briefing gap: executive team unaware of utility halt and cost exposure.",
      "Schedule update not yet distributed to owner.",
      "RFI-047 response still pending from Eng. Martinez — 3 business days outstanding.",
    ],
    safety: [],
    inspections: [],
    deliveries: [],

    relatedEventIds: ["A-E1", "A-E2", "A-E3"],
  },

  // A-L08 — Feb 9: Early mobilization / weekend prep
  {
    id: "A-L08",
    projectId: "p-mesa-stormdrain-2026",
    date: "2026-02-09",
    shift: "day",
    author: "Foreman Rivera",
    role: "Field Foreman",
    location: "STA 40+50 – 42+00",

    weather: {
      conditions: "clear",
      tempFHigh: 71,
      tempFLow: 47,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Laborer", headcount: 3, hours: 6 },
      { trade: "Operator", headcount: 1, hours: 6 },
      { trade: "Survey Tech", headcount: 1, hours: 4 },
    ],

    equipment: [
      { name: "Vac Truck", count: 1, hoursRun: 4, status: "running" },
      { name: "Mini Excavator", count: 1, hoursRun: 3, status: "running" },
    ],

    workPerformed: [
      "Pre-marked pothole locations between STA 40+50 and STA 42+00 based on plan sheet utility crossings.",
      "Completed 3 potholes at STA 40+50, 40+80, and 41+20 — all utilities at expected locations.",
      "Survey crew shot elevations and offsets for each pothole.",
    ],
    constraints: [
      "Telecom mark-outs still pending for STA 41+00+ area.",
    ],
    safety: [
      "Tailgate: hand-digging protocol within 24 inches of marked utilities.",
    ],
    inspections: [],
    deliveries: [],

    relatedEventIds: [],
  },

  // ===========================================================================
  // PROJECT B — Highway 87 Widening (p-hwy87-widening-2026)
  // Events: B-E1 (production drop), B-E2 (rain docs), B-E3 (culvert clearance)
  // ===========================================================================

  // B-L01 — Feb 8: Strong start, full production
  {
    id: "B-L01",
    projectId: "p-hwy87-widening-2026",
    date: "2026-02-08",
    shift: "day",
    author: "GC PM Watson",
    role: "GC Project Manager",
    location: "Segment A · Sta 148+00 – 150+00",

    weather: {
      conditions: "clear",
      tempFHigh: 78,
      tempFLow: 52,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Operator", headcount: 4, hours: 10 },
      { trade: "Laborer", headcount: 6, hours: 10 },
      { trade: "Teamster", headcount: 3, hours: 10 },
      { trade: "Grade Checker", headcount: 1, hours: 10 },
    ],

    equipment: [
      { name: "CAT D6 Dozer", count: 1, hoursRun: 9, status: "running" },
      { name: "CAT 330 Excavator", count: 1, hoursRun: 9, status: "running" },
      { name: "Compactor (CS56)", count: 1, hoursRun: 7, status: "running" },
      { name: "10-wheel Dump Truck", count: 3, hoursRun: 9, status: "running" },
      { name: "Water Truck", count: 1, hoursRun: 8, status: "running" },
    ],

    workPerformed: [
      "Rough grading Sta 148+00 to 150+00 — moved 1,800 CY fill material.",
      "Compaction in 8-inch lifts per spec, nuclear gauge tests passing (96-98% relative density).",
      "Grade checker confirmed subgrade within +/- 0.05 ft tolerance.",
      "Truck cycle time averaging 14 minutes — on target.",
    ],
    constraints: [],
    safety: [
      "Tailgate: working adjacent to live traffic — spotters assigned at each equipment crossing.",
      "All crew high-vis, hard hats, safety glasses.",
    ],
    inspections: [
      "QA Inspector Singh witnessed 4 nuclear gauge tests — all passing.",
    ],
    deliveries: [
      "1,800 CY structural fill from Mesa Pit — on schedule.",
    ],

    relatedEventIds: [],
  },

  // B-L02 — Feb 9: Rain event, informal documentation
  {
    id: "B-L02",
    projectId: "p-hwy87-widening-2026",
    date: "2026-02-09",
    shift: "day",
    author: "GC PM Watson",
    role: "GC Project Manager",
    location: "Segment A · Project-wide",

    weather: {
      conditions: "rain",
      tempFHigh: 62,
      tempFLow: 48,
      lostTimeHoursWeather: 6,
    },

    labor: [
      { trade: "Operator", headcount: 2, hours: 4 },
      { trade: "Laborer", headcount: 3, hours: 4 },
    ],

    equipment: [
      { name: "CAT D6 Dozer", count: 1, hoursRun: 0, status: "standby" },
      { name: "Compactor (CS56)", count: 1, hoursRun: 0, status: "standby" },
      { name: "Water Truck", count: 1, hoursRun: 0, status: "standby" },
    ],

    workPerformed: [
      "Rain started 06:30, heavy through 11:00. Site too wet for earthwork.",
      "Crews performed equipment maintenance and staged erosion control BMPs.",
      "Sent home at noon.",
    ],
    constraints: [
      "Full day lost to rain. No grading or compaction possible.",
      "Note: need to document this for potential time extension — conditions were unsuitable for earthwork.",
    ],
    safety: [
      "Slip hazard on access road — cones placed.",
    ],
    inspections: [],
    deliveries: [],

    relatedEventIds: ["B-E2"],

    attachments: [
      { type: "photo", title: "Standing water on subgrade Sta 149+00", ref: "IMG_B_0209_rain.jpg" },
    ],
  },

  // B-L03 — Feb 10: Drying day, reduced production
  {
    id: "B-L03",
    projectId: "p-hwy87-widening-2026",
    date: "2026-02-10",
    shift: "day",
    author: "GC PM Watson",
    role: "GC Project Manager",
    location: "Segment A · Sta 149+00 – 151+00",

    weather: {
      conditions: "cloudy",
      tempFHigh: 66,
      tempFLow: 50,
      lostTimeHoursWeather: 2,
    },

    labor: [
      { trade: "Operator", headcount: 3, hours: 8 },
      { trade: "Laborer", headcount: 4, hours: 8 },
      { trade: "Teamster", headcount: 2, hours: 6 },
      { trade: "Grade Checker", headcount: 1, hours: 6 },
    ],

    equipment: [
      { name: "CAT D6 Dozer", count: 1, hoursRun: 5, status: "running" },
      { name: "CAT 330 Excavator", count: 1, hoursRun: 6, status: "running" },
      { name: "Compactor (CS56)", count: 1, hoursRun: 3, status: "running" },
      { name: "10-wheel Dump Truck", count: 2, hoursRun: 6, status: "running" },
      { name: "Water Truck", count: 1, hoursRun: 2, status: "running" },
    ],

    workPerformed: [
      "AM spent drying and re-working subgrade at Sta 149+00. Moisture content 2% above optimum.",
      "Resumed grading at 10:30 — moved 900 CY (50% of normal production).",
      "Compaction tests marginal in AM; passing by PM.",
      "Truck cycle time increased to 22 minutes due to soft haul road conditions.",
    ],
    constraints: [
      "Production at 50% of plan due to wet conditions from yesterday's rain.",
      "Haul road needs grading before full truck fleet can resume.",
    ],
    safety: [
      "Soft ground conditions — operators cautioned on grade stability.",
    ],
    inspections: [
      "QA Inspector Singh: 2 of 4 morning tests below 95% — retested PM and passing.",
    ],
    deliveries: [],

    relatedEventIds: ["B-E1", "B-E2"],
  },

  // B-L04 — Feb 11: Continued below-plan production, rain docs still informal
  {
    id: "B-L04",
    projectId: "p-hwy87-widening-2026",
    date: "2026-02-11",
    shift: "day",
    author: "GC PM Watson",
    role: "GC Project Manager",
    location: "Segment A · Sta 150+00 – 152+00",

    weather: {
      conditions: "clear",
      tempFHigh: 74,
      tempFLow: 48,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Operator", headcount: 4, hours: 10 },
      { trade: "Laborer", headcount: 5, hours: 10 },
      { trade: "Teamster", headcount: 2, hours: 8 },
      { trade: "Grade Checker", headcount: 1, hours: 8 },
    ],

    equipment: [
      { name: "CAT D6 Dozer", count: 1, hoursRun: 8, status: "running" },
      { name: "CAT 330 Excavator", count: 1, hoursRun: 8, status: "running" },
      { name: "Compactor (CS56)", count: 1, hoursRun: 6, status: "running" },
      { name: "10-wheel Dump Truck", count: 2, hoursRun: 8, status: "running" },
      { name: "Water Truck", count: 1, hoursRun: 6, status: "running" },
    ],

    workPerformed: [
      "Grading resumed full operations — moved 1,400 CY (still below target of 1,800).",
      "Compactor passed all tests — subgrade firming up after dry day.",
      "One dump truck down since 14:00 — hydraulic leak on gate mechanism.",
      "Haul road regraded in AM — cycle times improved to 16 minutes.",
    ],
    constraints: [
      "Production trending 22% below plan for the week — cumulative rain impact.",
      "Feb 9 rain day documentation is informal only — no labor/equipment impact detail recorded.",
      "72-hour notice window for time extension claim is approaching (§105.17).",
    ],
    safety: [
      "Tailgate: hydraulic safety — pressurized lines, lock-out tag-out for truck repair.",
    ],
    inspections: [
      "QA Inspector Singh witnessed 6 compaction tests — all passing.",
    ],
    deliveries: [],

    relatedEventIds: ["B-E1", "B-E2"],
  },

  // B-L05 — Feb 12: Production still below plan, culvert clearance issue surfaces
  {
    id: "B-L05",
    projectId: "p-hwy87-widening-2026",
    date: "2026-02-12",
    shift: "day",
    author: "GC PM Watson",
    role: "GC Project Manager",
    location: "Segment A · Sta 151+00 – 153+00",

    weather: {
      conditions: "clear",
      tempFHigh: 76,
      tempFLow: 50,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Operator", headcount: 4, hours: 10 },
      { trade: "Laborer", headcount: 6, hours: 10 },
      { trade: "Teamster", headcount: 3, hours: 10 },
      { trade: "Grade Checker", headcount: 1, hours: 10 },
    ],

    equipment: [
      { name: "CAT D6 Dozer", count: 1, hoursRun: 9, status: "running" },
      { name: "CAT 330 Excavator", count: 1, hoursRun: 9, status: "running" },
      { name: "Compactor (CS56)", count: 1, hoursRun: 7, status: "running" },
      { name: "10-wheel Dump Truck", count: 3, hoursRun: 9, status: "running" },
      { name: "Water Truck", count: 1, hoursRun: 7, status: "running" },
    ],

    workPerformed: [
      "Best day this week — moved 1,650 CY. Approaching target production.",
      "Grading advanced to Sta 153+00. Subgrade looks good.",
      "Identified utility crossing at Sta 151+00 ahead of culvert extension work — APS gas line.",
      "Contacted APS for clearance verification — response expected within 48 hours.",
    ],
    constraints: [
      "Culvert extension at Sta 151+00 cannot start until APS gas line clearance received.",
      "4-day production trend shows cumulative shortfall of ~2,400 CY vs plan.",
    ],
    safety: [
      "Tailgate: proximity to gas line — hand-dig only within 5 ft of marked location.",
    ],
    inspections: [
      "QA Inspector Singh — 8 compaction tests, all passing (96-99%).",
    ],
    deliveries: [
      "Dump truck #3 returned from repair — hydraulic gate fixed.",
    ],

    relatedEventIds: ["B-E1", "B-E3"],
  },

  // B-L06 — Feb 13: Catch-up day, rain documentation formalized, culvert waiting
  {
    id: "B-L06",
    projectId: "p-hwy87-widening-2026",
    date: "2026-02-13",
    shift: "day",
    author: "GC PM Watson",
    role: "GC Project Manager",
    location: "Segment A · Sta 152+00 – 154+00",

    weather: {
      conditions: "wind",
      tempFHigh: 72,
      tempFLow: 46,
      lostTimeHoursWeather: 1,
    },

    labor: [
      { trade: "Operator", headcount: 4, hours: 9 },
      { trade: "Laborer", headcount: 6, hours: 9 },
      { trade: "Teamster", headcount: 3, hours: 9 },
      { trade: "Grade Checker", headcount: 1, hours: 9 },
    ],

    equipment: [
      { name: "CAT D6 Dozer", count: 1, hoursRun: 8, status: "running" },
      { name: "CAT 330 Excavator", count: 1, hoursRun: 8, status: "running" },
      { name: "Compactor (CS56)", count: 1, hoursRun: 7, status: "running" },
      { name: "10-wheel Dump Truck", count: 3, hoursRun: 8, status: "running" },
      { name: "Water Truck", count: 1, hoursRun: 8, status: "running" },
    ],

    workPerformed: [
      "Moved 1,750 CY — near full production. Wind caused 1-hr dust shutdown in AM.",
      "Grading advanced to Sta 154+00. Approaching proof-roll ready zone.",
      "Formalized rain day documentation for Feb 9 — retroactively logged labor/equipment impacts.",
      "Preparing notice package per §105.17 for time extension consideration.",
    ],
    constraints: [
      "APS clearance at Sta 151+00 still pending — culvert extension on hold.",
      "Rain documentation formalized late — notice window is tight (72 hrs from Feb 9 = Feb 12).",
      "Schedule upload has not been updated to reflect actual production shortfall.",
    ],
    safety: [
      "Wind-driven dust required water truck to increase passes. Shut down 1 hr for visibility.",
      "All operators wore N95 masks during dust event.",
    ],
    inspections: [],
    deliveries: [],

    relatedEventIds: ["B-E1", "B-E2", "B-E3"],

    attachments: [
      { type: "pdf", title: "Rain day impact log — Feb 9 retroactive", ref: "RAIN_LOG_0209_RETRO.pdf" },
    ],
  },

  // ===========================================================================
  // PROJECT C — Water Treatment Plant Upgrade (p-ventura-wtp-2026)
  // Events: C-E1 (submittal loop), C-E2 (SCADA/PLC firmware)
  // ===========================================================================

  // C-L01 — Feb 8: Submittal work, initial review comments received
  {
    id: "C-L01",
    projectId: "p-ventura-wtp-2026",
    date: "2026-02-08",
    shift: "day",
    author: "GC Superintendent Morgan",
    role: "Superintendent",
    location: "Admin · Submittals / Plant Site",

    weather: {
      conditions: "clear",
      tempFHigh: 68,
      tempFLow: 50,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Project Engineer", headcount: 1, hours: 8 },
      { trade: "Laborer", headcount: 2, hours: 6 },
      { trade: "Electrician", headcount: 1, hours: 4 },
    ],

    equipment: [
      { name: "Forklift", count: 1, hoursRun: 2, status: "running" },
    ],

    workPerformed: [
      "Received reviewer comments on chlorination skid submittal — 14 comments, 3 marked 'revise and resubmit'.",
      "Key comment: reviewer requesting additional seismic calculations not in original spec scope.",
      "Began preparing resubmittal package with vendor coordination.",
      "Site prep crew cleared temporary laydown area adjacent to chlorination building.",
    ],
    constraints: [
      "Chlorination skid submittal rejected — must address seismic calcs and resubmit.",
      "Vendor turnaround on seismic calcs estimated at 5-7 business days.",
    ],
    safety: [
      "Confined space entry permit reviewed for chemical storage room work next week.",
    ],
    inspections: [],
    deliveries: [],

    relatedEventIds: ["C-E1"],

    attachments: [
      { type: "email", title: "Submittal review comments — chlorination skid", ref: "EMAIL_SUB_REV_0208.pdf" },
    ],
  },

  // C-L02 — Feb 10: Resubmittal prep, site work continues
  {
    id: "C-L02",
    projectId: "p-ventura-wtp-2026",
    date: "2026-02-10",
    shift: "day",
    author: "GC Superintendent Morgan",
    role: "Superintendent",
    location: "Admin · Submittals / Chlorination Building",

    weather: {
      conditions: "cloudy",
      tempFHigh: 64,
      tempFLow: 48,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Project Engineer", headcount: 1, hours: 8 },
      { trade: "Laborer", headcount: 3, hours: 8 },
      { trade: "Pipefitter", headcount: 2, hours: 6 },
    ],

    equipment: [
      { name: "Forklift", count: 1, hoursRun: 3, status: "running" },
      { name: "Scissor Lift", count: 1, hoursRun: 4, status: "running" },
    ],

    workPerformed: [
      "Vendor confirmed seismic calcs will be ready by Feb 13 — fast-tracked at our request.",
      "Project engineer coordinating 2nd resubmittal package — addressing all 14 comments.",
      "Pipefitters began demolition of existing chemical feed piping in chlorination building.",
      "Removed 120 LF of 2-inch PVC chemical feed line and associated valves.",
    ],
    constraints: [
      "Cannot finalize resubmittal until vendor seismic calcs received.",
      "Procurement PO for chlorination skid blocked until submittal approved.",
      "Existing piping demo must be complete before new skid pad poured.",
    ],
    safety: [
      "Chemical residue clearing procedure followed for demo of chemical feed lines.",
      "All hands wore chemical-rated gloves and splash goggles during pipe removal.",
    ],
    inspections: [],
    deliveries: [],

    relatedEventIds: ["C-E1"],
  },

  // C-L03 — Feb 11: SCADA coordination call, firmware mismatch discovered
  {
    id: "C-L03",
    projectId: "p-ventura-wtp-2026",
    date: "2026-02-11",
    shift: "day",
    author: "GC Superintendent Morgan",
    role: "Superintendent",
    location: "Control Room / Chlorination Building",

    weather: {
      conditions: "clear",
      tempFHigh: 70,
      tempFLow: 46,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Electrician", headcount: 2, hours: 8 },
      { trade: "Controls Tech", headcount: 1, hours: 6 },
      { trade: "Laborer", headcount: 2, hours: 8 },
      { trade: "Pipefitter", headcount: 2, hours: 8 },
    ],

    equipment: [
      { name: "Scissor Lift", count: 1, hoursRun: 5, status: "running" },
      { name: "Forklift", count: 1, hoursRun: 2, status: "running" },
    ],

    workPerformed: [
      "Controls tech conducted SCADA pre-integration survey with vendor rep (Ellis) via conference call.",
      "Identified potential firmware mismatch: existing PLC running v3.2, vendor notes indicate v4.0+ required.",
      "Plant Ops Lead Nguyen confirmed current PLC has not been updated since 2019 installation.",
      "Continued chemical feed piping demolition — additional 80 LF removed.",
      "Electricians began conduit routing for new skid power feed — ran 60 ft of 2-inch EMT.",
    ],
    constraints: [
      "PLC firmware version needs formal verification — vendor to provide compatibility matrix.",
      "If firmware update required, may need plant outage window coordination.",
    ],
    safety: [
      "Lockout/tagout on electrical panels E-14 and E-15 for conduit work.",
    ],
    inspections: [],
    deliveries: [
      "2-inch EMT conduit and fittings delivered (contractor supply).",
    ],

    relatedEventIds: ["C-E2"],

    attachments: [
      { type: "email", title: "Vendor SCADA pre-integration call notes", ref: "EMAIL_SCADA_NOTES_0211.pdf" },
    ],
  },

  // C-L04 — Feb 12: Submittal resubmission prep, piping demo complete
  {
    id: "C-L04",
    projectId: "p-ventura-wtp-2026",
    date: "2026-02-12",
    shift: "day",
    author: "GC Superintendent Morgan",
    role: "Superintendent",
    location: "Admin · Submittals / Chlorination Building",

    weather: {
      conditions: "clear",
      tempFHigh: 72,
      tempFLow: 48,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Project Engineer", headcount: 1, hours: 8 },
      { trade: "Laborer", headcount: 3, hours: 8 },
      { trade: "Pipefitter", headcount: 2, hours: 6 },
      { trade: "Carpenter", headcount: 2, hours: 8 },
    ],

    equipment: [
      { name: "Forklift", count: 1, hoursRun: 3, status: "running" },
      { name: "Concrete Mixer (portable)", count: 1, hoursRun: 0, status: "standby" },
    ],

    workPerformed: [
      "Chemical feed piping demolition complete — all old piping and valves removed from chlorination building.",
      "Carpenters began forming skid equipment pad (6 ft x 10 ft x 8 in).",
      "Vendor seismic calcs received — project engineer reviewing for completeness before incorporating.",
      "Resubmittal package approximately 80% assembled.",
    ],
    constraints: [
      "Skid pad concrete pour scheduled for Feb 14, pending resubmittal approval of anchor pattern.",
      "Resubmittal must be submitted by EOD Feb 13 to maintain schedule for reviewer 10-day turnaround.",
    ],
    safety: [
      "Housekeeping inspection: chlorination building demo debris cleared, area broom-clean.",
    ],
    inspections: [
      "Building inspector walkthrough of demo work — no issues noted.",
    ],
    deliveries: [
      "Rebar for skid pad delivered — #4 bars, 12-inch O.C. each way per structural detail.",
    ],

    relatedEventIds: ["C-E1"],
  },

  // C-L05 — Feb 13: Resubmittal sent, firmware matrix received
  {
    id: "C-L05",
    projectId: "p-ventura-wtp-2026",
    date: "2026-02-13",
    shift: "day",
    author: "GC Superintendent Morgan",
    role: "Superintendent",
    location: "Admin · Submittals / Control Room",

    weather: {
      conditions: "cloudy",
      tempFHigh: 64,
      tempFLow: 50,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Project Engineer", headcount: 1, hours: 8 },
      { trade: "Carpenter", headcount: 2, hours: 8 },
      { trade: "Electrician", headcount: 2, hours: 8 },
      { trade: "Controls Tech", headcount: 1, hours: 4 },
    ],

    equipment: [
      { name: "Scissor Lift", count: 1, hoursRun: 4, status: "running" },
      { name: "Forklift", count: 1, hoursRun: 2, status: "running" },
    ],

    workPerformed: [
      "Submitted 2nd resubmittal of chlorination skid package — all 14 reviewer comments addressed.",
      "Vendor (Ellis) provided PLC firmware compatibility matrix. Confirmed: current v3.2 is NOT supported.",
      "Firmware update to v4.1 required before SCADA integration. Estimated 2-day plant outage needed.",
      "Electricians continued conduit routing — 85% of new power feed conduit installed.",
      "Carpenters completed skid pad formwork — ready for rebar placement.",
    ],
    constraints: [
      "PLC firmware update requires coordinated plant outage — Ops Lead Nguyen must schedule.",
      "Firmware update cost and schedule impact not yet quantified.",
      "Submittal approval clock restarted — 10 business days for reviewer turnaround.",
      "Procurement PO still blocked pending approval.",
    ],
    safety: [
      "Elevated work on scissor lift — harness inspections confirmed current.",
    ],
    inspections: [],
    deliveries: [],

    relatedEventIds: ["C-E1", "C-E2"],

    attachments: [
      { type: "pdf", title: "Chlorination skid resubmittal #2", ref: "SUB_CHLOR_SKID_R2.pdf" },
      { type: "pdf", title: "PLC firmware compatibility matrix", ref: "PLC_FW_COMPAT_MATRIX.pdf" },
    ],
  },

  // C-L06 — Feb 9: Early site mobilization / temp systems
  {
    id: "C-L06",
    projectId: "p-ventura-wtp-2026",
    date: "2026-02-09",
    shift: "day",
    author: "GC Superintendent Morgan",
    role: "Superintendent",
    location: "Plant Site — General",

    weather: {
      conditions: "clear",
      tempFHigh: 70,
      tempFLow: 48,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Laborer", headcount: 4, hours: 6 },
      { trade: "Electrician", headcount: 1, hours: 6 },
    ],

    equipment: [
      { name: "Forklift", count: 1, hoursRun: 3, status: "running" },
      { name: "Pickup", count: 2, hoursRun: 4, status: "running" },
    ],

    workPerformed: [
      "Set up temporary construction power panel adjacent to chlorination building.",
      "Established material laydown area and secured perimeter fencing.",
      "Inventoried existing chemical feed system for demo scope verification.",
      "Verified conduit paths against electrical drawings — minor routing conflict noted at panel E-15.",
    ],
    constraints: [
      "Conduit routing conflict at panel E-15 — need to verify clearance with existing wiring.",
    ],
    safety: [
      "Plant orientation for all new crew — emergency exits, chemical hazard zones, muster point.",
    ],
    inspections: [],
    deliveries: [
      "Temporary construction power panel and whips delivered.",
    ],

    relatedEventIds: [],
  },

  // ===========================================================================
  // PROJECT D — Santa Clara River Bridge Rehab (p-scr-bridge-rehab-2026)
  // Events: D-E1 (inspection hold), D-E2 (public escalation), D-E3 (partial schedule)
  // ===========================================================================

  // D-L01 — Feb 8: Pre-construction survey and inspection
  {
    id: "D-L01",
    projectId: "p-scr-bridge-rehab-2026",
    date: "2026-02-08",
    shift: "day",
    author: "GC PM Sato",
    role: "GC Project Manager",
    location: "Bridge — General / Office",

    weather: {
      conditions: "clear",
      tempFHigh: 72,
      tempFLow: 50,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Project Engineer", headcount: 1, hours: 8 },
      { trade: "Survey Tech", headcount: 1, hours: 6 },
      { trade: "Laborer", headcount: 2, hours: 4 },
    ],

    equipment: [
      { name: "Under-bridge Inspection Unit", count: 1, hoursRun: 4, status: "running" },
      { name: "Pickup (Survey)", count: 1, hoursRun: 6, status: "running" },
    ],

    workPerformed: [
      "Pre-construction survey of bridge deck — documented existing crack patterns, spalling locations.",
      "Under-bridge inspection of bearing seats at all 4 supports — photographed and measured.",
      "Bearing seat condition varies: Span 1 & 2 seats show more deterioration than anticipated.",
      "Began assembling schedule logic for deck removal sequencing.",
    ],
    constraints: [
      "Bearing seat condition at Span 2 worse than design drawings indicated — may require additional prep.",
      "Full schedule not yet imported — only partial milestone-level data available.",
    ],
    safety: [
      "Under-bridge unit operator certified — fall protection harness worn during inspection.",
    ],
    inspections: [
      "Bridge Inspector Patel on-site — jointly documented bearing seat condition with photos.",
    ],
    deliveries: [],

    relatedEventIds: ["D-E1", "D-E3"],

    attachments: [
      { type: "photo", title: "Bearing seat Span 2 — deterioration", ref: "IMG_D_SPAN2_BEARING.jpg" },
      { type: "photo", title: "Deck crack map — north approach", ref: "IMG_D_DECK_CRACKS.jpg" },
    ],
  },

  // D-L02 — Feb 10: Detour planning, public affairs coordination begins
  {
    id: "D-L02",
    projectId: "p-scr-bridge-rehab-2026",
    date: "2026-02-10",
    shift: "day",
    author: "GC PM Sato",
    role: "GC Project Manager",
    location: "Office / Bridge Approaches",

    weather: {
      conditions: "clear",
      tempFHigh: 74,
      tempFLow: 48,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Project Engineer", headcount: 1, hours: 8 },
      { trade: "Traffic Control Planner", headcount: 1, hours: 6 },
      { trade: "Laborer", headcount: 2, hours: 4 },
    ],

    equipment: [
      { name: "Pickup", count: 2, hoursRun: 4, status: "running" },
    ],

    workPerformed: [
      "Finalized weekend closure #1 traffic control plan with County traffic ops.",
      "Drove detour routes and verified signage locations — 3 signs need repositioning.",
      "Submitted weekend closure notification to County Public Affairs (Ruiz) for community outreach.",
      "Staged Type III barricades and arrow boards at bridge approaches.",
    ],
    constraints: [
      "Public Affairs has not confirmed community notification timeline for closure #1.",
      "Detour route capacity unverified during peak Saturday morning traffic.",
    ],
    safety: [
      "Inspected all traffic control devices — 2 arrow boards need battery replacement.",
    ],
    inspections: [],
    deliveries: [
      "Type III barricades delivered (12 units), channelizers (50 units).",
    ],

    relatedEventIds: ["D-E2"],
  },

  // D-L03 — Feb 11: Inspector hold point conflict emerges
  {
    id: "D-L03",
    projectId: "p-scr-bridge-rehab-2026",
    date: "2026-02-11",
    shift: "day",
    author: "GC PM Sato",
    role: "GC Project Manager",
    location: "Bridge Span 2 · Bearing seats / Office",

    weather: {
      conditions: "cloudy",
      tempFHigh: 66,
      tempFLow: 50,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Project Engineer", headcount: 1, hours: 8 },
      { trade: "Ironworker", headcount: 2, hours: 6 },
      { trade: "Laborer", headcount: 3, hours: 8 },
    ],

    equipment: [
      { name: "Under-bridge Inspection Unit", count: 1, hoursRun: 3, status: "running" },
      { name: "Forklift", count: 1, hoursRun: 2, status: "running" },
    ],

    workPerformed: [
      "Continued bearing seat assessment at Span 2 with ironworker crew.",
      "Identified additional concrete delamination behind bearing plate — needs chipping and patching before replacement.",
      "Received email from Inspector Patel suggesting we 'proceed with bearing removal on Span 1 while Span 2 prep continues.'",
      "Spec §05.40 defines bearing seat prep as a hold point requiring inspector sign-off BEFORE removal.",
      "Flagged conflicting direction — email says proceed, spec says hold. Requested formal clarification.",
    ],
    constraints: [
      "Cannot proceed with bearing removal until hold point conflict resolved.",
      "Inspector email direction contradicts spec hold point requirement §05.40.",
      "If we proceed without sign-off and work is rejected, tear-out cost estimated at $38K.",
    ],
    safety: [
      "Ironworkers in harnesses on under-bridge unit. All anchorage points inspected.",
    ],
    inspections: [
      "Inspector Patel on-site AM — verbal direction to proceed. Written direction conflicts with spec.",
    ],
    deliveries: [],

    relatedEventIds: ["D-E1"],

    attachments: [
      { type: "email", title: "Inspector Patel email — proceed direction", ref: "EMAIL_INS_PATEL_0211.pdf" },
      { type: "photo", title: "Bearing seat Span 2 — delamination behind plate", ref: "IMG_D_DELAM_SPAN2.jpg" },
    ],
  },

  // D-L04 — Feb 12: Hold zone active, community complaints start arriving
  {
    id: "D-L04",
    projectId: "p-scr-bridge-rehab-2026",
    date: "2026-02-12",
    shift: "day",
    author: "GC PM Sato",
    role: "GC Project Manager",
    location: "Bridge — General / Office",

    weather: {
      conditions: "clear",
      tempFHigh: 74,
      tempFLow: 46,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Project Engineer", headcount: 1, hours: 8 },
      { trade: "Laborer", headcount: 3, hours: 8 },
      { trade: "Carpenter", headcount: 2, hours: 6 },
    ],

    equipment: [
      { name: "Forklift", count: 1, hoursRun: 3, status: "running" },
      { name: "Pickup", count: 2, hoursRun: 4, status: "running" },
    ],

    workPerformed: [
      "Bearing removal on hold pending formal clarification from County PM Howard.",
      "Redirected crew to deck prep — sawcutting demo limits for Section 1.",
      "Carpenters built containment framework for deck demo debris collection.",
      "Project engineer drafted formal RFI requesting written direction on hold point conflict.",
    ],
    constraints: [
      "Bearing work on hold — day 1 of delay on critical path activity.",
      "Received forwarded community complaints from Public Affairs (Ruiz) — 4 emails regarding closure impacts.",
      "Public Affairs has not distributed detour information to community yet.",
    ],
    safety: [
      "Sawcutting crew: dust control with continuous water, hearing protection required.",
    ],
    inspections: [],
    deliveries: [
      "Concrete sawcutting blades delivered (diamond, 14-inch).",
    ],

    relatedEventIds: ["D-E1", "D-E2"],

    attachments: [
      { type: "email", title: "Community complaint email — forwarded from Ruiz", ref: "EMAIL_PUB_COMP_0212.pdf" },
    ],
  },

  // D-L05 — Feb 13: Schedule gaps becoming visible, public pressure increasing
  {
    id: "D-L05",
    projectId: "p-scr-bridge-rehab-2026",
    date: "2026-02-13",
    shift: "day",
    author: "GC PM Sato",
    role: "GC Project Manager",
    location: "Bridge Span 1 / Office",

    weather: {
      conditions: "wind",
      tempFHigh: 68,
      tempFLow: 48,
      lostTimeHoursWeather: 0.5,
    },

    labor: [
      { trade: "Project Engineer", headcount: 1, hours: 8 },
      { trade: "Laborer", headcount: 4, hours: 8 },
      { trade: "Carpenter", headcount: 2, hours: 8 },
      { trade: "Ironworker", headcount: 2, hours: 4 },
    ],

    equipment: [
      { name: "Concrete Saw", count: 1, hoursRun: 5, status: "running" },
      { name: "Forklift", count: 1, hoursRun: 3, status: "running" },
      { name: "Under-bridge Inspection Unit", count: 1, hoursRun: 0, status: "standby" },
    ],

    workPerformed: [
      "Completed sawcutting demo limits on deck Section 1 (Span 1) — 480 SF outlined.",
      "Carpenters set debris containment nets under Span 1 for demo work.",
      "Attempted to build full critical path schedule — discovered missing logic for striping, joint work, and reopen milestones.",
      "Only 60% of activities have predecessors/successors defined in imported schedule data.",
      "County PM Howard acknowledged hold point conflict but has not issued formal direction.",
    ],
    constraints: [
      "Bearing removal still on hold — day 2 of delay.",
      "Schedule is incomplete: deck pour, joints, striping, and reopen tasks have no predecessor logic.",
      "Community email count up to 8 — Public Affairs scheduled community meeting for Feb 17.",
      "Forecast confidence is low due to schedule coverage gaps.",
    ],
    safety: [
      "Wind gusts to 35 mph — suspended under-bridge unit operations for 30 min.",
      "Secured loose materials and tarps on bridge deck.",
    ],
    inspections: [
      "Inspector Patel on-site — inspected sawcut lines. Approved demo limits for Span 1.",
    ],
    deliveries: [],

    relatedEventIds: ["D-E1", "D-E2", "D-E3"],
  },

  // D-L06 — Feb 9: Material staging and mobilization
  {
    id: "D-L06",
    projectId: "p-scr-bridge-rehab-2026",
    date: "2026-02-09",
    shift: "day",
    author: "GC PM Sato",
    role: "GC Project Manager",
    location: "Bridge Approaches / Staging Area",

    weather: {
      conditions: "clear",
      tempFHigh: 72,
      tempFLow: 46,
      lostTimeHoursWeather: 0,
    },

    labor: [
      { trade: "Laborer", headcount: 3, hours: 6 },
      { trade: "Teamster", headcount: 1, hours: 6 },
    ],

    equipment: [
      { name: "Flatbed Truck", count: 1, hoursRun: 4, status: "running" },
      { name: "Forklift", count: 1, hoursRun: 3, status: "running" },
      { name: "Pickup", count: 2, hoursRun: 4, status: "running" },
    ],

    workPerformed: [
      "Established staging area on south approach — graded and compacted pad for material storage.",
      "Received and inventoried bearing assemblies (4 sets, elastomeric w/ steel plates).",
      "Staged containment tarps, debris nets, and demolition equipment on site.",
      "Verified crane access path on north approach — adequate clearance for 80-ton mobile crane.",
    ],
    constraints: [
      "Crane mobilization scheduled for weekend closure #1 (March 14) — long lead coordination required.",
    ],
    safety: [
      "Flagged overhead power line clearance on north approach — minimum 15 ft maintained for crane swing.",
    ],
    inspections: [],
    deliveries: [
      "4 bearing assemblies delivered and inventoried — stored in staging area.",
      "Debris containment nets and tarps delivered.",
    ],

    relatedEventIds: [],
  },
];
