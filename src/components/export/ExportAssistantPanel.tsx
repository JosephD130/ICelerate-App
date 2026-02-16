"use client";

import { useState, useEffect, useMemo } from "react";
import { Sparkles, Send, RotateCcw, AlertTriangle, Clock, DollarSign, FileWarning, BarChart3, Shield, ArrowRight, Copy, Mail, Bookmark, CheckCircle2, ExternalLink } from "lucide-react";
import { useRole, type Role } from "@/lib/contexts/role-context";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useEvents } from "@/lib/contexts/event-context";
import { buildExportAssistantPrompt, type ExportAssistantContext } from "@/lib/prompts/export-assistant-system";
import { resolveNoticeClocks } from "@/lib/ui/risk-register-helpers";
import { useStream } from "@/lib/hooks/use-stream";
import ReasoningOutput from "@/components/shared/ReasoningOutput";
import VerificationBanner from "@/components/verification/VerificationBanner";
import { computeTrustStatusForOutput, type TrustEvalResult } from "@/lib/validation/trust-evaluator";
import { computeFreshnessBadge } from "@/lib/provenance/freshness";
import { FLAGS } from "@/lib/flags";
import type { ExportScope } from "@/lib/contexts/export-context";
import type { Persona } from "@/lib/demo/personas";
import type { ExportPreflight } from "@/lib/demo/v5/resolvers/export-preflight";

const ROLE_LABELS: Record<Role, string> = {
  field: "Field",
  pm: "PM",
  stakeholder: "Executive",
};

const SHARED_CHIPS: { label: string; prompt: string }[] = [
  { label: "Weekly status summary", prompt: "Generate a weekly status summary covering progress, cost exposure, schedule risks, and notice deadlines" },
  { label: "What should I export?", prompt: "Based on current project data, what should I export right now and why? Consider open risk items, notice deadlines, and stakeholder needs." },
];

const PROMPT_CHIPS: Record<Role, { label: string; prompt: string }[]> = {
  field: [
    { label: "Field update for today", prompt: "Create a 3-bullet field update for today based on open risk items" },
    { label: "Documentation gaps", prompt: "Which risk items are missing field observations or evidence? List what needs documenting." },
  ],
  pm: [
    { label: "Owner meeting prep", prompt: "Prepare talking points and recommended exports for an owner meeting" },
    { label: "Top cost drivers", prompt: "Summarize the top 3 cost drivers with evidence and recommended actions" },
  ],
  stakeholder: [
    { label: "Board-ready narrative", prompt: "Board-ready narrative: what changed this week and what decisions are needed?" },
    { label: "Risk & notice overview", prompt: "Executive overview of active risks, notice deadlines, and budget exposure" },
  ],
};

const SCOPE_CHIPS: Record<ExportScope, { label: string; prompt: string }[]> = {
  all: [],
  cost: [
    { label: "Summarize cost exposure", prompt: "Summarize cost exposure across all open risk items for a stakeholder briefing" },
  ],
  schedule: [
    { label: "Summarize schedule impact", prompt: "Summarize schedule impact and critical path risk across open risk items" },
  ],
  notice: [
    { label: "Draft notice clock summary", prompt: "Draft a notice clock summary with upcoming deadlines and required actions" },
  ],
};

function detectExportFormat(text: string): string | null {
  const lower = text.toLowerCase();
  if (!(/\b(export|download|generate)\b/.test(lower))) return null;
  if (/\b(pptx|ppt|deck|presentation|slides?)\b/.test(lower)) return "pptx";
  if (/\b(pdf|report|alignment)\b/.test(lower)) return "pdf";
  if (/\b(xlsx|excel|workbook|spreadsheet)\b/.test(lower)) return "xlsx";
  if (/\b(csv)\b/.test(lower)) return "csv";
  return null;
}

// ---------------------------------------------------------------------------
// Smart empty state — data-driven quick actions
// ---------------------------------------------------------------------------
interface QuickAction {
  icon: React.ReactNode;
  label: string;
  detail: string;
  prompt: string;
  color: string;
  dimColor: string;
}

function EmptyState({
  openEventCount,
  totalExposure,
  noticeClockCount,
  urgentNoticeCount,
  overdueNoticeCount,
  critPathDays,
  avgCoverage,
  preflight,
  onAction,
}: {
  openEventCount: number;
  totalExposure: number;
  noticeClockCount: number;
  urgentNoticeCount: number;
  overdueNoticeCount: number;
  critPathDays: number;
  avgCoverage: number;
  preflight: ExportPreflight | null;
  onAction: (prompt: string) => void;
}) {
  // Build contextual quick actions based on real project data
  const actions: QuickAction[] = [];

  // Always show: generate status report
  actions.push({
    icon: <BarChart3 size={16} />,
    label: "Generate Status Report",
    detail: `${openEventCount} open risk items, $${(totalExposure / 1000).toFixed(0)}K exposure`,
    prompt: `Generate a comprehensive project status report. We have ${openEventCount} open risk items with $${(totalExposure / 1000).toFixed(0)}K total cost exposure and ${critPathDays} critical path days at risk. Include key metrics, top risks, and recommended next actions.`,
    color: "var(--color-accent)",
    dimColor: "var(--color-accent-dim)",
  });

  // Notice clocks — urgent
  if (overdueNoticeCount > 0) {
    actions.push({
      icon: <AlertTriangle size={16} />,
      label: `${overdueNoticeCount} Overdue Notice${overdueNoticeCount > 1 ? "s" : ""}`,
      detail: "Contractual deadlines have passed — draft response now",
      prompt: `URGENT: ${overdueNoticeCount} notice clocks are overdue. Draft an immediate action plan for each overdue notice, including what documentation is needed and recommended communication to stakeholders.`,
      color: "var(--color-semantic-red)",
      dimColor: "var(--color-semantic-red-dim)",
    });
  } else if (urgentNoticeCount > 0) {
    actions.push({
      icon: <Clock size={16} />,
      label: `${urgentNoticeCount} Notice${urgentNoticeCount > 1 ? "s" : ""} Due This Week`,
      detail: `${noticeClockCount} active clocks — ${urgentNoticeCount} expiring within 7 days`,
      prompt: `${urgentNoticeCount} notice clocks expire within 7 days. Summarize each upcoming deadline, the required contractual action, and what documentation needs to be filed.`,
      color: "var(--color-semantic-yellow)",
      dimColor: "var(--color-semantic-yellow-dim)",
    });
  }

  // Cost exposure — if significant
  if (totalExposure > 50000) {
    actions.push({
      icon: <DollarSign size={16} />,
      label: "Cost Exposure Analysis",
      detail: `$${(totalExposure / 1000).toFixed(0)}K across ${openEventCount} events — identify top drivers`,
      prompt: `Analyze the $${(totalExposure / 1000).toFixed(0)}K cost exposure across ${openEventCount} open risk items. Identify the top 3 cost drivers, their evidence basis, and recommend mitigation or recovery strategies.`,
      color: "var(--color-semantic-yellow)",
      dimColor: "var(--color-semantic-yellow-dim)",
    });
  }

  // Schedule risk
  if (critPathDays > 0) {
    actions.push({
      icon: <Clock size={16} />,
      label: `${critPathDays} Critical Path Days at Risk`,
      detail: "Schedule impact from open events on the critical path",
      prompt: `${critPathDays} working days are at risk on the critical path. Analyze the events causing schedule risk, their dependencies, and recommend mitigation strategies to protect the milestone.`,
      color: "var(--color-semantic-blue)",
      dimColor: "var(--color-semantic-blue-dim)",
    });
  }

  // Coverage gaps
  if (avgCoverage < 80) {
    actions.push({
      icon: <Shield size={16} />,
      label: "Evidence Coverage Gaps",
      detail: `${avgCoverage}% average coverage — identify weak areas`,
      prompt: `Evidence coverage is at ${avgCoverage}%. Identify which data sources have the lowest coverage, what documentation is missing, and recommend actions to improve data quality for more defensible exports.`,
      color: "var(--color-semantic-purple)",
      dimColor: "var(--color-semantic-purple-dim)",
    });
  }

  // Preflight warnings
  if (preflight && preflight.warnings.length > 0) {
    actions.push({
      icon: <FileWarning size={16} />,
      label: `${preflight.warnings.length} Export Warning${preflight.warnings.length > 1 ? "s" : ""}`,
      detail: preflight.warnings[0],
      prompt: `Review these export preflight warnings and recommend how to resolve each one before exporting:\n${preflight.warnings.map((w, i) => `${i + 1}. ${w}`).join("\n")}\n\nFor each warning, explain the risk of exporting without resolving it and the recommended fix.`,
      color: "var(--color-semantic-yellow)",
      dimColor: "var(--color-semantic-yellow-dim)",
    });
  }

  return (
    <div className="h-full flex flex-col py-2">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] mb-2">
          <Sparkles size={12} className="text-[var(--color-accent)]" />
          <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
            {openEventCount} open risk items &middot; ${(totalExposure / 1000).toFixed(0)}K exposure
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-dim)]">
          Click an action below or select personas on the right to generate a report.
        </p>
      </div>

      {/* Quick action cards */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => onAction(action.prompt)}
            className="w-full flex items-start gap-3 p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 bg-[var(--color-surface)] hover:bg-[var(--color-card)] transition-all cursor-pointer text-left group"
          >
            <div
              className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: action.dimColor, color: action.color }}
            >
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[var(--color-text-primary)] mb-0.5 flex items-center gap-1">
                {action.label}
                <ArrowRight size={10} className="text-[var(--color-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[10px] text-[var(--color-text-dim)] leading-relaxed line-clamp-2">
                {action.detail}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  boardReady?: boolean;
  scope?: ExportScope;
  onExport?: (format: string) => void;
  className?: string;
  externalPrompt?: string;
  onExternalPromptConsumed?: () => void;
  reportType?: string;
  selectedPersonas?: Persona[];
  preflight?: ExportPreflight | null;
}

export default function ExportAssistantPanel({
  boardReady = false,
  scope = "all",
  onExport,
  className,
  externalPrompt,
  onExternalPromptConsumed,
  reportType,
  selectedPersonas,
  preflight,
}: Props) {
  const { role } = useRole();
  const { activeProject } = useActiveProject();
  const { events } = useEvents();
  const [input, setInput] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "email-copied">("idle");

  const noticeClocks = useMemo(() => resolveNoticeClocks(events), [events]);
  const openEvents = events.filter((e) => e.status !== "resolved");
  const avgCoverage = Math.round(
    activeProject.sourceProfile.sources.reduce((s, src) => s + src.coverage, 0) /
      (activeProject.sourceProfile.sources.length || 1)
  );

  const worstSyncAge = useMemo(() => {
    const sources = activeProject.sourceProfile.sources;
    if (sources.length === 0) return "N/A";
    let oldest = Date.now();
    for (const src of sources) {
      const t = new Date(src.lastSyncAt).getTime();
      if (t < oldest) oldest = t;
    }
    const diff = Date.now() - oldest;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }, [activeProject.sourceProfile.sources]);

  const verifiedEventCount = boardReady
    ? events.filter((e) => e.status !== "resolved" && e.fieldRecord?.trust?.trustStatus === "verified").length
    : openEvents.length;

  // Build system prompt context with report type + persona awareness
  const systemPromptCtx: ExportAssistantContext = useMemo(() => ({
    projectName: activeProject.name,
    contractValue: activeProject.contractValue ?? 0,
    percentComplete: activeProject.percentComplete ?? 0,
    openEventCount: openEvents.length,
    verifiedOnly: boardReady,
    activeNoticeClocks: noticeClocks.length,
    noticeDueSoon: noticeClocks.filter((c) => c.daysRemaining <= 7 && !c.isOverdue).length,
    avgCoverage,
    worstSyncAge,
    role,
    reportType,
    selectedPersonas: selectedPersonas?.map((p) => ({ name: p.name, role: p.role, cares: p.cares })),
  }), [activeProject, openEvents.length, boardReady, noticeClocks, avgCoverage, worstSyncAge, role, reportType, selectedPersonas]);

  // Use the shared streaming hook — handles SSE, confidence stripping, markdown text
  const { text, isStreaming, error, confidenceData, send, reset } = useStream({
    tool: "export-assistant",
    context: {
      projectId: activeProject.id,
      toolSpecific: {
        systemPrompt: buildExportAssistantPrompt(systemPromptCtx),
      },
    },
  });

  const scopeChips = SCOPE_CHIPS[scope] ?? [];
  const baseChips = PROMPT_CHIPS[role] ?? PROMPT_CHIPS.pm;
  const chips = [...SHARED_CHIPS, ...scopeChips, ...baseChips];

  function handleChipClick(prompt: string) {
    const format = detectExportFormat(prompt);
    if (format && onExport) {
      onExport(format);
    }
    send([{ role: "user", content: prompt }]);
  }

  function handleFormSubmit(prompt: string) {
    if (!prompt.trim() || isStreaming) return;
    const format = detectExportFormat(prompt);
    if (format && onExport) {
      onExport(format);
    }
    send([{ role: "user", content: prompt }]);
    setInput("");
  }

  // Handle external prompts from parent (e.g., persona brief generation)
  useEffect(() => {
    if (externalPrompt && !isStreaming) {
      send([{ role: "user", content: externalPrompt }]);
      onExternalPromptConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);

  const hasOutput = text.length > 0;
  const isComplete = hasOutput && !isStreaming;

  // Trust evaluation on completed output (same pattern as FieldTab, ContractTab, etc.)
  const trustResult: TrustEvalResult | null = useMemo(() => {
    if (!isComplete || !text) return null;
    const badge = computeFreshnessBadge({ sources: activeProject.sourceProfile.sources });
    return computeTrustStatusForOutput({
      toolType: "field",
      outputText: text,
      freshnessLevel: badge.level,
    });
  }, [isComplete, text, activeProject.sourceProfile.sources]);

  // --- Output action handlers ---
  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch { /* clipboard unavailable */ }
  }

  async function handleCopyAsEmail() {
    const projectName = activeProject.name;
    const emailHtml = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;"><div style="border-bottom:2px solid #FF6B35;padding:12px 0;margin-bottom:16px;"><strong style="color:#0A1628;">${projectName}</strong><span style="color:#888;font-size:12px;margin-left:8px;">${new Date().toLocaleDateString()}</span></div><div style="color:#1a1a1a;font-size:14px;line-height:1.7;">${text.replace(/\n/g, "<br/>")}</div><div style="margin-top:24px;padding-top:12px;border-top:1px solid #ddd;font-size:11px;color:#999;">Generated by ICelerate | Powered by Claude Opus 4.6</div></div>`;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([emailHtml], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      setCopyState("email-copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  function handleSendViaGmail() {
    const subject = encodeURIComponent(
      `${activeProject.name} — ${new Date().toLocaleDateString()}`,
    );
    const body = encodeURIComponent(text);
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
      "_blank",
    );
  }

  function handleSaveBrief() {
    const firstLine = text.split("\n").find((l) => l.trim()) || "Untitled Brief";
    const title = firstLine.replace(/^#+\s*/, "").slice(0, 60);
    const briefId = `brief-${Date.now()}`;
    const brief = {
      id: briefId,
      title,
      text,
      createdAt: new Date().toISOString(),
      projectId: activeProject.id,
      reportType: reportType || "custom",
    };
    localStorage.setItem(briefId, JSON.stringify(brief));
    const index: string[] = JSON.parse(localStorage.getItem("icelerate-saved-briefs-index") || "[]");
    index.unshift(briefId);
    localStorage.setItem("icelerate-saved-briefs-index", JSON.stringify(index));
  }

  return (
    <div
      className={`rounded-[var(--radius-card)] border flex flex-col ${className ?? ""}`}
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--color-accent)]" />
          <span className="text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: "var(--color-text-muted)" }}>
            Decision Outputs Assistant
          </span>
          <span
            className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: "var(--color-accent-dim)",
              color: "var(--color-accent)",
            }}
          >
            {ROLE_LABELS[role]}
          </span>
        </div>
      </div>

      {/* Prompt chips — streamlined: role-based + scope only */}
      {chips.length > 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b" style={{ borderColor: "var(--color-border)" }}>
          {chips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleChipClick(chip.prompt)}
              disabled={isStreaming}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-[var(--radius-pill)] border transition-colors cursor-pointer disabled:opacity-50"
              style={{
                borderColor: "var(--color-accent)",
                color: "var(--color-accent)",
                background: "transparent",
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Response area — rich markdown rendering via ReasoningOutput */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[120px]">
        {error && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-semantic-red)] mb-3">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {hasOutput || isStreaming ? (
          <>
            {FLAGS.verificationGate && isComplete && trustResult && (
              <VerificationBanner result={trustResult} confidenceData={confidenceData} />
            )}
            <ReasoningOutput text={text} isStreaming={isStreaming} />
          </>
        ) : (
          <EmptyState
            openEventCount={openEvents.length}
            totalExposure={openEvents.reduce((s, e) => s + (e.costImpact?.estimated ?? 0), 0)}
            noticeClockCount={noticeClocks.length}
            urgentNoticeCount={noticeClocks.filter((c) => c.daysRemaining <= 7 && !c.isOverdue).length}
            overdueNoticeCount={noticeClocks.filter((c) => c.isOverdue).length}
            critPathDays={openEvents.filter((e) => e.scheduleImpact?.criticalPath).reduce((s, e) => s + (e.scheduleImpact?.daysAffected ?? 0), 0)}
            avgCoverage={avgCoverage}
            preflight={preflight ?? null}
            onAction={handleChipClick}
          />
        )}
      </div>

      {/* Output Actions Toolbar — visible after generation completes */}
      {isComplete && (
        <div className="px-4 py-2 border-t flex items-center gap-1.5" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={handleCopyText}
            className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm)] border transition-all cursor-pointer ${
              copyState === "copied"
                ? "border-[var(--color-semantic-green)] text-[var(--color-semantic-green)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            }`}
            title="Copy as plain text"
          >
            {copyState === "copied" ? <CheckCircle2 size={10} /> : <Copy size={10} />}
            {copyState === "copied" ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleCopyAsEmail}
            className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm)] border transition-all cursor-pointer ${
              copyState === "email-copied"
                ? "border-[var(--color-semantic-green)] text-[var(--color-semantic-green)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            }`}
            title="Copy formatted for email"
          >
            {copyState === "email-copied" ? <CheckCircle2 size={10} /> : <Mail size={10} />}
            {copyState === "email-copied" ? "Copied!" : "Email"}
          </button>
          <button
            onClick={handleSendViaGmail}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-semantic-blue)] hover:text-[var(--color-semantic-blue)] transition-all cursor-pointer"
            title="Open in Gmail"
          >
            <ExternalLink size={10} />
            Gmail
          </button>
          <button
            onClick={handleSaveBrief}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all cursor-pointer"
            title="Save brief to local storage"
          >
            <Bookmark size={10} />
            Save
          </button>
          <div className="flex-1" />
          <button
            onClick={() => { reset(); setInput(""); setCopyState("idle"); }}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all cursor-pointer"
          >
            <RotateCcw size={9} />
            New Analysis
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFormSubmit(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isComplete ? "Follow-up question..." : "Ask about your outputs..."}
            disabled={isStreaming}
            className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2 rounded-[var(--radius-sm)] transition-colors cursor-pointer disabled:opacity-30"
            style={{
              background: "var(--color-accent)",
              color: "white",
            }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Guardrails footer with preflight */}
      <div
        className="px-4 py-2 border-t text-xs font-data"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)" }}
      >
        Using {verifiedEventCount} risk items &middot; Validated Only {boardReady ? "ON" : "OFF"} &middot; Coverage {avgCoverage}% &middot; Sync {worstSyncAge}
        {preflight && (
          <span>
            {" "}&middot; {preflight.eventCount} events &middot; {preflight.sections.length} sections
          </span>
        )}
        {boardReady && verifiedEventCount === 0 && (
          <div className="mt-1" style={{ color: "var(--color-semantic-yellow)" }}>
            No validated risk items available. Consider turning off Board-Ready mode or approving pending evidence first.
          </div>
        )}
        {preflight && preflight.warnings.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {preflight.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px]">
                <AlertTriangle size={9} className="text-[var(--color-semantic-yellow)] shrink-0" />
                <span className="text-[var(--color-semantic-yellow)]">{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
