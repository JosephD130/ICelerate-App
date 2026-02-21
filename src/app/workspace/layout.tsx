"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import RealitySyncPanel from "@/components/nucleus/RealitySyncPanel";
import { EventProvider } from "@/lib/contexts/event-context";
import { MemoryProvider } from "@/lib/contexts/memory-context";
import { ExportContextProvider } from "@/lib/contexts/export-context";
import { NotificationProvider } from "@/lib/contexts/notification-context";
import { useActiveProject } from "@/lib/contexts/project-context";
import { refreshUploadedChunksCache } from "@/lib/demo/documents";
import ToastStack from "@/components/shared/ToastStack";

function WorkspaceInner({ children }: { children: React.ReactNode }) {
  const { activeProject } = useActiveProject();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    refreshUploadedChunksCache(activeProject.id);
  }, [activeProject.id]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-[var(--color-accent)] focus:text-white focus:px-3 focus:py-1.5 focus:rounded-[var(--radius-sm)] focus:text-sm">
        Skip to content
      </a>
      <div className="flex h-screen overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden light-content bg-[var(--color-navy)]">
          <RealitySyncPanel onMenuClick={() => setSidebarOpen((p) => !p)} />
          <main id="main" className="flex-1 overflow-y-auto p-3 md:p-6 min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EventProvider>
      <MemoryProvider>
        <ExportContextProvider>
          <NotificationProvider>
            <WorkspaceInner>{children}</WorkspaceInner>
            <ToastStack />
          </NotificationProvider>
        </ExportContextProvider>
      </MemoryProvider>
    </EventProvider>
  );
}
