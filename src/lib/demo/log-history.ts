export interface DailyLog {
  date: string;
  weather: string;
  temperature: string;
  workforce: string;
  equipment: string;
  workPerformed: string;
  materials: string;
  safety: string;
  visitors: string;
  score?: number;
}

export const SAMPLE_LOG_ENTRY = `Weather: Clear, 78°F
Workforce: 12 laborers, 3 operators, 2 foremen (Martinez, Garcia)
Equipment: CAT 320 excavator, JD 310 backhoe, 2x dump trucks, plate compactor

Work Performed:
- Continued storm drain installation STA 40+00 to STA 41+50
- Installed 120 LF of 36" RCP, laser-aligned per spec §301.4
- Began trench backfill STA 39+00 to STA 40+00, 8-inch lifts per §301.2
- Compaction testing at STA 39+50 — passed 92% relative compaction

Materials Received:
- 6x 36" RCP sections delivered
- 2 yards Class B bedding aggregate

Safety: Toolbox talk on trench safety per Cal/OSHA. All shoring in place.
Visitors: Engineer Torres on-site 10:00-11:30 AM, inspected pipe installation at STA 40+75.`;

export const logHistory: DailyLog[] = [
  {
    date: "2026-02-05",
    weather: "Clear, 72°F",
    temperature: "72°F",
    workforce: "14 total",
    equipment: "CAT 320, JD 310, 2 dump trucks",
    workPerformed: "Storm drain STA 38+00 to 39+50. 180 LF of 36\" RCP.",
    materials: "8x RCP sections, bedding aggregate",
    safety: "Toolbox talk conducted",
    visitors: "None",
    score: 78,
  },
  {
    date: "2026-02-06",
    weather: "Partly cloudy, 68°F",
    temperature: "68°F",
    workforce: "12 total",
    equipment: "CAT 320, JD 310, plate compactor",
    workPerformed: "Backfill and compaction STA 37+00 to 38+00. Compaction testing passed.",
    materials: "Class B bedding, backfill material",
    safety: "Shoring inspected",
    visitors: "City inspector — passed compaction test",
    score: 82,
  },
  {
    date: "2026-02-07",
    weather: "Clear, 75°F",
    temperature: "75°F",
    workforce: "15 total",
    equipment: "Full spread",
    workPerformed: "CB-5 junction structure formwork. Storm drain STA 39+50 to 40+00. Potholing crew noted possible utility marking at STA 42+00 during advance survey — flagged for verification next week.",
    materials: "Concrete forms, rebar, 4x RCP sections",
    safety: "No incidents",
    visitors: "Engineer Torres — reviewed CB-5 rebar",
    score: 85,
  },
  {
    date: "2026-02-08",
    weather: "Clear",
    temperature: "74°F",
    workforce: "10",
    equipment: "Backhoe, compactor",
    workPerformed: "Continued backfill. Poured CB-5 concrete.",
    materials: "12 CY concrete",
    safety: "OK",
    visitors: "None",
    score: 58,
  },
  {
    date: "2026-02-10",
    weather: "Clear, 78°F",
    temperature: "78°F",
    workforce: "12 laborers, 3 operators, 2 foremen",
    equipment: "CAT 320, JD 310, 2 dump trucks, plate compactor",
    workPerformed: "Storm drain STA 40+00 to 41+50. Encountered unmarked water main at 42+50.",
    materials: "6x 36\" RCP, bedding aggregate",
    safety: "Toolbox talk — trench safety",
    visitors: "Engineer Torres 10:00-11:30",
    score: 76,
  },
];
