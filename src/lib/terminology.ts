// src/lib/terminology.ts
// Single source of truth for all locked construction / PM terminology.
// Import { T } anywhere in the UI to guarantee consistent labels.

export const T = {
  TAGLINE: "Field-to-Office Decision Support for Infrastructure Projects",
  PIPELINE: ["Field Record", "Spec Check", "Position", "Issue Notice"] as const,
  REGISTER: "Project Control Center",
  RISK_ITEM: "Risk Item",
  RISK_LOG: "Risk Log",
  REVIEW: "Review",
  DATA_SOURCES: "Data Sources",
  EVIDENCE_INBOX: "Evidence Inbox",
  OUTPUTS: "Decision Outputs",
  DECISION_TOOL: "Stakeholder Position Brief",
  COMM_TOOL: "Stakeholder Update Draft",
  VARIANCE: "Variance Detected",
  TRUST: {
    verified: "Validated",
    needs_review: "Pending Review",
    unverified: "Insufficient Documentation",
  },
  EVIDENCE: "Evidence Coverage",
  FRESHNESS: "Last Sync Age",
  LAYER: "Risk Control Layer",
  SYNCED: "Synced",
  MISALIGNED: "High Risk Misalignment",
  PROJECT_MEMORY: "Project Memory",
  KNOWLEDGE_LIBRARY: "Knowledge Library",
  ADD_PROJECT: "Add Project",
  ADD_KNOWLEDGE: "Add Knowledge",
  CURRENT_EVENT: "Current Risk Item",
  STAKEHOLDER_UPDATE: "Stakeholder Update",
  ACTION_REQUIRED: "Action Required",
  ALL_OPEN: "All Open",
} as const;
