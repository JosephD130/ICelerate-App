"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import {
  DEMO_PROJECTS_V5,
  DEMO_PROJECT_BY_ID,
  type DemoProject,
} from "@/lib/demo/v5/projects";

const STORAGE_KEY = "icelerate-active-project";
const USER_PROJECTS_KEY = "icelerate-user-projects";
const HIDDEN_DEMOS_KEY = "icelerate-hidden-demos";
const DEFAULT_PROJECT_ID = DEMO_PROJECTS_V5[0].id;

interface ProjectContextValue {
  activeProject: DemoProject;
  allProjects: DemoProject[];
  switchProject: (id: string) => void;
  createProject: (project: DemoProject) => void;
  deleteProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string>(DEFAULT_PROJECT_ID);
  const [userProjects, setUserProjects] = useState<DemoProject[]>([]);
  const [hiddenDemoIds, setHiddenDemoIds] = useState<Set<string>>(new Set());

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_PROJECTS_KEY);
      if (stored) setUserProjects(JSON.parse(stored));
    } catch { /* ignore corrupt data */ }

    try {
      const hidden = localStorage.getItem(HIDDEN_DEMOS_KEY);
      if (hidden) setHiddenDemoIds(new Set(JSON.parse(hidden)));
    } catch { /* ignore corrupt data */ }

    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) setActiveId(storedId);
  }, []);

  const allProjects = useMemo(
    () => [
      ...DEMO_PROJECTS_V5.filter((p) => !hiddenDemoIds.has(p.id)),
      ...userProjects,
    ],
    [userProjects, hiddenDemoIds],
  );

  const projectById = useMemo(
    () => {
      const map: Record<string, DemoProject> = {};
      for (const p of DEMO_PROJECTS_V5) {
        if (!hiddenDemoIds.has(p.id)) map[p.id] = p;
      }
      for (const p of userProjects) map[p.id] = p;
      return map;
    },
    [userProjects, hiddenDemoIds],
  );

  const switchProject = useCallback((id: string) => {
    if (projectById[id]) {
      setActiveId(id);
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, [projectById]);

  const createProject = useCallback((project: DemoProject) => {
    setUserProjects((prev) => {
      const next = [...prev, project];
      localStorage.setItem(USER_PROJECTS_KEY, JSON.stringify(next));
      return next;
    });
    setActiveId(project.id);
    localStorage.setItem(STORAGE_KEY, project.id);
  }, []);

  const deleteProject = useCallback((id: string) => {
    if (DEMO_PROJECT_BY_ID[id]) {
      // Hide demo project
      setHiddenDemoIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        localStorage.setItem(HIDDEN_DEMOS_KEY, JSON.stringify(Array.from(next)));
        return next;
      });
    } else {
      // Remove user project
      setUserProjects((prev) => {
        const next = prev.filter((p) => p.id !== id);
        localStorage.setItem(USER_PROJECTS_KEY, JSON.stringify(next));
        return next;
      });
    }
    // If deleting the active project, switch to first remaining
    if (activeId === id) {
      const remaining = [
        ...DEMO_PROJECTS_V5.filter((p) => !hiddenDemoIds.has(p.id) && p.id !== id),
        ...userProjects.filter((p) => p.id !== id),
      ];
      const nextId = remaining[0]?.id ?? DEFAULT_PROJECT_ID;
      setActiveId(nextId);
      localStorage.setItem(STORAGE_KEY, nextId);
    }
  }, [activeId, hiddenDemoIds, userProjects]);

  const activeProject = projectById[activeId] ?? allProjects[0] ?? DEMO_PROJECTS_V5[0];

  return (
    <ProjectContext.Provider
      value={{ activeProject, allProjects, switchProject, createProject, deleteProject }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useActiveProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx)
    throw new Error("useActiveProject must be used within ProjectProvider");
  return ctx;
}
