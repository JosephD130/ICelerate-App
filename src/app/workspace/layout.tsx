"use client";

import Sidebar from "@/components/layout/Sidebar";
import RealitySyncPanel from "@/components/nucleus/RealitySyncPanel";
import { EventProvider } from "@/lib/contexts/event-context";
import { MemoryProvider } from "@/lib/contexts/memory-context";
import { ExportContextProvider } from "@/lib/contexts/export-context";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EventProvider>
      <MemoryProvider>
        <ExportContextProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-[var(--color-accent)] focus:text-white focus:px-3 focus:py-1.5 focus:rounded-[var(--radius-sm)] focus:text-sm">
          Skip to content
        </a>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden light-content bg-[var(--color-navy)]">
            <RealitySyncPanel />
            <main id="main" className="flex-1 overflow-y-auto p-3 md:p-6">{children}</main>
          </div>
        </div>
        </ExportContextProvider>
      </MemoryProvider>
    </EventProvider>
  );
}
