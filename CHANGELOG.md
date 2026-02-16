# Changelog

## v4.5.0 — Risk Register UX + Connect Onboarding + Export Assistant

### Risk Register UX
- **KPI tiles redesign**: Replaced clickable numbers with explicit CTA buttons ("View cost drivers", "View schedule drivers", "Review notice items") and separate provenance "Why" icon. Each tile now includes a deterministic "What this means" description and secondary breakdown.
- **Notice Clock panel**: New deterministic panel below KPI tiles showing active contractual notice deadlines with color-coded urgency (overdue/due soon/safe) and direct navigation to events.
- **Role-specific behavior**: Extended `RoleUiPolicy` with 7 new fields controlling subtitle text, Morning Review collapse state, top risks summary visibility, event list mode (full vs readonly), field badges, and default status filters.
  - **Field role**: Shows "Needs Field Record" badges on events missing documentation. Defaults to open/in-progress filter.
  - **PM role**: Full access with all statuses visible. Morning Review expanded by default.
  - **Exec role**: Collapsed Morning Review, Top Risks Summary (top 3 by severity), read-only event list indicator.
- **Morning Review rename**: "Action Required" renamed to "Morning Review" with role-specific sublabel ("Top items you can clear in under 2 minutes").
- **Second "+ New Risk" entry point**: Added in Morning Review header and empty state.
- **Top Risks Summary**: New exec-only component showing top 3 events by severity with cost/schedule meta.
- **Timeline impact mode**: Added `?mode=impact` deep-link param support.

### Connect Page
- **Layout rebuild**: Summary strip (sources connected, evidence coverage, last sync age, data mode) with source cards grouped by category (API, Files, Email).
- **Connection Wizard**: Modal with 3 tabs:
  - **Project System (API)**: Simulation preview with 20 demo objects (daily logs, RFIs, observations, change events, commitments) and type-count summary table.
  - **File Imports**: 4 upload slots (Schedule, Cost Report, Daily Logs, Contract/Spec) with per-slot coverage indicators. Metadata stored in localStorage.
  - **Email**: Demo Inbox simulation with 6 sample emails and keyword-match mapping explanation. OAuth placeholder (coming soon).
- **Sync improvements**: Removed `window.alert` placeholder; added proper animated sync state per source card.

### Export Assistant
- **AI assistant panel**: Right-side sticky panel on the export page with streaming responses via SSE.
- **Role-specific prompt chips**: Field (field update, risks needing records), PM (owner meeting export, top cost drivers), Exec (board-ready narrative, top notice risks).
- **Guardrails footer**: Always-visible line showing event count, verified-only status, evidence coverage %, and last sync age.
- **Verified-only warning**: Alert when board-ready mode is ON but no verified events exist.
- **New "export-assistant" tool type**: Added to `/api/claude` route with context-aware system prompt.

### Tests
- Extended `risk-register-role.test.ts` with 20+ new assertions for all new policy fields.
- Extended `risk-register-helpers.test.ts` with 7 notice clock resolver assertions.
- New `simulation.test.ts` for connect simulation (preview loading, type counts, connection apply).
- New `integration-checks.test.ts` for cross-cutting validation (role differentiation, notice clocks, simulation consistency, export prompt content).

### New Files
- `src/components/workspace/KpiTile.tsx`
- `src/components/workspace/NoticeClockPanel.tsx`
- `src/components/workspace/TopRisksSummary.tsx`
- `src/components/connect/ConnectionWizard.tsx`
- `src/components/export/ExportAssistantPanel.tsx`
- `src/lib/connect/simulation.ts`
- `src/lib/prompts/export-assistant-system.ts`
- `src/lib/demo/v5/connectors/project-system-sim.json`
- `src/lib/demo/v5/connectors/email-sim.json`
- `src/lib/connect/simulation.test.ts`
- `src/lib/ui/integration-checks.test.ts`
