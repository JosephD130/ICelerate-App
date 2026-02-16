// src/lib/demo/v5/resolvers/export-dataset.ts
// Resolves export manifest data into fully hydrated datasets for deck,
// workbook, or report rendering. Pure deterministic utility.

import type { ExportManifest } from "@/lib/demo/v5/exportManifests";
import { EXPORT_MANIFEST_BY_PROJECT } from "@/lib/demo/v5/exportManifests";
import { DEMO_PROJECT_BY_ID } from "@/lib/demo/v5/projects";
import type { DemoProject } from "@/lib/demo/v5/projects";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ResolvedSlide {
  slideNumber: number;
  title: string;
  type: string;
  bulletPoints: string[];
  dataRefs?: string[];
}

export interface ResolvedSheet {
  sheetName: string;
  description: string;
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface ResolvedSection {
  heading: string;
  type: string;
  narrative: string;
}

export interface ExportDataset {
  manifest: ExportManifest;
  resolvedSlides: ResolvedSlide[];
  resolvedSheets: ResolvedSheet[];
  resolvedSections: ResolvedSection[];
}

// ---------------------------------------------------------------------------
// Helpers — workbook row generators
// ---------------------------------------------------------------------------

function daysBetween(dateA: string, dateB: string): number {
  const msA = new Date(dateA).getTime();
  const msB = new Date(dateB).getTime();
  return Math.round((msB - msA) / 86_400_000);
}

function generateEventRows(project: DemoProject): Record<string, unknown>[] {
  return project.events.map((e) => ({
    "Event ID": e.id,
    Title: e.title,
    Severity: e.severity,
    Status: e.status,
    Alignment: e.alignmentStatus,
    Location: e.location,
    Created: e.createdAt,
    Updated: e.updatedAt,
    "Cost Exposure ($)": e.costExposure.amount,
    "Schedule Impact (days)": e.scheduleImpact.days,
    "Critical Path": e.scheduleImpact.criticalPath,
    "Notice Required": e.noticeRequired,
    "Notice Deadline": e.noticeDeadlineAt ?? null,
  }));
}

function generateCostExposureRows(
  project: DemoProject,
): Record<string, unknown>[] {
  let cumulative = 0;
  return project.events.map((e) => {
    cumulative += e.costExposure.amount;
    const contingencyImpact =
      project.contingency > 0
        ? Math.round(
            (e.costExposure.amount / project.contingency) * 10000,
          ) / 100
        : 0;
    return {
      "Event ID": e.id,
      Title: e.title,
      "Exposure Amount ($)": e.costExposure.amount,
      Confidence: e.costExposure.confidence,
      Notes: e.costExposure.notes,
      "Contingency Impact (%)": contingencyImpact,
      "Cumulative Exposure ($)": cumulative,
      "Remaining Contingency ($)": project.contingency - cumulative,
    };
  });
}

function generateScheduleImpactRows(
  project: DemoProject,
): Record<string, unknown>[] {
  // Build event-linkage for each task
  const taskToEvents = new Map<string, string[]>();
  for (const e of project.events) {
    for (const tid of e.taskIds) {
      const list = taskToEvents.get(tid) ?? [];
      list.push(e.id);
      taskToEvents.set(tid, list);
    }
  }

  return project.tasks.map((t) => {
    const variance = daysBetween(t.baselineFinish, t.forecastFinish);
    const linkedEvents = taskToEvents.get(t.id) ?? [];

    return {
      "Task ID": t.id,
      WBS: t.wbs,
      "Task Name": t.name,
      "Baseline Start": t.baselineStart,
      "Baseline Finish": t.baselineFinish,
      "Forecast Start": t.forecastStart,
      "Forecast Finish": t.forecastFinish,
      "Variance (days)": variance,
      "% Complete": t.percentComplete,
      "Critical Path": t.criticalPath,
      "Linked Events": linkedEvents.join(", "),
    };
  });
}

function generateRiskMatrixRows(
  project: DemoProject,
): Record<string, unknown>[] {
  return project.events.map((e) => {
    const severityWeight =
      e.severity === "critical"
        ? 4
        : e.severity === "high"
          ? 3
          : e.severity === "medium"
            ? 2
            : 1;
    const alignmentWeight =
      e.alignmentStatus === "high_risk"
        ? 3
        : e.alignmentStatus === "drift"
          ? 2
          : 1;
    const riskScore = severityWeight * alignmentWeight;

    return {
      "Event ID": e.id,
      Title: e.title,
      Probability:
        e.costExposure.confidence === "high"
          ? "High"
          : e.costExposure.confidence === "medium"
            ? "Medium"
            : "Low",
      "Cost Impact ($)": e.costExposure.amount,
      "Schedule Impact (days)": e.scheduleImpact.days,
      "Risk Score": riskScore,
      "Mitigation Status": e.status === "resolved" ? "Resolved" : "Active",
      Owner: null,
      "Next Action": null,
    };
  });
}

function generateNoticeTrackerRows(
  project: DemoProject,
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  for (const e of project.events) {
    if (!e.noticeRequired && e.docRefs.length === 0) continue;

    for (const docRef of e.docRefs) {
      const doc = project.documents.find((d) => d.id === docRef.docId);
      for (const clauseRef of docRef.clauseRefs) {
        const clause = doc?.clauses.find((c) => c.ref === clauseRef);
        rows.push({
          "Event ID": e.id,
          Title: e.title,
          "Clause Reference": clauseRef,
          "Notice Window (hrs)": clause?.noticeWindowHours ?? null,
          Deadline: e.noticeDeadlineAt ?? null,
          Filed: false,
          "Filed Date": null,
          "Entitlement at Risk": e.noticeRequired,
        });
      }
    }
  }

  return rows;
}

function generateStakeholderLogRows(
  project: DemoProject,
): Record<string, unknown>[] {
  const stakeholderToEvents = new Map<string, string[]>();
  for (const e of project.events) {
    for (const sid of e.stakeholderIds) {
      const list = stakeholderToEvents.get(sid) ?? [];
      list.push(e.id);
      stakeholderToEvents.set(sid, list);
    }
  }

  return project.stakeholders.map((s) => ({
    Stakeholder: s.name,
    Role: s.role,
    Org: s.org ?? null,
    Influence: s.influence,
    "Linked Events": (stakeholderToEvents.get(s.id) ?? []).join(", "),
    "Last Briefed": null,
    "Briefing Gap (days)": null,
    "Comm Preference": s.commPreference ?? null,
  }));
}

function generateSubmittalTrackerRows(
  project: DemoProject,
): Record<string, unknown>[] {
  // Derive submittal data from events that look like submittals
  return project.events
    .filter(
      (e) =>
        e.title.toLowerCase().includes("submittal") ||
        e.title.toLowerCase().includes("resubmittal"),
    )
    .map((e, idx) => ({
      "Submittal ID": `SUB-${String(idx + 1).padStart(3, "0")}`,
      "Item Description": e.title,
      "Revision Number": e.title.toLowerCase().includes("2nd") ? 2 : 1,
      "Submitted Date": e.createdAt,
      "Review Due": null,
      Status: e.status,
      "Reviewer Comments": e.summary.slice(0, 120),
      "Days in Review": null,
      "Linked Task":
        e.taskIds.length > 0 ? e.taskIds.join(", ") : null,
    }));
}

function generatePublicAffairsRows(
  project: DemoProject,
): Record<string, unknown>[] {
  return project.events
    .filter(
      (e) =>
        e.title.toLowerCase().includes("public") ||
        e.title.toLowerCase().includes("community") ||
        e.title.toLowerCase().includes("escalation"),
    )
    .map((e) => ({
      Date: e.createdAt,
      "Communication Type": "Event",
      Topic: e.title,
      Source: e.location,
      Sentiment: e.severity === "critical" ? "Negative" : "Neutral",
      "Response Status": e.status,
      "Assigned To": null,
      "Escalation Risk":
        e.alignmentStatus === "high_risk"
          ? "High"
          : e.alignmentStatus === "drift"
            ? "Medium"
            : "Low",
    }));
}

/** Map sheet name pattern to row generator */
const SHEET_GENERATORS: Array<{
  pattern: RegExp;
  generate: (project: DemoProject) => Record<string, unknown>[];
}> = [
  { pattern: /^events$/i, generate: generateEventRows },
  { pattern: /cost\s*exposure/i, generate: generateCostExposureRows },
  { pattern: /schedule\s*impact/i, generate: generateScheduleImpactRows },
  { pattern: /risk\s*matrix/i, generate: generateRiskMatrixRows },
  { pattern: /notice\s*tracker/i, generate: generateNoticeTrackerRows },
  { pattern: /stakeholder/i, generate: generateStakeholderLogRows },
  { pattern: /submittal/i, generate: generateSubmittalTrackerRows },
  { pattern: /public\s*affairs/i, generate: generatePublicAffairsRows },
];

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the export manifest for a project into a fully hydrated dataset
 * for a specific format (deck, workbook, or report).
 * Returns null if project or manifest not found.
 */
export interface ProvenanceStamp {
  generatedAt: string;
  sourceAges: Array<{ label: string; ageDays: number }>;
  freshness: "fresh" | "stale" | "old";
  verifiedCount: number;
  needsReviewCount: number;
}

export interface ExportOptions {
  verifiedOnly?: boolean;
  includeAppendix?: boolean;
  pendingItems?: Array<{ headline: string; confidence: number; type: string; improvement: string }>;
  provenance?: ProvenanceStamp;
}

export function resolveExportDataset(
  projectId: string,
  format: "deck" | "workbook" | "report",
  options?: ExportOptions,
): ExportDataset | null {
  const project = DEMO_PROJECT_BY_ID[projectId];
  if (!project) return null;

  const manifest = EXPORT_MANIFEST_BY_PROJECT[projectId];
  if (!manifest) return null;

  // Resolve slides (for "deck" format)
  let resolvedSlides: ResolvedSlide[] = [];
  if (format === "deck") {
    resolvedSlides = manifest.deckSlides.map((slide) => ({
      slideNumber: slide.slideNumber,
      title: slide.title,
      type: slide.type,
      bulletPoints: slide.bulletPoints,
      dataRefs: slide.dataRefs,
    }));
  }

  // Resolve sheets (for "workbook" format)
  let resolvedSheets: ResolvedSheet[] = [];
  if (format === "workbook") {
    resolvedSheets = manifest.workbookSheets.map((sheet) => {
      const generator = SHEET_GENERATORS.find((g) =>
        g.pattern.test(sheet.sheetName),
      );
      const rows = generator ? generator.generate(project) : [];

      return {
        sheetName: sheet.sheetName,
        description: sheet.description,
        columns: sheet.columns,
        rows,
      };
    });
  }

  // Resolve sections (for "report" format)
  let resolvedSections: ResolvedSection[] = [];
  if (format === "report") {
    resolvedSections = manifest.reportSections.map((s) => ({
      heading: s.heading,
      type: s.type,
      narrative: s.narrative,
    }));
  }

  // Appendix: pending review items
  if (options?.includeAppendix && options.pendingItems && options.pendingItems.length > 0) {
    if (format === "deck") {
      resolvedSlides.push({
        slideNumber: resolvedSlides.length + 1,
        title: "Items Pending Review",
        type: "appendix",
        bulletPoints: options.pendingItems.map(
          (item) => `[${item.type}] ${item.headline} — ${item.confidence}% confidence — ${item.improvement}`,
        ),
      });
    }
    if (format === "workbook") {
      resolvedSheets.push({
        sheetName: "Pending Review",
        description: "Items awaiting human verification before inclusion",
        columns: ["Headline", "Type", "Confidence", "What to Confirm"],
        rows: options.pendingItems.map((item) => ({
          Headline: item.headline,
          Type: item.type,
          Confidence: item.confidence,
          "What to Confirm": item.improvement,
        })),
      });
    }
    if (format === "report") {
      resolvedSections.push({
        heading: "Appendix: Items Pending Review",
        type: "appendix",
        narrative: options.pendingItems
          .map(
            (item) => `• ${item.headline} (${item.type}, ${item.confidence}% confidence) — ${item.improvement}`,
          )
          .join("\n"),
      });
    }
  }

  // Provenance stamping — append source metadata to exports
  if (options?.provenance) {
    const prov = options.provenance;
    const freshnessLabel =
      prov.freshness === "fresh" ? "Current" : prov.freshness === "stale" ? "Aging" : "Outdated";

    if (format === "deck") {
      resolvedSlides.push({
        slideNumber: resolvedSlides.length + 1,
        title: "Data Provenance",
        type: "provenance",
        bulletPoints: [
          `Generated: ${prov.generatedAt}`,
          `Source Freshness: ${freshnessLabel}`,
          `Validated Events: ${prov.verifiedCount}`,
          `Pending Review: ${prov.needsReviewCount}`,
          ...prov.sourceAges.map((s) => `${s.label}: ${s.ageDays}d old`),
        ],
      });
    }

    if (format === "workbook") {
      resolvedSheets.push({
        sheetName: "Provenance",
        description: "Data source ages and trust status at time of export",
        columns: ["Source", "Age (days)", "Freshness", "Generated At"],
        rows: prov.sourceAges.map((s) => ({
          Source: s.label,
          "Age (days)": s.ageDays,
          Freshness: freshnessLabel,
          "Generated At": prov.generatedAt,
        })),
      });
    }

    if (format === "report") {
      resolvedSections.push({
        heading: "Data Provenance",
        type: "provenance",
        narrative: [
          `Report generated: ${prov.generatedAt}`,
          `Overall source freshness: ${freshnessLabel}`,
          `Validated events: ${prov.verifiedCount} | Pending review: ${prov.needsReviewCount}`,
          "",
          "Source Ages:",
          ...prov.sourceAges.map((s) => `• ${s.label}: ${s.ageDays} days old`),
        ].join("\n"),
      });
    }
  }

  return {
    manifest,
    resolvedSlides,
    resolvedSheets,
    resolvedSections,
  };
}
