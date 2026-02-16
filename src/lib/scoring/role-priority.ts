// src/lib/scoring/role-priority.ts
// Role-aware project prioritization.
// Each role re-weights attention score factors to surface what matters most.

import type { Role } from "@/lib/contexts/role-context";
import type { DemoProject } from "@/lib/demo/v5/projects";
import { computeAttentionScore, type AttentionScore } from "./attention-score";

// ---------------------------------------------------------------------------
// Role-specific weights (must sum to 1.0)
// ---------------------------------------------------------------------------

const ROLE_WEIGHTS: Record<Role, Record<string, number>> = {
  field: {
    events: 0.25,
    severity: 0.15,
    notice: 0.10,
    schedule: 0.25,
    freshness: 0.15,
    contingency: 0.10,
  },
  pm: {
    events: 0.20,
    severity: 0.20,
    notice: 0.15,
    schedule: 0.15,
    freshness: 0.15,
    contingency: 0.15,
  },
  stakeholder: {
    events: 0.10,
    severity: 0.25,
    notice: 0.10,
    schedule: 0.15,
    freshness: 0.10,
    contingency: 0.30,
  },
};

// ---------------------------------------------------------------------------
// Role-specific CTA labels
// ---------------------------------------------------------------------------

export const ROLE_CTA: Record<Role, string> = {
  field: "View Field Events",
  pm: "Open Risk Register",
  stakeholder: "Executive Summary",
};

export function roleCTARoute(role: Role, topEventId: string | null): string {
  switch (role) {
    case "field":
      return topEventId ? `/workspace/events/${topEventId}` : "/workspace";
    case "pm":
      return "/workspace";
    case "stakeholder":
      return "/workspace/export";
  }
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export interface ScoredProject {
  project: DemoProject;
  score: AttentionScore;
}

export function scoreAndSort(
  projects: DemoProject[],
  role: Role,
): ScoredProject[] {
  const weights = ROLE_WEIGHTS[role];
  return projects
    .map((project) => ({
      project,
      score: computeAttentionScore(project, weights),
    }))
    .sort((a, b) => b.score.total - a.score.total);
}
