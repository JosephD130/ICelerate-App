"use client";

import { useState, useMemo } from "react";
import { X, BookOpen, Tag } from "lucide-react";
import type { DecisionEvent } from "@/lib/models/decision-event";
import { useEvents } from "@/lib/contexts/event-context";
import { useActiveProject } from "@/lib/contexts/project-context";
import { resolveCaseFromEvent, buildOutcome, extractClauses } from "@/lib/demo/v5/resolvers/cases";
import { MemoryStore } from "@/lib/memory/store";

interface Props {
  event: DecisionEvent;
}

export default function PromoteToCaseModal({ event }: Props) {
  const { updateEvent, setPendingResolution, addHistory } = useEvents();
  const { activeProject } = useActiveProject();

  const preOutcome = useMemo(() => buildOutcome(event), [event]);
  const preClauses = useMemo(() => extractClauses(event), [event]);

  const [outcome, setOutcome] = useState(preOutcome);
  const [tags, setTags] = useState(event.tags.join(", "));
  const [lesson, setLesson] = useState("");

  const handlePromote = () => {
    const caseRecord = resolveCaseFromEvent(event, activeProject.name);
    // Apply overrides
    caseRecord.outcome = outcome;
    caseRecord.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const store = new MemoryStore();
    store.addCase(caseRecord);

    if (lesson.trim()) {
      store.addLesson({
        id: `lesson-${Date.now()}`,
        title: `Lesson from ${event.title.slice(0, 60)}`,
        pattern: caseRecord.issueType,
        detail: lesson,
        caseIds: [caseRecord.id],
        issueTypes: [caseRecord.issueType],
        confidence: 80,
        status: "proposed",
        createdAt: new Date().toISOString(),
      });
    }

    updateEvent(event.id, { status: "resolved" });
    addHistory(event.id, {
      action: "Event resolved → promoted to case",
      tab: "activity",
      detail: `Case: ${caseRecord.id} — ${outcome.slice(0, 80)}`,
    });
    setPendingResolution(null);
  };

  const handleSkip = () => {
    updateEvent(event.id, { status: "resolved" });
    addHistory(event.id, {
      action: "Event resolved (no case)",
      tab: "activity",
      detail: "Resolved without case promotion",
    });
    setPendingResolution(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setPendingResolution(null)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] w-full max-w-lg shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[var(--color-accent)]" />
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">Save as Case?</div>
            </div>
            <button onClick={() => setPendingResolution(null)} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="text-sm text-[var(--color-text-secondary)]">
              Promote this risk item to your project memory as a resolved case. This helps the system learn from your decisions.
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Outcome</label>
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full h-24 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-accent)] focus:outline-none"
                placeholder="What was the resolution?"
              />
            </div>

            {preClauses.length > 0 && (
              <div>
                <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Clauses Invoked</label>
                <div className="flex flex-wrap gap-1.5">
                  {preClauses.map((c: string) => (
                    <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-data bg-[var(--color-semantic-blue-dim)] text-[var(--color-semantic-blue)]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1 mb-1">
                <Tag size={10} /> Tags
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2 px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                placeholder="utility, notice, water-main"
              />
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Lesson Learned (optional)</label>
              <textarea
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                className="w-full h-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:border-[var(--color-accent)] focus:outline-none"
                placeholder="What would you do differently next time?"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)]">
            <button onClick={handleSkip} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer">
              Skip — just resolve
            </button>
            <button onClick={handlePromote} className="btn-primary px-6">
              Save as Case
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
