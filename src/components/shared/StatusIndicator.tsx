import { TYPO } from "@/lib/ui/typography";

type Status = "synced" | "drift" | "misaligned";

const STATUS_CONFIG: Record<Status, { color: string; label: string; pulse: boolean }> = {
  synced: { color: "var(--color-semantic-green)", label: "Synced", pulse: false },
  drift: { color: "var(--color-semantic-yellow)", label: "Drift", pulse: true },
  misaligned: { color: "var(--color-semantic-red)", label: "Misaligned", pulse: true },
};

export default function StatusIndicator({
  status,
  size = "sm",
}: {
  status: Status;
  size?: "sm" | "md" | "lg";
}) {
  const config = STATUS_CONFIG[status];
  const sizeMap = { sm: "w-2 h-2", md: "w-3 h-3", lg: "w-4 h-4" };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <div
          className={`${sizeMap[size]} rounded-full`}
          style={{ backgroundColor: config.color }}
        />
        {config.pulse && (
          <div
            className={`absolute inset-0 ${sizeMap[size]} rounded-full animate-ping opacity-30`}
            style={{ backgroundColor: config.color }}
          />
        )}
      </div>
      <span className={`${TYPO.badgeTiny} font-medium`} style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}
