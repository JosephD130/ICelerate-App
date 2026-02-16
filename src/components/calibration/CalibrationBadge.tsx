"use client";

import { Zap } from "lucide-react";
import { useMemo } from "react";
import { useMemory } from "@/lib/contexts/memory-context";
import { getCalibrationInsight } from "@/lib/calibration/engine";
import type { CalibrationObjectType } from "@/lib/calibration/types";
import { FLAGS } from "@/lib/flags";

interface Props {
  resolverRule?: string;
  objectType?: CalibrationObjectType;
}

export default function CalibrationBadge({ resolverRule, objectType }: Props) {
  const { calibrations } = useMemory();

  const insight = useMemo(
    () => getCalibrationInsight(calibrations, resolverRule, objectType),
    [calibrations, resolverRule, objectType],
  );

  if (!FLAGS.calibrationEngine || !insight) return null;

  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-semantic-purple-dim)] border border-[var(--color-semantic-purple)]/20">
      <Zap size={12} className="text-[var(--color-semantic-purple)] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <span className="text-[10px] font-data font-semibold text-[var(--color-semantic-purple)]">
          Pattern corrected {insight.correctionCount}×
        </span>
        {insight.commonFix && (
          <span className="text-[10px] font-data text-[var(--color-text-dim)] ml-1.5">
            · Common fix: {insight.commonFix}
          </span>
        )}
        {insight.confidenceCap && (
          <p className="text-[9px] text-[var(--color-text-dim)] mt-0.5">
            Confidence capped at {insight.confidenceCap}% until evidence added
          </p>
        )}
      </div>
    </div>
  );
}
