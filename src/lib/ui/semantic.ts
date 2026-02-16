// Centralized semantic color mappings — single source of truth
// 3 alignment tones: danger (red), warning (amber), neutral (green)

export type AlignmentState = "synced" | "drift" | "misaligned";
export type AlignmentTone = "neutral" | "warning" | "danger";

/** Map an alignment state to one of the 3 semantic tones */
export function alignmentTone(state: AlignmentState): AlignmentTone {
  if (state === "misaligned") return "danger";
  if (state === "drift") return "warning";
  return "neutral";
}

/** CSS variable for a given tone */
export const TONE_COLORS: Record<AlignmentTone, { color: string; dim: string }> = {
  neutral: { color: "var(--color-semantic-green)", dim: "var(--color-semantic-green-dim)" },
  warning: { color: "var(--color-semantic-yellow)", dim: "var(--color-semantic-yellow-dim)" },
  danger: { color: "var(--color-semantic-red)", dim: "var(--color-semantic-red-dim)" },
};

export const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: "var(--color-semantic-red-dim)", text: "var(--color-semantic-red)" },
  high: { bg: "var(--color-semantic-yellow-dim)", text: "var(--color-semantic-yellow)" },
  medium: { bg: "var(--color-semantic-blue-dim)", text: "var(--color-semantic-blue)" },
  low: { bg: "var(--color-semantic-green-dim)", text: "var(--color-semantic-green)" },
  info: { bg: "var(--color-semantic-blue-dim)", text: "var(--color-semantic-blue)" },
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "var(--color-semantic-red-dim)", text: "var(--color-semantic-red)", label: "Open" },
  "in-progress": { bg: "var(--color-semantic-yellow-dim)", text: "var(--color-semantic-yellow)", label: "In Progress" },
  resolved: { bg: "var(--color-semantic-green-dim)", text: "var(--color-semantic-green)", label: "Resolved" },
  escalated: { bg: "var(--color-semantic-red-dim)", text: "var(--color-semantic-red)", label: "Escalated" },
};

export const ALIGNMENT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  synced: { bg: "var(--color-semantic-green-dim)", text: "var(--color-semantic-green)", label: "Synced" },
  drift: { bg: "var(--color-semantic-yellow-dim)", text: "var(--color-semantic-yellow)", label: "Variance Detected" },
  misaligned: { bg: "var(--color-semantic-red-dim)", text: "var(--color-semantic-red)", label: "High Risk Misalignment" },
};

/** Flat color-only map for simpler use cases (dots, borders) */
export const ALIGNMENT_DOT_COLORS: Record<string, string> = {
  synced: "var(--color-semantic-green)",
  drift: "var(--color-semantic-yellow)",
  misaligned: "var(--color-semantic-red)",
};

/** Flat severity color map for dots/markers */
export const SEVERITY_DOT_COLORS: Record<string, string> = {
  critical: "var(--color-semantic-red)",
  high: "var(--color-semantic-yellow)",
  medium: "var(--color-semantic-blue)",
  low: "var(--color-semantic-green)",
};
