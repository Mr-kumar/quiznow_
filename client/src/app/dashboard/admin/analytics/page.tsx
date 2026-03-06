"use client";

import { useState, useEffect, useCallback } from "react";
import {
  adminAnalyticsApi,
  type DashboardMetrics,
  type UserStats,
  type TestStats,
  type AttemptStats,
} from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/admin/progress-bar";
import {
  Users,
  FileText,
  CheckCircle2,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  Trophy,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsState {
  dashboardMetrics: DashboardMetrics | null;
  userStats: UserStats | null;
  testStats: TestStats | null;
  attemptStats: AttemptStats | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GrowthIndicator({ value, label }: { value: number; label: string }) {
  if (value > 0) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <ArrowUpRight className="h-3 w-3 text-green-600 shrink-0" />
        <span className="text-xs font-medium text-green-600">
          +{value}% {label}
        </span>
      </div>
    );
  }
  if (value < 0) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <ArrowDownRight className="h-3 w-3 text-red-500 shrink-0" />
        <span className="text-xs font-medium text-red-500">
          {value}% {label}
        </span>
      </div>
    );
  }
  return (
    <p className="text-xs text-zinc-400 mt-1">No change from last month</p>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="flex flex-row items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    dashboardMetrics: null,
    userStats: null,
    testStats: null,
    attemptStats: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Track which individual cards failed so others still render
  const [errors, setErrors] = useState<
    Partial<Record<keyof AnalyticsState, string>>
  >({});

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadAnalytics = useCallback(async () => {
    setErrors({});

    // Run all 4 calls independently — a failure in one doesn't block the others.
    const [metricsResult, usersResult, testsResult, attemptsResult] =
      await Promise.allSettled([
        adminAnalyticsApi.getDashboardMetrics(),
        adminAnalyticsApi.getUserStats(),
        adminAnalyticsApi.getTestStats(),
        adminAnalyticsApi.getAttemptStats(),
      ]);

    const newErrors: typeof errors = {};

    const metrics =
      metricsResult.status === "fulfilled"
        ? ((metricsResult.value.data as any)?.data ?? metricsResult.value.data)
        : null;
    if (metricsResult.status === "rejected") {
      newErrors.dashboardMetrics = "Failed to load dashboard metrics";
    }

    const users =
      usersResult.status === "fulfilled"
        ? ((usersResult.value.data as any)?.data ?? usersResult.value.data)
        : null;
    if (usersResult.status === "rejected") {
      newErrors.userStats = "Failed to load user stats";
    }

    const tests =
      testsResult.status === "fulfilled"
        ? ((testsResult.value.data as any)?.data ?? testsResult.value.data)
        : null;
    if (testsResult.status === "rejected") {
      newErrors.testStats = "Failed to load test stats";
    }

    const attempts =
      attemptsResult.status === "fulfilled"
        ? ((attemptsResult.value.data as any)?.data ??
          attemptsResult.value.data)
        : null;
    if (attemptsResult.status === "rejected") {
      newErrors.attemptStats = "Failed to load attempt stats";
    }

    setAnalytics({
      dashboardMetrics: metrics,
      userStats: users,
      testStats: tests,
      attemptStats: attempts,
    });
    setErrors(newErrors);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadAnalytics();
      setLoading(false);
    };
    init();
  }, [loadAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const { dashboardMetrics, userStats, testStats, attemptStats } = analytics;

  const completionRate =
    attemptStats && attemptStats.total > 0
      ? Math.round((attemptStats.completed / attemptStats.total) * 100)
      : 0;

  const engagementRate =
    userStats && userStats.total > 0
      ? Math.round((userStats.activeThisMonth / userStats.total) * 100)
      : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Comprehensive insights into platform performance and user activity
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          variant="outline"
          className="shrink-0 gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* ── Key metrics row ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))
        ) : errors.dashboardMetrics ? (
          <div className="col-span-4">
            <ErrorCard
              message={errors.dashboardMetrics}
              onRetry={handleRefresh}
            />
          </div>
        ) : dashboardMetrics ? (
          <>
            {/* Total Users */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Total Users
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {dashboardMetrics.totalUsers.toLocaleString()}
                </div>
                <GrowthIndicator
                  value={dashboardMetrics.userGrowth}
                  label="from last month"
                />
              </CardContent>
            </Card>

            {/* Active Tests */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Active Tests
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {dashboardMetrics.activeTests}
                </div>
                <GrowthIndicator
                  value={dashboardMetrics.testGrowth}
                  label="from last month"
                />
              </CardContent>
            </Card>

            {/* Completed Attempts */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Completed Attempts
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {dashboardMetrics.completedAttempts.toLocaleString()}
                </div>
                <GrowthIndicator
                  value={dashboardMetrics.attemptGrowth}
                  label="from last month"
                />
              </CardContent>
            </Card>

            {/* Avg Performance */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  Avg Performance
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {dashboardMetrics.avgPerformance}%
                </div>
                <GrowthIndicator
                  value={dashboardMetrics.performanceGrowth}
                  label="improvement"
                />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* ── Detailed stats row ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Statistics */}
        {loading ? (
          <StatCardSkeleton />
        ) : errors.userStats ? (
          <ErrorCard message={errors.userStats} onRetry={handleRefresh} />
        ) : userStats ? (
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>User Statistics</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Distribution and activity
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatBox
                  value={userStats.total.toLocaleString()}
                  label="Total Users"
                  color="blue"
                />
                <StatBox
                  value={String(userStats.newThisMonth)}
                  label="New This Month"
                  color="green"
                />
              </div>
              <div className="space-y-2">
                <StatRow
                  label="Students"
                  value={userStats.students}
                  badgeColor="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatRow
                  label="Instructors"
                  value={userStats.instructors}
                  badgeColor="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                />
                <StatRow
                  label="Admins"
                  value={userStats.admins}
                  badgeColor="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                />
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Active This Month
                </span>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-green-500" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {userStats.activeThisMonth}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Test Statistics */}
        {loading ? (
          <StatCardSkeleton />
        ) : errors.testStats ? (
          <ErrorCard message={errors.testStats} onRetry={handleRefresh} />
        ) : testStats ? (
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Test Statistics</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Creation and performance
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatBox
                  value={String(testStats.total)}
                  label="Total Tests"
                  color="green"
                />
                <StatBox
                  value={String(testStats.active)}
                  label="Active"
                  color="blue"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Live Tests
                  </span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {testStats.live}
                  </Badge>
                </div>
                <StatRow
                  label="Premium Tests"
                  value={testStats.premium}
                  badgeColor="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                />
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Created This Month
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {testStats.createdThisMonth}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Completed This Month
                  </span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {testStats.completedThisMonth}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Attempt Statistics */}
        {loading ? (
          <StatCardSkeleton />
        ) : errors.attemptStats ? (
          <ErrorCard message={errors.attemptStats} onRetry={handleRefresh} />
        ) : attemptStats ? (
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Attempt Statistics</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Attempts and performance
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatBox
                  value={attemptStats.total.toLocaleString()}
                  label="Total Attempts"
                  color="purple"
                />
                <StatBox
                  value={String(attemptStats.completed)}
                  label="Completed"
                  color="green"
                />
              </div>
              <div className="space-y-2">
                <StatRow
                  label="In Progress"
                  value={attemptStats.started}
                  badgeColor="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatRow
                  label="Expired"
                  value={attemptStats.expired}
                  badgeColor="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                />
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Average Score
                  </span>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                      {attemptStats.avgScore}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Avg Duration
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {Math.round(attemptStats.avgDuration / 60)} min
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* ── Performance overview ─────────────────────────────────────────────── */}
      {!loading && (userStats || attemptStats || dashboardMetrics) && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Overview
            </CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Key performance indicators
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <ProgressBar
                percentage={completionRate}
                color="green"
                label="Attempt Completion Rate"
                value={`${completionRate}%`}
              />
              <ProgressBar
                percentage={engagementRate}
                color="blue"
                label="Monthly User Engagement"
                value={`${engagementRate}%`}
              />
              <ProgressBar
                percentage={attemptStats?.avgScore ?? 0}
                color="purple"
                label="Average Score"
                value={`${attemptStats?.avgScore ?? 0}%`}
              />
              <ProgressBar
                percentage={dashboardMetrics?.avgPerformance ?? 0}
                color="orange"
                label="Overall Performance"
                value={`${dashboardMetrics?.avgPerformance ?? 0}%`}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

function StatBox({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const styles = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs text-green-600 dark:text-green-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs text-orange-600 dark:text-orange-400",
  };
  const [bg, textBig, , textSmall] = styles[color].split(" ");
  return (
    <div className={`text-center p-3 rounded-lg ${bg}`}>
      <div className={`text-2xl font-bold ${textBig}`}>{value}</div>
      <div className={`text-xs mt-0.5 ${textSmall}`}>{label}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  badgeColor,
}: {
  label: string;
  value: number;
  badgeColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <Badge className={badgeColor}>{value}</Badge>
    </div>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3 w-3 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
