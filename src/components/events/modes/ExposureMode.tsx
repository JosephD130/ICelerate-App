"use client";

import { useState, useMemo } from "react";
import { DollarSign, Clock, AlertTriangle, Save } from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import { useEvents } from "@/lib/contexts/event-context";
import { useActiveProject } from "@/lib/contexts/project-context";
import { resolveProjectMetrics } from "@/lib/demo/v5/resolvers";

export default function ExposureMode() {
  const { activeEvent, updateEvent, addHistory } = useEvents();
  const { activeProject } = useActiveProject();
  const metrics = resolveProjectMetrics(activeProject.id);

  const [costEstimated, setCostEstimated] = useState<number>(activeEvent?.costImpact?.estimated ?? 0);
  const [costConfidence, setCostConfidence] = useState<"high" | "medium" | "low">(activeEvent?.costImpact?.confidence ?? "medium");
  const [costDescription, setCostDescription] = useState(activeEvent?.costImpact?.description ?? "");
  const [scheduleDays, setScheduleDays] = useState<number>(activeEvent?.scheduleImpact?.daysAffected ?? 0);
  const [criticalPath, setCriticalPath] = useState(activeEvent?.scheduleImpact?.criticalPath ?? false);
  const [scheduleDescription, setScheduleDescription] = useState(activeEvent?.scheduleImpact?.description ?? "");
  const [saved, setSaved] = useState(false);

  const contingencyPct = useMemo(() => {
    if (!metrics || metrics.totalCostExposure === 0) return 0;
    return Math.round((costEstimated / (activeProject.contingency ?? 312000)) * 100);
  }, [costEstimated, metrics, activeProject.contingency]);

  const handleSave = () => {
    if (!activeEvent) return;
    updateEvent(activeEvent.id, {
      costImpact: costEstimated > 0 ? { estimated: costEstimated, currency: "USD", confidence: costConfidence, description: costDescription } : undefined,
      scheduleImpact: scheduleDays > 0 ? { daysAffected: scheduleDays, criticalPath, description: scheduleDescription } : undefined,
    });
    addHistory(activeEvent.id, {
      action: "Exposure updated",
      tab: "exposure",
      detail: `Cost: $${costEstimated.toLocaleString()} · Schedule: ${scheduleDays}d`,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!activeEvent) return null;

  return (
    <div className="grid grid-cols-2 gap-6 max-w-4xl">
      {/* Cost Impact */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5">
        <SectionTitle icon={<DollarSign size={12} />}>Cost Impact</SectionTitle>
        <div className="space-y-3 mt-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Estimated Cost ($)</label>
            <input type="number" value={costEstimated} onChange={(e) => setCostEstimated(Number(e.target.value))} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2 px-3 text-sm font-data text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Confidence</label>
            <div className="flex gap-1">
              {(["low", "medium", "high"] as const).map((c) => (
                <button key={c} onClick={() => setCostConfidence(c)} className={`flex-1 py-2 rounded-[var(--radius-sm)] text-[10px] font-medium capitalize transition-all ${costConfidence === c ? c === "high" ? "bg-[var(--color-semantic-green-dim)] text-[var(--color-semantic-green)] border border-[var(--color-semantic-green)]" : c === "medium" ? "bg-[var(--color-semantic-yellow-dim)] text-[var(--color-semantic-yellow)] border border-[var(--color-semantic-yellow)]" : "bg-[var(--color-semantic-red-dim)] text-[var(--color-semantic-red)] border border-[var(--color-semantic-red)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Description</label>
            <textarea value={costDescription} onChange={(e) => setCostDescription(e.target.value)} className="w-full h-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-accent)] focus:outline-none" placeholder="Describe cost exposure..." />
          </div>
          {contingencyPct > 0 && (
            <div className="flex items-center gap-2 text-xs font-data">
              {contingencyPct > 10 && <AlertTriangle size={12} className="text-[var(--color-semantic-yellow)]" />}
              <span className={contingencyPct > 10 ? "text-[var(--color-semantic-yellow)]" : "text-[var(--color-text-muted)]"}>
                {contingencyPct}% of contingency
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Impact */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5">
        <SectionTitle icon={<Clock size={12} />}>Schedule Impact</SectionTitle>
        <div className="space-y-3 mt-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Days Affected</label>
            <input type="number" value={scheduleDays} onChange={(e) => setScheduleDays(Number(e.target.value))} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2 px-3 text-sm font-data text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={criticalPath} onChange={(e) => setCriticalPath(e.target.checked)} className="accent-[var(--color-semantic-red)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">Critical Path</span>
          </label>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Description</label>
            <textarea value={scheduleDescription} onChange={(e) => setScheduleDescription(e.target.value)} className="w-full h-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-accent)] focus:outline-none" placeholder="Describe schedule impact..." />
          </div>
          {criticalPath && scheduleDays > 0 && (
            <div className="flex items-center gap-2 text-xs font-data text-[var(--color-semantic-red)]">
              <AlertTriangle size={12} />
              {scheduleDays}d on critical path
            </div>
          )}
        </div>
      </div>

      {/* Save button spanning full width */}
      <div className="col-span-2">
        <button onClick={handleSave} className="btn-primary flex items-center justify-center gap-2">
          <Save size={16} />
          {saved ? "Saved" : "Save Exposure"}
        </button>
      </div>
    </div>
  );
}
