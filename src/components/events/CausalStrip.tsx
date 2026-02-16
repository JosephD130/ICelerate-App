"use client";

import { CheckCircle, DollarSign, FileText, Radio, GitBranch } from "lucide-react";
import { useEvents } from "@/lib/contexts/event-context";
import { FLAGS } from "@/lib/flags";

interface StripNode {
  label: string;
  icon: React.ReactNode;
  done: boolean;
  value?: string;
  color: string;
}

export default function CausalStrip() {
  const { activeEvent } = useEvents();
  if (!FLAGS.causalStrip || !activeEvent) return null;

  const nodes: StripNode[] = [
    {
      label: "Field",
      icon: <Radio size={12} />,
      done: !!activeEvent.fieldRecord,
      value: activeEvent.fieldRecord ? activeEvent.severity : undefined,
      color: "var(--color-semantic-green)",
    },
    {
      label: "Contract",
      icon: <FileText size={12} />,
      done: activeEvent.contractReferences.length > 0,
      value: activeEvent.contractReferences.length > 0
        ? `${activeEvent.contractReferences.length} clause${activeEvent.contractReferences.length !== 1 ? "s" : ""}`
        : undefined,
      color: "var(--color-semantic-blue)",
    },
    {
      label: "Exposure",
      icon: <DollarSign size={12} />,
      done: !!(activeEvent.costImpact || activeEvent.scheduleImpact),
      value: activeEvent.costImpact
        ? `$${activeEvent.costImpact.estimated.toLocaleString()}`
        : activeEvent.scheduleImpact
        ? `${activeEvent.scheduleImpact.daysAffected}d`
        : undefined,
      color: "var(--color-accent)",
    },
    {
      label: "Decision",
      icon: <GitBranch size={12} />,
      done: !!activeEvent.decisionRecord,
      value: activeEvent.decisionRecord
        ? `${activeEvent.decisionRecord.panels.length} panels`
        : undefined,
      color: "var(--color-semantic-purple)",
    },
  ];

  return (
    <div className="flex items-center gap-1 py-3 px-1 mb-2 overflow-x-auto">
      {nodes.map((node, i) => (
        <div key={node.label} className="flex items-center gap-1 shrink-0">
          {/* Node */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] border transition-all ${
              node.done
                ? "border-[color:var(--node-color)] bg-[color:var(--node-dim)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]"
            }`}
            style={{
              "--node-color": node.color,
              "--node-dim": node.done ? `color-mix(in srgb, ${node.color} 12%, transparent)` : undefined,
              borderColor: node.done ? node.color : undefined,
              backgroundColor: node.done ? `color-mix(in srgb, ${node.color} 8%, transparent)` : undefined,
            } as React.CSSProperties}
          >
            {node.done ? (
              <CheckCircle size={12} style={{ color: node.color }} />
            ) : (
              <span style={{ color: "var(--color-text-dim)" }}>{node.icon}</span>
            )}
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: node.done ? node.color : "var(--color-text-dim)" }}
            >
              {node.label}
            </span>
            {node.value && (
              <span
                className="text-xs font-data ml-0.5"
                style={{ color: node.done ? node.color : "var(--color-text-dim)" }}
              >
                {node.value}
              </span>
            )}
          </div>

          {/* Arrow connector */}
          {i < nodes.length - 1 && (
            <div
              className="w-4 h-px shrink-0"
              style={{
                backgroundColor: node.done ? node.color : "var(--color-border)",
                opacity: node.done ? 0.5 : 0.3,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
