"use client";

/**
 * features/exam/components/QuestionPanel.tsx
 *
 * The main content area of the exam room.
 * Displays the current question, its options, and the action bar.
 *
 * Reads:
 *   - Current answer from exam-store (via precise selector)
 *   - Language from language-store
 *   - Question data from props (passed by attempt/page.tsx from use-exam-loader)
 *
 * Never fetches data directly — that is use-exam-loader's job.
 */

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { BookmarkIcon, ChevronRightIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionButton } from "./OptionButton";
import { useLangStore, resolveTranslation } from "@/stores/language-store";
import { useExamStore, selectAnswer } from "../stores/exam-store";
import type { ExamQuestion, ExamSection } from "@/types/exam";
import { getFlatQuestionIndex } from "../hooks/use-exam-loader";

// ── Props ─────────────────────────────────────────────────────────────────────

interface QuestionPanelProps {
  question: ExamQuestion;
  sections: ExamSection[];
  currentSectionIdx: number;
  currentQuestionIdx: number;
  /** Called when student clicks Save & Next */
  onNext: () => void;
  /** Whether exam is submitted/expired — disables interaction */
  isReadOnly?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuestionPanel({
  question,
  sections,
  currentSectionIdx,
  currentQuestionIdx,
  onNext,
  isReadOnly = false,
}: QuestionPanelProps) {
  const lang = useLangStore((s) => s.lang);
  const answerEntry = useExamStore(selectAnswer(question.id));
  const setAnswer = useExamStore((s) => s.setAnswer);
  const toggleMark = useExamStore((s) => s.toggleMark);

  // Resolve the correct translation (with EN fallback)
  const translation = resolveTranslation(question.translations, lang);

  // Fallback to question text if no translation available
  const questionText = translation?.content || "Question text not available";

  // Question numbering — "Q.14 of 75"
  const flatIdx = getFlatQuestionIndex(
    sections,
    currentSectionIdx,
    currentQuestionIdx,
  );
  const totalQ = sections.reduce((n, s) => n + s.questions.length, 0);
  const currentSection = sections[currentSectionIdx];

  const selectedOptionId = answerEntry?.optionId ?? null;
  const isMarked = answerEntry?.isMarked ?? false;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (isReadOnly) return;
      // Clicking the already-selected option deselects it
      setAnswer(question.id, selectedOptionId === optionId ? null : optionId);
    },
    [question.id, selectedOptionId, setAnswer, isReadOnly],
  );

  const handleClear = useCallback(() => {
    if (isReadOnly) return;
    setAnswer(question.id, null);
  }, [question.id, setAnswer, isReadOnly]);

  const handleMark = useCallback(() => {
    if (isReadOnly) return;
    toggleMark(question.id);
  }, [question.id, toggleMark, isReadOnly]);

  // Sort options by order field
  const sortedOptions = [...question.options].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full">
      {/* ── Question header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Q.{flatIdx}
            <span className="font-normal text-slate-400"> / {totalQ}</span>
          </span>
          {currentSection && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
              {currentSection.name}
            </span>
          )}
        </div>

        {/* Mark for review toggle */}
        <button
          type="button"
          onClick={handleMark}
          disabled={isReadOnly}
          aria-pressed={isMarked}
          aria-label={isMarked ? "Remove review mark" : "Mark for review"}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            isMarked
              ? "border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:border-purple-500 dark:text-purple-300"
              : "border-slate-300 text-slate-500 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:border-slate-600 dark:text-slate-400",
            isReadOnly && "cursor-not-allowed opacity-60",
          )}
        >
          <BookmarkIcon
            className={cn("h-3.5 w-3.5", isMarked && "fill-current")}
          />
          {isMarked ? "Marked" : "Mark for Review"}
        </button>
      </div>

      {/* ── Question content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Question text */}
        <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
          {questionText}
        </div>

        {/* Question image (if present) */}
        {translation?.imageUrl && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden max-w-lg">
            {/* ExamImage component will replace this img in Sprint 3 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={translation.imageUrl}
              alt="Question diagram"
              className="w-full h-auto object-contain max-h-64"
              loading="lazy"
            />
          </div>
        )}

        {/* ── Options ──────────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          {sortedOptions.map((option) => {
            // Resolve option text to current language
            const optionTranslation = resolveTranslation(
              option.translations,
              lang,
            );
            const optionText =
              optionTranslation?.text ?? `Option ${option.order + 1}`;

            return (
              <OptionButton
                key={option.id}
                order={option.order}
                text={optionText}
                isSelected={selectedOptionId === option.id}
                isDisabled={isReadOnly}
                onSelect={() => handleOptionSelect(option.id)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Action bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {/* Left: Clear response */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isReadOnly || selectedOptionId === null}
          className="gap-1.5 text-slate-600 dark:text-slate-400"
        >
          <RotateCcwIcon className="h-3.5 w-3.5" />
          Clear
        </Button>

        {/* Right: Save & Next */}
        <Button
          type="button"
          size="sm"
          onClick={onNext}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
        >
          Save & Next
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
