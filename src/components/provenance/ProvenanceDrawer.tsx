"use client";

import { X, FileText, Scale, AlertTriangle, Lightbulb, Clock } from "lucide-react";
import type { ProvenanceData } from "@/lib/provenance/buildProvenance";
import type { FreshnessBadge } from "@/lib/provenance/freshness";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  value: string;
  provenance: ProvenanceData;
  freshness?: FreshnessBadge;
}

function truncate(text: string, max = 200): string {
  return text.length > max ? text.slice(0, max) + "\u2026" : text;
}

export default function ProvenanceDrawer({
  open,
  onClose,
  title,
  value,
  provenance,
  freshness,
}: Props) {
  const { changedBecause, sources, citations, assumptions, missingEvidence } =
    provenance;

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
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              {title}
            </div>
            <div className="mt-0.5 font-data text-[16px] font-bold text-[var(--color-text-primary)]">
              {value}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 px-5 py-4">
          {/* ── Source Freshness ── */}
          {freshness && freshness.level !== "fresh" && (
            <section
              className="rounded-[var(--radius-sm)] px-3 py-2"
              style={{
                backgroundColor:
                  freshness.level === "old"
                    ? "var(--color-semantic-red-dim)"
                    : "var(--color-semantic-yellow-dim)",
                border: `1px solid ${
                  freshness.level === "old"
                    ? "var(--color-semantic-red)"
                    : "var(--color-semantic-yellow)"
                }`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <Clock
                  size={11}
                  style={{
                    color:
                      freshness.level === "old"
                        ? "var(--color-semantic-red)"
                        : "var(--color-semantic-yellow)",
                  }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      freshness.level === "old"
                        ? "var(--color-semantic-red)"
                        : "var(--color-semantic-yellow)",
                  }}
                >
                  {freshness.reason}
                </span>
              </div>
              {freshness.oldestSourceLabel && (
                <div className="text-xs font-data mt-0.5" style={{ color: "var(--color-text-dim)" }}>
                  Oldest: {freshness.oldestSourceLabel} ({freshness.oldestSourceAgeDays}d ago)
                </div>
              )}
            </section>
          )}

          {/* ── Changed Because ── */}
          {changedBecause && (
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb size={11} style={{ color: "var(--color-accent)" }} />
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                  Changed Because
                </span>
              </div>
              <div className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                Applied from suggestion:{" "}
                <span className="font-semibold">{changedBecause.summary}</span>
              </div>
              {changedBecause.acceptedAt && (
                <div className="mt-0.5 font-data text-xs text-[var(--color-text-dim)]">
                  {new Date(changedBecause.acceptedAt).toLocaleString()}
                </div>
              )}
            </section>
          )}

          {/* ── Inputs (Sources) ── */}
          {sources.length > 0 && (
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText size={11} style={{ color: "var(--color-accent)" }} />
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                  Inputs
                </span>
              </div>
              <div className="space-y-2">
                {sources.map((src, i) => (
                  <div
                    key={`${src.sourceId}-${i}`}
                    className="rounded-[var(--radius-sm)] p-2"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {src.type}
                      </span>
                      <span className="font-data text-xs text-[var(--color-text-dim)]">
                        {new Date(src.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                      {truncate(src.excerpt)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Contract Evidence (Citations) ── */}
          {citations && citations.length > 0 && (
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <Scale size={11} style={{ color: "var(--color-semantic-purple)" }} />
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                  Contract Evidence
                </span>
              </div>
              <div className="space-y-2">
                {citations.map((cite, i) => (
                  <div key={i} className="pl-3" style={{ borderLeft: "2px solid var(--color-semantic-purple)" }}>
                    {cite.clauseRef && (
                      <div
                        className="font-data text-xs font-bold"
                        style={{ color: "var(--color-semantic-purple)" }}
                      >
                        {cite.clauseRef}
                      </div>
                    )}
                    {cite.quote && (
                      <div className="mt-0.5 text-sm text-[var(--color-text-primary)] leading-relaxed italic">
                        &ldquo;{truncate(cite.quote)}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Assumptions ── */}
          {assumptions && assumptions.length > 0 && (
            <section>
              <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                Assumptions
              </span>
              <ul className="mt-2 space-y-1">
                {assumptions.map((a, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-[var(--color-text-primary)]">
                    <span className="mt-[3px] shrink-0 text-[var(--color-accent)]">&bull;</span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Missing to Confirm ── */}
          {missingEvidence && missingEvidence.length > 0 && (
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={11} style={{ color: "var(--color-semantic-yellow)" }} />
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                  Missing to Confirm
                </span>
              </div>
              <ul className="space-y-1">
                {missingEvidence.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-sm"
                    style={{ color: "var(--color-semantic-yellow)" }}
                  >
                    <span className="mt-[3px] shrink-0">&bull;</span>
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
