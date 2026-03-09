/**
 * features/results/hooks/use-solutions.ts
 *
 * Fetches the full question-by-question review for a submitted attempt.
 * Returns every question with the correct answer revealed, the student's
 * selected answer, and the explanation — everything the solutions page needs.
 *
 * Data shape from server (GET /attempts/:id/review):
 *   ReviewQuestion[] — flat array, ordered by section + question order.
 *
 * We group them by section here on the client so the solutions page can
 * render a section header before each group without extra logic.
 *
 * staleTime: Infinity — review data is immutable once submitted.
 * lang param: when the student switches language, we refetch with the new
 *   lang so the question content updates. The query key includes lang.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { attemptsApi } from "@/api/attempts";
import { useLangStore } from "@/stores/language-store";
import { attemptKeys } from "@/api/query-keys";
import type { ReviewQuestion } from "@/api/attempts";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SolutionSection {
  sectionId: string;
  sectionName: string;
  questions: ReviewQuestion[];
  /** Correct count for this section */
  correctCount: number;
  /** Total attempted in this section */
  attemptedCount: number;
}

export interface UseSolutionsReturn {
  /** All questions flat — for "filter all" views */
  questions: ReviewQuestion[];
  /** Questions grouped by section — for section-header rendering */
  sections: SolutionSection[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSolutions(attemptId: string | null): UseSolutionsReturn {
  const lang = useLangStore((s) => s.lang);

  const query = useQuery({
    queryKey: attemptKeys.review(attemptId ?? "", lang),
    queryFn: async (): Promise<ReviewQuestion[]> => {
      const res = await attemptsApi.getReview(attemptId!, lang);
      const data =
        (res.data as { data?: ReviewQuestion[] }).data ??
        (res.data as ReviewQuestion[]);
      // Sort by order within each section (defensive — server should pre-sort)
      return [...data].sort((a, b) =>
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

  const questions: ReviewQuestion[] = query.data ?? [];

  // Group questions by section — stable memo, only recomputes when questions change
  const sections: SolutionSection[] = useMemo(() => {
    if (questions.length === 0) return [];

    const map = new Map<string, SolutionSection>();

    questions.forEach((q) => {
      if (!map.has(q.sectionId)) {
        map.set(q.sectionId, {
          sectionId: q.sectionId,
          sectionName: q.sectionName,
          questions: [],
          correctCount: 0,
          attemptedCount: 0,
        });
      }

      const section = map.get(q.sectionId)!;
      section.questions.push(q);
      if (q.selectedOptionId !== null) section.attemptedCount++;
      if (q.isCorrect) section.correctCount++;
    });

    return Array.from(map.values());
  }, [questions]);

  const error = query.isError
    ? ((query.error as { message?: string })?.message ??
      "Failed to load solutions.")
    : null;

  return {
    questions,
    sections,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch: query.refetch,
  };
}
