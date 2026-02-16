export type BriefingRoom =
  | "city-hall"
  | "conference-room"
  | "field-trailer"
  | "jobsite"
  | "truck";

export interface Persona {
  id: string;
  emoji: string;
  name: string;
  role: string;
  cares: string;
  readingLevel: number;
  defaultFormality: number;
  defaultRoom: BriefingRoom;
}

export const personas: Persona[] = [
  {
    id: "chen",
    emoji: "\u{1F454}",
    name: "Director Chen",
    role: "Public Works Director",
    cares: "Timeline, budget, politics",
    readingLevel: 8,
    defaultFormality: 0.7,
    defaultRoom: "city-hall",
  },
  {
    id: "rawlings",
    emoji: "\u{1F4B0}",
    name: "CFO Rawlings",
    role: "Finance Director",
    cares: "Budget variance, contingency, change orders",
    readingLevel: 7,
    defaultFormality: 0.8,
    defaultRoom: "conference-room",
  },
  {
    id: "torres",
    emoji: "\u{1F527}",
    name: "Engineer Torres",
    role: "City Engineer",
    cares: "Technical accuracy, spec compliance, design impacts",
    readingLevel: 9,
    defaultFormality: 0.6,
    defaultRoom: "field-trailer",
  },
  {
    id: "martinez",
    emoji: "\u{1F9BA}",
    name: "Foreman Martinez",
    role: "General Contractor Superintendent",
    cares: "Schedule, crew allocation, material delivery",
    readingLevel: 6,
    defaultFormality: 0.4,
    defaultRoom: "jobsite",
  },
];

export interface RoomConfig {
  id: BriefingRoom;
  name: string;
  emoji: string;
  tone: string;
  maxLength: string;
  includes: string[];
  excludes: string[];
}

export const BRIEFING_ROOMS: RoomConfig[] = [
  {
    id: "city-hall",
    name: "City Hall",
    emoji: "\u{1F3DB}\uFE0F",
    tone: "Formal, cautious",
    maxLength: "2-3 paragraphs",
    includes: ["Budget impact", "milestone status", "political framing"],
    excludes: ["Technical jargon", "uncertainty", "blame"],
  },
  {
    id: "conference-room",
    name: "Conference Room",
    emoji: "\u{1F4CA}",
    tone: "Professional, thorough",
    maxLength: "Full briefing",
    includes: ["Data", "comparisons", "options", "recommendations"],
    excludes: ["Casual language", "assumptions"],
  },
  {
    id: "field-trailer",
    name: "Field Trailer",
    emoji: "\u{1F690}",
    tone: "Direct, collegial",
    maxLength: "Working length",
    includes: ["Specs", "RFI refs", "schedule", "real numbers"],
    excludes: ["Political spin", "over-formality"],
  },
  {
    id: "jobsite",
    name: "Jobsite",
    emoji: "\u{1F9BA}",
    tone: "Immediate, directive",
    maxLength: "3-4 sentences max",
    includes: ["What to do", "where", "when"],
    excludes: ["Background", "justification", "options"],
  },
  {
    id: "truck",
    name: "The Truck",
    emoji: "\u{1F4F1}",
    tone: "Quick, verbal",
    maxLength: "Voice-note length",
    includes: ["Headline", "ask", "timeline"],
    excludes: ["Detail", "attachments", "formality"],
  },
];

export function getPersona(id: string): Persona | undefined {
  return personas.find((p) => p.id === id);
}

export function getRoom(id: BriefingRoom): RoomConfig | undefined {
  return BRIEFING_ROOMS.find((r) => r.id === id);
}
