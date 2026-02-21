"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Download,
  Plus,
  BookOpen,
  Lightbulb,
  Scale,
  Clock,
  DollarSign,
  Tag,
  CheckCircle2,
  X,
  FileUp,
  FileText,
  Sheet,
  Loader2,
  Upload,
} from "lucide-react";
import { FLAGS } from "@/lib/flags";
import { extractPdfText } from "@/lib/utils/pdf-extract";
import { extractExcelText } from "@/lib/utils/excel-extract";
import { chunkText } from "@/lib/utils/chunk-text";
import { addChunks } from "@/lib/storage/document-store";
import { refreshUploadedChunksCache } from "@/lib/demo/documents";
import { MemoryStore } from "@/lib/memory/store";
import { seedGlobalMemory } from "@/lib/demo/v5/memory-seed";
import {
  IMPORTABLE_CASES,
  IMPORTABLE_LESSONS,
} from "@/lib/demo/v5/knowledge-import-seed";
import type { CaseRecord, LessonRecord } from "@/lib/memory/types";
import { T } from "@/lib/terminology";
import { APP_VERSION } from "@/lib/version";
import { useActiveProject } from "@/lib/contexts/project-context";

/* ── helpers ─────────────────────────────────────────────── */

function formatCost(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
}

function uniqueProjects(cases: CaseRecord[]): number {
  return new Set(cases.map((c) => c.sourceProjectId)).size;
}

function avgConfidence(lessons: LessonRecord[]): number {
  if (lessons.length === 0) return 0;
  return Math.round(lessons.reduce((s, l) => s + l.confidence, 0) / lessons.length);
}

/* ── inline sub-components ───────────────────────────────── */

function CaseCard({ c }: { c: CaseRecord }) {
  return (
    <div
      className="rounded-[var(--radius-card)] border p-5 space-y-3"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>
          {c.title}
        </h3>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 uppercase"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-semantic-blue) 15%, transparent)",
            color: "var(--color-semantic-blue)",
          }}
        >
          {c.issueType}
        </span>
      </div>

      <p className="text-xs text-[var(--color-text-dim)]">{c.projectName}</p>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
        {c.outcome}
      </p>

      <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1 font-data">
          <DollarSign size={11} /> {formatCost(c.costFinal)}
        </span>
        <span className="flex items-center gap-1 font-data">
          <Clock size={11} /> {c.scheduleDaysFinal}d
        </span>
        <span className="flex items-center gap-1 font-data">
          <Scale size={11} /> {c.resolutionDays}d to resolve
        </span>
      </div>

      {/* Clauses + Tags */}
      <div className="flex flex-wrap gap-1.5">
        {c.clausesInvoked.map((cl) => (
          <span
            key={cl}
            className="text-[10px] font-data px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-semantic-purple) 15%, transparent)",
              color: "var(--color-semantic-purple)",
            }}
          >
            {cl}
          </span>
        ))}
        {c.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-text-dim) 10%, transparent)",
              color: "var(--color-text-dim)",
            }}
          >
            <Tag size={8} className="inline mr-0.5 -mt-px" />{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function LessonCard({ l }: { l: LessonRecord }) {
  return (
    <div
      className="rounded-[var(--radius-card)] border p-5 space-y-3"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>
          {l.title}
        </h3>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: l.status === "approved"
              ? "color-mix(in srgb, var(--color-semantic-green) 15%, transparent)"
              : "color-mix(in srgb, var(--color-semantic-yellow) 15%, transparent)",
            color: l.status === "approved" ? "var(--color-semantic-green)" : "var(--color-semantic-yellow)",
          }}
        >
          {l.status === "approved" ? "Approved" : "Proposed"}
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
        {l.pattern}
      </p>

      <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="font-data">{l.confidence}% confidence</span>
        <span className="font-data">{l.caseIds.length} linked case{l.caseIds.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Confidence bar */}
      <div className="h-1 rounded-full" style={{ background: "var(--color-border)" }}>
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{
            width: `${l.confidence}%`,
            background: l.confidence >= 80 ? "var(--color-semantic-green)" : "var(--color-semantic-yellow)",
          }}
        />
      </div>
    </div>
  );
}

/* ── modals ───────────────────────────────────────────────── */

function ImportModal({
  open,
  onClose,
  onImportDemo,
  onAddManual,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  onImportDemo: () => void;
  onAddManual: (data: Partial<CaseRecord>) => void;
  projectId: string;
}) {
  const [tab, setTab] = useState<"demo" | "upload" | "manual">("demo");
  const [title, setTitle] = useState("");
  const [issueType, setIssueType] = useState("");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");
  const [clauses, setClauses] = useState("");
  const [cost, setCost] = useState("");
  const [days, setDays] = useState("");
  const [tags, setTags] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!FLAGS.realFileProcessing) {
      onAddManual({
        title: `Imported — ${file.name}`,
        issueType: "imported",
        summary: `Imported from uploaded file (${file.name}). Review and edit details.`,
        outcome: "Pending review",
        tags: ["imported", file.name.split(".").pop()?.toLowerCase() || "file"],
      });
      onClose();
      return;
    }

    setIsProcessingFile(true);
    try {
      let text = "";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else {
        text = await extractExcelText(file);
      }

      if (text) {
        const chunks = chunkText(text, file.name, projectId);
        await addChunks(chunks);
        await refreshUploadedChunksCache(projectId);

        onAddManual({
          title: `Imported — ${file.name}`,
          issueType: "imported",
          summary: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
          outcome: `${chunks.length} document sections extracted and indexed for RAG context.`,
          tags: ["imported", file.name.split(".").pop()?.toLowerCase() || "file"],
        });
      }
      onClose();
    } catch (err) {
      console.error("File processing failed:", err);
    } finally {
      setIsProcessingFile(false);
    }
  };

  if (!open) return null;

  const handleManualSubmit = () => {
    onAddManual({
      title: title.trim() || "Untitled Case",
      issueType: issueType.trim() || "general",
      summary: summary.trim(),
      outcome: outcome.trim(),
      clausesInvoked: clauses.split(",").map((s) => s.trim()).filter(Boolean),
      costFinal: parseFloat(cost) || 0,
      scheduleDaysFinal: parseInt(days) || 0,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setTitle(""); setIssueType(""); setSummary(""); setOutcome("");
    setClauses(""); setCost(""); setDays(""); setTags("");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-[var(--radius-card)] border shadow-xl max-h-[80vh] overflow-y-auto"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Import Cases</h2>
            <button onClick={onClose} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] cursor-pointer"><X size={18} /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
            {(["demo", "upload", "manual"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-all cursor-pointer ${
                  tab === t ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]" : "text-[var(--color-text-dim)]"
                }`}
              >
                {t === "demo" ? "Import Demo Cases" : t === "upload" ? "Upload File" : "Manual Entry"}
              </button>
            ))}
          </div>

          <div className="px-6 py-5 space-y-4">
            {tab === "demo" ? (
              <div className="text-center space-y-4">
                <BookOpen size={32} className="mx-auto text-[var(--color-text-dim)] opacity-40" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Import {IMPORTABLE_CASES.length} pre-built cases from completed projects including compaction failures, dewatering incidents, and utility conflicts.
                </p>
                <button
                  onClick={() => { onImportDemo(); onClose(); }}
                  className="px-5 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer"
                >
                  <Download size={14} className="inline mr-1.5 -mt-px" />
                  Import {IMPORTABLE_CASES.length} Cases
                </button>
              </div>
            ) : tab === "upload" ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Upload case files from previous projects. Files are parsed, chunked, and indexed for RAG context across all tools.
                </p>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = "";
                  }}
                />
                {isProcessingFile ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-accent)" }} />
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Extracting and indexing document...</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center gap-3 p-8 rounded-[var(--radius-sm)] border-2 border-dashed transition-all cursor-pointer hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface)]"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                    >
                      <Upload size={28} style={{ color: "var(--color-accent)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                        Click to select a file
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--color-text-dim)" }}>
                        PDF, Excel (.xlsx), or CSV
                      </span>
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {([
                        { ext: "PDF", icon: FileText, label: "PDF Report" },
                        { ext: "XLSX", icon: Sheet, label: "Excel Workbook" },
                        { ext: "CSV", icon: FileUp, label: "CSV Export" },
                      ] as const).map((fmt) => {
                        const Icon = fmt.icon;
                        return (
                          <div
                            key={fmt.ext}
                            className="flex flex-col items-center gap-1 p-3 rounded-[var(--radius-sm)] border"
                            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                          >
                            <Icon size={18} style={{ color: "var(--color-text-dim)" }} />
                            <span className="text-[10px] font-semibold" style={{ color: "var(--color-text-muted)" }}>{fmt.ext}</span>
                            <span className="text-[9px]" style={{ color: "var(--color-text-dim)" }}>{fmt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <InputField label="Title *" value={title} onChange={setTitle} placeholder="e.g. Compaction failure from oversized lifts" />
                <InputField label="Issue Type" value={issueType} onChange={setIssueType} placeholder="e.g. quality, utility, notice" />
                <InputField label="Summary" value={summary} onChange={setSummary} placeholder="What happened?" multiline />
                <InputField label="Outcome" value={outcome} onChange={setOutcome} placeholder="How was it resolved?" multiline />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField label="Clauses (comma-separated)" value={clauses} onChange={setClauses} placeholder="§4.3.1, §7.3.1" />
                  <InputField label="Tags (comma-separated)" value={tags} onChange={setTags} placeholder="utility, rework" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField label="Final Cost ($)" value={cost} onChange={setCost} placeholder="0" type="number" />
                  <InputField label="Schedule Days" value={days} onChange={setDays} placeholder="0" type="number" />
                </div>
                <button
                  onClick={handleManualSubmit}
                  disabled={!title.trim()}
                  className={`w-full py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                    title.trim()
                      ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
                      : "bg-[var(--color-surface)] text-[var(--color-text-dim)] cursor-not-allowed"
                  }`}
                >
                  Add Case
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AddLessonModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: Partial<LessonRecord>) => void;
}) {
  const [title, setTitle] = useState("");
  const [pattern, setPattern] = useState("");
  const [detail, setDetail] = useState("");
  const [issueTypes, setIssueTypes] = useState("");
  const [confidence, setConfidence] = useState(75);

  if (!open) return null;

  const handleSubmit = () => {
    onAdd({
      title: title.trim() || "Untitled Lesson",
      pattern: pattern.trim(),
      detail: detail.trim(),
      issueTypes: issueTypes.split(",").map((s) => s.trim()).filter(Boolean),
      confidence,
    });
    setTitle(""); setPattern(""); setDetail(""); setIssueTypes(""); setConfidence(75);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-[var(--radius-card)] border shadow-xl max-h-[80vh] overflow-y-auto"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Add Lesson</h2>
            <button onClick={onClose} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] cursor-pointer"><X size={18} /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <InputField label="Title *" value={title} onChange={setTitle} placeholder="e.g. File notice within 24 hours" />
            <InputField label="Pattern" value={pattern} onChange={setPattern} placeholder="What's the repeatable pattern?" multiline />
            <InputField label="Detail" value={detail} onChange={setDetail} placeholder="Supporting evidence and context" multiline />
            <InputField label="Issue Types (comma-separated)" value={issueTypes} onChange={setIssueTypes} placeholder="notice, utility, quality" />
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Confidence: {confidence}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className={`w-full py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                title.trim()
                  ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
                  : "bg-[var(--color-surface)] text-[var(--color-text-dim)] cursor-not-allowed"
              }`}
            >
              Add Lesson
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  const cls = "w-full px-3 py-2.5 rounded-[var(--radius-input)] border text-sm";
  const style = {
    background: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text-primary)",
  };
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cls}
          style={style}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
          style={style}
        />
      )}
    </div>
  );
}

/* ── main page ───────────────────────────────────────────── */

export default function KnowledgeLibraryPage() {
  const router = useRouter();
  const { activeProject } = useActiveProject();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [store] = useState(() => new MemoryStore());
  const [importOpen, setImportOpen] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Seed + load on mount
  useEffect(() => {
    seedGlobalMemory(store);
    setCases(store.getCases());
    setLessons(store.getLessons());
  }, [store]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleImportDemo = useCallback(() => {
    let added = 0;
    for (const c of IMPORTABLE_CASES) {
      if (!cases.find((existing) => existing.id === c.id)) {
        store.addCase(c);
        added++;
      }
    }
    for (const l of IMPORTABLE_LESSONS) {
      if (!lessons.find((existing) => existing.id === l.id)) {
        store.addLesson(l);
      }
    }
    setCases(store.getCases());
    setLessons(store.getLessons());
    showToast(`${added} cases and ${IMPORTABLE_LESSONS.length} lessons imported`);
  }, [store, cases, lessons, showToast]);

  const handleAddManualCase = useCallback(
    (data: Partial<CaseRecord>) => {
      const record: CaseRecord = {
        id: `case-manual-${Date.now()}`,
        sourceEventId: "",
        sourceProjectId: "",
        projectName: "Manual Entry",
        issueType: data.issueType || "general",
        title: data.title || "Untitled Case",
        summary: data.summary || "",
        actionsPerformed: [],
        outcome: data.outcome || "",
        clausesInvoked: data.clausesInvoked || [],
        costFinal: data.costFinal || 0,
        scheduleDaysFinal: data.scheduleDaysFinal || 0,
        resolutionDays: 0,
        tags: data.tags || [],
        closedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      store.addCase(record);
      setCases(store.getCases());
      showToast("Case added");
    },
    [store, showToast],
  );

  const handleAddLesson = useCallback(
    (data: Partial<LessonRecord>) => {
      const record: LessonRecord = {
        id: `lesson-manual-${Date.now()}`,
        title: data.title || "Untitled Lesson",
        pattern: data.pattern || "",
        detail: data.detail || "",
        caseIds: [],
        issueTypes: data.issueTypes || [],
        confidence: data.confidence || 75,
        status: "proposed",
        createdAt: new Date().toISOString(),
      };
      store.addLesson(record);
      setLessons(store.getLessons());
      showToast("Lesson added");
    },
    [store, showToast],
  );

  const approvedLessons = lessons.filter((l) => l.status === "approved");

  return (
    <div className="min-h-screen bg-[var(--color-navy)] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo-ICelerate.png"
              alt="ICelerate"
              width={140}
              height={32}
              className="object-contain"
              priority
            />
            <span className="text-[10px] text-[var(--color-text-muted)] font-data tracking-wider">
              V{APP_VERSION}
            </span>
          </div>

          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> All Projects
          </button>
        </div>

        {/* Title + actions */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {T.KNOWLEDGE_LIBRARY}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Improves recommendations across all projects &middot; {cases.length} case{cases.length !== 1 ? "s" : ""} &middot; {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer"
            >
              <Download size={14} /> Import Cases
            </button>
            <button
              onClick={() => setLessonOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium border transition-all cursor-pointer"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}
            >
              <Plus size={14} /> Add Lesson
            </button>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div
            className="rounded-[var(--radius-card)] border p-5"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} style={{ color: "var(--color-semantic-blue)" }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Cases</span>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold font-data" style={{ color: "var(--color-text-primary)" }}>{cases.length}</div>
                <div className="text-xs text-[var(--color-text-dim)]">available</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-data" style={{ color: "var(--color-text-primary)" }}>{uniqueProjects(cases)}</div>
                <div className="text-xs text-[var(--color-text-dim)]">projects covered</div>
              </div>
            </div>
          </div>

          <div
            className="rounded-[var(--radius-card)] border p-5"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} style={{ color: "var(--color-semantic-green)" }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Lessons</span>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold font-data" style={{ color: "var(--color-text-primary)" }}>{approvedLessons.length}</div>
                <div className="text-xs text-[var(--color-text-dim)]">approved</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-data" style={{ color: "var(--color-text-primary)" }}>{avgConfidence(lessons)}%</div>
                <div className="text-xs text-[var(--color-text-dim)]">avg confidence</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cases section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={14} style={{ color: "var(--color-semantic-blue)" }} />
            <span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              Historical Cases
            </span>
            <span className="text-[11px] text-[var(--color-text-dim)] ml-1">{cases.length}</span>
          </div>
          {cases.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border p-8 text-center" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <p className="text-sm text-[var(--color-text-dim)]">No cases yet. Import demo cases or add manually.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>

        {/* Lessons section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={14} style={{ color: "var(--color-semantic-green)" }} />
            <span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              Approved Lessons
            </span>
            <span className="text-[11px] text-[var(--color-text-dim)] ml-1">{lessons.length}</span>
          </div>
          {lessons.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border p-8 text-center" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <p className="text-sm text-[var(--color-text-dim)]">No lessons yet. Add one manually.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map((l) => (
                <LessonCard key={l.id} l={l} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportDemo={handleImportDemo}
        onAddManual={handleAddManualCase}
        projectId={activeProject.id}
      />
      <AddLessonModal
        open={lessonOpen}
        onClose={() => setLessonOpen(false)}
        onAdd={handleAddLesson}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] shadow-lg text-sm font-medium"
          style={{ background: "var(--color-semantic-green)", color: "white" }}
        >
          <CheckCircle2 size={14} /> {toast}
        </div>
      )}
    </div>
  );
}
