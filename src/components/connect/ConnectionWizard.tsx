"use client";

import { useState, useEffect } from "react";
import { X, Server, FileUp, Mail, Paperclip, Check, Building2, Globe, Shield } from "lucide-react";
import {
  loadProjectSystemPreview,
  loadEmailPreview,
  type SimObject,
  type SimEmail,
} from "@/lib/connect/simulation";

type WizardTab = "api" | "files" | "email";

interface Props {
  open: boolean;
  onClose: () => void;
  onConnectApi: () => void;
  onConnectEmail: () => void;
  onFileImport: (slot: string, fileName: string) => void;
  fileImports: Record<string, { fileName: string; importedAt: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  daily_log: "Daily Logs",
  rfi: "RFIs",
  observation: "Observations",
  change_event: "Change Events",
  commitment: "Commitments",
};

const FILE_SLOTS = [
  { key: "schedule", label: "Schedule (Excel / XLSX)", ext: "xlsx", coverageAdd: 20 },
  { key: "cost", label: "Cost Report (Excel / CSV)", ext: "xlsx", coverageAdd: 20 },
  { key: "daily_logs", label: "Daily Logs (Excel / CSV)", ext: "csv", coverageAdd: 15 },
  { key: "contract", label: "Contract & Specifications (PDF)", ext: "pdf", coverageAdd: 25 },
  { key: "asbuilt", label: "As-Built Drawings (PDF)", ext: "pdf", coverageAdd: 15 },
  { key: "rfi_log", label: "RFI Log Export (Excel / CSV)", ext: "xlsx", coverageAdd: 10 },
];

export default function ConnectionWizard({
  open,
  onClose,
  onConnectApi,
  onConnectEmail,
  onFileImport,
  fileImports,
}: Props) {
  const [activeTab, setActiveTab] = useState<WizardTab>("api");
  const [apiPreview, setApiPreview] = useState<{ objects: SimObject[]; summary: Record<string, number> } | null>(null);
  const [emailPreview, setEmailPreview] = useState<SimEmail[] | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);

  useEffect(() => {
    if (open && activeTab === "api" && !apiPreview) {
      setApiPreview(loadProjectSystemPreview());
    }
    if (open && activeTab === "email" && !emailPreview) {
      setEmailPreview(loadEmailPreview().emails);
    }
  }, [open, activeTab, apiPreview, emailPreview]);

  if (!open) return null;

  const tabs: { key: WizardTab; label: string; icon: typeof Server }[] = [
    { key: "api", label: "Project System (API)", icon: Server },
    { key: "files", label: "File Imports", icon: FileUp },
    { key: "email", label: "Email", icon: Mail },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[var(--radius-card)] border shadow-xl"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Add Connection
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
                  style={{
                    color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                    borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* API Tab */}
            {activeTab === "api" && (
              <div>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  Connect your project management system to automatically sync daily logs, RFIs, observations, and change events.
                </p>

                {/* System selection */}
                <div className="text-xs font-semibold uppercase tracking-[1.2px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                  Select System
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Procore */}
                  <div
                    className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-sm)] border"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <Building2 size={22} style={{ color: "var(--color-text-muted)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Procore</span>
                    <span className="text-[10px] text-center" style={{ color: "var(--color-text-dim)" }}>Requires admin API credentials</span>
                    <button
                      className="text-[10px] font-semibold px-3 py-1 rounded-full border cursor-default"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)", background: "var(--color-card)" }}
                    >
                      <Shield size={10} className="inline mr-1 -mt-px" />
                      Contact Administrator
                    </button>
                  </div>
                  {/* Demo Simulation */}
                  <div
                    className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-sm)] border"
                    style={{ background: "var(--color-surface)", borderColor: apiConnected ? "var(--color-semantic-green)" : "var(--color-accent)", borderWidth: "1.5px" }}
                  >
                    <Server size={22} style={{ color: "var(--color-accent)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Demo Simulation</span>
                    <span className="text-[10px] text-center" style={{ color: "var(--color-text-dim)" }}>Pre-loaded project data</span>
                    {apiConnected ? (
                      <span className="text-[10px] font-semibold px-3 py-1 rounded-full" style={{ color: "var(--color-semantic-green)" }}>
                        <Check size={10} className="inline mr-1 -mt-px" /> Connected
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-3 py-1 rounded-full" style={{ color: "var(--color-accent)" }}>
                        Available
                      </span>
                    )}
                  </div>
                </div>

                {apiPreview && !apiConnected && (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-[1.2px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                      Simulation Preview
                    </div>
                    <div
                      className="rounded-[var(--radius-sm)] border p-4 mb-4"
                      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    >
                      <div className="grid grid-cols-5 gap-3 mb-4">
                        {Object.entries(apiPreview.summary).map(([type, count]) => (
                          <div key={type} className="text-center">
                            <p className="text-lg font-bold font-data" style={{ color: "var(--color-text-primary)" }}>
                              {count}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>
                              {TYPE_LABELS[type] ?? type}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="text-xs font-semibold uppercase tracking-[1.2px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                        Sample Objects
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {apiPreview.objects.slice(0, 8).map((obj) => (
                          <div
                            key={obj.id}
                            className="flex items-center gap-2 text-xs px-2 py-1 rounded-[var(--radius-sm)]"
                            style={{ background: "var(--color-card)" }}
                          >
                            <span className="font-data shrink-0" style={{ color: "var(--color-text-dim)", minWidth: 60 }}>
                              {obj.id}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase" style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}>
                              {obj.type.replace("_", " ")}
                            </span>
                            <span className="truncate flex-1" style={{ color: "var(--color-text-secondary)" }}>
                              {obj.title}
                            </span>
                            {obj.location && (
                              <span className="font-data shrink-0" style={{ color: "var(--color-text-dim)" }}>
                                {obj.location}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setApiConnected(true);
                        onConnectApi();
                      }}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      <Server size={14} /> Connect Simulation
                    </button>
                  </>
                )}

                {apiConnected && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-semantic-green)" }}>
                    <Check size={16} /> Connected — {apiPreview?.objects.length ?? 0} objects synced.
                  </div>
                )}
              </div>
            )}

            {/* Files Tab */}
            {activeTab === "files" && (
              <div>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  Upload project files to supplement API data. Each file type increases evidence coverage.
                </p>

                <div className="space-y-3">
                  {FILE_SLOTS.map((slot) => {
                    const imported = fileImports[slot.key];
                    return (
                      <div
                        key={slot.key}
                        className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border"
                        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                      >
                        <FileUp size={16} style={{ color: "var(--color-text-muted)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {slot.label}
                          </p>
                          {imported ? (
                            <p className="text-xs font-data" style={{ color: "var(--color-semantic-green)" }}>
                              {imported.fileName} — imported {new Date(imported.importedAt).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                              Not imported
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] font-data shrink-0" style={{ color: "var(--color-text-dim)" }}>
                          +{slot.coverageAdd}% coverage
                        </span>
                        <button
                          onClick={() => {
                            const fakeName = `${slot.key}_${new Date().toISOString().slice(0, 10)}.${slot.ext}`;
                            onFileImport(slot.key, fakeName);
                          }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] border transition-colors cursor-pointer"
                          style={{
                            borderColor: "var(--color-border)",
                            color: imported ? "var(--color-text-muted)" : "var(--color-accent)",
                            background: "var(--color-card)",
                          }}
                        >
                          {imported ? "Replace" : "Choose file"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === "email" && (
              <div>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  Connect email to automatically link project communications to events. Matches become Pending Review suggestions — never auto-accepted.
                </p>

                {/* Email provider cards */}
                <div className="text-xs font-semibold uppercase tracking-[1.2px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                  Email Providers
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    className="flex flex-col items-center gap-2 p-3 rounded-[var(--radius-sm)] border"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <Globe size={18} style={{ color: "var(--color-text-muted)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Microsoft 365</span>
                    <span className="text-[10px] text-center" style={{ color: "var(--color-text-dim)" }}>Requires org admin consent</span>
                    <button
                      className="text-[10px] font-semibold px-3 py-1 rounded-full border cursor-default"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)", background: "var(--color-card)" }}
                    >
                      <Shield size={10} className="inline mr-1 -mt-px" />
                      Contact Administrator
                    </button>
                  </div>
                  <div
                    className="flex flex-col items-center gap-2 p-3 rounded-[var(--radius-sm)] border"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <Mail size={18} style={{ color: "var(--color-text-muted)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Gmail / Google</span>
                    <span className="text-[10px] text-center" style={{ color: "var(--color-text-dim)" }}>Requires workspace admin</span>
                    <button
                      className="text-[10px] font-semibold px-3 py-1 rounded-full border cursor-default"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)", background: "var(--color-card)" }}
                    >
                      <Shield size={10} className="inline mr-1 -mt-px" />
                      Contact Administrator
                    </button>
                  </div>
                </div>

                {/* Demo inbox */}
                <div
                  className="rounded-[var(--radius-sm)] border p-4 mb-4"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  <div className="text-xs font-semibold uppercase tracking-[1.2px] mb-3" style={{ color: "var(--color-text-muted)" }}>
                    Demo Inbox Preview
                  </div>
                  {emailPreview && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {emailPreview.map((email) => (
                        <div
                          key={email.id}
                          className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-[var(--radius-sm)]"
                          style={{ background: "var(--color-card)" }}
                        >
                          {email.hasAttachments && (
                            <Paperclip size={10} style={{ color: "var(--color-text-dim)" }} />
                          )}
                          <span className="font-medium truncate flex-1" style={{ color: "var(--color-text-primary)" }}>
                            {email.subject}
                          </span>
                          <span className="font-data shrink-0" style={{ color: "var(--color-text-dim)" }}>
                            {new Date(email.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className="mt-3 p-2 rounded-[var(--radius-sm)] text-xs"
                    style={{ background: "var(--color-card)", color: "var(--color-text-muted)" }}
                  >
                    <span className="font-semibold">How it maps:</span> Emails are linked to events via keyword match. Matches become Pending Review suggestions — never auto-accepted.
                  </div>
                </div>

                {!emailConnected ? (
                  <button
                    onClick={() => {
                      setEmailConnected(true);
                      onConnectEmail();
                    }}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Mail size={14} /> Connect Demo Inbox
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-semantic-green)" }}>
                    <Check size={16} /> Email connected — {emailPreview?.length ?? 0} messages linked.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
