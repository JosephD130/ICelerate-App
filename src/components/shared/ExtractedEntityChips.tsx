"use client";

import { useState } from "react";
import { X, DollarSign, Clock, MapPin, FileText, User, Wrench } from "lucide-react";
import type { ExtractedEntity, EntityType } from "@/lib/extraction/field-extractor";

const TYPE_CONFIG: Record<
  EntityType,
  { color: string; bg: string; icon: typeof DollarSign }
> = {
  cost: {
    color: "var(--color-semantic-green)",
    bg: "var(--color-semantic-green-dim)",
    icon: DollarSign,
  },
  schedule: {
    color: "var(--color-semantic-yellow)",
    bg: "var(--color-semantic-yellow-dim)",
    icon: Clock,
  },
  location: {
    color: "var(--color-semantic-blue)",
    bg: "var(--color-semantic-blue-dim)",
    icon: MapPin,
  },
  contract_ref: {
    color: "var(--color-semantic-purple)",
    bg: "var(--color-semantic-purple-dim)",
    icon: FileText,
  },
  stakeholder: {
    color: "var(--color-accent)",
    bg: "var(--color-accent-dim)",
    icon: User,
  },
  equipment: {
    color: "var(--color-text-secondary)",
    bg: "var(--color-surface)",
    icon: Wrench,
  },
};

function EntityChip({
  entity,
  onDismiss,
}: {
  entity: ExtractedEntity;
  onDismiss: () => void;
}) {
  const config = TYPE_CONFIG[entity.type];
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-data border"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderColor: config.color,
      }}
    >
      <Icon size={10} />
      <span>{entity.raw}</span>
      {entity.confidence === "low" && (
        <span className="opacity-60">?</span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <X size={9} />
      </button>
    </span>
  );
}

export default function ExtractedEntityChips({
  entities,
  onEntitiesChange,
}: {
  entities: ExtractedEntity[];
  onEntitiesChange?: (entities: ExtractedEntity[]) => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = (entity: ExtractedEntity) => {
    const key = `${entity.type}:${entity.raw}`;
    const newDismissed = new Set(dismissed);
    newDismissed.add(key);
    setDismissed(newDismissed);
    onEntitiesChange?.(
      entities.filter((e) => !newDismissed.has(`${e.type}:${e.raw}`)),
    );
  };

  const visible = entities.filter(
    (e) => !dismissed.has(`${e.type}:${e.raw}`),
  );

  if (visible.length === 0) return null;

  // Group by type
  const groups = new Map<EntityType, ExtractedEntity[]>();
  for (const e of visible) {
    const list = groups.get(e.type) ?? [];
    list.push(e);
    groups.set(e.type, list);
  }

  return (
    <div className="mt-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-2.5">
      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
        Extracted Entities ({visible.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((entity, i) => (
          <EntityChip
            key={`${entity.type}:${entity.raw}:${i}`}
            entity={entity}
            onDismiss={() => handleDismiss(entity)}
          />
        ))}
      </div>
    </div>
  );
}
