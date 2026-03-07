import { useCallback, useEffect, useState } from "react";
import {
  adminAnalyticsApi,
  type AttemptStats,
  type DashboardMetrics,
  type TestStats,
  type UserStats,
} from "@/lib/admin-api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardErrors {
  metrics?: string;
  users?: string;
  tests?: string;
  attempts?: string;
}

export interface DashboardState {
  metrics: DashboardMetrics | null;
  userStats: UserStats | null;
  testStats: TestStats | null;
  attemptStats: AttemptStats | null;
}

// ─── Response shape normalizer ─────────────────────────────────────────────────

function unwrap<T>(result: PromiseSettledResult<{ data: any }>): T | null {
  if (result.status === "rejected") return null;
  // Support both { data } and { data: { data } }
  return result.value.data?.data ?? result.value.data ?? null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminDashboard() {
  const [data, setData] = useState<DashboardState>({
    metrics: null,
    userStats: null,
    testStats: null,
    attemptStats: null,
  });
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Core fetch — runs all 4 calls independently via allSettled so a failure
   * in one card never blocks the rest from rendering.
   */
  const fetchAll = useCallback(async () => {
    const [metricsRes, usersRes, testsRes, attemptsRes] =
      await Promise.allSettled([
        adminAnalyticsApi.getDashboardMetrics(),
        adminAnalyticsApi.getUserStats(),
        adminAnalyticsApi.getTestStats(),
        adminAnalyticsApi.getAttemptStats(),
      ]);

    setData({
      metrics: unwrap<DashboardMetrics>(metricsRes),
      userStats: unwrap<UserStats>(usersRes),
      testStats: unwrap<TestStats>(testsRes),
      attemptStats: unwrap<AttemptStats>(attemptsRes),
    });

    setErrors({
      ...(metricsRes.status === "rejected" && {
        metrics: "Failed to load dashboard metrics",
      }),
      ...(usersRes.status === "rejected" && {
        users: "Failed to load user stats",
      }),
      ...(testsRes.status === "rejected" && {
        tests: "Failed to load test stats",
      }),
      ...(attemptsRes.status === "rejected" && {
        attempts: "Failed to load attempt stats",
      }),
    });
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchAll();
      setIsLoading(false);
    })();
  }, [fetchAll]);

  // Manual refresh — separate loading flag so cards don't flash skeletons
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAll();
    setIsRefreshing(false);
  }, [fetchAll]);

  // Convenience: did every single call fail?
  const totalError =
    Object.keys(errors).length === 4 ? "Failed to load dashboard data" : null;

  return {
    ...data,
    // Legacy single-error field consumed by admin/page.tsx
    error: totalError,
    errors,
    isLoading,
    isRefreshing,
    refresh,
  };
}
