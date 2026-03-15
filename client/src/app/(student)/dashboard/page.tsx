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
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { useState, useEffect } from "react";
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
  AlertCircleIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  SparkleIcon,
  CrownIcon,
  GraduationCapIcon,
  ZapIcon,
  FlameIcon,
  ActivityIcon,
  History as HistoryIcon,
  Layers as LayersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TopicAnalysis } from "@/features/results/components/TopicAnalysis";
import { attemptsApi } from "@/api/attempts";
import { leaderboardApi } from "@/api/leaderboard";
import { attemptKeys, studentKeys } from "@/api/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { studentUsersApi } from "@/api/student-users";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import type { AttemptSummary } from "@/api/attempts";
import type { UserTopicStat } from "@/api/leaderboard";
import { EXAM_CATEGORIES } from "@/constants/exams";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatScore(score: number, total: number) {
  return `${score}/${total}`;
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
  color,
  trend,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  sub?: string;
  color: string;
  trend?: { value: string; isUp: boolean };
}) {
  return (
    <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300",
              color
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full",
                trend.isUp
                  ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              )}
            >
              {trend.isUp ? (
                <TrendingUpIcon className="h-3 w-3" />
              ) : (
                <TrendingUpIcon className="h-3 w-3 rotate-180" />
              )}
              {trend.value}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            {label}
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Subscription widget ───────────────────────────────────────────────────────

interface SubscriptionWidgetProps {
  subscription: {
    data?: {
      plan?: { name: string; price?: number } | string | null;
      status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
      expiresAt?: string;
    };
  } | null;
}

function SubscriptionWidget({ subscription }: SubscriptionWidgetProps) {
  const planObj = subscription?.data?.plan;
  const planName =
    (typeof planObj === "object" && planObj !== null
      ? (planObj as { name?: string }).name
      : typeof planObj === "string"
      ? planObj
      : undefined) || "Free";
  const status = subscription?.data?.status ?? "ACTIVE";
  const expiresAt = subscription?.data?.expiresAt;
  const isPremium = planName !== "Free" && planName !== "FREE";
  const daysLeft = expiresAt
    ? differenceInDays(new Date(expiresAt), new Date())
    : null;

  return (
    <Card
      className={cn(
        "border shadow-lg relative overflow-hidden",
        isPremium
          ? "bg-linear-to-r from-amber-500 to-orange-600 border-amber-400 text-white"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      )}
    >
      {isPremium && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      )}
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner",
                isPremium
                  ? "bg-white/20 backdrop-blur-md"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              <CrownIcon
                className={cn(
                  "h-6 w-6",
                  isPremium ? "text-white" : "text-slate-500"
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-base font-black",
                    isPremium ? "text-white" : "text-slate-900 dark:text-white"
                  )}
                >
                  {isPremium ? planName : "Free"} Plan
                </p>
                <Badge
                  variant={status === "ACTIVE" ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] h-5 font-bold uppercase",
                    isPremium ? "bg-white text-orange-600 hover:bg-white" : ""
                  )}
                >
                  {status}
                </Badge>
              </div>
              <p
                className={cn(
                  "text-xs font-medium",
                  isPremium
                    ? "text-orange-50"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                {isPremium && daysLeft !== null
                  ? daysLeft > 0
                    ? `${daysLeft} days remaining`
                    : "Expired"
                  : "Unlock premium mock tests & deep analytics"}
              </p>
            </div>
          </div>
          {!isPremium ? (
            <Link href="/upgrade">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-blue-600/20"
              >
                Upgrade Now
              </Button>
            </Link>
          ) : (
            <Link href="/upgrade">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 font-bold h-10 px-4 rounded-xl"
              >
                View Details
              </Button>
            </Link>
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
    <Card className="hover:shadow-md transition-all duration-300 border-slate-100 dark:border-slate-800 group">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Status icon */}
          <div className="shrink-0">
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                isSubmitted
                  ? "bg-green-50 dark:bg-green-950/30"
                  : "bg-amber-50 dark:bg-amber-950/30"
              )}
            >
              {isSubmitted ? (
                <CheckCircle2Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
          </div>

          {/* Test info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1 group-hover:text-blue-600 transition-colors">
              {attempt.testTitle}
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {formatDistanceToNow(new Date(attempt.startTime), {
                  addSuffix: true,
                })}
              </div>
              <Separator orientation="vertical" className="h-3" />
              <span className={cn("font-bold", getStatusColor(attempt.status))}>
                {accuracy} accuracy
              </span>
            </div>
          </div>

          {/* Score */}
          <div className="shrink-0 text-right mr-2 hidden sm:block">
            <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
              {formatScore(attempt.score, attempt.totalMarks)}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Marks
            </p>
          </div>

          {/* Actions */}
          {isSubmitted && attempt.testId && attempt.attemptId ? (
            <div className="shrink-0 flex gap-2">
              <Link
                href={`/test/${attempt.testId}/result?attemptId=${attempt.attemptId}`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800"
                >
                  <BarChart3Icon className="h-3.5 w-3.5 mr-1.5" />
                  Analysis
                </Button>
              </Link>
            </div>
          ) : attempt.status === "STARTED" && attempt.testId ? (
            <div className="shrink-0 flex gap-2">
              <Link href={`/test/${attempt.testId}/attempt`}>
                <Button
                  size="sm"
                  className="h-9 px-4 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                >
                  <PlayIcon className="h-3.5 w-3.5 mr-1.5" />
                  Resume
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Greeting */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-80 rounded-xl" />
        <Skeleton className="h-5 w-64 rounded-lg" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full max-w-xs" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // 1. Attempts (for stats + recent)
  const attemptsQuery = useQuery({
    queryKey: attemptKeys.history({ page: 1, limit: 50 }),
    queryFn: async () => {
      const res = await attemptsApi.getMyHistory(1, 50);
      return (res.data as any)?.data ?? res.data;
    },
  });

  // 2. Topic stats (for weak areas)
  const topicStatsQuery = useQuery({
    queryKey: studentKeys.topicStats(),
    queryFn: async () => {
      const res = await leaderboardApi.getMyTopicStats();
      return (res.data as any)?.data ?? res.data;
    },
  });

  // 3. Subscription (for premium state)
  const { queryData: subQueryData, isLoading: subLoading } = useSubscription();

  // 4. Best Rank
  const bestRankQuery = useQuery({
    queryKey: ["best-rank"],
    queryFn: async () => {
      const res = await leaderboardApi.getMyBestRank();
      return (res.data as any)?.data ?? res.data;
    },
  });

  const isLoading =
    attemptsQuery.isLoading ||
    topicStatsQuery.isLoading ||
    subLoading ||
    bestRankQuery.isLoading;
  const isError = attemptsQuery.isError;

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="h-16 w-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircleIcon className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Failed to load dashboard
        </h2>
        <p className="text-slate-500 mb-8">
          Please check your internet connection and try again.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-blue-600 font-bold px-8 h-12 rounded-xl"
        >
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Retry Now
        </Button>
      </div>
    );
  }

  const attempts = (attemptsQuery.data as AttemptSummary[]) || [];
  const topicStats = (topicStatsQuery.data as UserTopicStat[]) || [];
  const bestRankValue = bestRankQuery.data;

  // Derived stats
  const totalAttempts = attempts.length;
  const submitted = attempts.filter((a) => a.status === "SUBMITTED");
  const avgAccuracy = submitted.length
    ? Math.round(
        submitted.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) /
          submitted.length
      )
    : 0;

  const resumeAttempt = attempts.find((a) => a.status === "STARTED");

  // Streak logic
  const calculateStreak = (allAttempts: AttemptSummary[]) => {
    const dates = Array.from(
      new Set(
        allAttempts
          .filter((a) => a.status === "SUBMITTED")
          .map((a) => format(new Date(a.startTime), "yyyy-MM-dd"))
      )
    ).sort((a, b) => b.localeCompare(a));

    if (dates.length === 0) return 0;

    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diff = differenceInDays(current, next);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  };

  // Trends logic (simple month-over-month)
  const calculateTrends = (allAttempts: AttemptSummary[]) => {
    const now = new Date();
    const thisMonth = allAttempts.filter(
      (a) => new Date(a.startTime).getMonth() === now.getMonth()
    );
    const lastMonth = allAttempts.filter(
      (a) => new Date(a.startTime).getMonth() === (now.getMonth() - 1 + 12) % 12
    );

    const attemptsTrend =
      lastMonth.length > 0
        ? Math.round(
            ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100
          )
        : 0;

    const getAvgAccuracy = (list: AttemptSummary[]) => {
      const sub = list.filter((a) => a.status === "SUBMITTED");
      return sub.length
        ? sub.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / sub.length
        : 0;
    };

    const thisMonthAcc = getAvgAccuracy(thisMonth);
    const lastMonthAcc = getAvgAccuracy(lastMonth);
    const accuracyTrend =
      lastMonthAcc > 0
        ? Math.round(((thisMonthAcc - lastMonthAcc) / lastMonthAcc) * 100)
        : 0;

    return {
      attempts: {
        value: `${Math.abs(attemptsTrend)}%`,
        isUp: attemptsTrend >= 0,
      },
      accuracy: {
        value: `${Math.abs(accuracyTrend)}%`,
        isUp: accuracyTrend >= 0,
      },
    };
  };

  const streak = calculateStreak(attempts);
  const trends = calculateTrends(attempts);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── HEADER & GREETING ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {greeting},{" "}
            <span className="text-blue-600">{user?.name?.split(" ")[0]}!</span>
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <CalendarIcon className="h-4 w-4" />
            <span>Today is {format(new Date(), "EEEE, do MMMM")}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user?.id && (
            <Link href={`/profile/${user.id}`}>
              <Button
                variant="outline"
                className="rounded-2xl h-12 px-6 border-slate-200 dark:border-slate-800 font-bold"
              >
                View Public Profile
              </Button>
            </Link>
          )}
          <Link href="/dashboard/tests">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-2xl shadow-xl shadow-blue-600/20 group">
              Browse New Tests
              <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── STATS GRID ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={ActivityIcon}
          label="Total Attempts"
          value={totalAttempts.toString()}
          sub="Across all exams"
          color="bg-blue-500"
          trend={trends.attempts.value !== "0%" ? trends.attempts : undefined}
        />
        <StatCard
          icon={TargetIcon}
          label="Avg. Accuracy"
          value={`${avgAccuracy}%`}
          sub="Last 10 tests"
          color="bg-green-500"
          trend={trends.accuracy.value !== "0%" ? trends.accuracy : undefined}
        />
        <StatCard
          icon={TrophyIcon}
          label="Best Rank"
          value={bestRankValue ? `#${bestRankValue}` : "—"}
          sub="Global ranking"
          color="bg-amber-500"
        />
        <StatCard
          icon={FlameIcon}
          label="Study Streak"
          value={streak.toString()}
          sub="Days in a row"
          color="bg-orange-500"
          trend={streak > 0 ? { value: "Live", isUp: true } : undefined}
        />
      </div>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent & Resume */}
        <div className="lg:col-span-2 space-y-8">
          {/* Resume Card (if any) */}
          {resumeAttempt && (
            <Card className="bg-linear-to-r from-blue-600 to-indigo-700 border-0 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
                <div className="space-y-2 text-center sm:text-left">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 font-bold uppercase tracking-wider mb-2">
                    <ZapIcon className="h-3 w-3 mr-1.5 fill-current" />
                    Continue Learning
                  </Badge>
                  <h3 className="text-2xl font-black leading-tight">
                    {resumeAttempt.testTitle}
                  </h3>
                  <p className="text-blue-100 text-sm font-medium opacity-90">
                    You have an unfinished test session. Pick up where you left
                    off.
                  </p>
                </div>
                <Link href={`/test/${resumeAttempt.testId}/attempt`}>
                  <Button className="h-14 px-10 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-black text-lg shadow-xl shrink-0">
                    <PlayIcon className="h-5 w-5 mr-2 fill-current" />
                    Resume Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Recent Attempts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HistoryIcon className="h-6 w-6 text-blue-600" />
                Recent Attempts
              </h2>
              <Link
                href="/test/history"
                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View History
              </Link>
            </div>
            <div className="grid gap-3">
              {attempts.length > 0 ? (
                attempts
                  .slice(0, 5)
                  .map((a) => (
                    <AttemptRow key={a.attemptId || a.testId} attempt={a} />
                  ))
              ) : (
                <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
                  <CardContent className="p-10 text-center">
                    <BookOpenIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">
                      No test attempts yet.
                    </p>
                    <Link href="/dashboard/tests">
                      <Button
                        variant="link"
                        className="text-blue-600 font-bold"
                      >
                        Start your first test
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Browse Categories & Practice */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <LayersIcon className="h-6 w-6 text-indigo-600" />
                Practice by Subject
              </h2>
              <Link
                href="/practice"
                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All Subjects
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {EXAM_CATEGORIES.slice(0, 4).map((cat) => (
                <Link key={cat.id} href={`/practice`}>
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all text-center group">
                    <div
                      className={`h-14 w-14 mx-auto mb-4 rounded-2xl bg-linear-to-br ${
                        cat.color ?? "from-blue-600 to-indigo-600"
                      } flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      {cat.emoji}
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {cat.shortLabel}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                      Start Practice
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Performance & Subscription */}
        <div className="space-y-8">
          <SubscriptionWidget subscription={subQueryData as any} />

          {/* Performance Analysis */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart3Icon className="h-5 w-5 text-indigo-600" />
                  Weak Areas
                </CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-slate-400" />
              </div>
              <CardDescription className="text-xs font-medium">
                Topics with accuracy below 60%
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {topicStats.length > 0 ? (
                <TopicAnalysis
                  topics={topicStats}
                  mode="bar"
                  limit={5}
                  showEmpty={false}
                />
              ) : (
                <div className="py-10 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto">
                    <SparkleIcon className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium px-4">
                    Complete at least 5 tests to see your performance analysis
                    here.
                  </p>
                </div>
              )}
            </CardContent>
            {topicStats.length > 0 && (
              <CardFooter className="bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
                <Link href="/profile" className="w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    View Full Analysis{" "}
                    <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>

          {/* Quick Actions / Help */}
          <Card className="bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-blue-100 dark:border-blue-900/40">
            <CardContent className="p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCapIcon className="h-5 w-5 text-blue-600" />
                Study Tips
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Focus on PYQs to understand the current exam patterns.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Take a mock test every Sunday to build exam stamina.
                  </p>
                </div>
                <Link href="/practice">
                  <Button
                    variant="outline"
                    className="w-full mt-4 h-10 rounded-xl text-xs font-bold border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-slate-900/50"
                  >
                    Start Topic Practice
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Inline SVG icons removed in favor of lucide-react History and Layers icons
