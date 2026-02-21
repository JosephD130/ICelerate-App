"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  FileText,
  TrendingDown,
  DollarSign,
  Upload,
  Cpu,
  ChevronRight,
  Image as ImageIcon,
  Film,
  Paperclip,
} from "lucide-react";
import {
  createDecisionEvent,
  type EventType,
  type Severity,
  type EventAttachment,
} from "@/lib/models/decision-event";
import { SEVERITY_MICROCOPY } from "@/lib/models/event-labels";
import { T } from "@/lib/terminology";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (event: ReturnType<typeof createDecisionEvent>) => void;
}

const EVENT_TYPES: {
  id: EventType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "notice-contract",
    label: "Notice / Contract",
    icon: <FileText size={14} />,
  },
  {
    id: "drift-variance",
    label: "Drift / Variance",
    icon: <TrendingDown size={14} />,
  },
  {
    id: "cost-schedule",
    label: "Cost / Schedule",
    icon: <DollarSign size={14} />,
  },
];

const SEVERITY_OPTIONS: Severity[] = ["low", "medium", "high", "critical"];

const SEVERITY_COLORS: Record<
  Severity,
  { border: string; bg: string; text: string }
> = {
  low: {
    border: "var(--color-semantic-green)",
    bg: "var(--color-semantic-green-dim)",
    text: "var(--color-semantic-green)",
  },
  medium: {
    border: "var(--color-semantic-blue)",
    bg: "var(--color-semantic-blue-dim)",
    text: "var(--color-semantic-blue)",
  },
  high: {
    border: "var(--color-semantic-yellow)",
    bg: "var(--color-semantic-yellow-dim)",
    text: "var(--color-semantic-yellow)",
  },
  critical: {
    border: "var(--color-semantic-red)",
    bg: "var(--color-semantic-red-dim)",
    text: "var(--color-semantic-red)",
  },
  info: {
    border: "var(--color-semantic-blue)",
    bg: "var(--color-semantic-blue-dim)",
    text: "var(--color-semantic-blue)",
  },
};

type Tab = "quick" | "import";

export default function PmCreateModal({ open, onClose, onCreated }: Props) {
  const [tab, setTab] = useState<Tab>("quick");

  // Quick entry state
  const [eventType, setEventType] = useState<EventType>("notice-contract");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const [estCost, setEstCost] = useState("");
  const [estDays, setEstDays] = useState("");
  const [noticeRequired, setNoticeRequired] = useState(false);

  // Import state
  const [importFiles, setImportFiles] = useState<EventAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        setImportFiles((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            kind: isImage ? "photo" : "document",
            title: file.name,
            rawText: "",
            metadata: {
              type: file.type,
              size: String(file.size),
              ...(isVideo ? { mediaType: "video" } : {}),
            },
            addedAt: new Date().toISOString(),
          },
        ]);
      });
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFilesAdded(e.dataTransfer.files);
    },
    [handleFilesAdded],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleCreateQuick = () => {
    if (!title.trim()) return;
    const costNum = Number(estCost.replace(/[^0-9.]/g, ""));
    const daysNum = Number(estDays);
    const event = createDecisionEvent({
      title,
      trigger: `${eventType} — PM structured entry`,
      station: "capture",
      severity,
      description,
      location: location || undefined,
      eventType,
      costImpact: costNum > 0
        ? {
            estimated: costNum,
            currency: "USD",
            confidence: "medium",
            description: `PM estimated cost: $${costNum.toLocaleString()}`,
          }
        : undefined,
      scheduleImpact: daysNum > 0
        ? {
            daysAffected: daysNum,
            criticalPath: daysNum >= 10,
            description: `PM estimated schedule impact: ${daysNum} days`,
          }
        : undefined,
      contractReferences: noticeRequired
        ? [
            {
              section: "TBD",
              clause: "TBD",
              summary: "Notice requirement flagged by PM at creation",
              noticeDays: 7,
            },
          ]
        : [],
    });
    onCreated(event);
    resetAll();
  };

  const handleCreateImport = () => {
    if (importFiles.length === 0) return;
    const firstFile = importFiles[0];
    const event = createDecisionEvent({
      title: `Document import: ${firstFile.title}`,
      trigger: "Document import — Opus 4.6 extraction",
      station: "capture",
      severity: "medium",
      description: `Imported ${importFiles.length} document(s) for AI analysis`,
      attachments: importFiles,
    });
    onCreated(event);
    resetAll();
  };

  const resetAll = () => {
    setTab("quick");
    setEventType("notice-contract");
    setTitle("");
    setLocation("");
    setSeverity("medium");
    setDescription("");
    setEstCost("");
    setEstDays("");
    setNoticeRequired(false);
    setImportFiles([]);
  };

  if (!open) return null;

  const canCreateQuick = title.trim().length > 0;
  const canCreateImport = importFiles.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-t-[20px] sm:rounded-[var(--radius-card)] w-full sm:max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
            <div className="text-sm font-semibold text-[var(--color-text-primary)]">
              New {T.RISK_ITEM}
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-[var(--color-border)] shrink-0">
            <button
              onClick={() => setTab("quick")}
              className={`flex-1 text-center py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                tab === "quick"
                  ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              Quick Entry
            </button>
            <button
              onClick={() => setTab("import")}
              className={`flex-1 text-center py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                tab === "import"
                  ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              Import Document
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {tab === "quick" ? (
              <div className="px-6 py-5 space-y-4">
                {/* Type selector */}
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                    Type
                  </label>
                  <div className="flex gap-2">
                    {EVENT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setEventType(type.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-sm)] text-xs font-medium border transition-all cursor-pointer ${
                          eventType === type.id
                            ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40"
                        }`}
                      >
                        {type.icon}
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                    Title *
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2.5 px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    placeholder={
                      eventType === "notice-contract"
                        ? "e.g., 7-day notice — unmarked utility"
                        : eventType === "drift-variance"
                          ? "e.g., Schedule drift — Phase 2 concrete"
                          : "e.g., Cost exposure — design revision CB-7"
                    }
                    autoFocus
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                    Location
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2.5 px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    placeholder="STA 42+50, Phase 2 Area B"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                    Severity
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SEVERITY_OPTIONS.map((s) => {
                      const colors = SEVERITY_COLORS[s];
                      return (
                        <button
                          key={s}
                          onClick={() => setSeverity(s)}
                          className="text-center py-2 rounded-[var(--radius-sm)] text-xs font-semibold capitalize transition-all border cursor-pointer"
                          style={{
                            borderColor:
                              severity === s
                                ? colors.border
                                : "var(--color-border)",
                            backgroundColor:
                              severity === s
                                ? colors.bg
                                : "var(--color-surface)",
                            color:
                              severity === s
                                ? colors.text
                                : "var(--color-text-muted)",
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-[var(--color-text-dim)] mt-1">
                    {SEVERITY_MICROCOPY[severity]}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-accent)] focus:outline-none"
                    placeholder="Describe the field condition, observation, or issue..."
                  />
                </div>

                {/* Cost & Schedule row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                      Est. Cost ($)
                    </label>
                    <input
                      value={estCost}
                      onChange={(e) => setEstCost(e.target.value)}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2.5 px-3 text-sm font-data text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                      placeholder="45,000"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                      Est. Days
                    </label>
                    <input
                      value={estDays}
                      onChange={(e) => setEstDays(e.target.value)}
                      type="number"
                      min={0}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2.5 px-3 text-sm font-data text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                      placeholder="12"
                    />
                  </div>
                </div>

                {/* Notice checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticeRequired}
                    onChange={(e) => setNoticeRequired(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Notice required (contractual obligation)
                  </span>
                </label>

                {/* AI info strip */}
                <div className="bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-[var(--radius-sm)] p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Cpu size={13} className="text-[var(--color-accent)]" />
                    <span className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-wider">
                      Opus 4.6 will process
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                    Cross-reference contract clauses, validate cost/schedule
                    estimates, identify notice deadlines, and route to
                    stakeholders.
                  </div>
                </div>
              </div>
            ) : (
              /* Import Document tab */
              <div className="px-6 py-5 space-y-4">
                {/* Drop zone */}
                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => importFileRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 py-12 rounded-[var(--radius-sm)] border-2 border-dashed transition-all cursor-pointer ${
                    isDragOver
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40"
                  }`}
                >
                  <Upload
                    size={32}
                    className={
                      isDragOver
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-text-dim)]"
                    }
                  />
                  <div className="text-center">
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      Drop PDF, email, or log file
                    </div>
                    <div className="text-xs text-[var(--color-text-dim)] mt-1">
                      or click to browse
                    </div>
                  </div>
                </div>
                <input
                  ref={importFileRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.eml,.msg,.txt,.log"
                  onChange={(e) => handleFilesAdded(e.target.files)}
                />

                {/* File list */}
                {importFiles.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block">
                      Files ({importFiles.length})
                    </label>
                    {importFiles.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border)]"
                      >
                        <span className="text-[var(--color-accent)] shrink-0">
                          {f.kind === "photo" ? (
                            <ImageIcon size={14} />
                          ) : f.metadata?.mediaType === "video" ? (
                            <Film size={14} />
                          ) : (
                            <FileText size={14} />
                          )}
                        </span>
                        <span className="text-xs text-[var(--color-text-primary)] truncate flex-1">
                          {f.title}
                        </span>
                        <span className="text-[10px] font-data text-[var(--color-text-dim)]">
                          {(Number(f.metadata?.size ?? 0) / 1024).toFixed(0)} KB
                        </span>
                        <button
                          onClick={() =>
                            setImportFiles((prev) =>
                              prev.filter((x) => x.id !== f.id),
                            )
                          }
                          className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI info strip */}
                <div className="bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-[var(--radius-sm)] p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Cpu size={13} className="text-[var(--color-accent)]" />
                    <span className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-wider">
                      Opus 4.6 will extract
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 gap-x-3">
                    {[
                      "Risk type & severity",
                      "Cost / schedule signals",
                      "Contract clause refs",
                      "Stakeholder routing",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]"
                      >
                        <ChevronRight
                          size={8}
                          className="text-[var(--color-accent)] shrink-0"
                        />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--color-border)] shrink-0">
            <button
              onClick={tab === "quick" ? handleCreateQuick : handleCreateImport}
              disabled={tab === "quick" ? !canCreateQuick : !canCreateImport}
              className="w-full btn-primary py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Create {T.RISK_ITEM}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
