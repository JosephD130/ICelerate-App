// Severity left-border class helper.
// Returns a Tailwind border-l color class based on severity + status.

export function getSeverityBorderClass(severity: string, status: string): string {
  if (status === "resolved") return "border-l-green-600/50";
  switch (severity) {
    case "critical": return "border-l-red-600";
    case "high": return "border-l-amber-600";
    case "medium": return "border-l-yellow-500";
    case "low": return "border-l-slate-400";
    default: return "border-l-slate-300";
  }
}
