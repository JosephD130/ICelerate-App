// src/lib/memory/store.ts
// In-memory + localStorage persistence for the Memory architecture.

import type {
  SourceObject,
  Suggestion,
  SuggestionStatus,
  ProjectSnapshot,
  EventSnapshot,
  CaseRecord,
  LessonRecord,
  LessonStatus,
  EvidenceItem,
  EvidenceStatus,
} from "./types";
import type { CalibrationRecord, CalibrationObjectType } from "@/lib/calibration/types";

function storageKey(entity: string, scope: string): string {
  return `icelerate-mem-${entity}-${scope}`;
}

function loadArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function saveArray<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full — silently degrade for demo
  }
}

export class MemoryStore {
  // ── Sources ──────────────────────────────────────

  getSources(projectId: string): SourceObject[] {
    return loadArray<SourceObject>(storageKey("sources", `p-${projectId}`));
  }

  addSource(source: SourceObject): void {
    const key = storageKey("sources", `p-${source.projectId}`);
    const arr = loadArray<SourceObject>(key);
    if (arr.some((s) => s.id === source.id)) return;
    arr.push(source);
    saveArray(key, arr);
  }

  sourceExists(hash: string, projectId: string): boolean {
    return this.getSources(projectId).some((s) => s.hash === hash);
  }

  // ── Suggestions ──────────────────────────────────

  getSuggestions(
    projectId: string,
    filter?: { status?: SuggestionStatus; eventId?: string },
  ): Suggestion[] {
    let arr = loadArray<Suggestion>(storageKey("suggestions", `p-${projectId}`));
    if (filter?.status) arr = arr.filter((s) => s.status === filter.status);
    if (filter?.eventId) arr = arr.filter((s) => s.eventId === filter.eventId);
    return arr;
  }

  getPendingSuggestions(projectId: string): Suggestion[] {
    return this.getSuggestions(projectId, { status: "pending" });
  }

  addSuggestion(suggestion: Suggestion): void {
    const key = storageKey("suggestions", `p-${suggestion.projectId}`);
    const arr = loadArray<Suggestion>(key);
    if (arr.some((s) => s.id === suggestion.id)) return;
    arr.push(suggestion);
    saveArray(key, arr);
  }

  updateSuggestionStatus(
    id: string,
    projectId: string,
    status: SuggestionStatus,
    note?: string,
  ): void {
    const key = storageKey("suggestions", `p-${projectId}`);
    const arr = loadArray<Suggestion>(key);
    const idx = arr.findIndex((s) => s.id === id);
    if (idx === -1) return;
    arr[idx] = {
      ...arr[idx],
      status,
      reviewedAt: new Date().toISOString(),
      ...(note ? { reviewNote: note } : {}),
    };
    saveArray(key, arr);
  }

  updateSuggestionOverrides(
    id: string,
    projectId: string,
    overrides: NonNullable<Suggestion["editorOverrides"]>,
  ): void {
    const key = storageKey("suggestions", `p-${projectId}`);
    const arr = loadArray<Suggestion>(key);
    const idx = arr.findIndex((s) => s.id === id);
    if (idx === -1) return;
    arr[idx] = {
      ...arr[idx],
      status: "edited" as const,
      reviewedAt: new Date().toISOString(),
      editorOverrides: { ...arr[idx].editorOverrides, ...overrides },
    };
    saveArray(key, arr);
  }

  // ── Project Snapshots ────────────────────────────

  getProjectSnapshots(projectId: string): ProjectSnapshot[] {
    return loadArray<ProjectSnapshot>(storageKey("psnap", `p-${projectId}`));
  }

  getLatestProjectSnapshot(projectId: string): ProjectSnapshot | null {
    const arr = this.getProjectSnapshots(projectId);
    return arr.length > 0 ? arr[arr.length - 1] : null;
  }

  addProjectSnapshot(snapshot: ProjectSnapshot): void {
    const key = storageKey("psnap", `p-${snapshot.projectId}`);
    const arr = loadArray<ProjectSnapshot>(key);
    arr.push(snapshot);
    saveArray(key, arr);
  }

  // ── Event Snapshots ──────────────────────────────

  getEventSnapshots(eventId: string): EventSnapshot[] {
    return loadArray<EventSnapshot>(storageKey("esnap", `e-${eventId}`));
  }

  getLatestEventSnapshot(eventId: string): EventSnapshot | null {
    const arr = this.getEventSnapshots(eventId);
    return arr.length > 0 ? arr[arr.length - 1] : null;
  }

  addEventSnapshot(snapshot: EventSnapshot): void {
    const key = storageKey("esnap", `e-${snapshot.eventId}`);
    const arr = loadArray<EventSnapshot>(key);
    arr.push(snapshot);
    saveArray(key, arr);
  }

  // ── Cases (global) ───────────────────────────────

  getCases(filter?: { issueType?: string; projectId?: string }): CaseRecord[] {
    let arr = loadArray<CaseRecord>(storageKey("cases", "global"));
    if (filter?.issueType)
      arr = arr.filter((c) => c.issueType === filter.issueType);
    if (filter?.projectId)
      arr = arr.filter((c) => c.sourceProjectId === filter.projectId);
    return arr;
  }

  getCaseByEventId(eventId: string): CaseRecord | null {
    return (
      loadArray<CaseRecord>(storageKey("cases", "global")).find(
        (c) => c.sourceEventId === eventId,
      ) ?? null
    );
  }

  addCase(record: CaseRecord): void {
    const key = storageKey("cases", "global");
    const arr = loadArray<CaseRecord>(key);
    if (arr.some((c) => c.id === record.id)) return;
    arr.push(record);
    saveArray(key, arr);
  }

  // ── Lessons (global) ─────────────────────────────

  getLessons(filter?: {
    status?: LessonStatus;
    issueType?: string;
  }): LessonRecord[] {
    let arr = loadArray<LessonRecord>(storageKey("lessons", "global"));
    if (filter?.status) arr = arr.filter((l) => l.status === filter.status);
    if (filter?.issueType)
      arr = arr.filter((l) => l.issueTypes.includes(filter.issueType!));
    return arr;
  }

  addLesson(lesson: LessonRecord): void {
    const key = storageKey("lessons", "global");
    const arr = loadArray<LessonRecord>(key);
    if (arr.some((l) => l.id === lesson.id)) return;
    arr.push(lesson);
    saveArray(key, arr);
  }

  updateLessonStatus(id: string, status: LessonStatus): void {
    const key = storageKey("lessons", "global");
    const arr = loadArray<LessonRecord>(key);
    const idx = arr.findIndex((l) => l.id === id);
    if (idx === -1) return;
    arr[idx] = {
      ...arr[idx],
      status,
      ...(status === "approved" ? { approvedAt: new Date().toISOString() } : {}),
    };
    saveArray(key, arr);
  }

  // ── Dismissed Cases / Lessons ────────────────────

  getDismissedCaseIds(): string[] {
    return loadArray<string>(storageKey("dismissed-cases", "global"));
  }

  dismissCase(caseId: string): void {
    const key = storageKey("dismissed-cases", "global");
    const arr = loadArray<string>(key);
    if (!arr.includes(caseId)) {
      arr.push(caseId);
      saveArray(key, arr);
    }
  }

  getDismissedLessonIds(): string[] {
    return loadArray<string>(storageKey("dismissed-lessons", "global"));
  }

  dismissLesson(lessonId: string): void {
    const key = storageKey("dismissed-lessons", "global");
    const arr = loadArray<string>(key);
    if (!arr.includes(lessonId)) {
      arr.push(lessonId);
      saveArray(key, arr);
    }
  }

  // ── Similarity Feedback ─────────────────────────

  /**
   * Store feedback for a similar case or lesson match.
   * Key format: project-event-target to scope per context.
   */
  setSimilarityFeedback(
    projectId: string,
    eventId: string,
    targetId: string,
    targetType: "case" | "lesson",
    feedback: "helpful" | "not_applicable",
  ): void {
    const key = storageKey("sim-feedback", `p-${projectId}`);
    const arr = loadArray<{
      eventId: string;
      targetId: string;
      targetType: "case" | "lesson";
      feedback: "helpful" | "not_applicable";
      timestamp: string;
    }>(key);
    const idx = arr.findIndex(
      (f) => f.eventId === eventId && f.targetId === targetId,
    );
    const entry = {
      eventId,
      targetId,
      targetType,
      feedback,
      timestamp: new Date().toISOString(),
    };
    if (idx >= 0) {
      arr[idx] = entry;
    } else {
      arr.push(entry);
    }
    saveArray(key, arr);
  }

  /**
   * Get all similarity feedback for a given project+event.
   * Returns a Map of targetId → feedback.
   */
  getSimilarityFeedback(
    projectId: string,
    eventId: string,
  ): Map<string, "helpful" | "not_applicable"> {
    const key = storageKey("sim-feedback", `p-${projectId}`);
    const arr = loadArray<{
      eventId: string;
      targetId: string;
      feedback: "helpful" | "not_applicable";
    }>(key);
    const map = new Map<string, "helpful" | "not_applicable">();
    for (const entry of arr) {
      if (entry.eventId === eventId) {
        map.set(entry.targetId, entry.feedback);
      }
    }
    return map;
  }

  // ── Evidence (Governed Risk System) ─────────────

  getEvidence(
    projectId: string,
    filter?: { status?: EvidenceStatus },
  ): EvidenceItem[] {
    let arr = loadArray<EvidenceItem>(storageKey("evidence", `p-${projectId}`));
    if (filter?.status) arr = arr.filter((e) => e.status === filter.status);
    return arr;
  }

  getPendingEvidence(projectId: string): EvidenceItem[] {
    return this.getEvidence(projectId, { status: "pending" });
  }

  addEvidence(item: EvidenceItem): void {
    const key = storageKey("evidence", `p-${item.projectId}`);
    const arr = loadArray<EvidenceItem>(key);
    if (arr.some((e) => e.id === item.id)) return;
    arr.push(item);
    saveArray(key, arr);
  }

  updateEvidenceStatus(
    id: string,
    projectId: string,
    status: EvidenceStatus,
    linkedRiskItemId?: string,
  ): void {
    const key = storageKey("evidence", `p-${projectId}`);
    const arr = loadArray<EvidenceItem>(key);
    const idx = arr.findIndex((e) => e.id === id);
    if (idx === -1) return;
    arr[idx] = {
      ...arr[idx],
      status,
      reviewedAt: new Date().toISOString(),
      ...(linkedRiskItemId ? { linkedRiskItemId } : {}),
    };
    saveArray(key, arr);
  }

  // ── Calibration Records ─────────────────────────

  getCalibrations(projectId: string): CalibrationRecord[] {
    return loadArray<CalibrationRecord>(storageKey("calibrations", `p-${projectId}`));
  }

  getCalibrationsByObject(
    projectId: string,
    objectType: CalibrationObjectType,
    objectId: string,
  ): CalibrationRecord[] {
    return this.getCalibrations(projectId).filter((c) => {
      if (c.objectType !== objectType) return false;
      if (objectType === "evidence") return c.evidenceId === objectId;
      if (objectType === "suggestion" || objectType === "notice") return c.suggestionId === objectId;
      return false;
    });
  }

  addCalibration(record: CalibrationRecord): void {
    const key = storageKey("calibrations", `p-${record.projectId}`);
    const arr = loadArray<CalibrationRecord>(key);
    if (arr.some((c) => c.id === record.id)) return;
    arr.push(record);
    saveArray(key, arr);
  }

  hasCalibrations(projectId: string): boolean {
    return this.getCalibrations(projectId).length > 0;
  }

  // ── Utility ──────────────────────────────────────

  /** Check if project-scoped memory has been seeded. */
  isSeeded(projectId: string): boolean {
    return this.getSources(projectId).length > 0;
  }

  isGlobalSeeded(): boolean {
    return loadArray<CaseRecord>(storageKey("cases", "global")).length > 0;
  }
}
