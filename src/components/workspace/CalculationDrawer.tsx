"use client";

import { X, Calculator, ArrowDownRight, Info, AlertTriangle, Users } from "lucide-react";
import { TYPO, cx } from "@/lib/ui/typography";
import type { MetricResult } from "@/lib/risk-metrics/risk-metrics";

interface CalculationDrawerProps {
  open: boolean;
  onClose: () => void;
  metric: MetricResult | null;
}

export default function CalculationDrawer({
  open,
  onClose,
  metric,
}: CalculationDrawerProps) {
  const calc = metric?.calculation;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-[380px] flex flex-col overflow-y-auto transition-transform duration-200 ease-in-out"
        style={{
          background: "var(--color-card)",
          borderLeft: "1px solid var(--color-border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <div className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
              {metric?.label ?? "KPI"}
            </div>
            <div className="mt-0.5 font-data text-[16px] font-bold text-[var(--color-text-primary)]">
              {metric?.formatted ?? "—"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 px-5 py-4">
          {!calc ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Calculation details not available.
            </p>
          ) : (
            <>
              {/* How it's calculated */}
              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <Calculator size={11} style={{ color: "var(--color-accent)" }} />
                  <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
                    How it&apos;s calculated
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                  {calc.formula}
                </p>
              </section>

              {/* Contributors */}
              {metric!.contributors.length > 0 && (
                <section>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users size={11} style={{ color: "var(--color-accent)" }} />
                    <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
                      Contributors
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {metric!.contributors.map((c) => (
                      <li
                        key={c.eventId}
                        className="pl-3"
                        style={{ borderLeft: "2px solid var(--color-accent)" }}
                      >
                        <div className="text-sm text-[var(--color-text-primary)] font-medium line-clamp-1">
                          {c.title}
                        </div>
                        <div className="text-xs font-data text-[var(--color-text-muted)]">
                          {metric!.id === "exposure"
                            ? `$${c.amount.toLocaleString()}`
                            : metric!.id === "days"
                              ? `${c.amount}d`
                              : c.description}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Inputs */}
              {calc.inputs.length > 0 && (
                <section>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ArrowDownRight size={11} style={{ color: "var(--color-accent)" }} />
                    <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
                      Inputs
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {calc.inputs.map((input, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-[var(--color-text-primary)]">
                        <span className="mt-[3px] shrink-0 text-[var(--color-accent)]">&bull;</span>
                        {input}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Assumptions */}
              {calc.assumptions.length > 0 && (
                <section>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info size={11} style={{ color: "var(--color-accent)" }} />
                    <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
                      Assumptions
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {calc.assumptions.map((a, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-[var(--color-text-primary)]">
                        <span className="mt-[3px] shrink-0 text-[var(--color-accent)]">&bull;</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Limitations */}
              {calc.limitations.length > 0 && (
                <section>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={11} style={{ color: "var(--color-semantic-yellow)" }} />
                    <span className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
                      Limitations
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {calc.limitations.map((l, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-sm"
                        style={{ color: "var(--color-semantic-yellow)" }}
                      >
                        <span className="mt-[3px] shrink-0">&bull;</span>
                        {l}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
