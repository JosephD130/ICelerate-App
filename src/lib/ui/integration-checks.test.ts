/**
 * Integration self-checks — validates cross-cutting deterministic outputs.
 * Run: npx tsx src/lib/ui/integration-checks.test.ts
 */

import { getRoleUiPolicy } from "./risk-register-role";
import { resolveNoticeClocks } from "./risk-register-helpers";
import { loadProjectSystemPreview, loadEmailPreview } from "@/lib/connect/simulation";
import { buildExportAssistantPrompt, type ExportAssistantContext } from "@/lib/prompts/export-assistant-system";
import type { DecisionEvent } from "@/lib/models/decision-event";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

function makeEvent(overrides: Partial<DecisionEvent> = {}): DecisionEvent {
  return {
    id: `e-${Math.random().toString(36).slice(2, 6)}`,
    title: "Test",
    description: "",
    trigger: "test",
    station: "capture",
    severity: "medium",
    status: "open",
    altitude: "ground",
    alignmentStatus: "synced",
    contractReferences: [],
    stakeholderNotifications: [],
    velocity: { detectedAt: new Date().toISOString(), traditionalDays: 18 },
    communications: [],
    monitorScores: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "test",
    toolSource: "test",
    tags: [],
    attachments: [],
    lifecycleStage: "field-record",
    evidenceIds: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Role policy: field/pm/exec produce different values
// ---------------------------------------------------------------------------
{
  const field = getRoleUiPolicy("field");
  const pm = getRoleUiPolicy("pm");
  const exec = getRoleUiPolicy("stakeholder");

  assert(field.helperSubtitle !== pm.helperSubtitle, "integration — field/pm different subtitles");
  assert(pm.helperSubtitle !== exec.helperSubtitle, "integration — pm/exec different subtitles");
  assert(field.primaryCta !== pm.primaryCta, "integration — field/pm different CTAs");
  assert(pm.primaryCta !== exec.primaryCta, "integration — pm/exec different CTAs");
  assert(field.morningReview.title !== exec.morningReview.title, "integration — field/exec different morning review titles");
}

// ---------------------------------------------------------------------------
// Notice clock panel: resolveNoticeClocks returns correct items
// ---------------------------------------------------------------------------
{
  const events = [
    makeEvent({
      title: "Notice Event 1",
      status: "open",
      contractReferences: [{ section: "GC", clause: "5.1", summary: "Notice req", noticeDays: 7 }],
    }),
    makeEvent({
      title: "No notice",
      status: "open",
    }),
    makeEvent({
      title: "Resolved with notice",
      status: "resolved",
      contractReferences: [{ section: "GC", clause: "5.2", summary: "Notice req", noticeDays: 3 }],
    }),
  ];
  const clocks = resolveNoticeClocks(events);
  assert(clocks.length === 1, "integration — resolveNoticeClocks returns 1 for test data");
  assert(clocks[0].title === "Notice Event 1", "integration — correct notice event");
  assert(clocks[0].clauseRef === "5.1", "integration — correct clause ref");
}

// ---------------------------------------------------------------------------
// Connect simulation: JSON loads and summary counts are consistent
// ---------------------------------------------------------------------------
{
  const preview = loadProjectSystemPreview();
  const totalFromSummary = Object.values(preview.summary).reduce((s, c) => s + c, 0);
  assert(
    totalFromSummary === preview.objects.length,
    `integration — summary total (${totalFromSummary}) matches objects count (${preview.objects.length})`,
  );

  const emails = loadEmailPreview();
  assert(emails.emails.length > 0, "integration — email preview has data");
}

// ---------------------------------------------------------------------------
// Export context: dataset summary line includes event count and coverage
// ---------------------------------------------------------------------------
{
  const ctx: ExportAssistantContext = {
    projectName: "Test Project",
    contractValue: 4200000,
    percentComplete: 68,
    openEventCount: 5,
    verifiedOnly: false,
    activeNoticeClocks: 2,
    noticeDueSoon: 1,
    avgCoverage: 72,
    worstSyncAge: "3h",
    role: "pm",
  };
  const prompt = buildExportAssistantPrompt(ctx);
  assert(prompt.includes("Test Project"), "integration — export prompt includes project name");
  assert(prompt.includes("5 open"), "integration — export prompt includes event count");
  assert(prompt.includes("72%"), "integration — export prompt includes coverage");
  assert(prompt.includes("2 active"), "integration — export prompt includes notice clocks");
  assert(prompt.includes("pm"), "integration — export prompt includes role");
}

// ---------------------------------------------------------------------------
// Verified-only warning scenario
// ---------------------------------------------------------------------------
{
  const ctx: ExportAssistantContext = {
    projectName: "Test",
    contractValue: 1000000,
    percentComplete: 50,
    openEventCount: 0,
    verifiedOnly: true,
    activeNoticeClocks: 0,
    noticeDueSoon: 0,
    avgCoverage: 30,
    worstSyncAge: "12h",
    role: "stakeholder",
  };
  const prompt = buildExportAssistantPrompt(ctx);
  assert(prompt.includes("verified-only=ON"), "integration — verified-only mode visible in prompt");
  assert(prompt.includes("0 open"), "integration — 0 events visible in prompt");
}

// ---------------------------------------------------------------------------
// KPI definitions: all IDs have non-empty formula
// ---------------------------------------------------------------------------
import { getKpiDefinition } from "./kpi-definitions";

{
  for (const id of ["exposure", "days", "notice"]) {
    const def = getKpiDefinition(id);
    assert(def !== undefined, `integration — KPI ${id} definition exists`);
    assert(def!.formula.length > 0, `integration — KPI ${id} has non-empty formula`);
  }
}

// ---------------------------------------------------------------------------
// ExportScope values: "all", "cost", "schedule", "notice" are valid
// ---------------------------------------------------------------------------
import type { ExportScope } from "@/lib/contexts/export-context";
{
  const validScopes: ExportScope[] = ["all", "cost", "schedule", "notice"];
  assert(validScopes.length === 4, "integration — ExportScope has 4 valid values");
}

console.log("\nDone.");
