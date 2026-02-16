"use client";

import Slider from "@/components/shared/Slider";

export interface ToneSettings {
  formality: number;
  urgency: number;
  optimism: number;
}

interface ToneSlidersProps {
  settings: ToneSettings;
  onChange: (settings: ToneSettings) => void;
}

export default function ToneSliders({ settings, onChange }: ToneSlidersProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Slider
        label="Formality"
        value={settings.formality}
        onChange={(v) => onChange({ ...settings, formality: v })}
        leftLabel="Casual"
        rightLabel="Formal"
        color="var(--color-semantic-blue)"
      />
      <Slider
        label="Urgency"
        value={settings.urgency}
        onChange={(v) => onChange({ ...settings, urgency: v })}
        leftLabel="Routine"
        rightLabel="Critical"
        color="var(--color-semantic-red)"
      />
      <Slider
        label="Optimism"
        value={settings.optimism}
        onChange={(v) => onChange({ ...settings, optimism: v })}
        leftLabel="Cautious"
        rightLabel="Optimistic"
        color="var(--color-semantic-green)"
      />
    </div>
  );
}
