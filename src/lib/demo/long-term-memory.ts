export interface PMBehavior {
  pattern: string;
  description: string;
  confidence: number;
  source: string;
}

export interface Nudge {
  id: string;
  trigger: string[];
  message: string;
  type: "warning" | "suggestion" | "pattern" | "insight";
  source: string;
}

export interface PriorProject {
  name: string;
  value: number;
  completion: string;
  lessons: string[];
}

export interface LongTermMemory {
  pmId: string;
  pmName: string;
  projectCount: number;
  behaviors: PMBehavior[];
  nudges: Nudge[];
  priorProjects: PriorProject[];
  communicationStyle: {
    formality: number;
    technicalDetail: number;
    urgencyBias: number;
    optimismBias: number;
  };
  rfiAccuracy: number;
  logQualityAvg: number;
}

export const LONG_TERM_MEMORY: LongTermMemory = {
  pmId: "pm-001",
  pmName: "Project Manager",
  projectCount: 2,
  behaviors: [
    {
      pattern: "Friday log quality drops 23%",
      description:
        "Log entries on Fridays consistently score lower — shorter descriptions, missing weather data, fewer photo references.",
      confidence: 0.87,
      source: "Riverside Flood Control + Highway 87",
    },
    {
      pattern: "RFI response accuracy: 94%",
      description:
        "RFIs generated with this PM's context rarely need revision. Spec references are accurate 94% of the time.",
      confidence: 0.94,
      source: "42 RFIs across 2 projects",
    },
    {
      pattern: "Delay escalation lag: 2.3 days average",
      description:
        "Time between identifying a delay-causing condition and escalating to stakeholders averages 2.3 days. Industry average is 5.8 days.",
      confidence: 0.78,
      source: "Riverside Flood Control",
    },
    {
      pattern: "Change order negotiation: 8% below initial estimate",
      description:
        "Final negotiated change order amounts average 8% below initial cost estimates.",
      confidence: 0.71,
      source: "Highway 87 Widening",
    },
    {
      pattern: "Communication preference: data-first",
      description:
        "PM tends to lead with data and cost figures before narrative context. Most effective with finance stakeholders.",
      confidence: 0.82,
      source: "Communication analysis across both projects",
    },
  ],
  nudges: [
    {
      id: "nudge-friday",
      trigger: ["friday", "end of week", "weekly"],
      message:
        "Your Friday logs have historically scored 23% lower than weekday averages. Consider using the structured log template today.",
      type: "warning",
      source: "Behavioral Pattern — Riverside & Highway 87",
    },
    {
      id: "nudge-notice",
      trigger: ["notice", "48 hours", "deadline", "clock", "differing"],
      message:
        "On Riverside Flood Control, a missed 48-hour notice window cost $28K in disputed change order. Make sure notice documentation is filed.",
      type: "warning",
      source: "Lesson Learned — Riverside Flood Control",
    },
    {
      id: "nudge-water-main",
      trigger: ["water main", "unmarked", "utility", "conflict", "DIP"],
      message:
        "Similar unmarked utility on Highway 87 resolved with 10-foot offset and protective sleeve. Resolution took 8 days. Cost: $32K.",
      type: "insight",
      source: "Historical Resolution — Highway 87 Widening",
    },
    {
      id: "nudge-rfi",
      trigger: ["RFI", "request for information", "spec reference"],
      message:
        "Your RFI spec references are accurate 94% of the time — among the highest tracked. Keep citing specific section numbers.",
      type: "pattern",
      source: "42 RFIs across 2 projects",
    },
    {
      id: "nudge-stakeholder",
      trigger: ["stakeholder", "director", "executive", "brief", "communicate"],
      message:
        "Your data-first communication style works best with CFO Rawlings (92% approval rate) but consider leading with narrative for Director Chen.",
      type: "suggestion",
      source: "Communication Pattern Analysis",
    },
    {
      id: "nudge-compaction",
      trigger: ["compaction", "backfill", "density", "soil"],
      message:
        "On Highway 87, compaction failures in Section 3 added 6 days. Root cause was lift thickness exceeding 8 inches. Spec requires 8-inch max lifts.",
      type: "insight",
      source: "Historical Issue — Highway 87 Widening",
    },
    {
      id: "nudge-delay",
      trigger: ["delay", "behind schedule", "critical path", "float"],
      message:
        "Your escalation timing (2.3-day avg) is better than industry average (5.8 days). Early escalation on Riverside saved an estimated $45K in acceleration costs.",
      type: "pattern",
      source: "Behavioral Pattern — Riverside Flood Control",
    },
    {
      id: "nudge-encroachment",
      trigger: ["utility", "water main", "proximity", "encroachment", "permit"],
      message:
        "On Highway 87, work near an existing gas line required a utility encroachment permit — processing took 23 business days. Schedule was delayed 30 calendar days because the permit wasn't requested until after discovery. Request permits immediately upon identifying utility conflicts.",
      type: "warning",
      source: "Historical Resolution — Highway 87 Widening",
    },
  ],
  priorProjects: [
    {
      name: "Riverside Flood Control",
      value: 3100000,
      completion: "Completed March 2025",
      lessons: [
        "Missed 48-hour notice on differing site condition cost $28K",
        "Early stakeholder escalation saved $45K in acceleration",
        "CCTV inspection caught 3 joint failures before backfill",
      ],
    },
    {
      name: "Highway 87 Widening",
      value: 6800000,
      completion: "Completed November 2025",
      lessons: [
        "Unmarked utility resolved with 10-foot offset + sleeve — 8 days, $32K",
        "Compaction failures from oversized lifts added 6 days in Section 3",
        "Staged traffic control saved 4 days vs full closure",
        "Utility encroachment permit from gas company took 23 business days — request immediately upon discovery",
      ],
    },
  ],
  communicationStyle: {
    formality: 0.6,
    technicalDetail: 0.8,
    urgencyBias: 0.5,
    optimismBias: 0.4,
  },
  rfiAccuracy: 0.94,
  logQualityAvg: 72,
};

export function matchNudges(input: string): Nudge[] {
  const inputLower = input.toLowerCase();
  return LONG_TERM_MEMORY.nudges.filter((nudge) =>
    nudge.trigger.some((t) => inputLower.includes(t.toLowerCase()))
  );
}
