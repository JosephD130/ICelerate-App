"use client";

import { BRIEFING_ROOMS, type BriefingRoom } from "@/lib/demo/personas";

interface BriefingRoomSelectorProps {
  selected: BriefingRoom;
  onSelect: (room: BriefingRoom) => void;
}

export default function BriefingRoomSelector({
  selected,
  onSelect,
}: BriefingRoomSelectorProps) {
  const activeRoom = BRIEFING_ROOMS.find((r) => r.id === selected);

  return (
    <div>
      {/* Compact button row */}
      <div className="flex gap-1">
        {BRIEFING_ROOMS.map((room) => {
          const isActive = selected === room.id;
          return (
            <button
              key={room.id}
              onClick={() => onSelect(room.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-sm)] border text-center transition-all ${
                isActive
                  ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-light)]"
              }`}
            >
              <span className="text-sm">{room.emoji}</span>
              <span className="text-[10px] font-medium hidden xl:inline">
                {room.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded description for selected room */}
      {activeRoom && (
        <div className="mt-2 p-2.5 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{activeRoom.emoji}</span>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {activeRoom.name}
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
            {activeRoom.tone} · {activeRoom.maxLength}
          </p>
          <div className="flex gap-3 mt-1.5">
            <div className="text-[10px] text-[var(--color-semantic-green)]">
              + {activeRoom.includes.join(", ")}
            </div>
          </div>
          <div className="text-[10px] text-[var(--color-semantic-red)] mt-0.5">
            - {activeRoom.excludes.join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}
