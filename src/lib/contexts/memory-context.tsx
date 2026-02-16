"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { MemoryStore } from "@/lib/memory/store";
import type {
  Suggestion,
  SuggestionStatus,
  CaseRecord,
  LessonRecord,
  EvidenceItem,
} from "@/lib/memory/types";
import type { CalibrationRecord, CalibrationStats } from "@/lib/calibration/types";
import {
  buildEvidenceCalibration,
  buildSuggestionCalibration,
  computeCalibrationStats,
} from "@/lib/calibration/engine";
import { useActiveProject } from "./project-context";
import { useEvents } from "./event-context";
import { useRole } from "./role-context";
import { seedMemoryStore, seedGlobalMemory } from "@/lib/demo/v5/memory-seed";
import { resolveSuggestions } from "@/lib/demo/v5/resolvers/suggestions";
import { FLAGS } from "@/lib/flags";

interface MemoryContextValue {
  store: MemoryStore;
  pendingSuggestions: Suggestion[];
  allSuggestions: Suggestion[];
  refreshSuggestions: () => void;
  acceptSuggestion: (id: string) => void;
  acceptMultipleSuggestions: (ids: string[]) => void;
  editSuggestion: (id: string, note: string) => void;
  editSuggestionStructured: (id: string, overrides: NonNullable<Suggestion["editorOverrides"]>) => void;
  rejectSuggestion: (id: string) => void;
  dismissCase: (id: string) => void;
  dismissLesson: (id: string) => void;
  dismissedCaseIds: Set<string>;
  dismissedLessonIds: Set<string>;
  cases: CaseRecord[];
  lessons: LessonRecord[];
  evidence: EvidenceItem[];
  pendingEvidence: EvidenceItem[];
  addEvidence: (item: EvidenceItem) => void;
  approveEvidence: (id: string, linkedRiskItemId?: string) => void;
  rejectEvidence: (id: string) => void;
  refreshEvidence: () => void;
  // Calibration engine
  calibrations: CalibrationRecord[];
  calibrationStats: CalibrationStats | null;
  recordCalibration: (record: CalibrationRecord) => void;
}

const MemoryContext = createContext<MemoryContextValue | undefined>(undefined);

const store = new MemoryStore();

export function MemoryProvider({ children }: { children: ReactNode }) {
  const { activeProject } = useActiveProject();
  const { updateEvent, events } = useEvents();
  const { role } = useRole();
  const projectId = activeProject.id;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [calibrations, setCalibrations] = useState<CalibrationRecord[]>([]);
  const [dismissedCaseIds, setDismissedCaseIds] = useState<Set<string>>(new Set());
  const [dismissedLessonIds, setDismissedLessonIds] = useState<Set<string>>(new Set());

  // Seed and load on project change
  useEffect(() => {
    if (!FLAGS.memoryLayer) return;

    // Seed project-scoped data
    seedMemoryStore(store, projectId);
    // Seed global data (cases + lessons)
    seedGlobalMemory(store);

    // Load all suggestions for this project
    setSuggestions(store.getSuggestions(projectId));
    setCases(store.getCases());
    setLessons(store.getLessons());
    setEvidence(store.getEvidence(projectId));
    setDismissedCaseIds(new Set(store.getDismissedCaseIds()));
    setDismissedLessonIds(new Set(store.getDismissedLessonIds()));

    // Load calibration records
    if (FLAGS.calibrationEngine) {
      setCalibrations(store.getCalibrations(projectId));
    }
  }, [projectId]);

  // Run live suggestion generation after seed
  useEffect(() => {
    if (!FLAGS.memoryLayer) return;

    const existingIds = new Set(suggestions.map((s) => s.id));
    const newSuggestions = resolveSuggestions(projectId, existingIds);

    if (newSuggestions.length > 0) {
      for (const s of newSuggestions) {
        store.addSuggestion(s);
      }
      setSuggestions(store.getSuggestions(projectId));
    }
    // Only run when project changes — not on every suggestion update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Calibration ──────────────────────────────────

  const recordCalibration = useCallback(
    (record: CalibrationRecord) => {
      store.addCalibration(record);
      setCalibrations(store.getCalibrations(projectId));
    },
    [projectId],
  );

  const calibrationStats = useMemo(
    () => (FLAGS.calibrationEngine && calibrations.length > 0 ? computeCalibrationStats(calibrations) : null),
    [calibrations],
  );

  // ── Suggestions ──────────────────────────────────

  const refreshSuggestions = useCallback(() => {
    const existingIds = new Set(
      store.getSuggestions(projectId).map((s) => s.id),
    );
    const newSuggestions = resolveSuggestions(projectId, existingIds);
    for (const s of newSuggestions) {
      store.addSuggestion(s);
    }
    setSuggestions(store.getSuggestions(projectId));
  }, [projectId]);

  const updateSuggestionStatus = useCallback(
    (id: string, status: SuggestionStatus, note?: string) => {
      store.updateSuggestionStatus(id, projectId, status, note);
      setSuggestions(store.getSuggestions(projectId));
    },
    [projectId],
  );

  const acceptSuggestion = useCallback(
    (id: string) => {
      const suggestion = suggestions.find((s) => s.id === id);
      if (!suggestion) return;

      // Merge editorOverrides into suggestedChanges for application
      const eventId = suggestion.editorOverrides?.linkedEventId ?? suggestion.eventId;
      const sc = { ...suggestion.suggestedChanges };
      const ov = suggestion.editorOverrides;

      if (ov?.costLow !== undefined || ov?.costHigh !== undefined) {
        sc.costExposure = {
          ...(sc.costExposure as Record<string, unknown> | undefined),
          amount: ov.costHigh ?? ov.costLow,
          notes: ov.note,
        };
      }
      if (ov?.scheduleDays !== undefined) {
        sc.scheduleImpact = {
          ...(sc.scheduleImpact as Record<string, unknown> | undefined),
          days: ov.scheduleDays,
          notes: ov.note,
        };
      }

      // Apply suggestedChanges to event if applicable
      if (eventId && Object.keys(sc).length > 0) {
        const event = events.find((e) => e.id === eventId);
        if (event) {
          const changes: Record<string, unknown> = {};

          if ("costExposure" in sc && sc.costExposure) {
            const ce = sc.costExposure as { amount?: number; notes?: string };
            if (ce.amount !== undefined) {
              changes.costImpact = {
                ...(event.costImpact ?? { currency: "USD", confidence: "medium", description: "" }),
                estimated: ce.amount,
                description: ce.notes ?? event.costImpact?.description ?? "",
              };
            }
          }

          if ("scheduleImpact" in sc && sc.scheduleImpact) {
            const si = sc.scheduleImpact as { days?: number; notes?: string };
            if (si.days !== undefined) {
              changes.scheduleImpact = {
                ...(event.scheduleImpact ?? { criticalPath: false, description: "" }),
                daysAffected: si.days,
                description: si.notes ?? event.scheduleImpact?.description ?? "",
              };
            }
          }

          if (Object.keys(changes).length > 0) {
            updateEvent(event.id, changes as Partial<typeof event>);
          }
        }
      }

      updateSuggestionStatus(id, "accepted");

      // Record calibration
      if (FLAGS.calibrationEngine) {
        recordCalibration(buildSuggestionCalibration(suggestion, "approved", role));
      }
    },
    [suggestions, events, updateEvent, updateSuggestionStatus, role, recordCalibration],
  );

  const editSuggestion = useCallback(
    (id: string, note: string) => {
      updateSuggestionStatus(id, "edited", note);
    },
    [updateSuggestionStatus],
  );

  const editSuggestionStructured = useCallback(
    (id: string, overrides: NonNullable<Suggestion["editorOverrides"]>) => {
      // Record calibration before applying overrides
      if (FLAGS.calibrationEngine) {
        const suggestion = suggestions.find((s) => s.id === id);
        if (suggestion) {
          recordCalibration(buildSuggestionCalibration(suggestion, "edited", role, overrides));
        }
      }

      store.updateSuggestionOverrides(id, projectId, overrides);
      setSuggestions(store.getSuggestions(projectId));
    },
    [projectId, suggestions, role, recordCalibration],
  );

  const rejectSuggestion = useCallback(
    (id: string) => {
      // Record calibration before rejecting
      if (FLAGS.calibrationEngine) {
        const suggestion = suggestions.find((s) => s.id === id);
        if (suggestion) {
          recordCalibration(buildSuggestionCalibration(suggestion, "rejected", role));
        }
      }

      updateSuggestionStatus(id, "rejected");
    },
    [updateSuggestionStatus, suggestions, role, recordCalibration],
  );

  const acceptMultipleSuggestions = useCallback(
    (ids: string[]) => {
      for (const id of ids) {
        const s = suggestions.find((sg) => sg.id === id);
        if (s && s.type !== "notice_risk") {
          acceptSuggestion(id);
        }
      }
    },
    [suggestions, acceptSuggestion],
  );

  const dismissCase = useCallback((id: string) => {
    store.dismissCase(id);
    setDismissedCaseIds((prev) => new Set([...Array.from(prev), id]));
  }, []);

  const dismissLesson = useCallback((id: string) => {
    store.dismissLesson(id);
    setDismissedLessonIds((prev) => new Set([...Array.from(prev), id]));
  }, []);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === "pending"),
    [suggestions],
  );

  const pendingEvidence = useMemo(
    () => evidence.filter((e) => e.status === "pending"),
    [evidence],
  );

  const addEvidence = useCallback(
    (item: EvidenceItem) => {
      store.addEvidence(item);
      setEvidence(store.getEvidence(projectId));
    },
    [projectId],
  );

  const refreshEvidence = useCallback(() => {
    setEvidence(store.getEvidence(projectId));
  }, [projectId]);

  const approveEvidence = useCallback(
    (id: string, linkedRiskItemId?: string) => {
      // Record calibration before status update
      if (FLAGS.calibrationEngine) {
        const item = evidence.find((e) => e.id === id);
        if (item) {
          recordCalibration(buildEvidenceCalibration(item, "approved", role, projectId));
        }
      }

      store.updateEvidenceStatus(id, projectId, "approved", linkedRiskItemId);
      setEvidence(store.getEvidence(projectId));
    },
    [projectId, evidence, role, recordCalibration],
  );

  const rejectEvidence = useCallback(
    (id: string) => {
      // Record calibration before status update
      if (FLAGS.calibrationEngine) {
        const item = evidence.find((e) => e.id === id);
        if (item) {
          recordCalibration(buildEvidenceCalibration(item, "rejected", role, projectId));
        }
      }

      store.updateEvidenceStatus(id, projectId, "rejected");
      setEvidence(store.getEvidence(projectId));
    },
    [projectId, evidence, role, recordCalibration],
  );

  const value: MemoryContextValue = useMemo(
    () => ({
      store,
      pendingSuggestions,
      allSuggestions: suggestions,
      refreshSuggestions,
      acceptSuggestion,
      acceptMultipleSuggestions,
      editSuggestion,
      editSuggestionStructured,
      rejectSuggestion,
      dismissCase,
      dismissLesson,
      dismissedCaseIds,
      dismissedLessonIds,
      cases,
      lessons,
      evidence,
      pendingEvidence,
      addEvidence,
      approveEvidence,
      rejectEvidence,
      refreshEvidence,
      calibrations,
      calibrationStats,
      recordCalibration,
    }),
    [
      pendingSuggestions,
      suggestions,
      refreshSuggestions,
      acceptSuggestion,
      acceptMultipleSuggestions,
      editSuggestion,
      editSuggestionStructured,
      rejectSuggestion,
      dismissCase,
      dismissLesson,
      dismissedCaseIds,
      dismissedLessonIds,
      cases,
      lessons,
      evidence,
      pendingEvidence,
      addEvidence,
      approveEvidence,
      rejectEvidence,
      refreshEvidence,
      calibrations,
      calibrationStats,
      recordCalibration,
    ],
  );

  return (
    <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
  );
}

export function useMemory(): MemoryContextValue {
  const ctx = useContext(MemoryContext);
  if (!ctx) {
    throw new Error("useMemory must be used inside <MemoryProvider>");
  }
  return ctx;
}
