/**
 * Self-check spec for mode-gating.
 * Run: npx tsx src/lib/models/mode-gating.test.ts
 */

import { getVisibleModes, MODE_CONFIGS } from "./mode-gating";
import type { DecisionEvent } from "./decision-event";
import type { Role } from "@/lib/contexts/role-context";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

// ---------------------------------------------------------------------------
// Minimal event factory
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<DecisionEvent> = {}): DecisionEvent {
  return {
    id: `e-${Math.random().toString(36).slice(2, 6)}`,
    title: "Test Event",
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

function modeIds(event: DecisionEvent, role: Role): string[] {
  return getVisibleModes(event, role).map((m) => m.id);
}

// ---------------------------------------------------------------------------
// Capture — always visible
// ---------------------------------------------------------------------------

assert(modeIds(makeEvent(), "pm").includes("capture"), "Capture visible for PM (always)");
assert(modeIds(makeEvent(), "field").includes("capture"), "Capture visible for field (always)");
assert(modeIds(makeEvent(), "stakeholder").includes("capture"), "Capture visible for stakeholder (always)");

// ---------------------------------------------------------------------------
// Activity — always visible
// ---------------------------------------------------------------------------

assert(modeIds(makeEvent(), "pm").includes("activity"), "Activity visible for PM (always)");
assert(modeIds(makeEvent(), "field").includes("activity"), "Activity visible for field (always)");

// ---------------------------------------------------------------------------
// Contract — visible when notice-contract, contractRefs, or noticeRequired
// ---------------------------------------------------------------------------

assert(
  !modeIds(makeEvent(), "pm").includes("contract"),
  "Contract NOT visible when no triggers (PM)"
);

assert(
  modeIds(makeEvent({ eventType: "notice-contract" }), "pm").includes("contract"),
  "Contract visible with eventType=notice-contract"
);

assert(
  modeIds(
    makeEvent({ contractReferences: [{ section: "1.1", clause: "A", summary: "test" }] }),
    "pm"
  ).includes("contract"),
  "Contract visible with contractReferences"
);

assert(
  modeIds(
    makeEvent({ fieldRecord: { observation: "", location: "", observer: "", timestamp: "", noticeRequired: true } }),
    "pm"
  ).includes("contract"),
  "Contract visible with fieldRecord.noticeRequired"
);

// Contract role gating — field cannot see contract
assert(
  !modeIds(makeEvent({ eventType: "notice-contract" }), "field").includes("contract"),
  "Contract NOT visible for field role (role gated)"
);

// ---------------------------------------------------------------------------
// Exposure — visible with costImpact, scheduleImpact, or cost-schedule type
// ---------------------------------------------------------------------------

assert(
  !modeIds(makeEvent(), "pm").includes("exposure"),
  "Exposure NOT visible when no impacts (PM)"
);

assert(
  modeIds(makeEvent({ costImpact: { estimated: 10000, currency: "USD", confidence: "high", description: "" } }), "pm").includes("exposure"),
  "Exposure visible with costImpact"
);

assert(
  modeIds(makeEvent({ scheduleImpact: { daysAffected: 5, criticalPath: false, description: "" } }), "pm").includes("exposure"),
  "Exposure visible with scheduleImpact"
);

assert(
  modeIds(makeEvent({ eventType: "cost-schedule" }), "pm").includes("exposure"),
  "Exposure visible with eventType=cost-schedule"
);

// Exposure role gating — field cannot see exposure
assert(
  !modeIds(makeEvent({ eventType: "cost-schedule" }), "field").includes("exposure"),
  "Exposure NOT visible for field role (role gated)"
);

// ---------------------------------------------------------------------------
// Stakeholder Update — visible with notice/drift types, high/critical, or stakeholder+open
// ---------------------------------------------------------------------------

assert(
  !modeIds(makeEvent({ severity: "low" }), "pm").includes("stakeholder-update"),
  "Stakeholder Update NOT visible for low severity PM"
);

assert(
  modeIds(makeEvent({ eventType: "notice-contract" }), "pm").includes("stakeholder-update"),
  "Stakeholder Update visible with eventType=notice-contract"
);

assert(
  modeIds(makeEvent({ eventType: "drift-variance" }), "pm").includes("stakeholder-update"),
  "Stakeholder Update visible with eventType=drift-variance"
);

assert(
  modeIds(makeEvent({ severity: "high" }), "pm").includes("stakeholder-update"),
  "Stakeholder Update visible with severity=high"
);

assert(
  modeIds(makeEvent({ severity: "critical" }), "field").includes("stakeholder-update"),
  "Stakeholder Update visible for field with severity=critical"
);

assert(
  modeIds(makeEvent({ severity: "low", status: "open" }), "stakeholder").includes("stakeholder-update"),
  "Stakeholder Update visible for stakeholder role with open event"
);

assert(
  !modeIds(makeEvent({ severity: "low", status: "resolved" }), "stakeholder").includes("stakeholder-update"),
  "Stakeholder Update NOT visible for stakeholder with resolved event and low severity"
);

// ---------------------------------------------------------------------------
// Decision Outputs — visible with trust or PM/stakeholder role
// ---------------------------------------------------------------------------

assert(
  modeIds(makeEvent(), "pm").includes("decision-outputs"),
  "Decision Outputs visible for PM (always via role)"
);

assert(
  modeIds(makeEvent(), "stakeholder").includes("decision-outputs"),
  "Decision Outputs visible for stakeholder (always via role)"
);

assert(
  !modeIds(makeEvent(), "field").includes("decision-outputs"),
  "Decision Outputs NOT visible for field (no trust, role gated)"
);

// Field with trust → still gated by role
assert(
  !modeIds(
    makeEvent({ fieldRecord: { observation: "", location: "", observer: "", timestamp: "", trust: { trustStatus: "verified", trustReason: "", evidenceRefs: { sourceIds: [], docChunkIds: [] }, evaluatedAt: "" } } }),
    "field"
  ).includes("decision-outputs"),
  "Decision Outputs NOT visible for field even with trust (role gated)"
);

// ---------------------------------------------------------------------------
// MODE_CONFIGS count
// ---------------------------------------------------------------------------

assert(MODE_CONFIGS.length === 6, "Exactly 6 mode configs defined");

// ---------------------------------------------------------------------------
// getVisibleModes returns ModeConfig objects (not just IDs)
// ---------------------------------------------------------------------------

const modes = getVisibleModes(makeEvent(), "pm");
assert(modes.every((m) => typeof m.id === "string" && typeof m.label === "string"), "getVisibleModes returns ModeConfig objects");

console.log("\n--- mode-gating tests complete ---");
