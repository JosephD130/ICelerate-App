"use client";

import { useState, useCallback, useRef } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Server,
  FileUp,
  Mail,
  PenLine,
  HardHat,
  Briefcase,
  Users,
  Upload,
  FileText,
} from "lucide-react";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useRole } from "@/lib/contexts/role-context";
import type { DemoProject } from "@/lib/demo/v5/projects";
import type { Role } from "@/lib/contexts/role-context";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

const PROJECT_TYPES = [
  "Infrastructure",
  "Water / Wastewater",
  "Highway",
  "Bridge",
  "Vertical",
  "Other",
] as const;

const SOURCE_CARDS = [
  { key: "project_system", label: "Project System (API)", icon: Server, available: false },
  { key: "files", label: "Files (Schedule, Cost, Logs)", icon: FileUp, available: true },
  { key: "email", label: "Email Integration", icon: Mail, available: false },
  { key: "manual", label: "Manual Entry", icon: PenLine, available: true },
] as const;

const ROLE_OPTIONS: { value: Role; label: string; icon: typeof HardHat; description: string }[] = [
  {
    value: "field",
    label: "Field",
    icon: HardHat,
    description: "Voice capture, photo logs, field observations. Mobile-first tools for the jobsite.",
  },
  {
    value: "pm",
    label: "Project Manager",
    icon: Briefcase,
    description: "Full toolkit: reports, RFIs, translations, AI chat, and decision packages.",
  },
  {
    value: "stakeholder",
    label: "Executive",
    icon: Users,
    description: "Project health dashboards, board-ready exports, progress summaries.",
  },
];

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

interface FormData {
  name: string;
  owner: string;
  projectType: string;
  contractValue: string;
  endDate: string;
  defaultRole: Role;
  enabledSources: Set<string>;
  uploadedFiles: UploadedFile[];
}

const INITIAL_FORM: FormData = {
  name: "",
  owner: "",
  projectType: "Infrastructure",
  contractValue: "",
  endDate: "",
  defaultRole: "pm",
  enabledSources: new Set(["manual"]),
  uploadedFiles: [],
};

export default function AddProjectWizard({ open, onClose, onCreated }: Props) {
  const { createProject } = useActiveProject();
  const { setRole } = useRole();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM, enabledSources: new Set(["manual"]), uploadedFiles: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSource = useCallback((key: string) => {
    setForm((prev) => {
      const next = new Set(prev.enabledSources);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, enabledSources: next };
    });
  }, []);

  const handleFileAdd = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setForm((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...newFiles],
    }));
  }, []);

  const handleFileRemove = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
    }));
  }, []);

  const handleCreate = useCallback(() => {
    const id = `p-user-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const contractValue = form.contractValue ? parseFloat(form.contractValue) : 0;

    const documents = form.uploadedFiles.map((f, i) => ({
      id: `${id}-doc-${i}`,
      title: f.name,
      category: "General Conditions" as const,
      tags: ["uploaded"],
      clauses: [],
    }));

    const project: DemoProject = {
      id,
      name: form.name.trim() || "Untitled Project",
      owner: form.owner.trim() || "Unknown",
      contractValue,
      contingency: Math.round(contractValue * 0.1),
      percentComplete: 0,
      startDate: today,
      endDateBaseline: form.endDate || today,
      endDateForecast: form.endDate || today,
      sourceProfile: {
        mode: "native",
        sources: [],
      },
      phases: [{ id: `${id}-ph1`, name: "Setup", order: 1 }],
      tasks: [],
      milestones: [],
      stakeholders: [],
      documents,
      events: [],
      exportHints: {
        execDeckFocusEventIds: [],
        publicBriefFocusEventIds: [],
        weeklyReportFocusEventIds: [],
      },
    };

    createProject(project);
    setRole(form.defaultRole);
    onCreated(id);

    // Reset for next use
    setStep(1);
    setForm({ ...INITIAL_FORM, enabledSources: new Set(["manual"]), uploadedFiles: [] });
  }, [form, createProject, setRole, onCreated]);

  const handleClose = useCallback(() => {
    setStep(1);
    setForm({ ...INITIAL_FORM, enabledSources: new Set(["manual"]), uploadedFiles: [] });
    onClose();
  }, [onClose]);

  if (!open) return null;

  const canAdvance = form.name.trim().length > 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-xl rounded-[var(--radius-card)] border shadow-xl max-h-[90vh] flex flex-col"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b shrink-0"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Add Project
              </h2>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                {[1, 2].map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: s === step ? "var(--color-accent)" : "var(--color-surface)",
                      color: s === step ? "white" : "var(--color-text-dim)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {step === 1 ? (
              <>
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-3">
                  Project Profile
                </p>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Phase 2 Storm Drain & Utility Relocation"
                    className="w-full px-3 py-2.5 rounded-[var(--radius-input)] border text-sm"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

                {/* Owner */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Owner / Agency
                  </label>
                  <input
                    type="text"
                    value={form.owner}
                    onChange={(e) => updateField("owner", e.target.value)}
                    placeholder="e.g. City of Mesa Public Works"
                    className="w-full px-3 py-2.5 rounded-[var(--radius-input)] border text-sm"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

                {/* Project Type + Contract Value row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Project Type
                    </label>
                    <select
                      value={form.projectType}
                      onChange={(e) => updateField("projectType", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[var(--radius-input)] border text-sm cursor-pointer"
                      style={{
                        background: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {PROJECT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Contract Value
                    </label>
                    <input
                      type="number"
                      value={form.contractValue}
                      onChange={(e) => updateField("contractValue", e.target.value)}
                      placeholder="$0"
                      className="w-full px-3 py-2.5 rounded-[var(--radius-input)] border text-sm"
                      style={{
                        background: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Planned End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => updateField("endDate", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[var(--radius-input)] border text-sm cursor-pointer"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

                {/* Your Role */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Your Role
                  </label>
                  <div className="space-y-2">
                    {ROLE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = form.defaultRole === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("defaultRole", opt.value)}
                          className="w-full flex items-start gap-3 p-3 rounded-[var(--radius-card)] border text-left transition-all cursor-pointer"
                          style={{
                            background: isSelected ? "var(--color-accent-dim)" : "var(--color-surface)",
                            borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)",
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              background: isSelected ? "var(--color-accent)" : "var(--color-surface-light, rgba(255,255,255,0.05))",
                              color: isSelected ? "white" : "var(--color-text-dim)",
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-semibold"
                              style={{ color: isSelected ? "var(--color-accent)" : "var(--color-text-primary)" }}
                            >
                              {opt.label}
                            </div>
                            <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                              {opt.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-3">
                  Connect Sources
                </p>
                <p className="text-sm text-[var(--color-text-dim)] mb-4">
                  Select which data sources this project will use. You can add more later from Connect.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SOURCE_CARDS.map((src) => {
                    const Icon = src.icon;
                    const enabled = form.enabledSources.has(src.key);
                    return (
                      <button
                        key={src.key}
                        type="button"
                        onClick={() => src.available && toggleSource(src.key)}
                        className={`flex items-start gap-3 p-4 rounded-[var(--radius-card)] border text-left transition-all ${
                          src.available ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                        }`}
                        style={{
                          background: enabled ? "var(--color-accent-dim)" : "var(--color-surface)",
                          borderColor: enabled ? "var(--color-accent)" : "var(--color-border)",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: enabled ? "var(--color-accent)" : "var(--color-surface-light, rgba(255,255,255,0.05))",
                            color: enabled ? "white" : "var(--color-text-dim)",
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {src.label}
                          </div>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                            style={{
                              backgroundColor: src.available
                                ? "color-mix(in srgb, var(--color-semantic-green) 15%, transparent)"
                                : "color-mix(in srgb, var(--color-text-dim) 15%, transparent)",
                              color: src.available ? "var(--color-semantic-green)" : "var(--color-text-dim)",
                            }}
                          >
                            {src.available ? "Available" : "Coming soon"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* File upload area — shown when Files source is enabled */}
                {form.enabledSources.has("files") && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                      Upload Documents
                    </label>
                    <div
                      className="border-2 border-dashed rounded-[var(--radius-card)] p-6 text-center cursor-pointer transition-colors hover:border-[var(--color-accent)]/40"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                      onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
                      onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-border)"; handleFileAdd(e.dataTransfer.files); }}
                    >
                      <Upload size={20} className="mx-auto mb-2 text-[var(--color-text-dim)]" />
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Drop files here or click to browse
                      </p>
                      <p className="text-xs text-[var(--color-text-dim)] mt-1">
                        PDF, XLSX, DOCX, CSV, images
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.txt,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileAdd(e.target.files)}
                    />

                    {/* Uploaded file chips */}
                    {form.uploadedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {form.uploadedFiles.map((f, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs"
                            style={{
                              background: "var(--color-surface)",
                              borderColor: "var(--color-border)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            <FileText size={12} className="text-[var(--color-accent)] shrink-0" />
                            <span className="truncate max-w-[140px]">{f.name}</span>
                            <span className="text-[var(--color-text-dim)] font-data">
                              {f.size < 1024 ? `${f.size}B` : f.size < 1048576 ? `${Math.round(f.size / 1024)}KB` : `${(f.size / 1048576).toFixed(1)}MB`}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleFileRemove(i); }}
                              className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] transition-colors cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-6 py-4 border-t shrink-0"
            style={{ borderColor: "var(--color-border)" }}
          >
            {step === 2 ? (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            {step === 1 ? (
              <button
                onClick={() => canAdvance && setStep(2)}
                disabled={!canAdvance}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                  canAdvance
                    ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
                    : "bg-[var(--color-surface)] text-[var(--color-text-dim)] cursor-not-allowed"
                }`}
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer"
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
