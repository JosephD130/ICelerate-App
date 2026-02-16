"use client";

import { useState } from "react";
import { Zap, ChevronDown, ChevronRight, Download } from "lucide-react";
import { useMemory } from "@/lib/contexts/memory-context";
import { useRole } from "@/lib/contexts/role-context";
import { FLAGS } from "@/lib/flags";
import type { CalibrationReasonCode } from "@/lib/calibration/types";
import { REASON_CODE_LABELS } from "@/lib/calibration/types";

const RULE_LABELS: Record<string, string> = {
  notice_risk: "Notice Risk",
  cost_revision: "Cost Revision",
  schedule_revision: "Schedule Revision",
  stakeholder_action: "Stakeholder Action",
  alignment_change: "Alignment Change",
  contract_reference: "Contract Ref",
  new_event: "New Event",
  field_observation: "Field Observation",
};

export default function CalibrationSummary() {
  const { calibrationStats } = useMemory();
  const { role } = useRole();
  const [collapsed, setCollapsed] = useState(true);

  if (!FLAGS.calibrationEngine) return null;
  if (role !== "pm") return null;
  if (!calibrationStats || calibrationStats.totalRecords === 0) return null;

  const maxReasonCount = calibrationStats.topReasonCodes[0]?.count ?? 1;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <Zap size={14} className="text-[var(--color-semantic-purple)]" />
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
          Calibration Summary
        </span>
        <span className="text-xs font-data text-[var(--color-text-muted)]">
          {calibrationStats.totalRecords} record{calibrationStats.totalRecords !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Collapsed */}
      {collapsed && (
        <p className="text-xs text-[var(--color-text-dim)] ml-6 mb-2">
          {calibrationStats.totalRecords} verified decision{calibrationStats.totalRecords !== 1 ? "s" : ""} recorded
        </p>
      )}

      {/* Expanded */}
      {!collapsed && (
        <div className="ml-6 space-y-4">
          <p className="text-xs text-[var(--color-text-dim)]">
            AI accuracy improving based on {calibrationStats.totalRecords} verified decisions.
          </p>

          {/* Action breakdown */}
          <div className="flex gap-3">
            <span className="text-[10px] font-data text-[var(--color-semantic-green)]">
              {calibrationStats.byAction.approved} approved
            </span>
            <span className="text-[10px] font-data text-[var(--color-semantic-yellow)]">
              {calibrationStats.byAction.edited} edited
            </span>
            <span className="text-[10px] font-data text-[var(--color-semantic-red)]">
              {calibrationStats.byAction.rejected} rejected
            </span>
          </div>

          {/* Top Correction Reasons */}
          {calibrationStats.topReasonCodes.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)] mb-2">
                Top Correction Reasons
              </h4>
              <div className="space-y-1.5">
                {calibrationStats.topReasonCodes.map(({ code, count }) => (
                  <div key={code} className="flex items-center gap-2">
                    <span className="text-[10px] font-data text-[var(--color-text-secondary)] w-28 shrink-0 truncate">
                      {REASON_CODE_LABELS[code as CalibrationReasonCode] ?? code}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-semantic-purple)]"
                        style={{ width: `${(count / maxReasonCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-data text-[var(--color-text-dim)] w-5 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rule Acceptance Rates */}
          {calibrationStats.ruleAcceptanceRates.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)] mb-2">
                Rule Acceptance Rates
              </h4>
              <div className="space-y-1.5">
                {calibrationStats.ruleAcceptanceRates.map(({ rule, accepted, rejected, edited }) => {
                  const total = accepted + rejected + edited;
                  const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
                  return (
                    <div key={rule} className="flex items-center gap-2">
                      <span className="text-[10px] font-data text-[var(--color-text-secondary)] w-28 shrink-0 truncate">
                        {RULE_LABELS[rule] ?? rule}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${rate}%`,
                            backgroundColor:
                              rate >= 80
                                ? "var(--color-semantic-green)"
                                : rate >= 50
                                ? "var(--color-semantic-yellow)"
                                : "var(--color-semantic-red)",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-data text-[var(--color-text-dim)] w-8 text-right">
                        {rate}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify(calibrationStats, null, 2)],
                { type: "application/json" },
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `calibration-report-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-semantic-purple)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
          >
            <Download size={10} />
            Export Calibration Report
          </button>
        </div>
      )}
    </div>
  );
}
