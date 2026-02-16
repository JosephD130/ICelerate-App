import type { PipelineStation, Altitude } from "@/lib/models/decision-event";

export interface StationConfig {
  id: PipelineStation;
  label: string;
  description: string;
  altitude: Altitude;
  color: string;
  colorClass: string;
  borderClass: string;
  icon: string;
  tools: string[];
  path: string;
}

export const PIPELINE_STATIONS: StationConfig[] = [
  {
    id: "capture",
    label: "Capture",
    description: "Field observations → structured data",
    altitude: "ground",
    color: "#22C55E",
    colorClass: "text-semantic-green",
    borderClass: "station-capture",
    icon: "radio",
    tools: ["field-report"],
    path: "/workspace/field-report",
  },
  {
    id: "analyze",
    label: "Analyze",
    description: "Issues → spec-referenced analysis",
    altitude: "50ft",
    color: "#3B82F6",
    colorClass: "text-semantic-blue",
    borderClass: "station-analyze",
    icon: "search",
    tools: ["rfi"],
    path: "/workspace/rfi",
  },
  {
    id: "decide",
    label: "Decide",
    description: "Analysis → stakeholder decisions",
    altitude: "200ft",
    color: "#A855F7",
    colorClass: "text-semantic-purple",
    borderClass: "station-decide",
    icon: "git-branch",
    tools: ["decision-package"],
    path: "/workspace/decision-package",
  },
  {
    id: "communicate",
    label: "Communicate",
    description: "Decisions → role-adapted outputs",
    altitude: "ground",
    color: "#FF6B35",
    colorClass: "text-accent",
    borderClass: "station-communicate",
    icon: "message-square",
    tools: ["translator"],
    path: "/workspace/translator",
  },
];

export const MONITOR_TOOL = {
  id: "pulse",
  label: "Pulse Monitor",
  description: "Log scoring + risk trends",
  icon: "activity",
  path: "/workspace/pulse",
};

export function getStationByTool(toolId: string): StationConfig | undefined {
  return PIPELINE_STATIONS.find((s) => s.tools.includes(toolId));
}

export function getStationById(id: PipelineStation): StationConfig | undefined {
  return PIPELINE_STATIONS.find((s) => s.id === id);
}
