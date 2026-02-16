"use client";

import { useState } from "react";
import { HelpCircle, X, FileText, Calculator, Database } from "lucide-react";
import { FLAGS } from "@/lib/flags";

export interface ValueSource {
  label: string;
  type: "document" | "calculation" | "field-data";
  detail: string;
}

interface Props {
  label: string;
  sources: ValueSource[];
}

const TYPE_ICONS = {
  document: FileText,
  calculation: Calculator,
  "field-data": Database,
};

export default function DerivedFromDrawer({ label, sources }: Props) {
  const [open, setOpen] = useState(false);

  if (!FLAGS.derivedFrom || sources.length === 0) return null;

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className="ml-1 text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors"
        title={`How "${label}" was derived`}
      >
        <HelpCircle size={11} />
      </button>

      {open && (
        <div
          className="absolute z-50 top-full left-0 mt-1 w-64 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              Derived From
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)]"
            >
              <X size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {sources.map((src, i) => {
              const Icon = TYPE_ICONS[src.type];
              return (
                <div key={i} className="flex items-start gap-2">
                  <Icon
                    size={11}
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--color-accent)" }}
                  />
                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-primary)]">
                      {src.label}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                      {src.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </span>
  );
}
