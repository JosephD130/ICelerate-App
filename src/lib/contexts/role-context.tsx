"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Role = "field" | "pm" | "stakeholder";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  hasAccess: (tool: string) => boolean;
  hasTabAccess: (tab: string) => boolean;
}

// Legacy tool access (for sidebar pages)
const ROLE_ACCESS: Record<string, Role[]> = {
  "field-report": ["field", "pm"],
  rfi: ["pm"],
  "decision-package": ["pm"],
  translator: ["pm", "stakeholder"],
  pulse: ["field", "pm", "stakeholder"],
  documents: ["field", "pm", "stakeholder"],
  assistant: ["pm", "stakeholder"],
  dashboard: ["field", "pm", "stakeholder"],
  register: ["field", "pm", "stakeholder"],
  export: ["field", "pm", "stakeholder"],
};

// Tab access within event workspace
const TAB_ACCESS: Record<string, Role[]> = {
  overview: ["field", "pm", "stakeholder"],
  field: ["field", "pm"],
  contract: ["pm", "stakeholder"],
  decision: ["pm", "stakeholder"],
  communication: ["field", "pm", "stakeholder"],
  monitor: ["field", "pm", "stakeholder"],
  history: ["field", "pm", "stakeholder"],
  // Event flow simplification modes
  capture: ["field", "pm", "stakeholder"],
  exposure: ["pm", "stakeholder"],
  "stakeholder-update": ["field", "pm", "stakeholder"],
  "decision-outputs": ["pm", "stakeholder"],
  activity: ["field", "pm", "stakeholder"],
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("pm");

  useEffect(() => {
    const stored = localStorage.getItem("icelerate-role") as Role | null;
    if (stored && ["field", "pm", "stakeholder"].includes(stored)) {
      setRoleState(stored);
    }
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem("icelerate-role", newRole);
  };

  const hasAccess = (tool: string): boolean => {
    const allowed = ROLE_ACCESS[tool];
    return allowed ? allowed.includes(role) : false;
  };

  const hasTabAccess = (tab: string): boolean => {
    const allowed = TAB_ACCESS[tab];
    return allowed ? allowed.includes(role) : false;
  };

  return (
    <RoleContext.Provider value={{ role, setRole, hasAccess, hasTabAccess }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
