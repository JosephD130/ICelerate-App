"use client";

import { Sparkles } from "lucide-react";
import { useMemory } from "@/lib/contexts/memory-context";
import { useEvents } from "@/lib/contexts/event-context";
import SuggestionCard from "@/components/shared/SuggestionCard";
import { FLAGS } from "@/lib/flags";

export default function EventSuggestionPanel() {
  const { activeEvent, events } = useEvents();
  const {
    pendingSuggestions,
    acceptSuggestion,
    editSuggestionStructured,
    rejectSuggestion,
  } = useMemory();

  if (!FLAGS.memoryLayer || !activeEvent) return null;

  const eventSuggestions = pendingSuggestions.filter(
    (s) => s.eventId === activeEvent.id,
  );

  if (eventSuggestions.length === 0) return null;

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={12} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
          Incoming Updates
        </span>
        <span
          className="badge text-[10px]"
          style={{
            backgroundColor: "var(--color-accent-dim)",
            color: "var(--color-accent)",
          }}
        >
          {eventSuggestions.length}
        </span>
      </div>

      <div className="space-y-3">
        {eventSuggestions.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onAccept={acceptSuggestion}
            onEditStructured={editSuggestionStructured}
            onReject={rejectSuggestion}
            events={events}
          />
        ))}
      </div>
    </div>
  );
}
