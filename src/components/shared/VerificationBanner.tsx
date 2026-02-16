"use client";

import { ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";
import type { VerificationResult, VerificationStatus } from "@/lib/verification";

const STATUS_CONFIG: Record<
  VerificationStatus,
  { Icon: typeof ShieldCheck; color: string; bg: string; border: string }
> = {
  verified: {
    Icon: ShieldCheck,
    color: "var(--color-semantic-green)",
    bg: "var(--color-semantic-green-dim)",
    border: "var(--color-semantic-green)",
  },
  caution: {
    Icon: AlertTriangle,
    color: "var(--color-semantic-yellow)",
    bg: "var(--color-semantic-yellow-dim)",
    border: "var(--color-semantic-yellow)",
  },
  unverified: {
    Icon: ShieldX,
    color: "var(--color-semantic-red)",
    bg: "var(--color-semantic-red-dim)",
    border: "var(--color-semantic-red)",
  },
};

interface Props {
  result: VerificationResult;
}

export default function VerificationBanner({ result }: Props) {
  const config = STATUS_CONFIG[result.status];
  const { Icon } = config;

  return (
    <div
      className="mt-3 flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)]"
      style={{
        backgroundColor: config.bg,
        borderLeft: `3px solid ${config.border}`,
      }}
    >
      <Icon size={13} style={{ color: config.color }} className="shrink-0" />
      <span className="text-[10px] font-data" style={{ color: config.color }}>
        {result.message}
      </span>
    </div>
  );
}
