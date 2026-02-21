"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckCircle,
  Loader2,
  UserPlus,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useEvents } from "@/lib/contexts/event-context";
import { resolveExportDataset, type ExportOptions, type ProvenanceStamp } from "@/lib/demo/v5/resolvers/export-dataset";
import { resolveExportPreflight } from "@/lib/demo/v5/resolvers/export-preflight";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import { resolveNoticeClocks } from "@/lib/ui/risk-register-helpers";
import ExportAssistantPanel from "@/components/export/ExportAssistantPanel";
import TrendMiniChart from "@/components/shared/TrendMiniChart";
import { FLAGS } from "@/lib/flags";
import { T } from "@/lib/terminology";
import { useExportContext } from "@/lib/contexts/export-context";
import { personas, type Persona } from "@/lib/demo/personas";
import { INTENT_KEY, type SuggestionActionIntent } from "@/lib/suggestion-actions";

// ---------------------------------------------------------------------------
// PPTX Export — Stakeholder Deck
// ---------------------------------------------------------------------------
async function exportPPTX(
  project: ReturnType<typeof useActiveProject>["activeProject"],
  events: ReturnType<typeof useEvents>["events"],
  exportOpts?: ExportOptions,
) {
  const pptxgenjs = await import("pptxgenjs");
  const pptx = new pptxgenjs.default();
  pptx.layout = "LAYOUT_WIDE";

  const BG = "121214";
  const CARD = "1E1E21";
  const ACCENT = "FF6B35";
  const TEXT = "E5E5E7";
  const MUTED = "8E8E93";
  const RED = "EF4444";
  const GREEN = "22C55E";

  const dataset = resolveExportDataset(project.id, "deck", exportOpts);

  if (dataset && dataset.resolvedSlides.length > 0) {
    // Manifest-driven slides
    for (const slide of dataset.resolvedSlides) {
      const s = pptx.addSlide();
      s.background = { color: BG };

      // Slide number badge
      s.addText(`${slide.slideNumber}/${dataset.resolvedSlides.length}`, {
        x: 12.2, y: 0.15, w: 1, fontSize: 8, color: MUTED, align: "right",
      });

      if (slide.type === "title") {
        // Title slide
        s.addText("ICelerate Export", { x: 0.5, y: 0.4, w: 8, fontSize: 12, color: MUTED, fontFace: "Arial" });
        s.addText(slide.title, { x: 0.5, y: 1.0, w: 10, fontSize: 26, color: TEXT, bold: true, fontFace: "Arial" });
        slide.bulletPoints.forEach((bp, i) => {
          s.addText(bp, { x: 0.5, y: 2.0 + i * 0.4, w: 10, fontSize: 13, color: MUTED, fontFace: "Arial" });
        });
        s.addText(`Generated ${new Date().toLocaleDateString()} | Powered by Claude Opus 4.6`, {
          x: 0.5, y: 4.5, w: 5, fontSize: 10, color: MUTED,
        });
      } else if (slide.type === "events") {
        // Events slide with severity coloring
        s.addText(slide.title, { x: 0.5, y: 0.3, w: 10, fontSize: 22, color: TEXT, bold: true });
        slide.bulletPoints.forEach((bp, i) => {
          const sevColor = bp.startsWith("CRITICAL") ? RED : bp.startsWith("HIGH") ? "F59E0B" : bp.startsWith("MEDIUM") ? "3B82F6" : TEXT;
          s.addText(bp, { x: 0.5, y: 1.2 + i * 0.9, w: 12, fontSize: 11, color: sevColor, fontFace: "Arial" });
        });
      } else if (slide.type === "status") {
        // Status with KPI cards
        s.addText(slide.title, { x: 0.5, y: 0.3, w: 10, fontSize: 22, color: TEXT, bold: true });
        slide.bulletPoints.forEach((bp, i) => {
          const isAtRisk = bp.includes("AT RISK") || bp.includes("slipped");
          s.addText(`• ${bp}`, {
            x: 0.5, y: 1.2 + i * 0.55, w: 12, fontSize: 11,
            color: isAtRisk ? "F59E0B" : TEXT, fontFace: "Arial",
          });
        });
      } else {
        // Generic slide (timeline, contract, recommendations, sources)
        s.addText(slide.title, { x: 0.5, y: 0.3, w: 10, fontSize: 22, color: TEXT, bold: true });
        const typeColor = slide.type === "recommendations" ? GREEN : slide.type === "contract" ? "3B82F6" : TEXT;
        slide.bulletPoints.forEach((bp, i) => {
          const highlight = bp.startsWith("IMMEDIATE") ? RED : bp.startsWith("THIS WEEK") ? "F59E0B" : typeColor;
          s.addText(`• ${bp}`, {
            x: 0.5, y: 1.2 + i * 0.55, w: 12, fontSize: 11,
            color: highlight, fontFace: "Arial",
          });
        });
      }
    }
  } else {
    // Fallback: original 4 hardcoded slides
    const s1 = pptx.addSlide();
    s1.background = { color: BG };
    s1.addText("ICelerate Export", { x: 0.5, y: 0.4, w: 8, fontSize: 12, color: MUTED, fontFace: "Arial" });
    s1.addText(project.name, { x: 0.5, y: 1.0, w: 10, fontSize: 28, color: TEXT, bold: true, fontFace: "Arial" });
    s1.addText(`${project.owner} | $${(project.contractValue / 1e6).toFixed(1)}M | ${project.percentComplete}% Complete`, {
      x: 0.5, y: 2.0, w: 10, fontSize: 14, color: MUTED, fontFace: "Arial",
    });
    s1.addText(`Generated ${new Date().toLocaleDateString()}`, { x: 0.5, y: 4.5, w: 5, fontSize: 10, color: MUTED });

    const s2 = pptx.addSlide();
    s2.background = { color: BG };
    s2.addText("Project Status", { x: 0.5, y: 0.3, w: 8, fontSize: 22, color: TEXT, bold: true });
    const openEvts = events.filter((e) => e.status !== "resolved");
    const totalExposure = openEvts.reduce((s, e) => s + (e.costImpact?.estimated ?? 0), 0);
    const critPathDays = openEvts.filter((e) => e.scheduleImpact?.criticalPath).reduce((s, e) => s + (e.scheduleImpact?.daysAffected ?? 0), 0);
    const stats = [
      [`${project.percentComplete}%`, "Complete"],
      [`$${(totalExposure / 1000).toFixed(0)}K`, "Open Exposure"],
      [`${openEvts.length}`, "Open Risk Items"],
      [`${critPathDays}d`, "Crit Path Impact"],
    ];
    stats.forEach(([val, label], i) => {
      const col = 0.5 + i * 2.8;
      s2.addShape(pptxgenjs.default.ShapeType.roundRect, { x: col, y: 1.2, w: 2.4, h: 1.4, fill: { color: CARD }, rectRadius: 0.1 });
      s2.addText(val, { x: col, y: 1.3, w: 2.4, fontSize: 28, color: ACCENT, bold: true, align: "center" });
      s2.addText(label, { x: col, y: 2.1, w: 2.4, fontSize: 11, color: MUTED, align: "center" });
    });

    const s3 = pptx.addSlide();
    s3.background = { color: BG };
    s3.addText("Top Events", { x: 0.5, y: 0.3, w: 8, fontSize: 22, color: TEXT, bold: true });
    openEvts.slice(0, 5).forEach((evt, i) => {
      const y = 1.0 + i * 0.8;
      s3.addText(evt.severity.toUpperCase(), { x: 0.5, y, w: 1.2, fontSize: 9, color: evt.severity === "critical" ? RED : "F59E0B", bold: true });
      s3.addText(evt.title, { x: 1.8, y, w: 7, fontSize: 12, color: TEXT });
    });

    const s4 = pptx.addSlide();
    s4.background = { color: BG };
    s4.addText("Data Sources", { x: 0.5, y: 0.3, w: 8, fontSize: 22, color: TEXT, bold: true });
    project.sourceProfile.sources.forEach((src, i) => {
      s4.addText(src.label, { x: 0.5, y: 1.0 + i * 0.6, w: 4, fontSize: 12, color: TEXT });
      s4.addText(`${src.coverage}%`, { x: 7, y: 1.0 + i * 0.6, w: 2, fontSize: 10, color: MUTED });
    });
  }

  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  downloadBlob(blob, `icelerate-deck-${project.id}.pptx`);
}

// ---------------------------------------------------------------------------
// XLSX Export — Decision Workbook
// ---------------------------------------------------------------------------
async function exportXLSX(
  project: ReturnType<typeof useActiveProject>["activeProject"],
  events: ReturnType<typeof useEvents>["events"],
  exportOpts?: ExportOptions,
) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const dataset = resolveExportDataset(project.id, "workbook", exportOpts);

  if (dataset && dataset.resolvedSheets.length > 0) {
    // Manifest-driven sheets with resolved rows
    for (const sheet of dataset.resolvedSheets) {
      if (sheet.rows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(sheet.rows);
        XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName.slice(0, 31));
      } else {
        // Empty sheet with headers
        const ws = XLSX.utils.aoa_to_sheet([sheet.columns]);
        XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName.slice(0, 31));
      }
    }
  } else {
    // Fallback: original hardcoded sheets
    const eventRows = events.map((e) => ({
      ID: e.id, Title: e.title, Severity: e.severity, Status: e.status,
      Alignment: e.alignmentStatus, Location: e.location ?? "",
      "Cost ($)": e.costImpact?.estimated ?? 0,
      "Schedule (days)": e.scheduleImpact?.daysAffected ?? 0,
      "Critical Path": e.scheduleImpact?.criticalPath ? "Yes" : "No",
      Created: e.createdAt,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventRows), "Events");

    const sourceRows = project.sourceProfile.sources.map((s) => ({
      Source: s.label, Kind: s.kind, Status: s.status, Coverage: `${s.coverage}%`, "Last Sync": s.lastSyncAt,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sourceRows), "Data Sources");
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, `icelerate-workbook-${project.id}.xlsx`);
}

// ---------------------------------------------------------------------------
// PDF Export — Print-friendly Alignment Report
// ---------------------------------------------------------------------------
function exportPDF(
  project: ReturnType<typeof useActiveProject>["activeProject"],
  events: ReturnType<typeof useEvents>["events"],
  exportOpts?: ExportOptions,
) {
  const dataset = resolveExportDataset(project.id, "report", exportOpts);

  let bodyContent = "";

  if (dataset && dataset.resolvedSections.length > 0) {
    // Manifest-driven rich sections
    for (const section of dataset.resolvedSections) {
      if (section.type === "header") {
        bodyContent += `<h1>${section.heading}</h1><div class="meta">${section.narrative}</div>`;
      } else {
        bodyContent += `<h2>${section.heading}</h2><p>${section.narrative}</p>`;
      }
    }
  } else {
    // Fallback: original generic report
    const openEvts = events.filter((e) => e.status !== "resolved");
    const totalExposure = openEvts.reduce((s, e) => s + (e.costImpact?.estimated ?? 0), 0);
    bodyContent = `
<h1>${project.name}</h1>
<div class="meta">${project.owner} | Contract: $${(project.contractValue / 1e6).toFixed(1)}M | Generated: ${new Date().toLocaleDateString()}</div>
<div class="stats">
  <div class="stat"><div class="stat-val">${project.percentComplete}%</div><div class="stat-label">Complete</div></div>
  <div class="stat"><div class="stat-val">$${(totalExposure / 1000).toFixed(0)}K</div><div class="stat-label">Open Exposure</div></div>
  <div class="stat"><div class="stat-val">${openEvts.length}</div><div class="stat-label">Open Risk Items</div></div>
</div>
<h2>Risk Item Summary</h2>
<table>
  <tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Cost</th><th>Days</th></tr>
  ${events.map((e) => `<tr><td>${e.id}</td><td>${e.title}</td><td class="sev-${e.severity}">${e.severity}</td><td>${e.status}</td><td>$${((e.costImpact?.estimated ?? 0) / 1000).toFixed(0)}K</td><td>${e.scheduleImpact?.daysAffected ?? 0}</td></tr>`).join("")}
</table>`;
  }

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>ICelerate Report — ${project.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 40px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 28px; margin-bottom: 12px; border-bottom: 2px solid #FF6B35; padding-bottom: 4px; }
  p { font-size: 13px; line-height: 1.7; margin-bottom: 12px; color: #333; }
  .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
  .stats { display: flex; gap: 24px; margin: 16px 0; }
  .stat { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; flex: 1; }
  .stat-val { font-size: 24px; font-weight: 700; color: #FF6B35; }
  .stat-label { font-size: 11px; color: #666; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th { background: #f5f5f5; text-align: left; padding: 8px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; }
  td { padding: 8px; border: 1px solid #ddd; }
  .sev-critical { color: #dc2626; font-weight: 600; }
  .sev-high { color: #d97706; font-weight: 600; }
  .sev-medium { color: #2563eb; }
  .sev-low { color: #16a34a; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
${bodyContent}
<div class="footer">
  Generated by ICelerate | Data mode: ${project.sourceProfile.mode} | ${project.sourceProfile.sources.length} sources | ${new Date().toISOString()}
</div>
</body></html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Report Types
// ---------------------------------------------------------------------------
type ReportType = "daily" | "weekly" | "monthly" | "custom";

const REPORT_TYPES: { id: ReportType; label: string; description: string }[] = [
  { id: "daily", label: "Daily", description: "Field summary with today\u2019s activity and immediate risks" },
  { id: "weekly", label: "Weekly", description: "Status update with progress, cost, and schedule trends" },
  { id: "monthly", label: "Monthly", description: "Executive report with KPIs, forecasts, and recommendations" },
  { id: "custom", label: "Custom", description: "Freeform \u2014 specify what you need in the assistant" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface DeliverableCard {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  format: string;
}

const DELIVERABLES: DeliverableCard[] = [
  {
    id: "pptx",
    label: "Stakeholder Deck",
    description: "PPTX presentation with status, top events, cost exposure, and source trust data",
    icon: <Presentation size={20} />,
    format: ".pptx",
  },
  {
    id: "xlsx",
    label: "Decision Workbook",
    description: "Multi-sheet XLSX with events, cost, schedule, stakeholder, and source data",
    icon: <FileSpreadsheet size={20} />,
    format: ".xlsx",
  },
  {
    id: "pdf",
    label: "Alignment Report",
    description: "Print-friendly report with alignment status, contract citations, and source provenance",
    icon: <FileText size={20} />,
    format: ".pdf",
  },
  {
    id: "csv",
    label: "Risk Item CSV",
    description: "Flat CSV of all risk items for import into other tools",
    icon: <FileSpreadsheet size={20} />,
    format: ".csv",
  },
];

// ---------------------------------------------------------------------------
// Export Readiness Score
// ---------------------------------------------------------------------------
interface ReadinessFactor {
  id: string;
  label: string;
  score: number;
  severity: "ok" | "warning" | "critical";
  detail: string;
}

interface ExportReadinessScore {
  composite: number;
  grade: "A" | "B" | "C" | "D" | "F";
  factors: ReadinessFactor[];
}

function severityFromScore(score: number): "ok" | "warning" | "critical" {
  if (score >= 70) return "ok";
  if (score >= 40) return "warning";
  return "critical";
}

function computeExportReadiness(
  events: ReturnType<typeof useEvents>["events"],
  sources: ReturnType<typeof useActiveProject>["activeProject"]["sourceProfile"]["sources"],
): ExportReadinessScore {
  const openEvents = events.filter((e) => e.status !== "resolved");

  // Factor 1: Data Freshness
  const avgAgeHours = sources.reduce((sum, s) => {
    return sum + (Date.now() - new Date(s.lastSyncAt).getTime()) / 3_600_000;
  }, 0) / (sources.length || 1);
  const freshnessScore = avgAgeHours <= 24 ? 100 : avgAgeHours <= 168 ? 65 : 25;

  // Factor 2: Evidence Coverage
  const avgCoverage = Math.round(
    sources.reduce((s, src) => s + src.coverage, 0) / (sources.length || 1)
  );

  // Factor 3: Notice Compliance
  const clocks = resolveNoticeClocks(events);
  const overdueCount = clocks.filter((c) => c.isOverdue).length;
  const noticeScore = clocks.length === 0
    ? 100
    : overdueCount > 0
      ? Math.max(0, 100 - overdueCount * 30)
      : 80;

  // Factor 4: Verified Items
  const verifiedCount = openEvents.filter((e) =>
    e.fieldRecord?.trust?.trustStatus === "verified" ||
    e.decisionRecord?.trust?.trustStatus === "verified" ||
    e.rfiRecord?.trust?.trustStatus === "verified"
  ).length;
  const verifiedPct = openEvents.length > 0
    ? Math.round((verifiedCount / openEvents.length) * 100)
    : 0;

  const factors: ReadinessFactor[] = [
    {
      id: "freshness",
      label: "Data Freshness",
      score: freshnessScore,
      severity: severityFromScore(freshnessScore),
      detail: avgAgeHours <= 24 ? "All sources current" : `Oldest source ${Math.floor(avgAgeHours / 24)}d old`,
    },
    {
      id: "coverage",
      label: "Evidence Coverage",
      score: avgCoverage,
      severity: severityFromScore(avgCoverage),
      detail: `${avgCoverage}% average across ${sources.length} sources`,
    },
    {
      id: "notices",
      label: "Notice Compliance",
      score: noticeScore,
      severity: severityFromScore(noticeScore),
      detail: overdueCount > 0
        ? `${overdueCount} overdue notice${overdueCount !== 1 ? "s" : ""}`
        : clocks.length > 0
          ? `${clocks.length} active, none overdue`
          : "No active notices",
    },
    {
      id: "verified",
      label: "Verified Items",
      score: verifiedPct,
      severity: severityFromScore(verifiedPct),
      detail: `${verifiedCount}/${openEvents.length} items validated`,
    },
  ];

  const composite = Math.round(factors.reduce((sum, f) => sum + f.score, 0) / 4);
  const grade: ExportReadinessScore["grade"] =
    composite >= 85 ? "A"
    : composite >= 70 ? "B"
    : composite >= 55 ? "C"
    : composite >= 40 ? "D"
    : "F";

  return { composite, grade, factors };
}

const GRADE_COLORS: Record<string, string> = {
  A: "var(--color-semantic-green)",
  B: "var(--color-semantic-green)",
  C: "var(--color-semantic-yellow)",
  D: "var(--color-semantic-red)",
  F: "var(--color-semantic-red)",
};

const SEVERITY_COLORS: Record<string, string> = {
  ok: "var(--color-semantic-green)",
  warning: "var(--color-semantic-yellow)",
  critical: "var(--color-semantic-red)",
};

function ExportReadinessCard({
  events,
  sources,
}: {
  events: ReturnType<typeof useEvents>["events"];
  sources: ReturnType<typeof useActiveProject>["activeProject"]["sourceProfile"]["sources"];
}) {
  const [expanded, setExpanded] = useState(false);
  const readiness = useMemo(
    () => computeExportReadiness(events, sources),
    [events, sources],
  );
  const gradeColor = GRADE_COLORS[readiness.grade];

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-sm font-bold font-data"
            style={{ backgroundColor: gradeColor, color: "#0A1628" }}
          >
            {readiness.grade}
          </span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              Export Readiness
            </div>
            <div className="text-xs font-data font-semibold" style={{ color: gradeColor }}>
              {readiness.composite}/100
            </div>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={12} className="text-[var(--color-text-dim)]" />
          : <ChevronDown size={12} className="text-[var(--color-text-dim)]" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2.5">
          {readiness.factors.map((f) => (
            <div key={f.id}>
              <div className="flex items-center gap-3">
                <div className="w-[100px] shrink-0 text-[10px] text-[var(--color-text-secondary)] truncate">
                  {f.label}
                </div>
                <div className="flex-1 h-[4px] rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-600"
                    style={{
                      width: `${f.score}%`,
                      backgroundColor: SEVERITY_COLORS[f.severity],
                    }}
                  />
                </div>
                <div
                  className="w-7 text-right text-[10px] font-data"
                  style={{ color: SEVERITY_COLORS[f.severity] }}
                >
                  {f.score}
                </div>
              </div>
              <div className="ml-[112px] text-[10px] text-[var(--color-text-dim)] mt-0.5">
                {f.detail}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ExportPage() {
  const { activeProject } = useActiveProject();
  const { events } = useEvents();
  const { scope } = useExportContext();
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string[]>([]);
  const [boardReady, setBoardReady] = useState(true);
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>();
  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [showAddPersona, setShowAddPersona] = useState(false);
  const [newPersonaForm, setNewPersonaForm] = useState({ name: "", role: "", cares: "" });

  // Check for suggestion action intent routed from workspace
  useEffect(() => {
    const raw = localStorage.getItem(INTENT_KEY);
    if (raw) {
      localStorage.removeItem(INTENT_KEY);
      try {
        const intent: SuggestionActionIntent = JSON.parse(raw);
        setReportType("custom");
        setPendingPrompt(intent.prompt);
      } catch { /* ignore parse errors */ }
    }
  }, []);

  const openEvts = events.filter((e) => e.status !== "resolved");
  const totalExposure = openEvts.reduce((s, e) => s + (e.costImpact?.estimated ?? 0), 0);
  const preflight = FLAGS.exportPreflight ? resolveExportPreflight(events, "all") : null;
  const freshnessBadge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });

  // Decision Velocity data
  const velocityData = useMemo(() => {
    const eventsWithVelocity = events.filter((e) => e.velocity.totalMinutes != null);
    const avgTraditionalDays = events.length > 0
      ? Math.round(events.reduce((s, e) => s + e.velocity.traditionalDays, 0) / events.length)
      : 18;
    const avgMinutes = eventsWithVelocity.length > 0
      ? Math.round(eventsWithVelocity.reduce((s, e) => s + (e.velocity.totalMinutes ?? 0), 0) / eventsWithVelocity.length)
      : null;
    const iceTime = avgMinutes != null
      ? avgMinutes < 60 ? `${avgMinutes} min` : `${(avgMinutes / 60).toFixed(1)} hrs`
      : "Pending";
    const multiplier = avgMinutes != null && avgMinutes > 0
      ? Math.round((avgTraditionalDays * 24 * 60) / avgMinutes)
      : null;
    const sparkData = eventsWithVelocity.map((e) => {
      const tradMinutes = e.velocity.traditionalDays * 24 * 60;
      const iceMinutes = e.velocity.totalMinutes ?? tradMinutes;
      return Math.round(tradMinutes / Math.max(iceMinutes, 1));
    });
    return { avgTraditionalDays, iceTime, multiplier, sparkData };
  }, [events]);

  const buildExportOptions = (): ExportOptions => {
    const opts: ExportOptions = {
      verifiedOnly: boardReady,
    };
    if (FLAGS.provenanceStamping) {
      const verifiedCount = events.filter(
        (e) => e.decisionRecord?.trust?.trustStatus === "verified" ||
               e.fieldRecord?.trust?.trustStatus === "verified" ||
               e.rfiRecord?.trust?.trustStatus === "verified"
      ).length;
      const needsReviewCount = events.filter(
        (e) => e.decisionRecord?.trust?.trustStatus === "needs_review" ||
               e.fieldRecord?.trust?.trustStatus === "needs_review" ||
               e.rfiRecord?.trust?.trustStatus === "needs_review"
      ).length;
      const provenance: ProvenanceStamp = {
        generatedAt: new Date().toISOString(),
        sourceAges: activeProject.sourceProfile.sources.map((s) => ({
          label: s.label,
          ageDays: Math.floor((Date.now() - new Date(s.lastSyncAt).getTime()) / 86_400_000),
        })),
        freshness: freshnessBadge.level,
        verifiedCount,
        needsReviewCount,
      };
      opts.provenance = provenance;
    }
    return opts;
  };

  const handleExport = async (id: string) => {
    setExporting(id);
    const opts = buildExportOptions();
    try {
      switch (id) {
        case "pptx":
          await exportPPTX(activeProject, events, opts);
          break;
        case "xlsx":
          await exportXLSX(activeProject, events, opts);
          break;
        case "pdf":
          exportPDF(activeProject, events, opts);
          break;
        case "csv": {
          const headers = ["ID", "Title", "Severity", "Status", "Alignment", "Location", "Cost ($)", "Schedule (days)", "Critical Path", "Created"];
          const rows = events.map((e) => [
            e.id, `"${e.title}"`, e.severity, e.status, e.alignmentStatus, e.location ?? "",
            e.costImpact?.estimated ?? 0, e.scheduleImpact?.daysAffected ?? 0,
            e.scheduleImpact?.criticalPath ? "Yes" : "No", e.createdAt,
          ]);
          const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
          downloadBlob(new Blob([csv], { type: "text/csv" }), `icelerate-events-${activeProject.id}.csv`);
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 800));
      setExported((prev) => [...prev, id]);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(null);
    }
  };

  const allPersonas: Persona[] = [...personas, ...customPersonas];

  const togglePersona = (id: string) => {
    setSelectedPersonaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddCustomPersona = () => {
    if (!newPersonaForm.name.trim() || !newPersonaForm.role.trim()) return;
    const id = `custom-${Date.now()}`;
    const newPersona: Persona = {
      id,
      emoji: "\u{1F464}",
      name: newPersonaForm.name.trim(),
      role: newPersonaForm.role.trim(),
      cares: newPersonaForm.cares.trim() || "General project status",
      readingLevel: 7,
      defaultFormality: 0.6,
      defaultRoom: "conference-room",
    };
    setCustomPersonas((prev) => [...prev, newPersona]);
    setNewPersonaForm({ name: "", role: "", cares: "" });
    setShowAddPersona(false);
  };

  const handleGenerateBriefs = () => {
    const selected = allPersonas.filter((p) => selectedPersonaIds.includes(p.id));
    if (selected.length === 0) return;
    const reportConfig = REPORT_TYPES.find((r) => r.id === reportType);
    const personaList = selected
      .map((p) => `- ${p.name} (${p.role}): cares about ${p.cares}`)
      .join("\n");
    setPendingPrompt(
      `Generate a ${reportConfig?.label ?? "Weekly"} project status brief.\n\nReport type: ${reportConfig?.description ?? ""}\n\nGenerate tailored sections for each of these stakeholders:\n${personaList}\n\nFor each persona, tailor the language, detail level, and framing for their specific role and concerns. Include relevant project metrics, open risk items, and recommended actions.`
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
            <Download size={18} />
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{T.OUTPUTS}</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Board-Ready toggle */}
          {FLAGS.safeUx && (
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => setBoardReady(!boardReady)}
                className="w-8 h-4 rounded-full relative transition-colors cursor-pointer"
                style={{
                  backgroundColor: boardReady
                    ? "var(--color-semantic-green)"
                    : "var(--color-border)",
                }}
              >
                <span
                  className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                  style={{ left: boardReady ? "17px" : "2px" }}
                />
              </button>
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                Board-Ready
              </span>
            </div>
          )}
          {/* Compact export buttons */}
          {DELIVERABLES.map((d) => (
            <button
              key={d.id}
              onClick={() => handleExport(d.id)}
              disabled={exporting === d.id}
              title={`${d.label} (${d.format})`}
              className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all cursor-pointer disabled:opacity-50"
            >
              {exporting === d.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : exported.includes(d.id) ? (
                <CheckCircle size={14} className="text-[var(--color-semantic-green)]" />
              ) : (
                <span className="[&>svg]:w-[14px] [&>svg]:h-[14px]">{d.icon}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-0">
        {/* Left: Project Assistant */}
        <ExportAssistantPanel
          className="min-h-0"
          boardReady={boardReady}
          scope={scope}
          onExport={handleExport}
          externalPrompt={pendingPrompt}
          onExternalPromptConsumed={() => setPendingPrompt(undefined)}
          reportType={reportType}
          selectedPersonas={allPersonas.filter((p) => selectedPersonaIds.includes(p.id))}
          preflight={preflight}
        />

        {/* Right column */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          {/* Export Readiness Score */}
          <ExportReadinessCard
            events={events}
            sources={activeProject.sourceProfile.sources}
          />

          {/* Report Type Selector */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
            <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-2">
              Report Type
            </div>
            <div className="flex gap-1">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => setReportType(rt.id)}
                  className={`flex-1 py-2 px-1 rounded-[var(--radius-sm)] border text-center transition-all cursor-pointer ${
                    reportType === rt.id
                      ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)] text-[var(--color-accent)]"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-light)]"
                  }`}
                >
                  <span className="text-[10px] font-semibold">{rt.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-1.5 text-[10px] text-[var(--color-text-dim)]">
              {REPORT_TYPES.find((r) => r.id === reportType)?.description}
            </div>
          </div>

          {/* Persona Selection with Add Custom */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                Generate Brief For
              </div>
              <button
                onClick={() => setShowAddPersona(!showAddPersona)}
                className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer"
              >
                <UserPlus size={10} />
                Add
              </button>
            </div>

            {/* Add persona inline form */}
            {showAddPersona && (
              <div className="mb-2 p-2 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)] space-y-1.5">
                <input
                  value={newPersonaForm.name}
                  onChange={(e) => setNewPersonaForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Name"
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
                <input
                  value={newPersonaForm.role}
                  onChange={(e) => setNewPersonaForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="Role (e.g. Inspector)"
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
                <input
                  value={newPersonaForm.cares}
                  onChange={(e) => setNewPersonaForm((f) => ({ ...f, cares: e.target.value }))}
                  placeholder="Cares about (e.g. Safety, compliance)"
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={handleAddCustomPersona}
                    disabled={!newPersonaForm.name.trim() || !newPersonaForm.role.trim()}
                    className="flex-1 py-1 text-[10px] font-semibold rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white cursor-pointer disabled:opacity-40"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowAddPersona(false); setNewPersonaForm({ name: "", role: "", cares: "" }); }}
                    className="px-2 py-1 text-[10px] text-[var(--color-text-muted)] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Persona list with multi-select */}
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {allPersonas.map((p) => {
                const isSelected = selectedPersonaIds.includes(p.id);
                const isCustom = p.id.startsWith("custom-");
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePersona(p.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-[var(--radius-sm)] border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    <span className="text-base shrink-0">{p.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight flex items-center gap-1">
                        {p.name}
                        {isCustom && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-dim)]">Custom</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-dim)] truncate">{p.role}</div>
                    </div>
                    {isCustom && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomPersonas((prev) => prev.filter((cp) => cp.id !== p.id));
                          setSelectedPersonaIds((prev) => prev.filter((x) => x !== p.id));
                        }}
                        className="text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] transition-colors shrink-0"
                      >
                        <X size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Generate button */}
            {selectedPersonaIds.length > 0 && (
              <button
                onClick={handleGenerateBriefs}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-sm)] text-xs font-semibold cursor-pointer transition-all bg-[var(--color-accent)] text-white hover:brightness-110"
              >
                <Users size={12} />
                Generate for {selectedPersonaIds.length} persona{selectedPersonaIds.length > 1 ? "s" : ""}
              </button>
            )}
          </div>

          {/* Project Snapshot */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
            <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-2">
              Project Snapshot
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <div className="text-sm font-data font-semibold text-[var(--color-text-primary)]">
                  ${(activeProject.contractValue / 1e6).toFixed(1)}M
                </div>
                <div className="text-[10px] text-[var(--color-text-dim)]">Contract</div>
              </div>
              <div>
                <div className="text-sm font-data font-semibold text-[var(--color-text-primary)]">
                  {activeProject.percentComplete}%
                </div>
                <div className="text-[10px] text-[var(--color-text-dim)]">Complete</div>
              </div>
              <div>
                <div className="text-sm font-data font-semibold text-[var(--color-semantic-red)]">
                  {openEvts.length} open
                </div>
                <div className="text-[10px] text-[var(--color-text-dim)]">Risk Items</div>
              </div>
              <div>
                <div className="text-sm font-data font-semibold text-[var(--color-accent)]">
                  ${(totalExposure / 1000).toFixed(1)}K
                </div>
                <div className="text-[10px] text-[var(--color-text-dim)]">Exposure</div>
              </div>
            </div>
          </div>

          {/* Decision Velocity */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={11} className="text-[var(--color-accent)]" />
              <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                Decision Velocity
              </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[var(--color-text-dim)] line-through">
                    {velocityData.avgTraditionalDays} days
                  </span>
                  <ArrowRight size={10} className="text-[var(--color-text-dim)]" />
                  <span className="text-sm font-data font-bold text-[var(--color-semantic-green)]">
                    {velocityData.iceTime}
                  </span>
                </div>
              </div>
              {velocityData.multiplier != null && (
                <div
                  className="flex items-center justify-center px-2 py-1 rounded-[var(--radius-sm)] text-xs font-data font-bold"
                  style={{
                    backgroundColor: "var(--color-accent-dim)",
                    color: "var(--color-accent)",
                  }}
                >
                  {velocityData.multiplier}x faster
                </div>
              )}
            </div>
            {velocityData.sparkData.length > 1 && (
              <TrendMiniChart
                data={velocityData.sparkData}
                label="Velocity Trend"
                color="var(--color-semantic-green)"
                suffix="x"
              />
            )}
          </div>

          {/* Evidence Coverage */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
            <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[var(--color-text-muted)] mb-2">
              Evidence Coverage
            </div>
            <div className="space-y-1.5">
              {activeProject.sourceProfile.sources.map((src) => (
                <div key={src.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-text-secondary)] w-28 truncate">{src.label}</span>
                  <div className="flex-1 h-1.5 bg-[var(--color-surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${src.coverage}%`,
                        backgroundColor: src.coverage >= 80 ? "var(--color-semantic-green)" : src.coverage >= 50 ? "var(--color-semantic-yellow)" : "var(--color-semantic-red)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-data text-[var(--color-text-dim)] w-7 text-right">{src.coverage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
