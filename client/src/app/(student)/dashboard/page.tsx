"use client";

/**
 * app/(student)/dashboard/page.tsx
 *
 * Student Dashboard — the home screen after login.
 *
 * Sections (in order):
 *  1. Welcome banner — personalised greeting, today's date
 *  2. Quick stats   — total attempts, avg accuracy, best rank, streak
 *  3. Available Tests — cards for tests accessible under current subscription
 *     CTA: [Start Test] / [View Result] depending on attempt history
 *  4. Recent Attempts — last 5 submissions with score + date + actions
 *  5. Weak Areas     — TopicAnalysis in bar mode, top 5 weak topics
 *
 * All data fetched via React Query (client-side).
 * Skeleton shown during loading. Error banner on failure.
 */

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  ClockIcon,
  TrophyIcon,
  TargetIcon,
  CalendarIcon,
  PlayIcon,
  BookOpenIcon,
  BarChart3Icon,
  ArrowRightIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  SparkleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TopicAnalysis } from "@/features/results/components/TopicAnalysis";
import { attemptsApi } from "@/api/attempts";
import { leaderboardApi } from "@/api/leaderboard";
import { attemptKeys, studentKeys } from "@/api/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { unwrap } from "@/lib/unwrap";
import { cn } from "@/lib/utils";
import type { AttemptSummary } from "@/api/attempts";
import type { UserTopicStat } from "@/api/leaderboard";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatScore(score: number, total: number) {
  return `${score}/${total}`;
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "SUBMITTED") return "default";
  if (status === "STARTED") return "secondary";
  return "destructive";
}

function getStatusColor(status: string) {
  if (status === "SUBMITTED") return "text-green-600 dark:text-green-400";
  if (status === "STARTED") return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  color: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                color,
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
                {value}
              </p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-500",
                trend === "neutral" && "text-muted-foreground",
              )}
            >
              <TrendingUpIcon className="h-3 w-3" />
              {trend === "up" ? "+12%" : trend === "down" ? "-5%" : "0%"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Attempt row ───────────────────────────────────────────────────────────────

function AttemptRow({ attempt }: { attempt: AttemptSummary }) {
  const isSubmitted = attempt.status === "SUBMITTED";
  const accuracy =
    attempt.accuracy !== null ? `${Math.round(attempt.accuracy)}%` : "—";

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Status icon */}
          <div className="shrink-0">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                isSubmitted ? "bg-green-100" : "bg-amber-100",
              )}
            >
              {isSubmitted ? (
                <CheckCircle2Icon className="h-4 w-4 text-green-600" />
              ) : (
                <XCircleIcon className="h-4 w-4 text-amber-600" />
              )}
            </div>
          </div>

          {/* Test info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate mb-1">
              {attempt.testTitle}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {formatDistanceToNow(new Date(attempt.startTime), {
                  addSuffix: true,
                })}
              </div>
              <Separator orientation="vertical" className="h-3" />
              <span
                className={cn("font-medium", getStatusColor(attempt.status))}
              >
                {accuracy} accuracy
              </span>
            </div>
          </div>

          {/* Score */}
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-foreground tabular-nums">
              {formatScore(attempt.score, attempt.totalMarks)}
            </p>
            <Badge
              variant={getStatusVariant(attempt.status)}
              className="text-xs mt-1"
            >
              {attempt.status}
            </Badge>
          </div>

          {/* Actions */}
          {isSubmitted && (
            <div className="shrink-0 hidden sm:flex gap-1">
              <Link
                href={`/test/${attempt.testId}/result?attemptId=${attempt.attemptId}`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs gap-1"
                >
                  <BarChart3Icon className="h-3 w-3" />
                  Result
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Recent */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
      {/* Topics */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  // Recent attempts (last 10, we'll show 5)
  const attemptsQuery = useQuery({
    queryKey: attemptKeys.history({ page: 1, limit: 10 }),
    queryFn: () => attemptsApi.getMyHistory(1, 10).then((res) => res.data),
    staleTime: 1000 * 60 * 2, // 2 min
  });

  // Topic stats
  const topicsQuery = useQuery({
    queryKey: studentKeys.topicStats(),
    queryFn: () =>
      leaderboardApi.getMyTopicStats().then(unwrap<UserTopicStat[]>),
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = attemptsQuery.isLoading || topicsQuery.isLoading;
  const isError = attemptsQuery.isError || topicsQuery.isError;

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircleIcon className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">Unable to load dashboard</CardTitle>
            <CardDescription>
              We couldn't fetch your dashboard data. Please try again.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              attemptsQuery.refetch();
              topicsQuery.refetch();
            }}
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  // Derive stats from recent attempts
  const attempts = attemptsQuery.data?.data ?? [];
  const topics = topicsQuery.data ?? [];
  const totalAttempts = attemptsQuery.data?.total ?? 0;
  const submitted = attempts.filter((a) => a.status === "SUBMITTED");

  const avgAccuracy =
    submitted.length > 0
      ? submitted.reduce((sum, a) => sum + (a.accuracy ?? 0), 0) /
        submitted.length
      : null;

  const recentFive = attempts.slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <SparkleIcon className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-xs">
                  Welcome back
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                {greeting()}, {user?.name?.split(" ")[0] ?? "Student"} 👋
              </h1>
              <p className="text-muted-foreground text-lg">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
              <div className="flex items-center gap-4 pt-2">
                <Link href="/dashboard/tests">
                  <Button className="gap-2">
                    <PlayIcon className="h-4 w-4" />
                    Start New Test
                  </Button>
                </Link>
                <Link href="/test/history">
                  <Button variant="outline" className="gap-2">
                    <BookOpenIcon className="h-4 w-4" />
                    View History
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TrophyIcon className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Stats ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpenIcon}
            label="Total Tests"
            value={String(totalAttempts)}
            sub="all time"
            trend={totalAttempts > 0 ? "up" : "neutral"}
            color="bg-blue-500"
          />
          <StatCard
            icon={TargetIcon}
            label="Avg Accuracy"
            value={avgAccuracy !== null ? `${Math.round(avgAccuracy)}%` : "—"}
            sub="submitted"
            trend={
              avgAccuracy && avgAccuracy > 70
                ? "up"
                : avgAccuracy && avgAccuracy < 50
                  ? "down"
                  : "neutral"
            }
            color="bg-green-500"
          />
          <StatCard
            icon={TrophyIcon}
            label="Tests Passed"
            value={String(submitted.length)}
            sub={`of ${totalAttempts}`}
            trend={submitted.length > 0 ? "up" : "neutral"}
            color="bg-amber-500"
          />
          <StatCard
            icon={ClockIcon}
            label="This Month"
            value={String(
              attempts.filter((a) => {
                const d = new Date(a.startTime);
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              }).length,
            )}
            sub="attempts"
            trend="up"
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* ── Recent Attempts ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Recent Attempts</CardTitle>
          <Link href="/test/history">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRightIcon className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentFive.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpenIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No tests attempted yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Start your first test to see your recent attempts and
                performance data here.
              </p>
              <Link href="/dashboard/tests">
                <Button className="gap-2">
                  <PlayIcon className="h-4 w-4" />
                  Browse Tests
                </Button>
              </Link>
            </div>
          ) : (
            recentFive.map((attempt, index) => (
              <AttemptRow
                key={`${attempt.attemptId}-${index}`}
                attempt={attempt}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Weak Areas Analysis ────────────────────────────────────────────── */}
      {topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TargetIcon className="h-5 w-5" />
              Performance Analysis
            </CardTitle>
            <CardDescription>
              Your top weak areas based on recent test performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopicAnalysis
              topics={topics}
              mode="bar"
              limit={5}
              title="Top 5 Weak Areas"
            />
          </CardContent>
        </Card>
      )}

      {/* ── Getting Started CTA ──────────────────────────────────────────────── */}
      {topics.length === 0 && attempts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <SparkleIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-3">
              Ready to start learning?
            </CardTitle>
            <CardDescription className="mb-6 max-w-md mx-auto">
              Begin your journey by taking your first test. Your performance
              data and personalized insights will appear here.
            </CardDescription>
            <Link href="/dashboard/tests">
              <Button size="lg" className="gap-2">
                <PlayIcon className="h-4 w-4" />
                Browse Available Tests
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
