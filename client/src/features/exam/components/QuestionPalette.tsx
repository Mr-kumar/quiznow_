"use client";

/**
 * features/exam/components/QuestionPalette.tsx
 *
 * The numbered question grid — NTA JEE/NEET standard colour coding.
 * Shows every question as a coloured numbered button so students can
 * see at a glance which questions are done, skipped, or flagged.
 *
 * NTA Standard Colours:
 *   🟩 Green   = Answered (has optionId)
 *   🟥 Red     = Not Answered (visited, no optionId)
 *   ⬜ Gray    = Not Visited (never navigated to)
 *   🟣 Purple  = Marked for Review + Answered
 *   🟠 Orange  = Marked for Review, No Answer
 *
 * Performance:
 *   - React.memo on the entire component
 *   - Each PaletteButton is also React.memo
 *   - Only cells whose status changes re-render
 */

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useExamStore } from "../stores/exam-store";
import type { ExamSection, QuestionStatus } from "@/types/exam";

// ── Status resolver ───────────────────────────────────────────────────────────

function resolveStatus(
  questionId: string,
  answers: Record<string, { optionId: string | null; isMarked: boolean }>,
  visited: Set<string>,
): QuestionStatus {
  const answer = answers[questionId];
  const hasVisited = visited.has(questionId);
  const hasAnswer = !!answer?.optionId;
  const isMarked = !!answer?.isMarked;

  if (isMarked && hasAnswer) return "MARKED_ANSWERED";
  if (isMarked && !hasAnswer) return "MARKED_ONLY";
  if (hasAnswer) return "ANSWERED";
  if (hasVisited) return "NOT_ANSWERED";
  return "NOT_VISITED";
}

// ── NTA colour classes ────────────────────────────────────────────────────────

const STATUS_STYLES: Record<QuestionStatus, string> = {
  NOT_VISITED:
    "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600",
  NOT_ANSWERED:
    "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-400 dark:border-red-700",
  ANSWERED:
    "bg-green-500 text-white border-green-600 dark:bg-green-600 dark:border-green-700",
  MARKED_ONLY:
    "bg-orange-400 text-white border-orange-500 dark:bg-orange-500 dark:border-orange-600",
  MARKED_ANSWERED:
    "bg-purple-500 text-white border-purple-600 dark:bg-purple-600 dark:border-purple-700",
};

const LEGEND: { status: QuestionStatus; label: string }[] = [
  { status: "ANSWERED", label: "Answered" },
  { status: "NOT_ANSWERED", label: "Not Answered" },
  { status: "NOT_VISITED", label: "Not Visited" },
  { status: "MARKED_ANSWERED", label: "Marked + Answered" },
  { status: "MARKED_ONLY", label: "Marked, No Answer" },
];

// ── Palette button ────────────────────────────────────────────────────────────

interface PaletteButtonProps {
  number: number; // 1-indexed display number
  questionId: string;
  status: QuestionStatus;
  isActive: boolean;
  onClick: () => void;
}

const PaletteButton = React.memo(function PaletteButton({
  number,
  questionId: _questionId,
  status,
  isActive,
  onClick,
}: PaletteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Question ${number}, ${status.toLowerCase().replace(/_/g, " ")}`}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "relative h-8 w-8 rounded-md border-2 text-xs font-bold",
        "transition-all duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
        STATUS_STYLES[status],
        // Active: white ring overlay
        isActive && "ring-2 ring-blue-500 ring-offset-1 scale-110 z-10",
      )}
    >
      {number}
    </button>
  );
});

// ── Main component ────────────────────────────────────────────────────────────

interface QuestionPaletteProps {
  sections: ExamSection[];
  currentSectionIdx: number;
  currentQuestionIdx: number;
  onNavigate: (
    sectionIdx: number,
    questionIdx: number,
    questionId: string,
  ) => void;
  className?: string;
}

function QuestionPaletteInner({
  sections,
  currentSectionIdx,
  currentQuestionIdx,
  onNavigate,
  className,
}: QuestionPaletteProps) {
  const answers = useExamStore((s) => s.answers);
  const visitedQuestions = useExamStore((s) => s.visitedQuestions);

  // Pre-compute summary counts for the header
  const summary = useMemo(() => {
    let answered = 0,
      notAnswered = 0,
      notVisited = 0,
      markedAnswered = 0,
      markedOnly = 0;
    sections.forEach((section) => {
      section.questions.forEach((q) => {
        const s = resolveStatus(q.id, answers, visitedQuestions);
        if (s === "ANSWERED") answered++;
        else if (s === "NOT_ANSWERED") notAnswered++;
        else if (s === "NOT_VISITED") notVisited++;
        else if (s === "MARKED_ANSWERED") markedAnswered++;
        else markedOnly++;
      });
    });
    const total =
      answered + notAnswered + notVisited + markedAnswered + markedOnly;
    return {
      answered,
      notAnswered,
      notVisited,
      markedAnswered,
      markedOnly,
      total,
    };
  }, [answers, visitedQuestions, sections]);

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* ── Summary header ─────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          Question Palette
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 font-medium">
            {summary.answered} Answered
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-medium">
            {summary.notAnswered} Skipped
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium">
            {summary.notVisited} Unseen
          </span>
        </div>
      </div>

      {/* ── Per-section grids ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section, sIdx) => (
          <div key={section.id}>
            {/* Section label */}
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              {section.name}
            </p>

            {/* Grid — 6 columns on desktop, 8 on wider mobile */}
            <div className="grid grid-cols-6 gap-1.5">
              {section.questions.map((question, qIdx) => {
                // 1-indexed flat number across all sections
                const flatOffset = sections
                  .slice(0, sIdx)
                  .reduce((n, s) => n + s.questions.length, 0);
                const displayNumber = flatOffset + qIdx + 1;

                const status = resolveStatus(
                  question.id,
                  answers,
                  visitedQuestions,
                );
                const isActive =
                  sIdx === currentSectionIdx && qIdx === currentQuestionIdx;

                return (
                  <PaletteButton
                    key={question.id}
                    number={displayNumber}
                    questionId={question.id}
                    status={status}
                    isActive={isActive}
                    onClick={() => onNavigate(sIdx, qIdx, question.id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Colour legend ──────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
        {LEGEND.map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className={cn(
                "h-4 w-4 rounded border shrink-0",
                STATUS_STYLES[status],
              )}
              aria-hidden="true"
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const QuestionPalette = React.memo(QuestionPaletteInner);
QuestionPalette.displayName = "QuestionPalette";
