"use client";

/**
 * features/solutions/components/SolutionQuestion.tsx
 *
 * Full question card for the solutions/review screen.
 * Shows: question content, student's answer (blue), correct answer (green),
 * marks badge, and an expandable explanation panel.
 *
 * Option colour rules (NTA standard, consistent with SolutionCard):
 *   ✅ Correct option that student selected  → green bg + green border
 *   ❌ Wrong option that student selected    → red bg + red border
 *   ✓  Correct option (student didn't pick) → green border, white bg
 *   —  Wrong unselected option              → default slate
 *
 * This component is React.memo'd so filter tab switches don't re-render
 * cards that are already visible.
 *
 * Can be used as a standalone alternative to SolutionCard, or imported
 * into custom solutions UIs outside the main solutions page.
 */

import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  XCircleIcon,
  MinusCircleIcon,
  BookmarkIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/shared/MathRenderer";
import { ExamImage } from "@/components/shared/ExamImage";
import { ExplanationPanel } from "./ExplanationPanel";
import type { ReviewQuestion } from "@/api/attempts";

// ── Helpers ───────────────────────────────────────────────────────────────────

type QuestionStatus = "correct" | "wrong" | "unattempted";

function getStatus(q: ReviewQuestion): QuestionStatus {
  if (q.selectedOptionId === null) return "unattempted";
  return q.isCorrect ? "correct" : "wrong";
}

function getStatusConfig(status: QuestionStatus) {
  const configs = {
    correct: {
      icon: CheckCircle2Icon,
      label: "Correct",
      iconCls: "text-green-500",
      badgeCls:
        "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
    },
    wrong: {
      icon: XCircleIcon,
      label: "Wrong",
      iconCls: "text-red-500",
      badgeCls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    },
    unattempted: {
      icon: MinusCircleIcon,
      label: "Not Attempted",
      iconCls: "text-slate-400",
      badgeCls:
        "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    },
  };
  return configs[status];
}

function getMarksBadgeClass(marks: number): string {
  if (marks > 0)
    return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-green-200 dark:border-green-800";
  if (marks < 0)
    return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800";
  return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
}

function getOptionClass(
  optionId: string,
  isCorrect: boolean,
  selectedOptionId: string | null,
): string {
  const isSelected = selectedOptionId === optionId;
  if (isCorrect && isSelected)
    return "border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/30";
  if (!isCorrect && isSelected)
    return "border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-950/30";
  if (isCorrect && !isSelected)
    return "border-green-400 bg-white dark:border-green-600 dark:bg-transparent";
  return "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900";
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SolutionQuestionProps {
  question: ReviewQuestion;
  /** 1-based display number for "Q.1", "Q.2" etc. */
  displayNumber: number;
  /** If true, explanation is expanded by default */
  expandedByDefault?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SolutionQuestion = memo(function SolutionQuestion({
  question,
  displayNumber,
  expandedByDefault = false,
}: SolutionQuestionProps) {
  const [explanationOpen, setExplanationOpen] = useState(expandedByDefault);
  const status = getStatus(question);
  const {
    icon: StatusIcon,
    label: statusLabel,
    iconCls,
    badgeCls,
  } = getStatusConfig(status);

  const OPTION_LABELS = ["A", "B", "C", "D", "E"];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* ── Question header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Q.{displayNumber}
          </span>
          <StatusIcon className={cn("h-4 w-4", iconCls)} />
          <Badge
            variant="secondary"
            className={cn("text-[11px] h-5 px-2", badgeCls)}
          >
            {statusLabel}
          </Badge>
          {question.isMarked && (
            <BookmarkIcon className="h-3.5 w-3.5 text-amber-500" />
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Marks badge */}
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums",
              getMarksBadgeClass(question.marksAwarded),
            )}
          >
            {question.marksAwarded > 0 ? "+" : ""}
            {question.marksAwarded}
          </span>
          {/* Topic tag */}
          {question.topicName && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
              <TagIcon className="h-3 w-3" />
              {question.subjectName ? `${question.subjectName} › ` : ""}
              {question.topicName}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ── Question content ─────────────────────────────────────────── */}
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          <MathRenderer content={question.content} />
        </div>

        {question.imageUrl && (
          <ExamImage
            src={question.imageUrl}
            alt={`Question ${displayNumber} image`}
          />
        )}

        {/* ── Options ──────────────────────────────────────────────────── */}
        <div className="space-y-2">
          {question.options
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((option, idx) => {
              const isSelected = question.selectedOptionId === option.optionId;
              const optionCls = getOptionClass(
                option.optionId,
                option.isCorrect,
                question.selectedOptionId,
              );

              return (
                <div
                  key={option.optionId}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border-2 px-3 py-2.5 text-sm transition-colors",
                    optionCls,
                  )}
                >
                  {/* Label */}
                  <span
                    className={cn(
                      "shrink-0 h-5 w-5 rounded-full border text-[11px] font-bold flex items-center justify-center",
                      option.isCorrect && isSelected
                        ? "border-green-500 text-green-600 dark:text-green-400"
                        : !option.isCorrect && isSelected
                          ? "border-red-500 text-red-600 dark:text-red-400"
                          : option.isCorrect
                            ? "border-green-500 text-green-600 dark:text-green-400"
                            : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400",
                    )}
                  >
                    {OPTION_LABELS[idx] ?? String.fromCharCode(65 + idx)}
                  </span>

                  {/* Text */}
                  <span className="flex-1 text-slate-700 dark:text-slate-300">
                    <MathRenderer content={option.text} />
                  </span>

                  {/* Indicators */}
                  <div className="shrink-0 flex items-center gap-1">
                    {option.isCorrect && (
                      <CheckCircle2Icon className="h-3.5 w-3.5 text-green-500" />
                    )}
                    {isSelected && !option.isCorrect && (
                      <XCircleIcon className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* ── Explanation toggle ───────────────────────────────────────── */}
        {question.explanation && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExplanationOpen((v) => !v)}
              className="h-7 gap-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 -ml-1"
            >
              {explanationOpen ? (
                <ChevronUpIcon className="h-3.5 w-3.5" />
              ) : (
                <ChevronDownIcon className="h-3.5 w-3.5" />
              )}
              {explanationOpen ? "Hide" : "Show"} Explanation
            </Button>

            {explanationOpen && (
              <ExplanationPanel
                explanation={question.explanation}
                showHeader={false}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
});
