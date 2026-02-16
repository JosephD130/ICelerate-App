// Pure functions for Connect page simulation — no side effects.

import projectSystemData from "@/lib/demo/v5/connectors/project-system-sim.json";
import emailData from "@/lib/demo/v5/connectors/email-sim.json";

export interface SimObject {
  id: string;
  type: string;
  date: string;
  title: string;
  location?: string;
  status?: string;
  costDelta?: number;
  scheduleDeltaDays?: number;
}

export interface SimEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  hasAttachments: boolean;
  linkedKeywords: string[];
}

export interface ProjectSystemPreview {
  objects: SimObject[];
  summary: Record<string, number>;
}

export interface EmailPreview {
  emails: SimEmail[];
}

export function loadProjectSystemPreview(): ProjectSystemPreview {
  return {
    objects: projectSystemData.objects as SimObject[],
    summary: projectSystemData.summary as Record<string, number>,
  };
}

export function loadEmailPreview(): EmailPreview {
  return {
    emails: emailData.emails as SimEmail[],
  };
}

export interface SourceProfile {
  mode: string;
  sources: Array<{
    kind: string;
    label: string;
    status: string;
    lastSyncAt: string;
    coverage: number;
  }>;
}

export function applySimulatedConnection(
  profile: SourceProfile,
  kind: "project_system" | "email",
): SourceProfile {
  const now = new Date().toISOString();
  const updated = { ...profile, sources: [...profile.sources] };

  if (kind === "project_system") {
    const idx = updated.sources.findIndex((s) => s.kind === "project_system");
    if (idx >= 0) {
      updated.sources[idx] = {
        ...updated.sources[idx],
        status: "connected",
        lastSyncAt: now,
        coverage: Math.min(updated.sources[idx].coverage + 25, 95),
      };
    }
  }

  if (kind === "email") {
    const idx = updated.sources.findIndex((s) => s.kind === "email");
    if (idx >= 0) {
      updated.sources[idx] = {
        ...updated.sources[idx],
        status: "connected",
        lastSyncAt: now,
        coverage: Math.min(updated.sources[idx].coverage + 15, 90),
      };
    }
  }

  // Recalculate mode
  const statuses = updated.sources.map((s) => s.status);
  if (statuses.every((s) => s === "connected")) {
    updated.mode = "connected";
  } else if (statuses.some((s) => s === "connected") && statuses.some((s) => s === "uploaded" || s === "native")) {
    updated.mode = "mixed";
  }

  return updated;
}
