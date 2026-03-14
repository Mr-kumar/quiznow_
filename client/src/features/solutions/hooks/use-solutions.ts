/**
 * features/solutions/hooks/use-solutions.ts
 *
 * Solutions hook for the features/solutions/ feature folder.
 * COMPOSITION LAYER: Uses the base useSolutions hook from features/results
 * and adds client-side filtering logic consumed by SolutionFilter + SolutionQuestion.
 *
 * NOTE: This ensures data-fetching and sorting logic is centralized in
 * features/results/hooks/use-solutions.ts.
 */

import { useState, useMemo } from "react";
import type { ReviewQuestion } from "@/api/attempts";
import { useSolutions } from "@/features/results/hooks/use-solutions";

// ── Filter type ───────────────────────────────────────────────────────────────

export type SolutionFilterType =
  | "all"
  | "correct"
  | "wrong"
  | "unattempted"
  | "marked";

export function filterQuestions(
  questions: ReviewQuestion[],
  filter: SolutionFilterType
): ReviewQuestion[] {
  switch (filter) {
    case "correct":
      return questions.filter((q) => q.isCorrect);
    case "wrong":
      return questions.filter(
        (q) => !q.isCorrect && q.selectedOptionId !== null
      );
    case "unattempted":
      return questions.filter((q) => q.selectedOptionId === null);
    case "marked":
      return questions.filter((q) => q.isMarked);
    default:
      return questions;
  }
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface FilterCounts {
  all: number;
  correct: number;
  wrong: number;
  unattempted: number;
  marked: number;
}

export interface UseSolutionsResult {
  /** All questions (unfiltered) */
  allQuestions: ReviewQuestion[];
  /** Filtered by activeFilter */
  filteredQuestions: ReviewQuestion[];
  /** Active filter */
  activeFilter: SolutionFilterType;
  /** Set filter — resets to page 1 */
  setFilter: (f: SolutionFilterType) => void;
  /** Count per filter tab */
  counts: FilterCounts;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSolutionsFeature(
  attemptId: string | null
): UseSolutionsResult {
  const {
    questions: allQuestions,
    isLoading,
    isError,
    error,
    refetch,
  } = useSolutions(attemptId);

  const [activeFilter, setFilter] = useState<SolutionFilterType>("all");

  const counts: FilterCounts = useMemo(
    () => ({
      all: allQuestions.length,
      correct: allQuestions.filter((q) => q.isCorrect).length,
      wrong: allQuestions.filter(
        (q) => !q.isCorrect && q.selectedOptionId !== null
      ).length,
      unattempted: allQuestions.filter((q) => q.selectedOptionId === null)
        .length,
      marked: allQuestions.filter((q) => q.isMarked).length,
    }),
    [allQuestions]
  );

  const filteredQuestions = useMemo(
    () => filterQuestions(allQuestions, activeFilter),
    [allQuestions, activeFilter]
  );

  return {
    allQuestions,
    filteredQuestions,
    activeFilter,
    setFilter,
    counts,
    isLoading,
    isError,
    error,
    refetch,
  };
}
