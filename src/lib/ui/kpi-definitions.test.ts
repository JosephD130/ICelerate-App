/**
 * Self-check spec for kpi-definitions.
 * Run: npx tsx src/lib/ui/kpi-definitions.test.ts
 */

import { getKpiDefinition } from "./kpi-definitions";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

// ---------------------------------------------------------------------------
// Known KPI IDs return valid definitions
// ---------------------------------------------------------------------------
for (const id of ["exposure", "days", "notice"]) {
  const def = getKpiDefinition(id);
  assert(def !== undefined, `${id} — definition exists`);
  assert(def!.label.length > 0, `${id} — non-empty label`);
  assert(def!.formula.length > 0, `${id} — non-empty formula`);
  assert(def!.inputs.length > 0, `${id} — has inputs`);
  assert(def!.assumptions.length > 0, `${id} — has assumptions`);
  assert(def!.limitations.length > 0, `${id} — has limitations`);
}

// ---------------------------------------------------------------------------
// Unknown KPI ID returns undefined
// ---------------------------------------------------------------------------
assert(getKpiDefinition("unknown") === undefined, "unknown — returns undefined");

console.log("\nDone.");
