// src/lib/analysis/conflict-extractor.ts
// Structured conflict analysis from decision package panels.
// Pure deterministic — regex extraction, no AI calls.

type Recommendation = "APPROVE" | "DELAY" | "ESCALATE" | "SEEK CLARIFICATION";
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface PanelPosition {
  panelId: string;
  panelLabel: string;
  recommendation: Recommendation | null;
  severity: Severity | null;
  rationale: string;
  costConcern: number | null;
}

export interface ConflictAnalysis {
  aligned: boolean;
  positions: PanelPosition[];
  conflictSeverity: number; // 0-1
  conflictSummary: string;
  pivotPoint: string | null;
}

// ── Extraction helpers ────────────────────────────────────

const REC_KEYWORDS: Recommendation[] = [
  "APPROVE",
  "DELAY",
  "ESCALATE",
  "SEEK CLARIFICATION",
];

const SEVERITY_KEYWORDS: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function extractSection(text: string, headerPattern: string): string {
  const headerIdx = text.indexOf(headerPattern);
  if (headerIdx < 0) return "";

  const start = headerIdx + headerPattern.length;
  // Find next ## header or end
  const nextHeader = text.indexOf("\n##", start);
  const section = nextHeader >= 0 ? text.slice(start, nextHeader) : text.slice(start);
  return section.trim();
}

function extractRecommendation(text: string): Recommendation | null {
  const upper = text.toUpperCase();
  // Search near "Recommended Position" first
  const posIdx = upper.indexOf("RECOMMENDED POSITION");
  const searchRegion = posIdx >= 0 ? upper.slice(posIdx, posIdx + 600) : upper;

  for (const kw of REC_KEYWORDS) {
    if (searchRegion.includes(kw)) return kw;
  }
  // Fallback: full text
  for (const kw of REC_KEYWORDS) {
    if (upper.includes(kw)) return kw;
  }
  return null;
}

function extractSeverity(text: string): Severity | null {
  const upper = text.toUpperCase();
  const concernIdx = upper.indexOf("PRIMARY CONCERN TRIGGERED");
  const searchRegion =
    concernIdx >= 0 ? upper.slice(concernIdx, concernIdx + 400) : upper;

  for (const kw of SEVERITY_KEYWORDS) {
    if (searchRegion.includes(`**${kw}**`)) return kw;
    if (searchRegion.includes(kw)) return kw;
  }
  return null;
}

function extractRationale(text: string): string {
  // Look for **Rationale** marker
  const patterns = [
    /\*\*Rationale\*\*\s*[-—:]\s*([\s\S]+?)(?=\n\*\*|\n##|$)/i,
    /Rationale\s*[-—:]\s*([\s\S]+?)(?=\n\*\*|\n##|$)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().slice(0, 200);
  }
  // Fallback: text near recommendation
  const posSection = extractSection(text, "## Recommended Position");
  if (posSection) return posSection.slice(0, 200);
  return "";
}

function extractCostConcern(text: string): number | null {
  // Look in "Risk If Delayed" section for dollar amounts
  const riskSection = extractSection(text, "## Risk If Delayed");
  const dollarMatch = riskSection.match(/\$[\d,]+/);
  if (dollarMatch) {
    return parseInt(dollarMatch[0].replace(/[$,]/g, "")) || null;
  }
  return null;
}

// ── Pivot point detection ─────────────────────────────────

function identifyPivotPoint(positions: PanelPosition[]): string | null {
  if (positions.length < 2) return null;

  const withRec = positions.filter((p) => p.recommendation !== null);
  const recs = new Set(withRec.map((p) => p.recommendation));
  if (recs.size <= 1) return null;

  // Check if the split is cost vs schedule driven
  const approvers = withRec.filter(
    (p) => p.recommendation === "APPROVE",
  );
  const delayers = withRec.filter(
    (p) => p.recommendation === "DELAY" || p.recommendation === "ESCALATE",
  );

  if (approvers.length > 0 && delayers.length > 0) {
    // Check rationale themes
    const approversCostFocused = approvers.some(
      (p) =>
        p.rationale.toLowerCase().includes("budget") ||
        p.rationale.toLowerCase().includes("cost"),
    );
    const delayersScheduleFocused = delayers.some(
      (p) =>
        p.rationale.toLowerCase().includes("schedule") ||
        p.rationale.toLowerCase().includes("timeline"),
    );
    const delayersCostFocused = delayers.some(
      (p) =>
        p.rationale.toLowerCase().includes("budget") ||
        p.rationale.toLowerCase().includes("cost"),
    );
    const approversScheduleFocused = approvers.some(
      (p) =>
        p.rationale.toLowerCase().includes("schedule") ||
        p.rationale.toLowerCase().includes("timeline"),
    );

    if (approversScheduleFocused && delayersCostFocused) {
      return "Schedule urgency vs. budget protection";
    }
    if (approversCostFocused && delayersScheduleFocused) {
      return "Cost efficiency vs. schedule risk";
    }

    // Generic: describe the split
    return `${approvers.map((p) => p.panelLabel).join(" & ")} favor ${approvers[0].recommendation} while ${delayers.map((p) => p.panelLabel).join(" & ")} recommend ${delayers[0].recommendation}`;
  }

  return null;
}

// ── Main analyzer ─────────────────────────────────────────

/**
 * Analyze stakeholder panel outputs for conflicts.
 * Extracts recommendation, severity, rationale, and cost concerns from each panel.
 */
export function analyzeConflicts(
  panels: Array<{ id: string; label: string; text: string }>,
): ConflictAnalysis {
  const positions: PanelPosition[] = panels
    .filter((p) => p.text)
    .map((p) => ({
      panelId: p.id,
      panelLabel: p.label,
      recommendation: extractRecommendation(p.text),
      severity: extractSeverity(p.text),
      rationale: extractRationale(p.text),
      costConcern: extractCostConcern(p.text),
    }));

  const withRec = positions.filter((p) => p.recommendation !== null);
  const uniqueRecs = new Set(withRec.map((p) => p.recommendation));
  const aligned = uniqueRecs.size <= 1;

  const conflictSeverity =
    withRec.length > 0
      ? Math.round(((uniqueRecs.size - 1) / Math.max(withRec.length - 1, 1)) * 100) / 100
      : 0;

  let conflictSummary: string;
  if (aligned) {
    conflictSummary =
      withRec.length > 0
        ? `All stakeholders recommend: ${withRec[0].recommendation}`
        : "No recommendations extracted";
  } else {
    const groups: Record<string, string[]> = {};
    for (const p of withRec) {
      const key = p.recommendation!;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p.panelLabel);
    }
    conflictSummary = Object.entries(groups)
      .map(([rec, names]) => `${names.join(" & ")}: ${rec}`)
      .join(" vs ");
  }

  const pivotPoint = aligned ? null : identifyPivotPoint(positions);

  return {
    aligned,
    positions,
    conflictSeverity,
    conflictSummary,
    pivotPoint,
  };
}
