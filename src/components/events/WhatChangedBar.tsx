"use client";

import { ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import type { Delta } from "@/lib/ui/delta";
import { FLAGS } from "@/lib/flags";

const DIRECTION_CONFIG = {
  up: { icon: ArrowUp, color: "var(--color-semantic-red)" },
  down: { icon: ArrowDown, color: "var(--color-semantic-green)" },
  changed: { icon: RefreshCw, color: "var(--color-semantic-blue)" },
} as const;

export default function WhatChangedBar({ deltas }: { deltas: Delta[] }) {
  if (!FLAGS.whatChanged || deltas.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
      <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-dim)]">
        Changed
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {deltas.map((delta) => {
          const config = DIRECTION_CONFIG[delta.direction];
          const Icon = config.icon;
          return (
            <span
              key={delta.label}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-data"
              style={{
                backgroundColor: `color-mix(in srgb, ${config.color} 10%, transparent)`,
                color: config.color,
              }}
            >
              <Icon size={9} />
              {delta.label}: {delta.value}
            </span>
          );
        })}
      </div>
    </div>
  );
}
