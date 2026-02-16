// src/lib/suggestion-actions.ts
// Maps each SuggestionType to an actionable output config.
// Used by SuggestionQueue (accept → route) and EditSuggestionDrawer (field filtering).

import type { SuggestionType, Suggestion } from "@/lib/memory/types";
import type { DecisionEvent } from "@/lib/models/decision-event";

export interface SuggestionActionConfig {
  actionLabel: string;
  reportType: "custom";
  buildPrompt: (suggestion: Suggestion, event?: DecisionEvent) => string;
  /** Which fields the EditSuggestionDrawer should show for this type */
  relevantFields: string[];
}

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

function eventContext(e?: DecisionEvent): string {
  if (!e) return "";
  const parts: string[] = [`Risk Item: ${e.title}`];
  if (e.costImpact) parts.push(`Cost exposure: $${e.costImpact.estimated.toLocaleString()}`);
  if (e.scheduleImpact) {
    parts.push(`Schedule impact: ${e.scheduleImpact.daysAffected} days${e.scheduleImpact.criticalPath ? " (critical path)" : ""}`);
  }
  if (e.contractReferences?.length) {
    parts.push(`Contract refs: ${e.contractReferences.map((r) => r.clause).join(", ")}`);
  }
  if (e.severity) parts.push(`Severity: ${e.severity}`);
  return parts.join("\n");
}

function citationContext(s: Suggestion): string {
  if (s.citations.length === 0) return "";
  return `\n\nEvidence cited:\n${s.citations.map((c) => `- ${c.sourceId}${c.chunkRef ? ` (${c.chunkRef})` : ""}: ${c.excerpt}`).join("\n")}`;
}

// ---------------------------------------------------------------------------
// Action config per suggestion type
// ---------------------------------------------------------------------------

export const SUGGESTION_ACTIONS: Record<SuggestionType, SuggestionActionConfig> = {
  notice_risk: {
    actionLabel: "Draft Notice Letter",
    reportType: "custom",
    buildPrompt: (s, e) => {
      const clause = s.editorOverrides?.clauseRef ?? s.citations.find((c) => c.chunkRef)?.chunkRef ?? "applicable clause";
      const deadline = s.editorOverrides?.deadline ?? (s.suggestedChanges as Record<string, unknown>)?.deadline ?? "per contract";
      return `Draft a formal contractual notice letter for the following issue.

${s.headline}

${s.detail}

Clause reference: ${clause}
Notice deadline: ${deadline}
${e ? `\n${eventContext(e)}` : ""}${citationContext(s)}

The letter should:
1. Reference the specific contract clause requiring notice
2. Describe the differing site condition or triggering event
3. State the potential cost and schedule impact
4. Request appropriate direction or time extension
5. Preserve the owner's entitlement position

Use a professional construction industry tone. Include a subject line suitable for email.`;
    },
    relevantFields: ["headline", "linkedEventId", "impact", "clauseRef", "deadline", "note"],
  },

  cost_revision: {
    actionLabel: "Draft Cost Impact Summary",
    reportType: "custom",
    buildPrompt: (s, e) => {
      const costLow = s.editorOverrides?.costLow;
      const costHigh = s.editorOverrides?.costHigh;
      const costRange = costLow || costHigh ? `$${(costLow ?? 0).toLocaleString()} – $${(costHigh ?? costLow ?? 0).toLocaleString()}` : "See details";
      return `Draft a cost impact summary for stakeholder review.

${s.headline}

${s.detail}

Revised cost range: ${costRange}
${e ? `\n${eventContext(e)}` : ""}${citationContext(s)}

Include:
1. Summary of the cost driver and root cause
2. Breakdown of direct and indirect costs
3. Impact on contingency and overall budget
4. Recommended mitigation or recovery actions
5. Evidence basis for the revised estimate

Format as a concise briefing suitable for a project controls meeting.`;
    },
    relevantFields: ["headline", "linkedEventId", "impact", "costLow", "costHigh", "note"],
  },

  schedule_revision: {
    actionLabel: "Draft Schedule Impact Report",
    reportType: "custom",
    buildPrompt: (s, e) => {
      const days = s.editorOverrides?.scheduleDays ?? (s.suggestedChanges as Record<string, unknown>)?.days;
      return `Draft a schedule impact report.

${s.headline}

${s.detail}

Schedule impact: ${days ? `${days} working days` : "See details"}
${e ? `\n${eventContext(e)}` : ""}${citationContext(s)}

Include:
1. Activities affected and their relationship to the critical path
2. Revised milestone implications
3. Float consumption analysis
4. Recommended acceleration or mitigation strategies
5. Contractual basis for time extension (if applicable)

Format for inclusion in a schedule narrative or owner correspondence.`;
    },
    relevantFields: ["headline", "linkedEventId", "impact", "scheduleDays", "note"],
  },

  stakeholder_action: {
    actionLabel: "Draft Stakeholder Brief",
    reportType: "custom",
    buildPrompt: (s, e) => {
      return `Draft a stakeholder briefing document.

${s.headline}

${s.detail}
${e ? `\n${eventContext(e)}` : ""}${citationContext(s)}

Generate tailored communication for the relevant stakeholders. Include:
1. Executive summary (2-3 sentences)
2. What happened and why it matters to this stakeholder
3. Cost and schedule implications
4. Recommended decision or action needed
5. Timeline for response

Use language appropriate for senior leadership. Avoid technical jargon.`;
    },
    relevantFields: ["headline", "linkedEventId", "impact", "note"],
  },

  alignment_change: {
    actionLabel: "Draft Alignment Update",
    reportType: "custom",
    buildPrompt: (s, e) => {
      return `Draft a field-to-office alignment update.

${s.headline}

${s.detail}
${e ? `\n${eventContext(e)}` : ""}${citationContext(s)}

Include:
1. What changed in the field vs. what was assumed in the office
2. The gap between current field conditions and the reported narrative
3. Which stakeholders need updated information
4. Recommended corrective actions to re-align field and office
5. Documentation needed to close the alignment gap

Format as an internal memo suitable for the PM and project team.`;
    },
    relevantFields: ["headline", "linkedEventId", "impact", "note"],
  },

  contract_reference: {
    actionLabel: "Draft Clause Summary",
    reportType: "custom",
    buildPrompt: (s, e) => {
      const clause = s.editorOverrides?.clauseRef ?? s.citations.find((c) => c.chunkRef)?.chunkRef ?? "";
      return `Summarize the contractual implications of the following clause reference.

${s.headline}

${s.detail}

Clause: ${clause}
${e ? `\n${eventContext(e)}` : ""}${citationContext(s)}

Include:
1. Plain-language summary of the clause requirements
2. What triggered this clause (the field condition or event)
3. Obligations for the contractor and owner
4. Notice requirements and deadlines
5. Financial or schedule entitlements at stake
6. Recommended next steps

Format for inclusion in a contract compliance review or RFI response.`;
    },
    relevantFields: ["headline", "linkedEventId", "clauseRef", "note"],
  },

  new_event: {
    actionLabel: "Draft Risk Assessment",
    reportType: "custom",
    buildPrompt: (s, e) => {
      const costLow = s.editorOverrides?.costLow;
      const costHigh = s.editorOverrides?.costHigh;
      const days = s.editorOverrides?.scheduleDays;
      return `Draft a risk assessment brief for a newly identified risk.

${s.headline}

${s.detail}

${costLow || costHigh ? `Estimated cost range: $${(costLow ?? 0).toLocaleString()} – $${(costHigh ?? costLow ?? 0).toLocaleString()}` : ""}
${days ? `Estimated schedule impact: ${days} working days` : ""}
${citationContext(s)}

Include:
1. Risk description and trigger condition
2. Probability and severity assessment
3. Cost and schedule exposure analysis
4. Contract implications (if any)
5. Recommended risk response strategy
6. Monitoring triggers and escalation criteria

Format as a risk register entry brief suitable for team review.`;
    },
    relevantFields: ["headline", "impact", "costLow", "costHigh", "scheduleDays", "note"],
  },

  field_observation: {
    actionLabel: "Draft Field Report",
    reportType: "custom",
    buildPrompt: (s, e) => {
      return `Draft a field condition report based on this observation.

${s.headline}

${s.detail}
${e ? `\n${eventContext(e)}` : ""}${citationContext(s)}

Include:
1. Observation summary and location
2. Potential risk implications
3. Contract or specification relevance
4. Recommended immediate actions
5. Follow-up documentation needed

Format as a structured field report suitable for project records.`;
    },
    relevantFields: ["headline", "linkedEventId", "impact", "note"],
  },
};

// ---------------------------------------------------------------------------
// Intent — stored in localStorage for page-to-page transfer
// ---------------------------------------------------------------------------

export interface SuggestionActionIntent {
  prompt: string;
  suggestionType: SuggestionType;
  suggestionHeadline: string;
  eventTitle?: string;
  actionLabel: string;
}

export const INTENT_KEY = "icelerate-suggestion-action";
