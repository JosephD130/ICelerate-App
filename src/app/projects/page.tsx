"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Library } from "lucide-react";
import { useActiveProject } from "@/lib/contexts/project-context";
import { useRole } from "@/lib/contexts/role-context";
import RoleSwitcher from "@/components/shared/RoleSwitcher";
import { scoreAndSort, ROLE_CTA, roleCTARoute } from "@/lib/scoring/role-priority";
import type { AttentionTier, AttentionScore } from "@/lib/scoring/attention-score";
import type { DemoProject } from "@/lib/demo/v5/projects";
import { FLAGS } from "@/lib/flags";
import { T } from "@/lib/terminology";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectTable from "@/components/projects/ProjectTable";
import ProjectToolbar, {
  type ViewMode,
  type SortOption,
} from "@/components/projects/ProjectToolbar";
import ScoreDrawer from "@/components/projects/ScoreDrawer";
import AddProjectWizard from "@/components/projects/AddProjectWizard";


export default function ProjectsPage() {
  const router = useRouter();
  const { allProjects, activeProject, switchProject, deleteProject } = useActiveProject();
  const { role } = useRole();

  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "priority";
    return (localStorage.getItem("icelerate-projects-view") as ViewMode) || "priority";
  });
  const [sort, setSort] = useState<SortOption>(() => {
    if (typeof window === "undefined") return "score";
    return (localStorage.getItem("icelerate-projects-sort") as SortOption) || "score";
  });
  const [tierFilter, setTierFilter] = useState<Set<AttentionTier>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("icelerate-projects-tiers");
      if (saved) {
        try { return new Set<AttentionTier>(JSON.parse(saved)); } catch {}
      }
    }
    return new Set<AttentionTier>(["critical", "elevated", "monitoring", "stable"]);
  });
  const [drawerData, setDrawerData] = useState<{ project: DemoProject; score: AttentionScore } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const scored = useMemo(() => scoreAndSort(allProjects, role), [allProjects, role]);

  const filtered = useMemo(() => {
    let items = scored.filter((s) => tierFilter.has(s.score.tier));
    if (sort !== "score") {
      items = [...items].sort((a, b) => {
        switch (sort) {
          case "name":
            return a.project.name.localeCompare(b.project.name);
          case "events":
            return (
              b.project.events.filter((e) => e.status !== "resolved").length -
              a.project.events.filter((e) => e.status !== "resolved").length
            );
          case "cost":
            return (
              b.project.events.reduce((s, e) => s + e.costExposure.amount, 0) -
              a.project.events.reduce((s, e) => s + e.costExposure.amount, 0)
            );
          default:
            return 0;
        }
      });
    }
    return items;
  }, [scored, tierFilter, sort]);

  // Card body click → always open workspace home
  const handleOpenProject = useCallback(
    (projectId: string) => {
      switchProject(projectId);
      router.push("/workspace");
    },
    [switchProject, router]
  );

  // CTA button click → role-specific destination
  const handleCta = useCallback(
    (projectId: string, topEventId: string | null) => {
      switchProject(projectId);
      const route = roleCTARoute(role, topEventId);
      if (role === "field" && topEventId) {
        localStorage.setItem("icelerate-workspace-target", "event");
        localStorage.setItem("icelerate-top-event", topEventId);
      } else if (role === "stakeholder") {
        localStorage.setItem("icelerate-workspace-target", "export");
      }
      router.push(route);
    },
    [switchProject, router, role]
  );

  const handleDelete = useCallback(
    (projectId: string) => {
      if (!window.confirm("Delete this project? This cannot be undone.")) return;
      deleteProject(projectId);
    },
    [deleteProject]
  );

  const handleShowScore = useCallback(
    (projectId: string) => {
      const match = scored.find((s) => s.project.id === projectId);
      if (match) setDrawerData(match);
    },
    [scored]
  );

  const handleViewChange = useCallback((v: ViewMode) => {
    setView(v);
    localStorage.setItem("icelerate-projects-view", v);
  }, []);

  const handleSortChange = useCallback((s: SortOption) => {
    setSort(s);
    localStorage.setItem("icelerate-projects-sort", s);
  }, []);

  const handleTierToggle = useCallback((tier: AttentionTier) => {
    setTierFilter((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      localStorage.setItem("icelerate-projects-tiers", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const ctaLabel = ROLE_CTA[role];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Dark header zone ─── */}
      <div className="bg-[var(--color-navy)] px-4 sm:px-6 md:px-8 pt-6 md:pt-8 pb-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <Image
                src="/Logo-ICelerate.png"
                alt="ICelerate"
                width={140}
                height={32}
                className="object-contain"
                priority
              />
            </div>

            {/* Role switcher */}
            <RoleSwitcher />
          </div>

          {/* Sub-header */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Projects
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {filtered.length} project{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {FLAGS.addProject && (
              <button
                onClick={() => setWizardOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer"
              >
                <Plus size={14} /> {T.ADD_PROJECT}
              </button>
            )}
            {FLAGS.knowledgeLibrary && (
              <button
                onClick={() => router.push("/knowledge")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium border transition-all cursor-pointer"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-secondary)",
                  background: "var(--color-surface)",
                }}
              >
                <Library size={14} /> {T.ADD_KNOWLEDGE}
              </button>
            )}
            <span className="ml-auto text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] cursor-pointer transition-colors">
              Invite teammate &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* ─── Light content zone ─── */}
      <div className="light-content flex-1 rounded-t-2xl -mt-1 px-4 sm:px-6 md:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Toolbar */}
          <ProjectToolbar
            view={view}
            onViewChange={handleViewChange}
            sort={sort}
            onSortChange={handleSortChange}
            tierFilter={tierFilter}
            onTierToggle={handleTierToggle}
          />

          {/* Views */}
          {filtered.length === 0 ? (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-12 text-center">
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                No projects match the selected filters
              </p>
              <button
                onClick={() => {
                  const all = new Set<AttentionTier>(["critical", "elevated", "monitoring", "stable"]);
                  setTierFilter(all);
                  localStorage.setItem("icelerate-projects-tiers", JSON.stringify(Array.from(all)));
                }}
                className="text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                Show all tiers
              </button>
            </div>
          ) : view === "table" ? (
            <ProjectTable
              items={filtered}
              ctaLabel={ctaLabel}
              currentProjectId={activeProject.id}
              onSelect={handleOpenProject}
              onCta={handleCta}
              onShowScore={handleShowScore}
              onDelete={handleDelete}
            />
          ) : (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {filtered.map(({ project, score }) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  score={score}
                  isCurrent={project.id === activeProject.id}
                  ctaLabel={ctaLabel}
                  onSelect={() => handleOpenProject(project.id)}
                  onCta={() => handleCta(project.id, score.topEventId)}
                  onShowScore={() => handleShowScore(project.id)}
                  onDelete={() => handleDelete(project.id)}
                  variant={view === "priority" ? "priority" : "grid"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Score Drawer */}
      {drawerData && (
        <ScoreDrawer
          project={drawerData.project}
          score={drawerData.score}
          onClose={() => setDrawerData(null)}
        />
      )}

      {/* Add Project Wizard */}
      {FLAGS.addProject && (
        <AddProjectWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onCreated={() => {
            setWizardOpen(false);
            router.push("/workspace");
          }}
        />
      )}
    </div>
  );
}
