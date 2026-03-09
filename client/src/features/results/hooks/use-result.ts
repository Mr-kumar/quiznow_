/**
 * features/results/hooks/use-result.ts
 *
 * Fetches the full result for a submitted attempt.
 * staleTime: Infinity — result data is immutable once submitted.
 *
 * Two sources depending on how the student reaches the result page:
 *  A) Immediately after submit → result data may already be passed via
 *     router state (if we stored it). Use cached query data.
 *  B) Direct navigation (bookmarked URL, sharing) → fetch from server.
 *
 * This hook handles both transparently via React Query's cache.
 */

import { useQuery } from "@tanstack/react-query";
import { attemptsApi } from "@/api/attempts";
import { useLangStore } from "@/stores/language-store";
import { attemptKeys } from "@/api/query-keys";
import type { AttemptResult } from "@/api/attempts";

// ── Return type ────────────────────────────────────────────────────────────

export interface UseResultReturn {
  result: AttemptResult | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useResult(attemptId: string | null): UseResultReturn {
  const lang = useLangStore((s) => s.lang);

  const query = useQuery({
    queryKey: attemptKeys.result(attemptId ?? ""),
    queryFn: async () => {
      const res = await attemptsApi.getResult(attemptId!, lang);
      return (
        (res.data as { data?: AttemptResult }).data ??
        (res.data as AttemptResult)
      );
    },
    enabled: !!attemptId,
    staleTime: Infinity, // Result is immutable — never refetch automatically
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    retry: 2,
  });

  const error = query.isError
    ? ((query.error as { message?: string })?.message ??
      "Failed to load result.")
    : null;

  return {
    result: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch: query.refetch,
  };
}
