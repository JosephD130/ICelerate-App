"use client";

import {
  LayoutDashboard,
  Radio,
  FileText,
  GitBranch,
  MessageSquare,
  Activity,
  History,
} from "lucide-react";
import { useRole } from "@/lib/contexts/role-context";
import type { EventTab } from "@/lib/contexts/event-context";

interface TabConfig {
  id: EventTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={14} /> },
  { id: "field", label: "Field", icon: <Radio size={14} /> },
  { id: "contract", label: "Contract", icon: <FileText size={14} /> },
  { id: "decision", label: "Decision", icon: <GitBranch size={14} /> },
  { id: "communication", label: "Communication", icon: <MessageSquare size={14} /> },
  { id: "monitor", label: "Monitor", icon: <Activity size={14} /> },
  { id: "history", label: "History", icon: <History size={14} /> },
];

export default function EventTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: EventTab;
  onTabChange: (tab: EventTab) => void;
}) {
  const { hasTabAccess } = useRole();

  const visibleTabs = TABS.filter((tab) => hasTabAccess(tab.id));

  return (
    <div role="tablist" aria-label="Event tabs" className="flex items-center gap-1 border-b border-[var(--color-border)] mb-6 overflow-x-auto">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
            activeTab === tab.id
              ? "border-b-[var(--color-accent)] text-[var(--color-text-primary)]"
              : "border-b-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
