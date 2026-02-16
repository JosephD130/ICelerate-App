/**
 * Self-check spec for computeTopRisk.
 * No test runner needed — run with: npx tsx src/lib/risk/top-risk.test.ts
 */

import { computeTopRisk, formatCount, type TopRiskInput } from "./top-risk";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

// Helpers
const empty: TopRiskInput = { unresolvedEvents: [] };

// Test 1: Notice clocks > 0 → "Notice Clock" with count
{
  const result = computeTopRisk({
    ...empty,
    activeNoticeClocks: 3,
  });
  assert(result.reasonCode === "notice_clock", "Rule 1 — notice clock reason");
  assert(result.label === "Notice Clock", "Rule 1 — label");
  assert(result.count === 3, "Rule 1 — count");
  assert(result.displayText === "Top risk: Notice Clock (3)", "Rule 1 — display");
}

// Test 2: Overdue event present → "Overdue Item" with count
{
  const result = computeTopRisk({
    ...empty,
    unresolvedEvents: [
      { id: "e1", overdue: true, overdueHours: 12 },
      { id: "e2", overdue: true, overdueHours: 5 },
    ],
  });
  assert(result.reasonCode === "overdue", "Rule 2 — overdue reason");
  assert(result.label === "Overdue Item", "Rule 2 — label");
  assert(result.count === 2, "Rule 2 — count");
  assert(result.displayText === "Top risk: Overdue Item (2)", "Rule 2 — display");
}

// Test 3: Critical path + delay → "Critical Path Delay" no count
{
  const result = computeTopRisk({
    ...empty,
    unresolvedEvents: [
      { id: "e1", criticalPath: true, scheduleImpactDays: 5 },
    ],
  });
  assert(result.reasonCode === "critical_path", "Rule 3 — critical path reason");
  assert(result.label === "Critical Path Delay", "Rule 3 — label");
  assert(result.count === undefined, "Rule 3 — no count");
}

// Test 4: Cost exposure over threshold → "High Cost Exposure"
{
  const result = computeTopRisk({
    ...empty,
    contractValue: 4_200_000,
    unresolvedEvents: [
      { id: "e1", costExposureAmount: 45_000 },
      { id: "e2", costExposureAmount: 12_000 },
    ],
  });
  // threshold = max(50000, 4200000*0.01=42000) = 50000; total = 57000 >= 50000
  assert(result.reasonCode === "cost_exposure", "Rule 4 — cost exposure reason");
  assert(result.label === "High Cost Exposure", "Rule 4 — label");
}

// Test 5: Drift count > 0 → "Variance Detected" with count
{
  const result = computeTopRisk({
    ...empty,
    driftCount: 4,
  });
  assert(result.reasonCode === "variance", "Rule 5 — variance reason");
  assert(result.label === "Variance Detected", "Rule 5 — label");
  assert(result.count === 4, "Rule 5 — count");
}

// Test 6: Pending review suggestions → "Pending Review" with count
{
  const result = computeTopRisk({
    ...empty,
    projectStatus: "synced",
    driftCount: 0,
    suggestions: [
      { trust: "needs_review" },
      { trust: "unverified" },
      { trust: "verified" },
    ],
  });
  assert(result.reasonCode === "pending_review", "Rule 6 — pending review reason");
  assert(result.label === "Pending Review", "Rule 6 — label");
  assert(result.count === 2, "Rule 6 — count");
}

// Test 7: No risks + synced → "All clear"
{
  const result = computeTopRisk({
    projectStatus: "synced",
    driftCount: 0,
    activeNoticeClocks: 0,
    unresolvedEvents: [],
    suggestions: [{ trust: "verified" }],
  });
  assert(result.reasonCode === "none", "Rule 7 — none reason");
  assert(result.displayText === "All clear", "Rule 7 — all clear display");
}

// Test 8: No risks but NOT synced → "No Immediate Action" (not "All clear")
{
  const result = computeTopRisk({
    projectStatus: "drift",
    driftCount: 0,
    activeNoticeClocks: 0,
    unresolvedEvents: [],
  });
  assert(result.reasonCode === "none", "Rule 7b — none reason");
  assert(
    result.displayText === "Top risk: No Immediate Action",
    "Rule 7b — not all-clear when project not synced"
  );
}

// Test 9: Priority — notice clock beats overdue
{
  const result = computeTopRisk({
    ...empty,
    activeNoticeClocks: 1,
    unresolvedEvents: [{ id: "e1", overdue: true }],
  });
  assert(result.reasonCode === "notice_clock", "Priority — notice clock beats overdue");
}

// Test 10: formatCount edge cases
assert(formatCount(0) === "", "formatCount(0)");
assert(formatCount(undefined) === "", "formatCount(undefined)");
assert(formatCount(5) === " (5)", "formatCount(5)");
assert(formatCount(10) === " (9+)", "formatCount(10)");
assert(formatCount(99) === " (9+)", "formatCount(99)");

console.log("\nDone.");
