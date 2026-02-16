"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import type { DecisionEvent, HistoryEntry } from "@/lib/models/decision-event";
import { demoDecisionEvents } from "@/lib/demo/decision-events";
import { computeEventSync } from "@/lib/reality-sync/compute-sync";
import { useActiveProject } from "./project-context";
import { v5EventToDecisionEvent } from "@/lib/demo/v5/event-adapter";
import { FLAGS } from "@/lib/flags";

export type EventTab =
  | "overview"
  | "field"
  | "contract"
  | "decision"
  | "communication"
  | "monitor"
  | "history"
  // Event flow simplification modes
  | "capture"
  | "exposure"
  | "stakeholder-update"
  | "decision-outputs"
  | "activity"
  // Governed risk system modes
  | "summary"
  | "evidence"
  | "contract-position"
  | "tracking"
  | "audit-log";

interface EventContextValue {
  events: DecisionEvent[];
  activeEvent: DecisionEvent | null;
  activeTab: EventTab;
  selectEvent: (id: string | null) => void;
  setActiveTab: (tab: EventTab) => void;
  updateEvent: (id: string, partial: Partial<DecisionEvent>) => void;
  addHistory: (id: string, entry: Omit<HistoryEntry, "timestamp">) => void;
  createEvent: (event: DecisionEvent) => void;
  // Event flow simplification
  pendingResolution: string | null;
  setPendingResolution: (id: string | null) => void;
  resolveEvent: (id: string) => void;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

// Mesa project uses the original rich demo events
const MESA_PROJECT_ID = "p-mesa-stormdrain-2026";

export function EventProvider({ children }: { children: ReactNode }) {
  const { activeProject } = useActiveProject();

  // Compute initial events based on active project
  const getProjectEvents = useCallback((): DecisionEvent[] => {
    if (activeProject.id === MESA_PROJECT_ID) {
      return demoDecisionEvents;
    }
    return activeProject.events.map((e) =>
      v5EventToDecisionEvent(e, activeProject)
    );
  }, [activeProject]);

  const defaultTab: EventTab = FLAGS.governedRiskSystem ? "summary" : FLAGS.eventFlowSimplification ? "capture" : "overview";
  const [events, setEvents] = useState<DecisionEvent[]>(getProjectEvents);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EventTab>(defaultTab);
  const [pendingResolution, setPendingResolution] = useState<string | null>(null);
  const prevProjectId = useRef(activeProject.id);

  // Reload events when project changes (skip reset on initial mount)
  useEffect(() => {
    if (prevProjectId.current !== activeProject.id) {
      prevProjectId.current = activeProject.id;
      setEvents(getProjectEvents());
      setActiveEventId(null);
      setActiveTab(defaultTab);
    }
  }, [activeProject.id, getProjectEvents]);

  const activeEvent = activeEventId
    ? events.find((e) => e.id === activeEventId) ?? null
    : null;

  const selectEvent = useCallback(
    (id: string | null) => {
      setActiveEventId(id);
      setActiveTab(defaultTab);
    },
    [defaultTab]
  );

  const updateEvent = useCallback(
    (id: string, partial: Partial<DecisionEvent>) => {
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const updated = {
            ...e,
            ...partial,
            updatedAt: new Date().toISOString(),
          };
          // Recompute alignment status
          updated.alignmentStatus = computeEventSync(updated);
          return updated;
        })
      );
    },
    []
  );

  const addHistory = useCallback(
    (id: string, entry: Omit<HistoryEntry, "timestamp">) => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                history: [
                  ...e.history,
                  { ...entry, timestamp: new Date().toISOString() },
                ],
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );
    },
    []
  );

  const createEvent = useCallback((event: DecisionEvent) => {
    setEvents((prev) => [event, ...prev]);
    setActiveEventId(event.id);
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const resolveEvent = useCallback(
    (id: string) => {
      if (FLAGS.eventFlowSimplification) {
        setPendingResolution(id);
      } else {
        updateEvent(id, { status: "resolved" });
      }
    },
    [updateEvent]
  );

  return (
    <EventContext.Provider
      value={{
        events,
        activeEvent,
        activeTab,
        selectEvent,
        setActiveTab,
        updateEvent,
        addHistory,
        createEvent,
        pendingResolution,
        setPendingResolution,
        resolveEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within EventProvider");
  return ctx;
}
