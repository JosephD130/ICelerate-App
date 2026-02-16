"use client";

import { useMemo, useState, useCallback } from "react";
import { BookOpen, Scale, ArrowRight, ThumbsUp, XCircle } from "lucide-react";
import { useEvents } from "@/lib/contexts/event-context";
import { useMemory } from "@/lib/contexts/memory-context";
import { useActiveProject } from "@/lib/contexts/project-context";
import {
  findSimilarCases,
  type MatchedCase,
  type MatchedLesson,
  type WhyMatched,
} from "@/lib/demo/v5/resolvers/similar-cases";
import { FLAGS } from "@/lib/flags";

type Feedback = "helpful" | "not_applicable";

function WhyMatchedBullets({ whyMatched }: { whyMatched: WhyMatched }) {
  if (whyMatched.bullets.length === 0) return null;
  return (
    <div className="mt-1.5 space-y-0.5">
      {whyMatched.bullets.map((bullet, i) => (
        <div
          key={i}
          className="text-[10px] font-data text-[var(--color-text-dim)] flex items-start gap-1"
        >
          <span className="text-[var(--color-semantic-purple)] mt-[1px] shrink-0">&bull;</span>
          {bullet}
        </div>
      ))}
    </div>
  );
}

function FeedbackButtons({
  id,
  current,
  onFeedback,
}: {
  id: string;
  current?: Feedback;
  onFeedback: (id: string, fb: Feedback) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <button
        onClick={() => onFeedback(id, "helpful")}
        disabled={current === "helpful"}
        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
        style={{
          backgroundColor:
            current === "helpful"
              ? "var(--color-semantic-green-dim)"
              : "var(--color-surface)",
          color:
            current === "helpful"
              ? "var(--color-semantic-green)"
              : "var(--color-text-dim)",
          border: `1px solid ${
            current === "helpful"
              ? "var(--color-semantic-green)"
              : "var(--color-border)"
          }`,
          opacity: current === "not_applicable" ? 0.4 : 1,
        }}
      >
        <ThumbsUp size={9} /> Helpful
      </button>
      <button
        onClick={() => onFeedback(id, "not_applicable")}
        disabled={current === "not_applicable"}
        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
        style={{
          backgroundColor:
            current === "not_applicable"
              ? "var(--color-semantic-red-dim)"
              : "var(--color-surface)",
          color:
            current === "not_applicable"
              ? "var(--color-semantic-red)"
              : "var(--color-text-dim)",
          border: `1px solid ${
            current === "not_applicable"
              ? "var(--color-semantic-red)"
              : "var(--color-border)"
          }`,
          opacity: current === "helpful" ? 0.4 : 1,
        }}
      >
        <XCircle size={9} /> Not applicable
      </button>
    </div>
  );
}

function CaseCard({
  match,
  feedback,
  onFeedback,
}: {
  match: MatchedCase;
  feedback?: Feedback;
  onFeedback: (id: string, fb: Feedback) => void;
}) {
  const c = match.caseRecord;
  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3"
      style={{ borderLeftWidth: 3, borderLeftColor: "var(--color-semantic-purple)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
          {c.title}
        </span>
        <span className="text-[10px] font-data text-[var(--color-text-dim)] shrink-0">
          {Math.round(match.score)}pts
        </span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-2">{c.projectName}</p>
      <p className="text-[10px] text-[var(--color-text-dim)] leading-relaxed mb-2">
        {c.outcome}
      </p>
      <div className="flex flex-wrap gap-2 text-[10px] font-data">
        <span className="text-[var(--color-semantic-yellow)]">
          ${c.costFinal.toLocaleString()}
        </span>
        <span className="text-[var(--color-text-dim)]">
          {c.scheduleDaysFinal}d schedule
        </span>
        <span className="text-[var(--color-text-dim)]">
          {c.resolutionDays}d resolution
        </span>
      </div>
      {c.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {c.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="badge text-[10px]"
              style={{
                backgroundColor: "var(--color-semantic-purple-dim)",
                color: "var(--color-semantic-purple)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <WhyMatchedBullets whyMatched={match.whyMatched} />
      <FeedbackButtons id={c.id} current={feedback} onFeedback={onFeedback} />
    </div>
  );
}

function LessonCard({
  match,
  feedback,
  onFeedback,
}: {
  match: MatchedLesson;
  feedback?: Feedback;
  onFeedback: (id: string, fb: Feedback) => void;
}) {
  const lesson = match.lesson;
  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3"
      style={{ borderLeftWidth: 3, borderLeftColor: "var(--color-semantic-green)" }}
    >
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Scale size={11} className="text-[var(--color-semantic-green)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {lesson.title}
          </span>
        </div>
        <span className="text-[10px] font-data text-[var(--color-text-dim)] shrink-0">
          {Math.round(match.score)}pts
        </span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-2">
        {lesson.pattern}
      </p>
      <div className="flex items-center gap-2 text-[10px] font-data text-[var(--color-text-dim)]">
        <span>{lesson.confidence}% confidence</span>
        <span>{lesson.caseIds.length} source case{lesson.caseIds.length !== 1 ? "s" : ""}</span>
        {lesson.status === "approved" && (
          <span className="text-[var(--color-semantic-green)]">approved</span>
        )}
      </div>
      <WhyMatchedBullets whyMatched={match.whyMatched} />
      <FeedbackButtons id={lesson.id} current={feedback} onFeedback={onFeedback} />
    </div>
  );
}

export default function SimilarCasesPanel() {
  const { activeEvent } = useEvents();
  const { cases, lessons, store } = useMemory();
  const { activeProject } = useActiveProject();

  // Local feedback state — synced to store on change
  const [feedbackMap, setFeedbackMap] = useState<Map<string, Feedback>>(() => {
    if (!activeEvent) return new Map();
    return store.getSimilarityFeedback(activeProject.id, activeEvent.id);
  });

  const handleFeedback = useCallback(
    (targetId: string, targetType: "case" | "lesson", fb: Feedback) => {
      if (!activeEvent) return;
      store.setSimilarityFeedback(activeProject.id, activeEvent.id, targetId, targetType, fb);
      setFeedbackMap((prev) => {
        const next = new Map(prev);
        next.set(targetId, fb);
        return next;
      });
    },
    [activeEvent, activeProject.id, store],
  );

  const results = useMemo(() => {
    if (!FLAGS.memoryLayer || !activeEvent) return null;
    const { cases: matchedCases, lessons: matchedLessons } = findSimilarCases(
      activeEvent,
      cases,
      lessons,
      feedbackMap,
    );
    // Filter out items with not_applicable feedback (they'll have very low scores)
    const visibleCases = matchedCases.filter(
      (mc) => feedbackMap.get(mc.caseRecord.id) !== "not_applicable",
    );
    const visibleLessons = matchedLessons.filter(
      (ml) => feedbackMap.get(ml.lesson.id) !== "not_applicable",
    );
    if (visibleCases.length === 0 && visibleLessons.length === 0) return null;
    return { cases: visibleCases, lessons: visibleLessons };
  }, [activeEvent, cases, lessons, feedbackMap]);

  if (!results) return null;

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={12} className="text-[var(--color-semantic-purple)]" />
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
          Similar Cases & Lessons
        </span>
        <span className="text-[10px] font-data text-[var(--color-text-dim)]">
          {results.cases.length} case{results.cases.length !== 1 ? "s" : ""},{" "}
          {results.lessons.length} lesson{results.lessons.length !== 1 ? "s" : ""}
        </span>
      </div>

      {results.cases.length > 0 && (
        <div className="space-y-2 mb-3">
          {results.cases.map((mc) => (
            <CaseCard
              key={mc.caseRecord.id}
              match={mc}
              feedback={feedbackMap.get(mc.caseRecord.id)}
              onFeedback={(id, fb) => handleFeedback(id, "case", fb)}
            />
          ))}
        </div>
      )}

      {results.lessons.length > 0 && (
        <div className="space-y-2">
          {results.lessons.map((ml) => (
            <LessonCard
              key={ml.lesson.id}
              match={ml}
              feedback={feedbackMap.get(ml.lesson.id)}
              onFeedback={(id, fb) => handleFeedback(id, "lesson", fb)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 mt-3 text-xs text-[var(--color-text-dim)]">
        <ArrowRight size={9} />
        Matched by tag overlap, clause references, and cost range
      </div>
    </div>
  );
}
