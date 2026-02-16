"use client";

import { HardHat, Briefcase, Users } from "lucide-react";
import { useRole, type Role } from "@/lib/contexts/role-context";

const ROLES: { id: Role; label: string; icon: React.ReactNode }[] = [
  { id: "field", label: "Field", icon: <HardHat size={12} /> },
  { id: "pm", label: "PM", icon: <Briefcase size={12} /> },
  { id: "stakeholder", label: "Exec", icon: <Users size={12} /> },
];

interface RoleSwitcherProps {
  variant?: "compact" | "default";
}

export default function RoleSwitcher({ variant = "default" }: RoleSwitcherProps) {
  const { role, setRole } = useRole();

  return (
    <div className="flex items-center gap-1.5">
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => setRole(r.id)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer ${
            role === r.id
              ? "bg-[var(--color-accent)] text-white"
              : variant === "compact"
                ? "bg-slate-800/60 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-slate-800"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          } ${variant === "compact" ? "flex-1 justify-center" : ""}`}
        >
          {r.icon}
          {r.label}
        </button>
      ))}
    </div>
  );
}
