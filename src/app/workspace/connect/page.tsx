"use client";

import { useState, useMemo, useEffect } from "react";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useEvents } from "@/lib/contexts/event-context";
import { resolveDecisionConfidence } from "@/lib/demo/v5/resolvers/decision-confidence";
import { FLAGS } from "@/lib/flags";
import { T } from "@/lib/terminology";
import ConnectionWizard from "@/components/connect/ConnectionWizard";
import {
  PlugZap,
  Plus,
  Server,
  Calendar,
  DollarSign,
  ClipboardList,
  Mail,
  FileText,
  RefreshCw,
  Clock,
} from "lucide-react";

const KIND_ICON: Record<string, typeof Server> = {
  project_system: Server,
  schedule_file: Calendar,
  cost_file: DollarSign,
  daily_logs: ClipboardList,
  email: Mail,
  documents: FileText,
};

const KIND_CATEGORY: Record<string, string> = {
  project_system: "api",
  schedule_file: "files",
  cost_file: "files",
  daily_logs: "files",
  email: "email",
  documents: "files",
};

const CATEGORY_LABELS: Record<string, { label: string; icon: typeof Server }> = {
  api: { label: "Project System (API)", icon: Server },
  files: { label: "Files", icon: FileText },
  email: { label: "Email", icon: Mail },
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  connected:    { bg: "bg-[var(--color-semantic-green-dim)]",  text: "text-[var(--color-semantic-green)]",  label: "Connected" },
  uploaded:     { bg: "bg-[var(--color-semantic-blue-dim)]",   text: "text-[var(--color-semantic-blue)]",   label: "Uploaded" },
  native:       { bg: "bg-[var(--color-semantic-purple-dim)]", text: "text-[var(--color-semantic-purple)]", label: "Native" },
  disconnected: { bg: "bg-[var(--color-semantic-red-dim)]",    text: "text-[var(--color-semantic-red)]",    label: "Disconnected" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function coverageColor(c: number) {
  if (c >= 80) return "var(--color-semantic-green)";
  if (c >= 50) return "var(--color-semantic-yellow)";
  return "var(--color-semantic-red)";
}

const FILE_IMPORTS_KEY = "icelerate-file-imports";

export default function ConnectPage() {
  const { activeProject } = useActiveProject();
  const { events, activeEvent } = useEvents();
  const { sourceProfile } = activeProject;
  const sources = sourceProfile.sources;

  const [wizardOpen, setWizardOpen] = useState(false);
  const [syncTimes, setSyncTimes] = useState<Record<number, string>>({});
  const [syncing, setSyncing] = useState<Record<number, boolean>>({});
  const [fileImports, setFileImports] = useState<Record<string, { fileName: string; importedAt: string }>>({});

  // Load file imports from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FILE_IMPORTS_KEY);
      if (stored) setFileImports(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Confidence from active event or average across all events
  const confidence = useMemo(() => {
    if (!FLAGS.connectConfidence) return null;
    if (activeEvent) return resolveDecisionConfidence(activeEvent);
    if (events.length === 0) return null;
    const scores = events.map((e) => resolveDecisionConfidence(e));
    const avg = Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length);
    const factorMap = new Map<string, { met: number; total: number; weight: number }>();
    for (const sc of scores) {
      for (const f of sc.factors) {
        const existing = factorMap.get(f.label) ?? { met: 0, total: 0, weight: f.weight };
        existing.total++;
        if (f.met) existing.met++;
        factorMap.set(f.label, existing);
      }
    }
    const factors = Array.from(factorMap.entries()).map(([label, { met, total, weight }]) => ({
      label,
      weight,
      met: met > total / 2,
    }));
    return { score: avg, factors };
  }, [events, activeEvent]);

  const connectedCount = sources.filter((s) => s.status === "connected").length;
  const avgCoverage = Math.round(
    sources.reduce((s, src) => s + src.coverage, 0) / (sources.length || 1)
  );

  // Worst sync age
  const worstSyncAge = useMemo(() => {
    if (sources.length === 0) return "N/A";
    let oldest = Date.now();
    for (const src of sources) {
      const t = new Date(src.lastSyncAt).getTime();
      if (t < oldest) oldest = t;
    }
    return relativeTime(new Date(oldest).toISOString());
  }, [sources]);

  const modeStyle = STATUS_STYLE[sourceProfile.mode] ?? STATUS_STYLE.disconnected;

  function handleSync(idx: number) {
    setSyncing((p) => ({ ...p, [idx]: true }));
    setTimeout(() => {
      setSyncTimes((p) => ({ ...p, [idx]: new Date().toISOString() }));
      setSyncing((p) => ({ ...p, [idx]: false }));
    }, 1500);
  }

  function handleConnectApi() {
    const idx = sources.findIndex((s) => s.kind === "project_system");
    if (idx >= 0) {
      setSyncTimes((p) => ({ ...p, [idx]: new Date().toISOString() }));
    }
  }

  function handleConnectEmail() {
    const idx = sources.findIndex((s) => s.kind === "email");
    if (idx >= 0) {
      setSyncTimes((p) => ({ ...p, [idx]: new Date().toISOString() }));
    }
  }

  function handleFileImport(slot: string, fileName: string) {
    const next = { ...fileImports, [slot]: { fileName, importedAt: new Date().toISOString() } };
    setFileImports(next);
    try {
      localStorage.setItem(FILE_IMPORTS_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  }

  // Group sources by category
  const categories = useMemo(() => {
    const groups: Record<string, typeof sources> = { api: [], files: [], email: [] };
    sources.forEach((src) => {
      const cat = KIND_CATEGORY[src.kind] ?? "files";
      groups[cat].push(src);
    });
    return groups;
  }, [sources]);

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-accent-dim)] flex items-center justify-center">
            <PlugZap size={20} style={{ color: "var(--color-accent)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {FLAGS.governedRiskSystem ? T.DATA_SOURCES : "Connect"}
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {FLAGS.governedRiskSystem ? "Data sources and ingestion control" : "Manage data sources feeding this project"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={14} /> Add Connection
        </button>
      </div>

      {/* Summary strip */}
      <div
        className="rounded-[var(--radius-md)] border p-5 flex flex-wrap items-center gap-6"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Sources Connected
          </p>
          <p className="text-3xl font-bold font-data" style={{ color: "var(--color-text-primary)" }}>
            {connectedCount}/{sources.length}
          </p>
        </div>
        <div className="w-px h-10" style={{ background: "var(--color-border)" }} />
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Evidence Coverage
          </p>
          <p className="text-3xl font-bold font-data" style={{ color: coverageColor(avgCoverage) }}>
            {avgCoverage}%
          </p>
        </div>
        <div className="w-px h-10" style={{ background: "var(--color-border)" }} />
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Last Sync Age
          </p>
          <p className="text-lg font-data font-semibold flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
            <Clock size={14} style={{ color: "var(--color-text-dim)" }} />
            {worstSyncAge}
          </p>
        </div>
        <div className="w-px h-10" style={{ background: "var(--color-border)" }} />
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>
            Data Mode
          </p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${modeStyle.bg} ${modeStyle.text}`}>
            {sourceProfile.mode}
          </span>
        </div>
      </div>

      {/* Ingestion flow note (governed) */}
      {FLAGS.governedRiskSystem && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--color-semantic-blue)]/20 bg-[var(--color-semantic-blue-dim)]">
          <Mail size={14} style={{ color: "var(--color-semantic-blue)" }} />
          <span className="text-sm" style={{ color: "var(--color-semantic-blue)" }}>
            Incoming data flows to the <strong>{T.EVIDENCE_INBOX}</strong> for review before entering the Risk Log.
          </span>
        </div>
      )}

      {/* Decision Confidence */}
      {confidence && (
        <div
          className="rounded-[var(--radius-md)] border p-5"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-muted)" }}>
              Decision Confidence
            </p>
            <span
              className="font-data text-3xl font-bold"
              style={{
                color: confidence.score >= 70 ? "var(--color-semantic-green)" : confidence.score >= 40 ? "var(--color-semantic-yellow)" : "var(--color-semantic-red)",
              }}
            >
              {confidence.score}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "var(--color-border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${confidence.score}%`,
                background: confidence.score >= 70 ? "var(--color-semantic-green)" : confidence.score >= 40 ? "var(--color-semantic-yellow)" : "var(--color-semantic-red)",
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {confidence.factors.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-data"
                style={{
                  backgroundColor: f.met ? "var(--color-semantic-green-dim)" : "var(--color-surface)",
                  color: f.met ? "var(--color-semantic-green)" : "var(--color-text-dim)",
                }}
              >
                {f.met ? "\u2713" : "\u25CB"} {f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source cards grouped by category */}
      {(["api", "files", "email"] as const).map((cat) => {
        const catSources = categories[cat];
        if (catSources.length === 0) return null;
        const catConfig = CATEGORY_LABELS[cat];
        const CatIcon = catConfig.icon;

        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <CatIcon size={14} style={{ color: "var(--color-text-muted)" }} />
              <span className="text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: "var(--color-text-muted)" }}>
                {catConfig.label}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catSources.map((src) => {
                const idx = sources.indexOf(src);
                const Icon = KIND_ICON[src.kind] ?? FileText;
                const st = STATUS_STYLE[src.status] ?? STATUS_STYLE.disconnected;
                const lastSync = syncTimes[idx] ?? src.lastSyncAt;
                const isSyncing = syncing[idx];

                return (
                  <div
                    key={idx}
                    className="rounded-[var(--radius-md)] border p-4 flex flex-col gap-3"
                    style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={18} style={{ color: "var(--color-text-muted)" }} />
                        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {src.label}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>

                    <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                      Last Sync:{" "}
                      <span className="font-data" style={{ color: "var(--color-text-secondary)" }}>
                        {relativeTime(lastSync)}
                      </span>
                    </p>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--color-text-muted)" }}>Coverage</span>
                        <span className="font-data" style={{ color: coverageColor(src.coverage) }}>
                          {src.coverage}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${src.coverage}%`, background: coverageColor(src.coverage) }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSync(idx)}
                      disabled={isSyncing}
                      className="mt-auto flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-[var(--radius-sm)] border transition-colors cursor-pointer disabled:opacity-50"
                      style={{
                        borderColor: "var(--color-border)",
                        color: "var(--color-accent)",
                        background: "var(--color-surface)",
                      }}
                    >
                      <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Connection Wizard */}
      <ConnectionWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onConnectApi={handleConnectApi}
        onConnectEmail={handleConnectEmail}
        onFileImport={handleFileImport}
        fileImports={fileImports}
      />
    </div>
  );
}
