"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Shield,
  FileText,
  Download,
  X,
  ChevronRight,
  ChevronDown,
  GanttChart,
  BarChart3,
  PlugZap,
  ArrowLeft,
  Library,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useEvents } from "@/lib/contexts/event-context";
import { useActiveProject } from "@/lib/contexts/project-context";
import { TYPO } from "@/lib/ui/typography";
import { APP_VERSION } from "@/lib/version";
import { T } from "@/lib/terminology";
import { FLAGS } from "@/lib/flags";
import { generateFriendlyLabel } from "@/lib/models/event-labels";

const STATUS_DOT: Record<string, string> = {
  synced: "var(--color-semantic-green)",
  drift: "var(--color-semantic-yellow)",
  misaligned: "var(--color-semantic-red)",
};

const MODE_BADGE: Record<string, { label: string; color: string }> = {
  connected: { label: "API", color: "var(--color-semantic-green)" },
  uploaded: { label: "File", color: "var(--color-semantic-blue)" },
  native: { label: "Native", color: "var(--color-semantic-purple)" },
  mixed: { label: "Mixed", color: "var(--color-semantic-yellow)" },
};

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const WORKSPACE_NAV: NavItem[] = [
  {
    label: FLAGS.governedRiskSystem ? T.REGISTER : "Risk Register",
    path: "/workspace",
    icon: <Shield size={18} />,
  },
  {
    label: "Timeline",
    path: "/workspace/timeline",
    icon: <GanttChart size={18} />,
  },
  {
    label: "Analytics",
    path: "/workspace/analytics",
    icon: <BarChart3 size={18} />,
  },
];

const SOURCES_NAV: NavItem[] = [
  {
    label: FLAGS.governedRiskSystem ? T.DATA_SOURCES : "Connect",
    path: "/workspace/connect",
    icon: <PlugZap size={18} />,
  },
  {
    label: "Documents",
    path: "/workspace/documents",
    icon: <FileText size={18} />,
  },
];

const DELIVER_NAV: NavItem[] = [
  {
    label: T.OUTPUTS,
    path: "/workspace/export",
    icon: <Download size={18} />,
  },
];

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-[var(--radius-sm)] text-sm transition-all ${
        isActive
          ? "bg-slate-800 text-white"
          : "text-[var(--color-text-secondary)] hover:bg-slate-800/60 hover:text-[var(--color-text-primary)]"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-800/40 ${
          isActive ? "text-[var(--color-accent)]" : "text-slate-400"
        }`}
      >
        {item.icon}
      </div>
      <div className="font-medium">{item.label}</div>
    </Link>
  );
}

function ProjectSelector() {
  const { activeProject, allProjects, switchProject, deleteProject } = useActiveProject();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const badge = MODE_BADGE[activeProject.sourceProfile.mode];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2 rounded-xl bg-slate-900/40 border border-slate-800/60 p-3 hover:border-[var(--color-accent)] transition-all cursor-pointer text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2" title={activeProject.name}>
            {activeProject.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-300 font-data">
              {activeProject.owner}
            </span>
            {badge && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
                  color: badge.color,
                }}
              >
                {badge.label}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={12}
          className={`shrink-0 text-[var(--color-text-dim)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
          {allProjects.map((p) => {
            const isActive = p.id === activeProject.id;
            const pBadge = MODE_BADGE[p.sourceProfile.mode];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  switchProject(p.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--color-accent-dim)]"
                    : "hover:bg-[var(--color-surface)]"
                }`}
              >
                <div className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug" title={p.name}>
                  {p.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[var(--color-text-dim)]">
                    {p.owner}
                  </span>
                  {pBadge && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${pBadge.color} 15%, transparent)`,
                        color: pBadge.color,
                      }}
                    >
                      {pBadge.label}
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-text-dim)] font-data ml-auto">
                    {p.percentComplete}%
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Delete this project?")) {
                        deleteProject(p.id);
                        setOpen(false);
                      }
                    }}
                    className="ml-1 p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] hover:bg-[var(--color-semantic-red)]/10 transition-all"
                    title="Delete project"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { activeEvent, selectEvent } = useEvents();

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={`fixed md:static inset-y-0 left-0 z-50 w-[270px] h-screen flex flex-col bg-[var(--color-navy-light)] border-r border-[var(--color-border)] shrink-0 transition-transform duration-200 ease-in-out ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <Link href="/workspace" className="flex items-center gap-2">
          <Image
            src="/Logo-ICelerate.png"
            alt="ICelerate"
            width={120}
            height={28}
            className="object-contain"
            priority
          />
          <span className="text-xs text-[var(--color-text-muted)] font-data tracking-wider ml-auto">
            V{APP_VERSION}
          </span>
        </Link>
      </div>

      {/* Project Selector */}
      <div className="px-3 pt-3 pb-2 border-b border-[var(--color-border)]">
        <div className={`${TYPO.sectionHeader} text-[var(--color-text-muted)] px-2 mb-2`}>
          Project
        </div>
        <ProjectSelector />
        <Link
          href="/projects"
          className="flex items-center gap-3 px-3 py-3 mt-2 text-sm text-[var(--color-text-dim)] hover:bg-slate-800/60 hover:text-[var(--color-text-primary)] rounded-[var(--radius-sm)] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800/40 flex items-center justify-center shrink-0 text-slate-400">
            <ArrowLeft size={18} />
          </div>
          <span className="font-medium">All Projects</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {/* Workspace section */}
        <div className={`${TYPO.sectionHeader} text-[var(--color-text-muted)] px-2 mb-3`}>
          Workspace
        </div>
        <nav className="space-y-0.5">
          {WORKSPACE_NAV.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              isActive={pathname === item.path}
              onClick={onClose}
            />
          ))}
        </nav>

        {/* Sources section */}
        <div className={`${TYPO.sectionHeader} text-[var(--color-text-muted)] px-2 mt-8 mb-3`}>
          Sources
        </div>
        <nav className="space-y-0.5">
          {SOURCES_NAV.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              isActive={pathname === item.path}
              onClick={onClose}
            />
          ))}
        </nav>

        {/* Deliver section */}
        <div className={`${TYPO.sectionHeader} text-[var(--color-text-muted)] px-2 mt-8 mb-3`}>
          Deliver
        </div>
        <nav className="space-y-0.5">
          {DELIVER_NAV.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              isActive={pathname === item.path}
              onClick={onClose}
            />
          ))}
        </nav>

        {/* Global section */}
        {FLAGS.knowledgeLibrary && (
          <>
            <div className={`${TYPO.sectionHeader} text-[var(--color-text-muted)] px-2 mt-8 mb-3`}>
              Global
            </div>
            <nav className="space-y-0.5">
              <NavLink
                item={{ label: T.KNOWLEDGE_LIBRARY, path: "/knowledge", icon: <Library size={18} /> }}
                isActive={pathname === "/knowledge"}
                onClick={onClose}
              />
            </nav>
          </>
        )}

        {/* Active Event indicator — hidden in governed risk system (breadcrumb replaces it) */}
        {!FLAGS.governedRiskSystem && activeEvent && (
          <>
            <div className={`${TYPO.sectionHeader} text-[var(--color-text-muted)] px-2 mt-8 mb-3`}>
              {T.CURRENT_EVENT}
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
              <div className="flex items-start gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1"
                  style={{
                    backgroundColor:
                      STATUS_DOT[activeEvent.alignmentStatus] ??
                      STATUS_DOT.drift,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-tight">
                    {activeEvent.title}
                  </div>
                  <div className="text-xs text-[var(--color-text-dim)] font-data mt-1">
                    {FLAGS.eventFlowSimplification
                      ? (activeEvent.friendlyLabel ?? generateFriendlyLabel(activeEvent.id))
                      : activeEvent.id}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Link
                  href={`/workspace/events/${activeEvent.id}`}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-[var(--radius-sm)] bg-[var(--color-accent-dim)] text-[var(--color-accent)] text-xs font-medium hover:bg-[var(--color-accent)] hover:text-white transition-all"
                >
                  Open <ChevronRight size={10} />
                </Link>
                <button
                  onClick={() => selectEvent(null)}
                  className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
