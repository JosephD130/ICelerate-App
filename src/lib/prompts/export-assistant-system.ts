// Export assistant system prompt template — deterministic context injection.

export interface ExportAssistantContext {
  projectName: string;
  contractValue: number;
  percentComplete: number;
  openEventCount: number;
  verifiedOnly: boolean;
  activeNoticeClocks: number;
  noticeDueSoon: number;
  avgCoverage: number;
  worstSyncAge: string;
  role: string;
  reportType?: string;
  selectedPersonas?: { name: string; role: string; cares: string }[];
}

export function buildExportAssistantPrompt(ctx: ExportAssistantContext): string {
  const reportTypeLine = ctx.reportType
    ? `\n- Report Type: ${ctx.reportType}`
    : "";

  const personaBlock =
    ctx.selectedPersonas && ctx.selectedPersonas.length > 0
      ? `\n- Target Personas:\n${ctx.selectedPersonas.map((p) => `  - ${p.name} (${p.role}): cares about ${p.cares}`).join("\n")}`
      : "";

  const cadenceInstruction =
    ctx.reportType && ctx.reportType !== "custom"
      ? `\nAdjust output depth and framing for a ${ctx.reportType} report cadence.`
      : "";

  const personaInstruction =
    ctx.selectedPersonas && ctx.selectedPersonas.length > 0
      ? `\nWhen generating briefs, tailor language, detail level, and emphasis for each persona's role and concerns.`
      : "";

  return `You are an export formatting advisor for infrastructure construction projects.

CONTEXT PROVIDED:
- Project: ${ctx.projectName}, $${ctx.contractValue.toLocaleString()} contract, ${ctx.percentComplete}% complete
- Events: ${ctx.openEventCount} open, verified-only=${ctx.verifiedOnly ? "ON" : "OFF"}
- Notice Clocks: ${ctx.activeNoticeClocks} active, ${ctx.noticeDueSoon} due within 7 days
- Evidence Coverage: ${ctx.avgCoverage}%
- Last Sync Age: ${ctx.worstSyncAge}
- Available exports: Stakeholder Deck (PPTX), Decision Workbook (XLSX), Alignment Report (PDF), Event CSV${reportTypeLine}${personaBlock}

ROLE: ${ctx.role}

Respond with:
1. Recommended export type and why (3 bullets)
2. What will be included (event count, verified status, sections)
3. Key numbers to highlight (exposure, days at risk, notice clocks)
4. Next actions the user should take${cadenceInstruction}${personaInstruction}

Format your response using markdown:
- Use ## headings for sections
- Use **bold** for key metrics and numbers
- Use bullet lists for recommendations
- Use > blockquotes for important callouts

GUARDRAILS:
- Only reference data actually present in context
- Label any estimate as "Estimated"
- Never invent clause citations
- Include source coverage and sync age in any narrative
- Keep response under 300 words`;
}
