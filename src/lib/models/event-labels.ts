// Friendly event labeling and severity microcopy.
// Pure functions — no React, no side effects.

/**
 * Generate a friendly label from a raw event ID.
 * de-1708967234517-a4b2k9 → EV-20240226-A4B2
 */
export function generateFriendlyLabel(rawId: string): string {
  const parts = rawId.split("-");
  const ts = Number(parts[1]);
  const hash = (parts[2] ?? "0000").slice(0, 4).toUpperCase();
  if (isNaN(ts)) return `RI-${hash}`;
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `RI-${y}${m}${day}-${hash}`;
}

/** Human-readable severity guidance shown during event creation. */
export const SEVERITY_MICROCOPY: Record<string, string> = {
  low: "Track it, no deadline risk yet.",
  medium: "Monitor, standard priority.",
  high: "Action needed this week.",
  critical: "Deadline / entitlement risk.",
};

/** Copy the raw event ID to the clipboard. */
export function copyRawIdToClipboard(rawId: string): void {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(rawId);
  }
}
