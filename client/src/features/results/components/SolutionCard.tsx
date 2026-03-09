"use client";

/**
 * features/results/components/SolutionCard.tsx
 *
 * A single question card on the solutions/review screen.
 * Shows the student's answer vs the correct answer with full colour coding,
 * the explanation (collapsible), and the topic tag.
 *
 * Option colour rules (NTA standard):
 *   ✅ Correct option student selected → green border + green bg
 *   ❌ Wrong option student selected  → red border + red bg
 *   ✓  Correct option (unselected)    → green border, white bg (shows right answer)
 *   —  Wrong unselected option        → default slate
 *
 * Marks display:
 *   +4  correct, shown in green
 *   -1  wrong,   shown in red
 *    0  unattempted, shown in slate
 *
 * Explanation: hidden by default, revealed via Accordion to keep the page
 * scannable. Students can expand only what they need.
 */

import React, { memo } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  XCircleIcon,
  MinusCircleIcon,
  BookmarkIcon,
  TagIcon,
  ChevronDownIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { ExamImage } from "@/components/shared/ExamImage";
import type { ReviewQuestion } from "@/api/attempts";

// ── Option labels ─────────────────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;

// ── Option item ───────────────────────────────────────────────────────────────

function ReviewOptionItem({
  order,
  text,
  isCorrect,
  isSelected,
}: {
  order: number;
  text: string;
  isCorrect: boolean;
  isSelected: boolean;
}) {
  const label = OPTION_LABELS[order] ?? String(order + 1);

  // Determine visual state
  const isCorrectAndSelected = isCorrect && isSelected;
  const isWrongAndSelected = !isCorrect && isSelected;
  const isCorrectButNotSelected = isCorrect && !isSelected;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-none",
        isCorrectAndSelected &&
          "border-green-500 bg-green-50 dark:bg-green-950/40 dark:border-green-600",
        isWrongAndSelected &&
          "border-red-400   bg-red-50   dark:bg-red-950/40   dark:border-red-500",
        isCorrectButNotSelected &&
          "border-green-400 bg-white   dark:bg-slate-900    dark:border-green-700",
        !isCorrect &&
          !isSelected &&
          "border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700",
      )}
    >
      {/* Label badge */}
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5",
          isCorrectAndSelected && "bg-green-500 text-white",
          isWrongAndSelected && "bg-red-400   text-white",
          isCorrectButNotSelected &&
            "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
          !isCorrect &&
            !isSelected &&
            "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
        )}
        aria-hidden="true"
      >
        {label}
      </span>

      {/* Text */}
      <span
        className={cn(
          "flex-1 leading-relaxed",
          isCorrectAndSelected &&
            "font-medium text-green-800 dark:text-green-200",
          isWrongAndSelected && "font-medium text-red-700   dark:text-red-300",
          isCorrectButNotSelected && "text-green-700 dark:text-green-400",
          !isCorrect && !isSelected && "text-slate-600 dark:text-slate-400",
        )}
      >
        {text}
      </span>

      {/* Right icon */}
      <span className="shrink-0 mt-0.5">
        {isCorrectAndSelected && (
          <CheckCircle2Icon className="h-4 w-4 text-green-500" />
        )}
        {isWrongAndSelected && <XCircleIcon className="h-4 w-4 text-red-400" />}
        {isCorrectButNotSelected && (
          <CheckCircle2Icon className="h-4 w-4 text-green-400" />
        )}
      </span>
    </div>
  );
}

// ── Marks badge ───────────────────────────────────────────────────────────────

function MarksBadge({
  marksAwarded,
  wasAttempted,
}: {
  marksAwarded: number;
  wasAttempted: boolean;
}) {
  if (!wasAttempted) {
    return (
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
        <MinusCircleIcon className="h-3.5 w-3.5" />
        Not Attempted · 0 marks
      </div>
    );
  }

  if (marksAwarded > 0) {
    return (
      <div className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
        <CheckCircle2Icon className="h-3.5 w-3.5" />
        Correct · +{marksAwarded} marks
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs font-bold text-red-500 dark:text-red-400">
      <XCircleIcon className="h-3.5 w-3.5" />
      Wrong · {marksAwarded} marks
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SolutionCardProps {
  question: ReviewQuestion;
  /** 1-indexed display number (e.g. "Q.14") */
  displayNumber: number;
  className?: string;
}

function SolutionCardInner({
  question,
  displayNumber,
  className,
}: SolutionCardProps) {
  const {
    content,
    imageUrl,
    options,
    selectedOptionId,
    isCorrect,
    isMarked,
    marksAwarded,
    explanation,
    topicName,
    subjectName,
  } = question;

  const wasAttempted = selectedOptionId !== null;
  const sortedOptions = [...options].sort((a, b) => a.order - b.order);

  // Header bg based on outcome
  const headerBg = !wasAttempted
    ? "bg-slate-100 dark:bg-slate-800"
    : isCorrect
      ? "bg-green-50 dark:bg-green-950/40"
      : "bg-red-50 dark:bg-red-950/30";

  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden",
        className,
      )}
      aria-label={`Question ${displayNumber}`}
    >
      {/* ── Question header bar ───────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3",
          headerBg,
        )}
      >
        {/* Left: Q number + marks */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Q.{displayNumber}
          </span>
          <MarksBadge marksAwarded={marksAwarded} wasAttempted={wasAttempted} />
        </div>

        {/* Right: flags */}
        <div className="flex items-center gap-2">
          {isMarked && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400">
              <BookmarkIcon className="h-3 w-3 fill-current" />
              Marked
            </span>
          )}
          {/* Topic tag */}
          {(topicName || subjectName) && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <TagIcon className="h-3 w-3" />
              {subjectName && <span>{subjectName}</span>}
              {topicName && subjectName && <span>·</span>}
              {topicName && <span>{topicName}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ── Question content ────────────────────────────────────────── */}
        <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
          <MarkdownRenderer content={content} mode="question" withMath />
        </div>

        {/* Question image */}
        {imageUrl && (
          <ExamImage
            src={imageUrl}
            alt={`Diagram for question ${displayNumber}`}
            className="max-w-md"
          />
        )}

        {/* ── Options ─────────────────────────────────────────────────── */}
        <div className="space-y-2">
          {sortedOptions.map((option) => (
            <ReviewOptionItem
              key={option.optionId}
              order={option.order}
              text={option.text}
              isCorrect={option.isCorrect}
              isSelected={option.optionId === selectedOptionId}
            />
          ))}
        </div>

        {/* ── Explanation (collapsible) ─────────────────────────────── */}
        {explanation && (
          <Accordion type="single" collapsible>
            <AccordionItem
              value="explanation"
              className="border-t border-slate-100 dark:border-slate-800"
            >
              <AccordionTrigger className="py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                    E
                  </span>
                  View Explanation
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <MarkdownRenderer
                    content={explanation}
                    mode="explanation"
                    withMath
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* No explanation fallback */}
        {!explanation && (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic pt-1">
            No explanation available for this question.
          </p>
        )}
      </div>
    </article>
  );
}

// Memo: solutions page renders 75–150 cards. Without memo, switching filter
// tabs would re-render all of them. With memo, only newly visible cards mount.
export const SolutionCard = memo(SolutionCardInner);
SolutionCard.displayName = "SolutionCard";
