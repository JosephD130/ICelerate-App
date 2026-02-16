"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// Scope values matching DrillDown categories plus "all"
export type ExportScope = "all" | "cost" | "schedule" | "notice";

// Actions taken on the Risk Register that inform export recommendations
export type ExportAction =
  | "viewed_cost_drivers"
  | "viewed_schedule_drivers"
  | "reviewed_notice_clocks"
  | "export_board_ready"
  | null;

export interface ExportContextValue {
  scope: ExportScope;
  driverMode: string | null;
  selectedEventIds: string[];
  lastAction: ExportAction;
  setScope: (scope: ExportScope) => void;
  setDriverMode: (mode: string | null) => void;
  setSelectedEventIds: (ids: string[]) => void;
  setLastAction: (action: ExportAction) => void;
  reset: () => void;
}

const ExportContext = createContext<ExportContextValue | undefined>(undefined);

export function ExportContextProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<ExportScope>("all");
  const [driverMode, setDriverModeState] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIdsState] = useState<string[]>([]);
  const [lastAction, setLastActionState] = useState<ExportAction>(null);

  const setScope = useCallback((s: ExportScope) => setScopeState(s), []);
  const setDriverMode = useCallback(
    (m: string | null) => setDriverModeState(m),
    [],
  );
  const setSelectedEventIds = useCallback(
    (ids: string[]) => setSelectedEventIdsState(ids),
    [],
  );
  const setLastAction = useCallback(
    (a: ExportAction) => setLastActionState(a),
    [],
  );
  const reset = useCallback(() => {
    setScopeState("all");
    setDriverModeState(null);
    setSelectedEventIdsState([]);
    setLastActionState(null);
  }, []);

  return (
    <ExportContext.Provider
      value={{
        scope,
        driverMode,
        selectedEventIds,
        lastAction,
        setScope,
        setDriverMode,
        setSelectedEventIds,
        setLastAction,
        reset,
      }}
    >
      {children}
    </ExportContext.Provider>
  );
}

export function useExportContext() {
  const ctx = useContext(ExportContext);
  if (!ctx)
    throw new Error(
      "useExportContext must be used within ExportContextProvider",
    );
  return ctx;
}
