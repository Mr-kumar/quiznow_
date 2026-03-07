import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { analyticsKeys } from "@/api/query-keys";
import { adminAnalyticsApi } from "@/api/analytics";
import { unwrap } from "@/lib/unwrap";
import type {
  DashboardMetrics,
  UserStats,
  TestStats,
  AttemptStats,
} from "@/api/analytics";

export function useDashboard() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const results = useQueries({
    queries: [
      {
        queryKey: analyticsKeys.metrics(),
        queryFn: () =>
          adminAnalyticsApi
            .getDashboardMetrics()
            .then(unwrap<DashboardMetrics>),
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: analyticsKeys.users(),
        queryFn: () => adminAnalyticsApi.getUserStats().then(unwrap<UserStats>),
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: analyticsKeys.tests(),
        queryFn: () => adminAnalyticsApi.getTestStats().then(unwrap<TestStats>),
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: analyticsKeys.attempts(),
        queryFn: () =>
          adminAnalyticsApi.getAttemptStats().then(unwrap<AttemptStats>),
        staleTime: 1000 * 60 * 5,
      },
    ],
  });

  const [metricsQ, usersQ, testsQ, attemptsQ] = results;

  // Invalidate all 4 queries at once and track the in-progress state separately
  // so the refresh button can show a spinner without flashing skeleton cards
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: analyticsKeys.metrics() }),
      queryClient.invalidateQueries({ queryKey: analyticsKeys.users() }),
      queryClient.invalidateQueries({ queryKey: analyticsKeys.tests() }),
      queryClient.invalidateQueries({ queryKey: analyticsKeys.attempts() }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  return {
    metrics: (metricsQ.data as DashboardMetrics | undefined) ?? null,
    userStats: (usersQ.data as UserStats | undefined) ?? null,
    testStats: (testsQ.data as TestStats | undefined) ?? null,
    attemptStats: (attemptsQ.data as AttemptStats | undefined) ?? null,

    // Per-card error tracking: one failing endpoint never blocks others
    errors: {
      metrics: metricsQ.isError ? "Failed to load metrics" : undefined,
      users: usersQ.isError ? "Failed to load user stats" : undefined,
      tests: testsQ.isError ? "Failed to load test stats" : undefined,
      attempts: attemptsQ.isError ? "Failed to load attempt stats" : undefined,
    },

    isLoading: results.some((r) => r.isLoading),
    isRefreshing,
    refresh,

    // Convenience flag for admin/page.tsx top-level error banner
    error: results.every((r) => r.isError) ? "Failed to load dashboard" : null,
  };
}
