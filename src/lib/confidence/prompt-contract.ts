// src/lib/confidence/prompt-contract.ts
// Shared confidence contract injected into all tool system prompts.
// Instructs Claude to append a structured JSON confidence block after markdown output.

export const CONFIDENCE_CONTRACT = `

## CONFIDENCE SCORING CONTRACT

After producing all markdown output above, you MUST append a structured confidence block in the following exact format. This block must be the VERY LAST thing in your output.

<!-- CONFIDENCE_DATA
{
  "status": "complete",
  "summary": "<1-sentence confidence assessment>",
  "claims": [
    {
      "id": "claim-1",
      "text": "<the factual or inferential statement you made>",
      "type": "FACT_FROM_SOURCE | FACT_FROM_CONTRACT | INFERENCE | RECOMMENDATION",
      "citations": [
        {
          "sourceId": "<doc section identifier, e.g. gc-7.3.1 or spec-2.3.1>",
          "clauseRef": "<e.g. §7.3.1 or ASTM D2321>",
          "excerpt": "<quoted text from source, max 25 words>"
        }
      ],
      "rangeLow": null,
      "rangeHigh": null,
      "unit": null
    }
  ],
  "confidence_breakdown": {
    "evidence_score": 0.0,
    "freshness_score": 0.0,
    "fit_score": 0.0,
    "composite": 0.0
  },
  "assumptions": [],
  "missing_evidence": [],
  "safe_next_steps": []
}
-->

### Confidence Contract Rules (you must follow all 13):

1. A CLAIM is any statement of fact, inference, or recommendation you make in the markdown above.
2. EVIDENCE is ONLY text that exists in the provided documents or source data in the context window.
3. Every CITATION must reference a real section, clause, or document from the provided context. Use the section identifiers from the documents (e.g., "gc-7.3.1", "spec-2.3.1"). Do NOT invent identifiers.
4. FACT_FROM_SOURCE claims: must have at least one citation with a non-empty excerpt.
5. FACT_FROM_CONTRACT claims: must have at least one citation with clauseRef AND excerpt (max 25 words). If the clause is referenced but no quote is available, set type to INFERENCE instead.
6. INFERENCE claims: should have citations where possible. If no citation, explain the reasoning chain in the claim text.
7. RECOMMENDATION claims: must cite the evidence that justifies the recommendation.
8. For any estimated number (costs in dollars, durations in days, percentages) that is NOT quoted verbatim from a source document, you MUST provide rangeLow and rangeHigh with a unit ("USD", "days", or "percent").
9. evidence_score = (number of claims with at least 1 valid citation) / (total number of claims). If zero claims, set to 0.
10. freshness_score: 1.0 if all source documents appear current, 0.7 if age is uncertain, 0.3 if sources are explicitly dated or stale. Use the timestamps in the provided context; do not guess.
11. fit_score: how completely you addressed the user's question. 1.0 = fully addressed all aspects, 0.6 = partially addressed, 0.3 = tangentially related.
12. If evidence_score < 0.8, you MUST populate missing_evidence[] with what additional evidence would strengthen the analysis.
13. composite MUST equal round(0.6 * evidence_score + 0.2 * freshness_score + 0.2 * fit_score, 2).

Output VALID JSON inside the HTML comment block. No trailing commas. No comments inside JSON. Use null instead of undefined.
`;

/**
 * Tool-specific confidence addenda that modify the contract
 * based on each tool's output characteristics.
 */
export const TOOL_CONFIDENCE_ADDENDA: Record<string, string> = {
  "field-report": `
### Field Report Confidence Notes:
- Cost Exposure claims are INFERENCE unless quoting a bid document verbatim. Always provide rangeLow/rangeHigh/unit for dollar estimates.
- Schedule Risk day estimates are INFERENCE — provide ranges.
- Location and observation details from user input are FACT_FROM_SOURCE (cite "user-input" as sourceId).
- Contract Trigger Probability ratings are INFERENCE grounded in contract clauses.
- Each item in "Recommended Immediate Actions" is a RECOMMENDATION claim.`,

  "rfi": `
### RFI Confidence Notes:
- Every spec section reference MUST be a FACT_FROM_CONTRACT claim with clauseRef and quoted excerpt.
- Verdict (RFI REQUIRED / ALREADY ADDRESSED / AMBIGUOUS) is an INFERENCE or RECOMMENDATION.
- Notice deadline calculations are INFERENCE based on contract language — cite the notice clause.
- Entitlement strength ratings are RECOMMENDATION claims.
- Each row in the Supporting Clauses table should map to a claim.`,

  "decision-package": `
### Position Brief Confidence Notes:
- "Stakeholder Lens" analysis is INFERENCE.
- "Primary Concern Triggered" is INFERENCE grounded in role + event data.
- Position recommendations (APPROVE/DELAY/ESCALATE) are RECOMMENDATION claims — cite evidence.
- Dollar amounts from source documents are FACT_FROM_SOURCE; estimated impacts are INFERENCE with ranges.
- "Evidence Cited" items should each be a FACT_FROM_SOURCE or FACT_FROM_CONTRACT claim.
- The "Adapted Communication" section is not a claim — do not include it in the claims array.`,

  "translator": `
### Translator Confidence Notes:
- The adapted communication itself is NOT a claim — it is the tool output, not an evidence-backed assertion.
- Jargon mappings referencing spec definitions are FACT_FROM_CONTRACT.
- Persona Reaction predictions are INFERENCE.
- Confidence scoring is simplified for communication outputs: focus on fit_score (how well the tone/room adaptation matches the request).
- It is acceptable for evidence_score to be low or 0 for pure communication adaptation.`,

  "pulse-log": `
### Pulse Confidence Notes:
- Overall Health Score is an INFERENCE — cite the factors that drive it.
- Each risk dimension rating (CRITICAL/HIGH/MEDIUM/LOW) is an INFERENCE claim.
- Contract cross-references in Risk Breakdown are FACT_FROM_CONTRACT — cite clauseRef + excerpt.
- "If No Action in 48 Hours" consequences are INFERENCE claims — provide dollar/day ranges.
- Pattern Comparison assessments are INFERENCE based on historical data.
- Each row in Threshold Detection table maps to a claim.`,

  "pulse-chat": `
### Pulse Chat Confidence Notes:
- Direct answers from documents are FACT_FROM_SOURCE or FACT_FROM_CONTRACT.
- Interpretive answers are INFERENCE.
- If the question cannot be answered from available context, set status to "partial" and populate missing_evidence.`,

  "pulse-report": `
### Pulse Report Confidence Notes:
- Health Score breakdown items are INFERENCE claims.
- Active Risks are INFERENCE claims — cite evidence for each risk.
- Contract Compliance items are FACT_FROM_CONTRACT.
- Recommendations are RECOMMENDATION claims.`,
};
