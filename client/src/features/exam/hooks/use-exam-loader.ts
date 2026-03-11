//(load test + sections + questions)
/**
 * features/exam/hooks/use-exam-loader.ts
 *
 * Fetches the test configuration AND all sections with questions.
 * This is READ-ONLY data — what the test CONTAINS.
 * It never mixes with exam-store (what the student DID).
 *
 * Uses React Query with staleTime: Infinity because:
 *   - Test config (title, duration, marking scheme) never changes mid-exam
 *   - Questions never change mid-exam
 *   - We don't want background refetches interrupting an active exam
 *
 * Uses useQueries to fire both requests in parallel rather than waterfall.
 */

import { useQueries } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ExamTest, ExamSection, ExamQuestion } from "@/types/exam";

// ── Query keys ────────────────────────────────────────────────────────────────
// Scoped under "exam" so invalidation never touches admin test cache

export const examKeys = {
  test: (id: string) => ["exam", "test", id] as const,
  sections: (id: string) => ["exam", "sections", id] as const,
};

// ── API calls ─────────────────────────────────────────────────────────────────
// These are student-facing endpoints (different from admin /tests)

async function fetchExamTest(testId: string): Promise<ExamTest> {
  const res = await api.get<ExamTest>(`/student/tests/${testId}`);
  // Student API returns { success: true, data: ExamTest } structure
  const test = (res.data as { data?: ExamTest }).data ?? (res.data as ExamTest);
  return test;
}

async function fetchExamSections(testId: string): Promise<ExamSection[]> {
  // GET /student/tests/:id/sections returns sections[] with nested questions[]
  // Questions are pre-sorted by SectionQuestion.order on the server
  const res = await api.get<ExamSection[]>(`/student/tests/${testId}/sections`);
  const data =
    (res.data as { data?: ExamSection[] }).data ?? (res.data as ExamSection[]);

  // Sort sections by order (defensive — server should already sort)
  return [...data].sort((a, b) => a.order - b.order);
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface ExamLoaderResult {
  test: ExamTest | null;
  sections: ExamSection[];
  totalQuestions: number;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  // Convenience: flat question lookup map — O(1) by questionId
  questionMap: Map<string, ExamQuestion>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useExamLoader(testId: string | null): ExamLoaderResult {
  const enabled = !!testId;

  const [testQuery, sectionsQuery] = useQueries({
    queries: [
      {
        queryKey: examKeys.test(testId ?? ""),
        queryFn: () => fetchExamTest(testId!),
        enabled,
        staleTime: Infinity, // Never refetch — test config is immutable mid-exam
        gcTime: 1000 * 60 * 120, // Keep in cache for 2 hours
        retry: 2,
      },
      {
        queryKey: examKeys.sections(testId ?? ""),
        queryFn: () => fetchExamSections(testId!),
        enabled,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 120,
        retry: 2,
      },
    ],
  });

  const sections = sectionsQuery.data ?? [];

  // Build question lookup map for O(1) access by questionId
  const questionMap = new Map<string, ExamQuestion>();
  sections.forEach((section) => {
    section.questions.forEach((q) => {
      questionMap.set(q.id, q);
    });
  });

  const totalQuestions = questionMap.size;

  // Aggregate error message
  const error =
    testQuery.isError || sectionsQuery.isError
      ? [
          testQuery.isError ? "Failed to load test configuration." : null,
          sectionsQuery.isError ? "Failed to load questions." : null,
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  return {
    test: testQuery.data ?? null,
    sections,
    totalQuestions,
    isLoading: testQuery.isLoading || sectionsQuery.isLoading,
    isError: testQuery.isError || sectionsQuery.isError,
    error,
    questionMap,
  };
}

// ── Section helpers — used by ExamHeader and navigation logic ─────────────────

/** Get a specific question by section + question index */
export function getQuestion(
  sections: ExamSection[],
  sectionIdx: number,
  questionIdx: number,
): ExamQuestion | null {
  return sections[sectionIdx]?.questions[questionIdx] ?? null;
}

/** Get total question count across all sections */
export function getTotalQuestions(sections: ExamSection[]): number {
  return sections.reduce((sum, s) => sum + s.questions.length, 0);
}

/** Get the flat index of a question (for "Q.14 of 75" display) */
export function getFlatQuestionIndex(
  sections: ExamSection[],
  sectionIdx: number,
  questionIdx: number,
): number {
  const offset = sections
    .slice(0, sectionIdx)
    .reduce((sum, s) => sum + s.questions.length, 0);
  return offset + questionIdx + 1; // 1-indexed
}
