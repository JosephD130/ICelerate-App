# CLAUDE.md — ICelerate V4.0 Build Plan

## What This Is

ICelerate V4.0 is a decision intelligence layer for infrastructure and construction project managers. It ingests fragmented project data, normalizes it into structured DecisionEvents, and generates role-adapted outputs that accelerate decisions, reduce risk, and align the field with the office.

**One-liner:** ICelerate transforms fragmented field data into defensible, contract-aware, executive-ready decisions while maintaining operational realism.

**Built for:** "Built with Opus 4.6" Claude Code Hackathon (Feb 10–16, 2026). Deadline: Feb 16, 3:00 PM EST.

---

## Ecosystem Architecture

ICelerate operates as a reasoning layer connecting field conditions, contractual obligations, and executive narratives into one continuous intelligence system. Five integrated layers:

### Layer 1: Data Ingestion
Inputs include spreadsheets, email threads, PDFs (contracts/specs), construction management systems, daily logs, field photos, and mobile reports. For hackathon demo: pre-parsed document chunks.

### Layer 2: Normalization (DecisionEvent Schema)
All inputs map to a unified DecisionEvent schema:

```typescript
interface DecisionEvent {
  id: string;
  trigger: string;                    // What initiated this event
  location: {
    station?: string;                 // STA 42+50
    zone?: string;                    // Phase 2, Area B
    coordinates?: [number, number];
  };
  costExposure: {
    estimated: number;
    confidence: 'low' | 'medium' | 'high';
    contingencyImpact: number;        // Percentage of remaining contingency
  };
  scheduleImpact: {
    days: number;
    criticalPath: boolean;
    milestoneAffected?: string;
  };
  contractReferences: {
    section: string;
    clause: string;
    noticeRequired: boolean;
    noticeDays?: number;
  }[];
  stakeholders: {
    role: string;
    action: 'inform' | 'approve' | 'decide';
    priority: number;
  }[];
  resolutionState: 'open' | 'pending' | 'resolved' | 'escalated';
  outputs: {
    type: 'rfi' | 'change-order' | 'notice' | 'briefing' | 'field-directive';
    status: 'draft' | 'sent' | 'approved';
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Briefing Room Types
```typescript
// lib/types.ts

export type BriefingRoom = 'city-hall' | 'conference-room' | 'field-trailer' | 'jobsite' | 'truck';

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
    id: 'city-hall',
    name: 'City Hall',
    emoji: '🏛️',
    tone: 'Formal, cautious',
    maxLength: '2-3 paragraphs',
    includes: ['Budget impact', 'milestone status', 'political framing'],
    excludes: ['Technical jargon', 'uncertainty', 'blame'],
  },
  {
    id: 'conference-room',
    name: 'Conference Room',
    emoji: '📊',
    tone: 'Professional, thorough',
    maxLength: 'Full briefing',
    includes: ['Data', 'comparisons', 'options', 'recommendations'],
    excludes: ['Casual language', 'assumptions'],
  },
  {
    id: 'field-trailer',
    name: 'Field Trailer',
    emoji: '🚐',
    tone: 'Direct, collegial',
    maxLength: 'Working length',
    includes: ['Specs', 'RFI refs', 'schedule', 'real numbers'],
    excludes: ['Political spin', 'over-formality'],
  },
  {
    id: 'jobsite',
    name: 'Jobsite',
    emoji: '🦺',
    tone: 'Immediate, directive',
    maxLength: '3-4 sentences max',
    includes: ['What to do', 'where', 'when'],
    excludes: ['Background', 'justification', 'options'],
  },
  {
    id: 'truck',
    name: 'The Truck',
    emoji: '📱',
    tone: 'Quick, verbal',
    maxLength: 'Voice-note length',
    includes: ['Headline', 'ask', 'timeline'],
    excludes: ['Detail', 'attachments', 'formality'],
  },
];
```

### Layer 3: Dual Memory

**Short-Term Memory (Project-Scoped):** 
RAG engine holding uploaded project documents (contract, specs, schedule), daily logs, RFI history, change orders. Built when PM uploads docs. Dies when project closes.

**Long-Term Memory (PM-Scoped):** 
Persists across all projects. Built passively from PM behavior: communication style, recurring risks, historical resolution trends, RFIs generated, log quality patterns.

### Layer 4: Intelligence Core (Claude Opus 4.6)
- Multi-document reasoning across contracts, specs, schedules, logs
- Contract-aware scoring and compliance checking
- Role adaptation for different stakeholder audiences
- Decision velocity modeling
- Field-to-office alignment detection

### Layer 5: Export & Decision
- Decision registers (CSV)
- Executive briefings (PowerPoint)
- Compliance summaries (PDF)
- Stakeholder-ready communications

---

## 4-Station Pipeline

**Capture → Analyze → Decide → Communicate**

| Station | Tool | Function |
|---------|------|----------|
| Capture | Field Report | Converts field observations into structured DecisionEvents |
| Analyze | RFI Generator | Converts plain-language issues into specification-referenced RFIs |
| Decide | Decision Package | Generates stakeholder-adapted communications simultaneously |
| Communicate | Translator | Reframes updates by audience role and reading level |
| Monitor | Pulse | Scores daily logs against contractual obligations, surfaces risk trends |

---

## Core Tools

### 1. Field Report (Capture)
**Input:** Free-text field observation, location, photos
**Output:** Structured DecisionEvent with cost exposure, schedule impact, contract refs, stakeholder routing
**Opus 4.6 Value:** Infers missing data from project context, identifies contract implications from plain language

### 2. RFI Generator (Analyze)
**Input:** Plain-language issue description, location, urgency
**Output:** Formal RFI with spec references, notice requirements, response deadline
**Opus 4.6 Value:** Multi-step reasoning: search 150+ pages, find relevant specs, check if already answered, identify notice requirements

### 3. Decision Package (Decide)
**Input:** Single field condition or DecisionEvent
**Output:** Simultaneous stakeholder-adapted communications (Executive, CFO, Engineer, Contractor)
**Opus 4.6 Value:** Generates 4 distinct communications from one input, each calibrated to audience role and reading level

### 4. Translator (Communicate)
**Input:** Technical update, target persona, tone sliders (formality, urgency, optimism)
**Output:** Adapted communication, persona reaction, jargon mapping
**Opus 4.6 Value:** Real-time adaptation based on slider values, injects project data at high formality

### 5. Pulse (Monitor)
**Input:** Daily log entry
**Output:** Quality scores, contract cross-references, schedule implications, risk trends
**Opus 4.6 Value:** Reasons across log + contract + schedule + historical logs simultaneously

---

## The Briefing Room (Context-Adaptive Communication)

Physical spaces have communication norms baked in. PMs already code-switch based on where they're standing. The Briefing Room makes this explicit — select a space, and the output adapts to that context.

### The Spaces

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     🏛️ CITY HALL              📊 CONFERENCE ROOM           │
│     ┌───────────┐              ┌───────────┐               │
│     │  Formal   │              │ Analytical│               │
│     │  Political│              │ Data-heavy│               │
│     │  Defensive│              │ Structured│               │
│     └───────────┘              └───────────┘               │
│                                                             │
│     🚐 FIELD TRAILER           🦺 JOBSITE                   │
│     ┌───────────┐              ┌───────────┐               │
│     │  Working  │              │ Immediate │               │
│     │  Practical│              │ Directive │               │
│     │  Honest   │              │ No fluff  │               │
│     └───────────┘              └───────────┘               │
│                                                             │
│                    📱 THE TRUCK                             │
│                    ┌───────────┐                           │
│                    │  Quick    │                           │
│                    │  Mobile   │                           │
│                    │  Verbal   │                           │
│                    └───────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Space Characteristics

| Space | Tone | Length | Includes | Excludes |
|-------|------|--------|----------|----------|
| **City Hall** | Formal, cautious | 2-3 paragraphs | Budget impact, milestone status, political framing | Technical jargon, uncertainty, blame |
| **Conference Room** | Professional, thorough | Full briefing | Data, comparisons, options, recommendations | Casual language, assumptions |
| **Field Trailer** | Direct, collegial | Working length | Specs, RFI refs, schedule, real numbers | Political spin, over-formality |
| **Jobsite** | Immediate, directive | 3-4 sentences max | What to do, where, when | Background, justification, options |
| **The Truck** | Quick, verbal | Voice-note length | Headline, ask, timeline | Detail, attachments, formality |

### How Persona + Room Interact

The room modifies the persona output — same person, different context:

| Persona + Room | Result |
|----------------|--------|
| Director Chen + City Hall | Maximum formality, political awareness, defensive positioning |
| Director Chen + Field Trailer | Still executive-level content, but working tone, real talk |
| Foreman Martinez + Jobsite | Pure directive, zone-based, no preamble |
| Foreman Martinez + Conference Room | Still practical, but structured for meeting format |

### Sample Output by Room

**Input:** Unmarked 12" water main at STA 42+50, $45K impact, 12-day delay

**City Hall:**
> The Phase 2 utility work has identified a previously undocumented water main that requires design coordination. We're evaluating options to maintain the August milestone. Current exposure is within contingency at approximately 1% of contract value. We'll have a recommendation by end of week.

**Field Trailer:**
> Found an unmarked 12-inch DIP at 42+50 — conflicts with our storm drain alignment. Contractor wants 15-foot offset. I'm getting Torres to look at the CB-7 revision. Probably $45K and 12 days if we go that route. Need to decide by Friday or we burn float.

**Jobsite:**
> Hold at 42+50. Unmarked water main. Don't dig past the east flag until I clear it. Probably tomorrow afternoon.

**The Truck:**
> Hey, heads up — we hit an unmarked main at 42+50. Might be 12 days and $45K. Call me when you're free.

### Visual Treatment

Isometric or top-down floor plan with blueprint line style. Selected room gets orange glow/border. Persona avatar appears inside selected room. Unselected rooms dim to blueprint blue.

---

## Reality Sync Layer (Field-to-Office Alignment Engine)

The Reality Sync Panel lives inside the Project Nucleus and is always visible. It connects three information streams:

### Panel Structure

**Field Reality:**
- Real-time summary of logs
- Hold zones and idle equipment
- Active constraints and blockers

**Contract Position:**
- Relevant clause requirements
- Notice clocks and deadlines
- Documentation status

**Office Narrative:**
- Current schedule assumptions
- Forecast impact projections
- Contingency usage

### Alignment Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Synced | Green | Field, contract, and office assumptions align |
| Drift Detected | Yellow | Minor inconsistencies between field activity and office assumptions |
| High Risk Misalignment | Red | Field conditions contradict executive narrative or contractual obligations |

### Drift Detection Logic
Drift triggers when:
- Idle time exceeds modeled delay assumptions
- Notice windows are expiring without logging
- Schedule forecasts contradict field hold zones
- Cost burn rate diverges from progress

---

## Decision Velocity Engine

**Traditional Path:** Field condition → PM writes email → waits for response → writes another email → decision → field clearance = **18 days**

**ICelerate Path:** Field condition → multi-stakeholder package → decision cascade → field clearance = **minutes**

The engine:
1. Captures field condition
2. Enriches with contract/schedule context
3. Routes to appropriate decision-makers based on confidence
4. High-certainty issues bypass manual review
5. Executes decision cascade
6. Closes loop with field
7. Learns from resolution for future patterns

---

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS v4
- **AI:** Claude Opus 4.6 API (`claude-opus-4-6`) — streaming via SSE
- **Storage:** IndexedDB via `idb` (short-term), localStorage (long-term MVP)
- **Icons:** Lucide React
- **Fonts:** Outfit (primary), Space Mono (monospace)

---

## Project Structure

```
icelerate-v4/
├── src/
│   ├── app/
│   │   ├── page.tsx                        # Landing page
│   │   ├── layout.tsx                      # Root layout, fonts, metadata
│   │   ├── globals.css                     # Tailwind + CSS custom properties
│   │   ├── workspace/
│   │   │   ├── layout.tsx                  # Workspace shell with sidebar + Reality Sync
│   │   │   ├── page.tsx                    # Project home (tool cards)
│   │   │   ├── field-report/page.tsx       # Field Report (Capture)
│   │   │   ├── rfi/page.tsx                # RFI Generator (Analyze)
│   │   │   ├── decision/page.tsx           # Decision Package (Decide)
│   │   │   ├── translator/page.tsx         # Translator (Communicate)
│   │   │   ├── pulse/page.tsx              # Pulse (Monitor)
│   │   │   └── dashboard/page.tsx          # PM Dashboard (scores, DISC, archetype)
│   │   └── api/
│   │       ├── chat/route.ts               # Unified streaming endpoint
│   │       └── analyze/route.ts            # Structured analysis endpoint
│   ├── components/
│   │   ├── landing/
│   │   │   └── LandingPage.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── RealitySyncPanel.tsx        # Always-visible alignment indicator
│   │   │   └── ProjectNucleus.tsx          # Central project status hub
│   │   ├── tools/
│   │   │   ├── field-report/
│   │   │   │   ├── FieldObservationForm.tsx
│   │   │   │   └── DecisionEventOutput.tsx
│   │   │   ├── rfi/
│   │   │   │   ├── FieldConditionForm.tsx
│   │   │   │   ├── VerdictPanel.tsx
│   │   │   │   └── GeneratedRFI.tsx
│   │   │   ├── decision/
│   │   │   │   ├── ConditionInput.tsx
│   │   │   │   ├── StakeholderPanel.tsx
│   │   │   │   ├── AccelerationMetrics.tsx
│   │   │   │   └── DecisionCascade.tsx
│   │   │   ├── translator/
│   │   │   │   ├── PersonaCard.tsx
│   │   │   │   ├── ToneSliders.tsx
│   │   │   │   ├── TranslationOutput.tsx
│   │   │   │   ├── JargonXRay.tsx
│   │   │   │   └── PersonaReaction.tsx
│   │   │   ├── pulse/
│   │   │   │   ├── LogEntry.tsx
│   │   │   │   ├── LogScore.tsx
│   │   │   │   ├── ProjectChat.tsx
│   │   │   │   └── RiskTrends.tsx
│   │   │   └── dashboard/
│   │   │       ├── EngineerScore.tsx
│   │   │       ├── DISCQuadrant.tsx
│   │   │       └── ArchetypeCard.tsx
│   │   └── shared/
│   │       ├── Badge.tsx
│   │       ├── ScoreBar.tsx
│   │       ├── SectionTitle.tsx
│   │       ├── Pill.tsx
│   │       ├── Slider.tsx
│   │       ├── BriefingRoom.tsx            # City Hall/Conference/Trailer/Jobsite/Truck selector
│   │       └── StatusIndicator.tsx         # Green/Yellow/Red alignment status
│   ├── lib/
│   │   ├── claude.ts                       # Claude API client, streaming helpers
│   │   ├── types.ts                        # DecisionEvent, Persona, etc.
│   │   ├── memory/
│   │   │   ├── short-term.ts               # IndexedDB ops, document retrieval
│   │   │   ├── long-term.ts                # PM behavioral patterns
│   │   │   └── context-builder.ts          # Builds context window for Claude
│   │   ├── alignment/
│   │   │   ├── drift-detector.ts           # Reality Sync drift logic
│   │   │   └── alignment-scorer.ts         # Field/Contract/Office alignment
│   │   ├── prompts/
│   │   │   ├── field-report-system.ts
│   │   │   ├── rfi-system.ts
│   │   │   ├── decision-system.ts
│   │   │   ├── translator-system.ts
│   │   │   ├── pulse-system.ts
│   │   │   └── personality-system.ts
│   │   └── demo/
│   │       ├── project-data.ts             # Demo project metadata
│   │       ├── documents.ts                # Pre-parsed contract/spec chunks
│   │       ├── log-history.ts              # Sample daily logs
│   │       ├── rfi-history.ts              # Sample RFI records
│   │       ├── long-term-memory.ts         # Mock PM behavioral data
│   │       └── personas.ts                 # Stakeholder personas
├── public/
│   └── logo.png                            # ICelerate logo
├── .env.local                              # ANTHROPIC_API_KEY
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## Design System — "The Blueprint"

### Design Philosophy
The visual identity is rooted in construction itself. Deep navy backgrounds reference blueprint paper. Construction orange accents reference barricades, safety cones, and MUTCD signage. Every PM has seen these colors on a jobsite. The app should feel like it was built by someone who's been in the field.

### Colors (CSS Custom Properties)
```css
:root {
  /* Base palette — blueprint navy */
  --bg: #0A1628;
  --surface: #0F1D32;
  --surface-hover: #142640;
  --card: #122035;
  --card-hover: #1A2D4A;
  --border: #1E3A5F;
  --border-focus: #FF6B35;

  /* Text */
  --text: #E2E8F0;
  --text-muted: #8899AA;
  --text-dim: #556677;

  /* Primary accent — construction orange */
  --accent: #FF6B35;
  --accent-dim: rgba(255,107,53,0.15);
  --accent-glow: rgba(255,107,53,0.3);
  --accent-hover: #FF8255;

  /* Semantic colors — jobsite safety palette */
  --red: #EF4444;
  --red-dim: rgba(239,68,68,0.15);
  --yellow: #F59E0B;
  --yellow-dim: rgba(245,158,11,0.15);
  --green: #22C55E;
  --green-dim: rgba(34,197,94,0.15);
  --blue: #3B82F6;
  --blue-dim: rgba(59,130,246,0.15);
  --purple: #A78BFA;
  --purple-dim: rgba(167,139,250,0.15);
}
```

### Tailwind Config Extension
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        card: "var(--card)",
        "card-hover": "var(--card-hover)",
        border: "var(--border)",
        "border-focus": "var(--border-focus)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        "text-dim": "var(--text-dim)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        "accent-glow": "var(--accent-glow)",
        "accent-hover": "var(--accent-hover)",
        semantic: {
          red: "var(--red)",
          "red-dim": "var(--red-dim)",
          yellow: "var(--yellow)",
          "yellow-dim": "var(--yellow-dim)",
          green: "var(--green)",
          "green-dim": "var(--green-dim)",
          blue: "var(--blue)",
          "blue-dim": "var(--blue-dim)",
          purple: "var(--purple)",
          "purple-dim": "var(--purple-dim)",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
        input: "10px",
        pill: "99px",
      },
    },
  },
  plugins: [],
};

export default config;
```

### Typography
- **Primary:** Outfit — geometric, industrial, modern warmth
- **Monospace:** Space Mono — technical readout feel for scores, data, percentages
- **Scale:**
  - 10px: fine print, context labels
  - 11px: section titles (uppercase, letter-spacing 1.2px), badges
  - 12px: secondary body, sidebar items
  - 13px: primary body text, form inputs
  - 14px: content text, chat messages
  - 16px: tool names, card titles
  - 22px: page titles
  - 48-56px: landing hero, large score numbers

### Font Setup
```typescript
// src/app/layout.tsx
import { Outfit, Space_Mono } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceMono.variable}`}>
      <body className="font-sans bg-bg text-text">{children}</body>
    </html>
  );
}
```

### Component Patterns

**Cards:**
```
bg-card border border-border rounded-card p-5
hover: bg-card-hover border-accent/30
transition: all 0.2s
```

**Inputs:**
```
bg-surface border border-border rounded-input p-3 text-text
focus: border-border-focus outline-none
font-sans text-[13px]
```

**Primary Buttons:**
```
bg-gradient-to-br from-accent to-orange-500
text-bg font-bold rounded-xl px-6 py-3
shadow-[0_0_20px_var(--accent-glow)]
hover: shadow-[0_0_30px_var(--accent-glow)] translate-y-[-1px]
transition: all 0.2s
```

**Badges:**
```
inline-flex items-center px-2.5 py-0.5
rounded-pill text-[11px] font-semibold uppercase tracking-wide
color: {semantic-color}
bg: {semantic-color} at 15% opacity
```

**Section Titles:**
```
text-[11px] font-bold uppercase tracking-[1.2px]
text-text-muted
flex items-center gap-2
```

**Score Bars:**
```
height: 4px, rounded-full
track: bg-border
fill: {color}, width animated with transition 0.6s ease
```

### Visual Texture

**Blueprint Grid Background:**
```css
.blueprint-grid {
  background-image:
    linear-gradient(rgba(30,58,95,0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30,58,95,0.3) 1px, transparent 1px);
  background-size: 60px 60px;
}
```

---

## API Architecture

### Unified Streaming Endpoint
```typescript
// /api/chat/route.ts
interface ChatRequest {
  tool: 'field-report' | 'rfi' | 'decision-package' | 'translator' | 'pulse-log' | 'pulse-chat';
  messages: Message[];
  context: {
    projectId: string;
    documents: DocumentChunk[];
    longTermMemory?: LongTermData;
    toolSpecific: Record<string, any>;
  };
}
```

### Claude API Pattern
```typescript
// lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function streamToolResponse(
  systemPrompt: string,
  messages: { role: string; content: string }[],
) {
  return client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });
}

export async function analyzeStructured(
  systemPrompt: string,
  content: string,
) {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
  });
  return JSON.parse(response.content[0].text);
}
```

---

## Demo Data

### Demo Project
```typescript
// lib/demo/project-data.ts
export const demoProject = {
  id: 'riverside-infrastructure',
  name: 'Riverside Infrastructure Improvements',
  client: 'City of Riverside',
  contractValue: 4200000,
  completion: 68,
  contingencyRemaining: 312000,
  contingencyPercent: 7.4,
  keyMilestone: 'August 2026',
  phases: ['Phase 1: Drainage', 'Phase 2: Utility Relocation', 'Phase 3: Paving'],
  currentPhase: 2,
};
```

### Stakeholder Personas
```typescript
// lib/demo/personas.ts
export type BriefingRoom = 'city-hall' | 'conference-room' | 'field-trailer' | 'jobsite' | 'truck';

export const personas = [
  {
    id: 'chen',
    emoji: '👔',
    name: 'Director Chen',
    role: 'Public Works Director',
    cares: 'Timeline, budget, politics',
    readingLevel: 8,
    defaultFormality: 0.7,
    defaultRoom: 'city-hall' as BriefingRoom,
  },
  {
    id: 'rawlings',
    emoji: '💰',
    name: 'CFO Rawlings',
    role: 'Finance Director',
    cares: 'Budget variance, contingency, change orders',
    readingLevel: 7,
    defaultFormality: 0.8,
    defaultRoom: 'conference-room' as BriefingRoom,
  },
  {
    id: 'torres',
    emoji: '🔧',
    name: 'Engineer Torres',
    role: 'City Engineer',
    cares: 'Technical accuracy, spec compliance, design impacts',
    readingLevel: 9,
    defaultFormality: 0.6,
    defaultRoom: 'field-trailer' as BriefingRoom,
  },
  {
    id: 'martinez',
    emoji: '🦺',
    name: 'Foreman Martinez',
    role: 'General Contractor Superintendent',
    cares: 'Schedule, crew allocation, material delivery',
    readingLevel: 6,
    defaultFormality: 0.4,
    defaultRoom: 'jobsite' as BriefingRoom,
  },
];
```

### Sample Field Condition (for Decision Package demo)
```
Phase 2 utility relocation is 68% complete. We encountered an unmarked 12" DIP water main at STA 42+50 that conflicts with the proposed storm drain alignment. The contractor submitted RFI-047 requesting a 15-foot horizontal offset. This will require a design revision to the CB-7 junction structure and approximately $45,000 in additional costs. We're evaluating the Type II diffuser specification for the revised outfall location. Schedule impact is estimated at 12 working days if the revision is approved by EOW.
```

---

## Build Sequence

### Phase 1: Foundation (Day 1)
- [ ] `npx create-next-app@latest icelerate-v4 --typescript --tailwind --app --src-dir`
- [ ] Install deps: `@anthropic-ai/sdk`, `lucide-react`, `idb`
- [ ] Set up `globals.css` with all CSS custom properties
- [ ] Configure `tailwind.config.ts` with extended colors, fonts, border-radius
- [ ] Set up Outfit + Space Mono fonts in `layout.tsx`
- [ ] Build shared components: Badge, ScoreBar, SectionTitle, Pill, Slider, StatusIndicator, BriefingRoom
- [ ] Build workspace layout with Sidebar
- [ ] Build landing page with blueprint aesthetic
- [ ] Create demo data files
- [ ] Verify Claude API connection

### Phase 2: Reality Sync Panel (Day 2)
- [ ] Build RealitySyncPanel component
- [ ] Implement drift detection logic
- [ ] Create StatusIndicator (Green/Yellow/Red)
- [ ] Wire into workspace layout (always visible)

### Phase 3: Translator (Day 2-3)
- [ ] PersonaCard component with selection state
- [ ] ToneSliders component (formality, urgency, optimism)
- [ ] BriefingRoom component (City Hall, Conference Room, Field Trailer, Jobsite, Truck)
- [ ] Build translator system prompt with room context injection
- [ ] Wire up `/api/chat` with streaming
- [ ] TranslationOutput with streaming display
- [ ] JargonXRay toggle
- [ ] PersonaReaction component

### Phase 4: Decision Package (Day 3-4)
- [ ] ConditionInput form
- [ ] StakeholderPanel component (4 simultaneous outputs)
- [ ] AccelerationMetrics display
- [ ] DecisionCascade animation
- [ ] Build decision system prompt
- [ ] Wire into unified API endpoint

### Phase 5: RFI Generator (Day 4)
- [ ] FieldConditionForm component
- [ ] VerdictPanel (already answered? spec refs? notice required?)
- [ ] GeneratedRFI component
- [ ] Build RFI system prompt with document context

### Phase 6: Pulse (Day 5)
- [ ] LogEntry form
- [ ] LogScore display with contract cross-references
- [ ] ProjectChat interface
- [ ] RiskTrends visualization
- [ ] Build pulse system prompts

### Phase 7: Field Report (Day 5)
- [ ] FieldObservationForm
- [ ] DecisionEventOutput (structured output display)
- [ ] Build field report system prompt

### Phase 8: Dashboard (Day 6)
- [ ] EngineerScore component
- [ ] DISCQuadrant visualization
- [ ] ArchetypeCard
- [ ] Wire up `/api/analyze` for personality inference

### Phase 9: Polish & Demo (Day 6)
- [ ] Smooth transitions, loading states, error handling
- [ ] Test full demo flow across all tools
- [ ] Record 3-minute demo video
- [ ] Write 100–200 word summary
- [ ] Push to GitHub
- [ ] Submit by Feb 16, 3:00 PM EST

---

## Critical Rules

1. **Every Claude call uses `claude-opus-4-6`.** No exceptions.
2. **Streaming for all tool responses.** Non-streaming only for structured analysis.
3. **Pre-loaded demo data, not mocked UI.** Claude actually processes demo data.
4. **Reality Sync Panel always visible** in workspace layout.
5. **Decision Package shows 4 simultaneous stakeholder outputs** from one input.
6. **Briefing Room changes the output.** City Hall vs Jobsite produce visibly different communications for the same persona.
7. **The sliders must change the output.** Demo moment: move formality slider and show different result.
8. **Source citations on every tool output.**
9. **Open source.** MIT license. Clean README.

---

## Judging Criteria Alignment

| Criterion | Weight | Our Angle |
|-----------|--------|-----------|
| **Impact** | 25% | Decision intelligence for infrastructure. $14M/month data center delay costs. 9.7-day average RFI response compressed to minutes. |
| **Opus 4.6 Use** | 25% | Multi-document reasoning across 150+ pages. Simultaneous 4-stakeholder adaptation. Behavioral inference from communication patterns. |
| **Depth & Execution** | 20% | 5-layer architecture. Reality Sync alignment engine. Decision Velocity Engine. Briefing Room context adaptation. |
| **Demo** | 30% | Decision Package as hero feature: one input → four outputs. Before/after of 18-day vs minutes. Reality Sync showing drift detection. Briefing Room visual demo. |

---

## Demo Video Script (3 minutes)

**0:00–0:15 — Hook**
"Traditional path: field condition to decision takes 18 days. ICelerate path: minutes. I'm a licensed PE and PMP. I built this because communication is the bottleneck."

**0:15–0:45 — Decision Package (Hero Feature)**
Enter field condition. Show 4 stakeholder panels generating simultaneously. "One input, four outputs. Executive gets milestone impact. CFO gets budget variance. Engineer gets technical specs. Contractor gets field directives. All at once."

**0:45–1:15 — Reality Sync**
Show alignment panel. "Reality Sync connects field conditions to contract position to office narrative. Yellow means drift detected. Red means the field and the executive suite are telling different stories."

**1:15–1:45 — Translator + Briefing Room**
Same update, switch personas. Move sliders. Switch rooms from City Hall to Field Trailer to Jobsite. "Same information for Director Chen — but City Hall gets the political framing, Field Trailer gets real talk, Jobsite gets the three-sentence directive. The room changes how you communicate."

**1:45–2:15 — RFI Generator**
Type field description. Show verdict panel. "Opus 4.6 searched the entire spec, found the relevant sections, checked if it was already answered, and flagged the notice deadline. A smaller model gets spec references wrong."

**2:15–2:45 — Pulse**
Enter daily log. Show scores, contract cross-references. "Every log scored against the contract, the schedule, and historical patterns. It caught that this work was due last week."

**2:45–3:00 — Close**
"ICelerate. Decision intelligence for construction. Field-to-office alignment in minutes, not weeks. Powered by Opus 4.6."
