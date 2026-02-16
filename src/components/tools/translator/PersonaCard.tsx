"use client";

import type { Persona } from "@/lib/demo/personas";

interface PersonaCardProps {
  persona: Persona;
  selected: boolean;
  onSelect: () => void;
}

export default function PersonaCard({ persona, selected, onSelect }: PersonaCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-[var(--radius-input)] border transition-all ${
        selected
          ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)] shadow-[0_0_12px_var(--color-accent-glow)]"
          : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-light)]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{persona.emoji}</span>
        <div className="min-w-0">
          <div className={`text-xs font-semibold ${selected ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
            {persona.name}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] truncate">
            {persona.role}
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-[var(--color-text-dim)]">
        Cares about: {persona.cares}
      </div>
    </button>
  );
}
