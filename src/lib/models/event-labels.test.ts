/**
 * Self-check spec for event-labels.
 * Run: npx tsx src/lib/models/event-labels.test.ts
 */

import { generateFriendlyLabel, SEVERITY_MICROCOPY } from "./event-labels";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

// ---------------------------------------------------------------------------
// generateFriendlyLabel
// ---------------------------------------------------------------------------

assert(
  generateFriendlyLabel("de-1708967234517-a4b2k9") === "EV-20240226-A4B2",
  "Standard ID → EV-YYYYMMDD-XXXX"
);

assert(
  generateFriendlyLabel("de-1700000000000-zz99xx").startsWith("EV-2023"),
  "Timestamp from 2023 produces EV-2023..."
);

assert(
  /^EV-\d{8}-[A-Z0-9]{4}$/.test(generateFriendlyLabel("de-1708967234517-abcd")),
  "Output matches EV-YYYYMMDD-XXXX pattern"
);

// Edge: missing hash portion
assert(
  generateFriendlyLabel("de-1708967234517-").startsWith("EV-2024"),
  "Empty hash still produces date-based label"
);

// Edge: bad timestamp
assert(
  generateFriendlyLabel("de-notanumber-abc123") === "EV-ABC1",
  "Non-numeric timestamp falls back to hash-only label"
);

// Edge: completely malformed
assert(
  generateFriendlyLabel("garbage").startsWith("EV-"),
  "Malformed ID still returns EV- prefix"
);

// Hash uppercasing
assert(
  generateFriendlyLabel("de-1708967234517-abcd") === "EV-20240226-ABCD",
  "Hash is uppercased"
);

// Short hash (fewer than 4 chars)
assert(
  generateFriendlyLabel("de-1708967234517-ab").includes("AB"),
  "Short hash is preserved (uppercased)"
);

// ---------------------------------------------------------------------------
// SEVERITY_MICROCOPY
// ---------------------------------------------------------------------------

assert(typeof SEVERITY_MICROCOPY.low === "string" && SEVERITY_MICROCOPY.low.length > 0, "low microcopy exists");
assert(typeof SEVERITY_MICROCOPY.medium === "string" && SEVERITY_MICROCOPY.medium.length > 0, "medium microcopy exists");
assert(typeof SEVERITY_MICROCOPY.high === "string" && SEVERITY_MICROCOPY.high.length > 0, "high microcopy exists");
assert(typeof SEVERITY_MICROCOPY.critical === "string" && SEVERITY_MICROCOPY.critical.length > 0, "critical microcopy exists");
assert(Object.keys(SEVERITY_MICROCOPY).length === 4, "Exactly 4 severity levels");

console.log("\n--- event-labels tests complete ---");
