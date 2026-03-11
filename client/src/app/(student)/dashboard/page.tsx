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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

function getStatusColor(status: string) {
  if (status === "SUBMITTED")
    return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400";
  if (status === "STARTED")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex items-center gap-4">
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Attempt row ───────────────────────────────────────────────────────────────

function AttemptRow({ attempt }: { attempt: AttemptSummary }) {
  const isSubmitted = attempt.status === "SUBMITTED";
  const accuracy =
    attempt.accuracy !== null ? `${Math.round(attempt.accuracy)}%` : "—";

  return (
    <div className="flex items-center gap-3 py-3 px-1">
      {/* Status icon */}
      <div className="shrink-0">
        {isSubmitted ? (
          <CheckCircle2Icon className="h-4 w-4 text-green-500" />
        ) : (
          <XCircleIcon className="h-4 w-4 text-red-400" />
        )}
      </div>

      {/* Test info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {attempt.testTitle}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
          <CalendarIcon className="h-3 w-3" />
          {formatDistanceToNow(new Date(attempt.startTime), {
            addSuffix: true,
          })}
          <span>·</span>
          <span>{accuracy} accuracy</span>
        </p>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
          {formatScore(attempt.score, attempt.totalMarks)}
        </p>
        <Badge
          className={cn(
            "text-[10px] mt-0.5 h-4 px-1.5",
            getStatusColor(attempt.status),
          )}
          variant="secondary"
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
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
            >
              <BarChart3Icon className="h-3 w-3" />
              Result
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Greeting */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      {/* Recent */}
      <Skeleton className="h-52 rounded-xl" />
      {/* Topics */}
      <Skeleton className="h-48 rounded-xl" />
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
      <div className="flex items-center justify-center min-h-[40vh] px-4">
        <div className="text-center space-y-3">
          <AlertCircleIcon className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Failed to load dashboard data.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              attemptsQuery.refetch();
              topicsQuery.refetch();
            }}
            className="gap-1.5"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {greeting()}, {user?.name?.split(" ")[0] ?? "Student"} 👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* ── Quick stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={BookOpenIcon}
          label="Total Tests"
          value={String(totalAttempts)}
          sub="all time"
          color="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <StatCard
          icon={TargetIcon}
          label="Avg Accuracy"
          value={avgAccuracy !== null ? `${Math.round(avgAccuracy)}%` : "—"}
          sub="submitted"
          color="bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400"
        />
        <StatCard
          icon={TrophyIcon}
          label="Tests Passed"
          value={String(submitted.length)}
          sub={`of ${totalAttempts}`}
          color="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
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
          color="bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
        />
      </div>

      {/* ── Recent attempts ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Recent Attempts
          </h2>
          <Link href="/test/history">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1 text-xs text-blue-600 dark:text-blue-400"
            >
              View All
              <ArrowRightIcon className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {recentFive.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center px-4">
            <BookOpenIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No tests attempted yet.
            </p>
            <Link href="/dashboard/tests" className="mt-3">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                Browse Tests
              </Button>
            </Link>
          </div>
        ) : (
          <div className="px-4 divide-y divide-slate-100 dark:divide-slate-800">
            {recentFive.map((attempt, index) => (
              <AttemptRow
                key={`${attempt.attemptId}-${index}`}
                attempt={attempt}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Weak areas ────────────────────────────────────────────────────── */}
      {topics.length > 0 && (
        <TopicAnalysis
          topics={topics}
          mode="bar"
          limit={5}
          title="Top 5 Weak Areas"
        />
      )}

      {/* ── CTA if no topics ──────────────────────────────────────────────── */}
      {topics.length === 0 && attempts.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
          <BookOpenIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Start your first test
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
            Your performance data and weak areas will appear here once you
            attempt a test.
          </p>
          <Link href="/dashboard/tests">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              <PlayIcon className="h-4 w-4" />
              Browse Available Tests
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
