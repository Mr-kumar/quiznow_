//Q-by-Q review with correct answers
"use client";

/**
 * app/(student)/test/[testId]/solutions/page.tsx
 *
 * Solutions & Review Page — Q-by-Q review of the entire exam.
 *
 * URL: /test/[testId]/solutions?attemptId=xxx
 *
 * Features:
 *  - Filter bar: All / Correct / Wrong / Unattempted / Marked
 *  - Filter counts in each tab so students can see at a glance
 *  - Language toggle — switches question language via useLangStore
 *  - Section headers between question groups
 *  - Jump-to-section navigation (sticky filter bar)
 *  - Each question rendered as a SolutionCard (expandable explanation)
 *  - Sticky "Back to Result" button in header
 *
 * Performance:
 *  - SolutionCard is React.memo'd — switching filter tabs only mounts
 *    newly visible cards, doesn't re-render the already-visible ones
 *  - useSolutions groups questions on the client with useMemo
 *  - Language switch causes a new query fetch (different query key)
 *    while the previous language data remains cached
 */

import { useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  XCircleIcon,
  MinusCircleIcon,
  BookmarkIcon,
  ListIcon,
  Loader2Icon,
  AlertCircleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SolutionCard } from "@/features/results/components/SolutionCard";
import { useSolutions } from "@/features/results/hooks/use-solutions";
import { LanguageToggle } from "@/features/exam/components/LanguageToggle";
import { cn } from "@/lib/utils";
import type { ReviewQuestion } from "@/api/attempts";

// ── Filter types ─────────────────────────────────────────────────────────────

type FilterType = "all" | "correct" | "wrong" | "unattempted" | "marked";

interface FilterConfig {
  key: FilterType;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeClass: string;
}

const FILTERS: FilterConfig[] = [
  {
    key: "all",
    label: "All",
    icon: ListIcon,
    activeClass:
      "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900",
  },
  {
    key: "correct",
    label: "Correct",
    icon: CheckCircle2Icon,
    activeClass: "bg-green-600 text-white",
  },
  {
    key: "wrong",
    label: "Wrong",
    icon: XCircleIcon,
    activeClass: "bg-red-500 text-white",
  },
  {
    key: "unattempted",
    label: "Unattempted",
    icon: MinusCircleIcon,
    activeClass: "bg-slate-500 text-white",
  },
  {
    key: "marked",
    label: "Marked",
    icon: BookmarkIcon,
    activeClass: "bg-purple-600 text-white",
  },
];

// ── Filter function ───────────────────────────────────────────────────────────

function applyFilter(
  questions: ReviewQuestion[],
  filter: FilterType,
): ReviewQuestion[] {
  switch (filter) {
    case "correct":
      return questions.filter((q) => q.isCorrect);
    case "wrong":
      return questions.filter(
        (q) => q.selectedOptionId !== null && !q.isCorrect,
      );
    case "unattempted":
      return questions.filter((q) => q.selectedOptionId === null);
    case "marked":
      return questions.filter((q) => q.isMarked);
    default:
      return questions;
  }
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function SolutionsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      {/* Filter bar skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
        ))}
      </div>
      {/* Cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden space-y-0"
        >
          <Skeleton className="h-10 w-full rounded-none" />
          <div className="p-4 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Error screen ──────────────────────────────────────────────────────────────

function SolutionsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
          <AlertCircleIcon className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="gap-1.5"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" /> Try Again
        </Button>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyFilter({ filter }: { filter: FilterType }) {
  const messages: Record<FilterType, string> = {
    all: "No questions found.",
    correct:
      "No correct answers — don't worry, review the solutions and try again!",
    wrong: "No wrong answers — great work!",
    unattempted: "You attempted every question!",
    marked: "You didn't mark any questions for review.",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <CheckCircle2Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        {messages[filter]}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SolutionsPage() {
  const params = useParams<{ testId: string }>();
  const searchParams = useSearchParams();
  const testId = params.testId;
  const attemptId = searchParams.get("attemptId");

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { questions, sections, isLoading, isError, error, refetch } =
    useSolutions(attemptId);

  // ── Computed filter counts ─────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      all: questions.length,
      correct: questions.filter((q) => q.isCorrect).length,
      wrong: questions.filter(
        (q) => q.selectedOptionId !== null && !q.isCorrect,
      ).length,
      unattempted: questions.filter((q) => q.selectedOptionId === null).length,
      marked: questions.filter((q) => q.isMarked).length,
    }),
    [questions],
  );

  // ── Filtered + grouped questions ──────────────────────────────────────────
  // When a filter is active, show filtered flat list without section headers.
  // When "all" is selected, show grouped by section with section headers.
  const filteredQuestions = useMemo(
    () => applyFilter(questions, activeFilter),
    [questions, activeFilter],
  );

  // Build a flat → display-number map from original full list
  const displayNumbers = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((q, idx) => map.set(q.questionId, idx + 1));
    return map;
  }, [questions]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return <SolutionsSkeleton />;

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <SolutionsError
        message={error ?? "Failed to load solutions."}
        onRetry={refetch}
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const resultUrl = `/test/${testId}/result?attemptId=${attemptId}`;
  const showGrouped = activeFilter === "all";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Sticky top nav ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          {/* Top row: back + title + language toggle */}
          <div className="flex items-center justify-between h-12 gap-3">
            <Link href={resultUrl}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-slate-600 dark:text-slate-400 pl-0 hover:pl-0"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Result</span>
                <span className="sm:hidden">Result</span>
              </Button>
            </Link>

            <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              Solutions &amp; Review
            </h1>

            <LanguageToggle compact />
          </div>

          {/* Filter bar */}
          <div
            role="tablist"
            aria-label="Filter questions"
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-2.5"
          >
            {FILTERS.map(({ key, label, icon: Icon, activeClass }) => {
              const isActive = activeFilter === key;
              const count = counts[key];

              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(key)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                    "shrink-0",
                    isActive
                      ? activeClass
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                      isActive
                        ? "bg-white/25"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-5 pb-16">
        {filteredQuestions.length === 0 ? (
          <EmptyFilter filter={activeFilter} />
        ) : showGrouped ? (
          // ── Grouped by section (All filter) ─────────────────────────────
          <div className="space-y-8">
            {sections.map((section) => {
              const sectionFiltered = section.questions; // "all" = no filter
              if (sectionFiltered.length === 0) return null;

              return (
                <div key={section.sectionId}>
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {section.sectionName}
                      </h2>
                      <Badge variant="outline" className="text-[11px]">
                        {sectionFiltered.length} Qs
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {section.correctCount}/{section.questions.length} correct
                    </span>
                  </div>

                  {/* Question cards */}
                  <div className="space-y-4">
                    {sectionFiltered.map((q) => (
                      <SolutionCard
                        key={q.questionId}
                        question={q}
                        displayNumber={displayNumbers.get(q.questionId) ?? 0}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // ── Flat filtered list (Correct / Wrong / etc.) ──────────────────
          <div className="space-y-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Showing {filteredQuestions.length} question
              {filteredQuestions.length !== 1 ? "s" : ""}
            </p>
            {filteredQuestions.map((q) => (
              <SolutionCard
                key={q.questionId}
                question={q}
                displayNumber={displayNumbers.get(q.questionId) ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
