"use client";

import { ProjectProvider } from "@/lib/contexts/project-context";
import { RoleProvider } from "@/lib/contexts/role-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <RoleProvider>{children}</RoleProvider>
    </ProjectProvider>
  );
}
