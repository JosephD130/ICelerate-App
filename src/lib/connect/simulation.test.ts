/**
 * Self-check spec for connect/simulation.
 * Run: npx tsx src/lib/connect/simulation.test.ts
 */

import {
  loadProjectSystemPreview,
  loadEmailPreview,
  applySimulatedConnection,
} from "./simulation";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

// ---------------------------------------------------------------------------
// loadProjectSystemPreview
// ---------------------------------------------------------------------------
{
  const preview = loadProjectSystemPreview();
  assert(preview.objects.length > 0, "API preview — has objects");
  assert(Object.keys(preview.summary).length > 0, "API preview — has summary");

  // Verify object types match summary
  const typeCounts: Record<string, number> = {};
  for (const obj of preview.objects) {
    typeCounts[obj.type] = (typeCounts[obj.type] ?? 0) + 1;
  }
  for (const [type, count] of Object.entries(preview.summary)) {
    assert(typeCounts[type] === count, `API preview — ${type} count matches (expected ${count}, got ${typeCounts[type]})`);
  }

  // All objects have required fields
  for (const obj of preview.objects) {
    assert(!!obj.id, `API preview — object ${obj.id} has id`);
    assert(!!obj.type, `API preview — object ${obj.id} has type`);
    assert(!!obj.date, `API preview — object ${obj.id} has date`);
    assert(!!obj.title, `API preview — object ${obj.id} has title`);
  }
}

// ---------------------------------------------------------------------------
// loadEmailPreview
// ---------------------------------------------------------------------------
{
  const preview = loadEmailPreview();
  assert(preview.emails.length > 0, "Email preview — has emails");

  for (const email of preview.emails) {
    assert(!!email.id, `Email — ${email.id} has id`);
    assert(!!email.subject, `Email — ${email.id} has subject`);
    assert(!!email.from, `Email — ${email.id} has from`);
    assert(!!email.date, `Email — ${email.id} has date`);
    assert(email.linkedKeywords.length > 0, `Email — ${email.id} has linkedKeywords`);
  }
}

// ---------------------------------------------------------------------------
// applySimulatedConnection
// ---------------------------------------------------------------------------
{
  const profile = {
    mode: "native",
    sources: [
      { kind: "project_system", label: "API", status: "disconnected", lastSyncAt: "2025-01-01T00:00:00Z", coverage: 30 },
      { kind: "email", label: "Email", status: "disconnected", lastSyncAt: "2025-01-01T00:00:00Z", coverage: 20 },
    ],
  };

  const updated = applySimulatedConnection(profile, "project_system");
  const apiSource = updated.sources.find((s) => s.kind === "project_system")!;
  assert(apiSource.status === "connected", "applySimulatedConnection — API status updated to connected");
  assert(apiSource.coverage > 30, "applySimulatedConnection — API coverage increased");

  const emailSource = updated.sources.find((s) => s.kind === "email")!;
  assert(emailSource.status === "disconnected", "applySimulatedConnection — email not affected");
}

console.log("\nDone.");
