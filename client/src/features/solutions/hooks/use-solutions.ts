/**
 * features/solutions/hooks/use-solutions.ts
 *
 * Solutions hook for the features/solutions/ feature folder.
 * Thin wrapper around attemptsApi.getReview() with client-side
 * filtering helpers consumed by SolutionFilter + SolutionQuestion.
 *
 * NOTE: This is the hook for the features/solutions/ components.
 * The features/results/hooks/use-solutions.ts is used by the main
 * solutions page (app/(student)/test/[testId]/solutions/page.tsx).
 * Both fetch the same API endpoint but expose different interfaces.
 */

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { attemptsApi } from "@/api/attempts";
import { useLangStore } from "@/stores/language-store";
import { attemptKeys } from "@/api/query-keys";
import type { ReviewQuestion } from "@/api/attempts";

// ── Filter type ───────────────────────────────────────────────────────────────

export type SolutionFilterType =
  | "all"
  | "correct"
  | "wrong"
  | "unattempted"
  | "marked";

export function filterQuestions(
  questions: ReviewQuestion[],
  filter: SolutionFilterType,
): ReviewQuestion[] {
  switch (filter) {
    case "correct":
      return questions.filter((q) => q.isCorrect);
    case "wrong":
      return questions.filter(
        (q) => !q.isCorrect && q.selectedOptionId !== null,
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
  attemptId: string | null,
): UseSolutionsResult {
  const lang = useLangStore((s) => s.lang);
  const [activeFilter, setFilter] = useState<SolutionFilterType>("all");

  const query = useQuery({
    queryKey: attemptKeys.review(attemptId ?? "", lang),
    queryFn: async (): Promise<ReviewQuestion[]> => {
      const res = await attemptsApi.getReview(attemptId!, lang);
      const raw =
        (res.data as { data?: ReviewQuestion[] }).data ??
        (res.data as ReviewQuestion[]);
      return [...raw].sort((a, b) =>
        a.sectionId === b.sectionId
          ? a.order - b.order
          : a.sectionId.localeCompare(b.sectionId),
      );
    },
    enabled: !!attemptId,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    retry: 2,
  });

  const allQuestions: ReviewQuestion[] = query.data ?? [];

  const counts: FilterCounts = useMemo(
    () => ({
      all: allQuestions.length,
      correct: allQuestions.filter((q) => q.isCorrect).length,
      wrong: allQuestions.filter(
        (q) => !q.isCorrect && q.selectedOptionId !== null,
      ).length,
      unattempted: allQuestions.filter((q) => q.selectedOptionId === null)
        .length,
      marked: allQuestions.filter((q) => q.isMarked).length,
    }),
    [allQuestions],
  );

  const filteredQuestions = useMemo(
    () => filterQuestions(allQuestions, activeFilter),
    [allQuestions, activeFilter],
  );

  const error = query.isError
    ? ((query.error as { message?: string })?.message ??
      "Failed to load solutions.")
    : null;

  return {
    allQuestions,
    filteredQuestions,
    activeFilter,
    setFilter,
    counts,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch: query.refetch,
  };
}
