import { useEffect, useState } from "react";
import {
  adminAnalyticsApi,
  DashboardMetrics,
  UserStats,
  TestStats,
  AttemptStats,
} from "@/lib/admin-api";
import { toast } from "@/components/ui/use-toast";

export function useAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [testStats, setTestStats] = useState<TestStats | null>(null);
  const [attemptStats, setAttemptStats] = useState<AttemptStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [
          metricsResponse,
          usersResponse,
          testsResponse,
          attemptsResponse,
        ] = await Promise.all([
          adminAnalyticsApi.getDashboardMetrics(),
          adminAnalyticsApi.getUserStats(),
          adminAnalyticsApi.getTestStats(),
          adminAnalyticsApi.getAttemptStats(),
        ]);

        setMetrics(metricsResponse.data.data);
        setUserStats(usersResponse.data.data);
        setTestStats(testsResponse.data.data);
        setAttemptStats(attemptsResponse.data.data);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard data loading error:", err);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const refresh = async () => {
    const loadData = async () => {
      try {
        setError(null);

        const [
          metricsResponse,
          usersResponse,
          testsResponse,
          attemptsResponse,
        ] = await Promise.all([
          adminAnalyticsApi.getDashboardMetrics(),
          adminAnalyticsApi.getUserStats(),
          adminAnalyticsApi.getTestStats(),
          adminAnalyticsApi.getAttemptStats(),
        ]);

        setMetrics(metricsResponse.data.data);
        setUserStats(usersResponse.data.data);
        setTestStats(testsResponse.data.data);
        setAttemptStats(attemptsResponse.data.data);
      } catch (err) {
        setError("Failed to refresh dashboard data");
        console.error("Dashboard refresh error:", err);
      }
    };

    await loadData();
  };

  return {
    metrics,
    userStats,
    testStats,
    attemptStats,
    isLoading,
    error,
    refresh,
  };
}
