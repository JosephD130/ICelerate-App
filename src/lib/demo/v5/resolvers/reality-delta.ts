import type { DriftResult } from "@/lib/reality-sync/drift-detector";

/**
 * Produce a single human-readable sentence summarizing the drift state.
 */
export function resolveRealityDelta(drifts: DriftResult[]): string {
  if (drifts.length === 0) return "All systems aligned";

  const parts: string[] = [];

  const notice = drifts.find((d) => d.ruleId === "unfiled-notice");
  if (notice) parts.push("notice deadline approaching");

  const unbriefed = drifts.find((d) => d.ruleId === "unbriefed-stakeholders");
  if (unbriefed) parts.push("unbriefed stakeholders");

  const stale = drifts.find((d) => d.ruleId === "stale-decision");
  if (stale) parts.push("stale decisions pending");

  const budget = drifts.find((d) => d.ruleId === "budget-gap");
  if (budget) parts.push("budget exposure above threshold");

  // Fallback for unknown rules
  const known = new Set(["unfiled-notice", "unbriefed-stakeholders", "stale-decision", "budget-gap"]);
  const unknown = drifts.filter((d) => !known.has(d.ruleId));
  for (const d of unknown) parts.push(d.message.toLowerCase());

  if (parts.length === 0) return "All systems aligned";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

  const last = parts.pop()!;
  return parts.join(", ") + " and " + last;
}
