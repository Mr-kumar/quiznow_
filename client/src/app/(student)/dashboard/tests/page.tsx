"use client";

/**
 * app/(student)/dashboard/tests/page.tsx
 *
 * Available Tests Page — all tests the student can take.
 *
 * URL: /dashboard/tests
 * Linked from: /dashboard "Browse Tests" CTAs
 *
 * Features:
 *  - Category filter pills (fetched from /categories)
 *  - Search input (debounced, updates URL param)
 *  - Test cards: title, duration, marks, series, live badge, CTA
 *  - CTA: [Start Test] / [Resume] / [View Result] based on attempt state
 *  - Premium lock badge — links to /plans
 *  - Pagination (10 per page)
 *
 * Data:
 *  - GET /tests?page&limit&search&seriesId  → Test[]
 *  - GET /categories                        → Category[] (for filter pills)
 *  - GET /users/me/attempts (page 1, 100)   → recent AttemptSummary[] (for CTA state)
 *
 * We cross-reference attempt history with tests to decide which CTA to show.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  SearchIcon,
  XIcon,
  PlayCircleIcon,
  RotateCcwIcon,
  BarChart2Icon,
  LockIcon,
  ClockIcon,
  TargetIcon,
  ZapIcon,
  Loader2Icon,
  AlertCircleIcon,
  FilterIcon,
  BookOpenIcon,
  TrendingUpIcon,
  SparkleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { studentTestsApi, publicApi } from "@/api/tests";
import { attemptsApi } from "@/api/attempts";
import { testKeys, attemptKeys } from "@/api/query-keys";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { Test } from "@/api/tests";
import type { AttemptSummary } from "@/api/attempts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

function isLiveNow(test: Test): boolean {
  const now = Date.now();
  const start = test.startAt ? new Date(test.startAt).getTime() : null;
  const end = test.endAt ? new Date(test.endAt).getTime() : null;
  if (!start || !end) return false;
  return now >= start && now <= end;
}

type TestCTA = "start" | "resume" | "result" | "locked" | "upcoming";

function getTestCTA(
  test: Test,
  attempts: AttemptSummary[],
  hasActiveSubscription: boolean
): TestCTA {
  if (test.isPremium && !hasActiveSubscription) return "locked";
  if (test.startAt && new Date(test.startAt) > new Date()) return "upcoming";

  const testAttempts = attempts.filter((a) => a.testId === test.id);
  if (testAttempts.length === 0) return "start";

  const inProgress = testAttempts.find((a) => a.status === "STARTED");
  if (inProgress) return "resume";

  return "result";
}

// ── Test Card ─────────────────────────────────────────────────────────────────

interface TestCardProps {
  test: Test;
  attempts: AttemptSummary[];
  hasActiveSubscription: boolean;
}

function TestCard({ test, attempts, hasActiveSubscription }: TestCardProps) {
  const cta = getTestCTA(test, attempts, hasActiveSubscription);
  const live = isLiveNow(test);

  const latestAttempt = attempts
    .filter((a) => a.testId === test.id && a.status === "SUBMITTED")
    .sort(
      (a, b) =>
        new Date(b.endTime ?? 0).getTime() - new Date(a.endTime ?? 0).getTime()
    )[0];

  const inProgressAttempt = attempts.find(
    (a) => a.testId === test.id && a.status === "STARTED"
  );

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-lg",
        live && "ring-2 ring-green-500 ring-offset-2"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {live && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs gap-1 animate-pulse">
                  <span className="h-2 w-2 bg-white rounded-full" />
                  LIVE
                </Badge>
              )}
              {test.isPremium && (
                <Badge
                  variant={cta === "locked" ? "secondary" : "default"}
                  className={cn(
                    "text-xs gap-1",
                    cta !== "locked" && "bg-amber-500 hover:bg-amber-600"
                  )}
                >
                  {cta === "locked" ? (
                    <LockIcon className="h-3 w-3" />
                  ) : (
                    <SparkleIcon className="h-3 w-3" />
                  )}
                  Premium
                </Badge>
              )}
              {cta === "resume" && (
                <Badge
                  variant="outline"
                  className="text-xs gap-1 border-blue-200 text-blue-600"
                >
                  <RotateCcwIcon className="h-3 w-3" />
                  In Progress
                </Badge>
              )}
            </div>
            <CardTitle className="text-base leading-tight">
              {test.title}
            </CardTitle>
            {test.series && (
              <CardDescription className="text-xs">
                {test.series.title}
                {test.series.exam && ` · ${test.series.exam.name}`}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            {formatDuration(test.durationMins)}
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <TargetIcon className="h-4 w-4" />
            {test.totalMarks} marks
          </div>
          {test.negativeMark > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1 text-red-500">
                <ZapIcon className="h-4 w-4" />-{test.negativeMark}
              </div>
            </>
          )}
        </div>

        {/* Last score if attempted */}
        {latestAttempt && cta === "result" && (
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last score</span>
              <span className="font-semibold tabular-nums">
                {latestAttempt.score}/{latestAttempt.totalMarks}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-muted-foreground">Accuracy</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  (latestAttempt.accuracy ?? 0) >= 70
                    ? "text-green-600"
                    : (latestAttempt.accuracy ?? 0) >= 40
                    ? "text-amber-600"
                    : "text-red-500"
                )}
              >
                {latestAttempt.accuracy?.toFixed(1) ?? "—"}%
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {cta === "locked" ? (
          <Link href="/upgrade" className="w-full">
            <Button
              className="w-full gap-2 transition-all hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-700"
              variant="secondary"
            >
              <LockIcon className="h-4 w-4" />
              Upgrade to Unlock
            </Button>
          </Link>
        ) : cta === "resume" ? (
          <Link
            href={`/test/${test.id}/attempt?attemptId=${
              inProgressAttempt?.attemptId ?? ""
            }`}
            className="w-full"
          >
            <Button className="w-full gap-2">
              <RotateCcwIcon className="h-4 w-4" />
              Resume Test
            </Button>
          </Link>
        ) : cta === "result" ? (
          <div className="flex gap-2 w-full">
            <Link
              href={`/test/${test.id}/result?attemptId=${
                latestAttempt?.attemptId ?? ""
              }`}
              className="flex-1"
            >
              <Button variant="outline" className="w-full gap-2">
                <BarChart2Icon className="h-4 w-4" />
                Result
              </Button>
            </Link>
            <Link href={`/test/${test.id}`} className="flex-1">
              <Button className="w-full gap-2">
                <RotateCcwIcon className="h-4 w-4" />
                Retake
              </Button>
            </Link>
          </div>
        ) : cta === "upcoming" ? (
          <Button disabled className="w-full">
            Not started yet
          </Button>
        ) : (
          <Link href={`/test/${test.id}`} className="w-full">
            <Button className="w-full gap-2">
              <PlayCircleIcon className="h-4 w-4" />
              Start Test
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function TestCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-9 w-full rounded" />
      </CardFooter>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const LIMIT = 12;

export default function DashboardTestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await publicApi.getCategories();
      return (
        (res.data as unknown as { data?: typeof res.data }).data ??
        res.data ??
        []
      );
    },
    staleTime: 1000 * 60 * 10,
  });

  // Initialize category from local storage once categories are loaded
  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === null) {
      const savedCategory = localStorage.getItem("quiznow_target_category");
      if (
        savedCategory &&
        categories.some((c: any) => c.id === savedCategory)
      ) {
        setActiveCategoryId(savedCategory);
      } else {
        // Default to "All Categories" (null) instead of force-selecting the first one
        // This gives a better "first impression" showing all content
        setActiveCategoryId(null);
      }
    }
  }, [categories, activeCategoryId]);

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setActiveCategoryId(categoryId);
    setPage(1);
    if (categoryId) {
      localStorage.setItem("quiznow_target_category", categoryId);
    } else {
      localStorage.removeItem("quiznow_target_category");
    }
  }, []);

  const {
    data: testsData,
    isLoading: testsLoading,
    isError: testsError,
  } = useQuery({
    queryKey: testKeys.list({
      page,
      search: debouncedSearch,
      categoryId: activeCategoryId,
    }),
    queryFn: async () => {
      const res = await studentTestsApi.getAll(
        page,
        LIMIT,
        debouncedSearch || undefined,
        undefined, // seriesId
        activeCategoryId || undefined
      );
      // Server returns { success, data: { data: Test[], total, page, limit } }
      // Axios res.data = { success, data: { data, total } }
      const outer = res.data as any;
      const inner = outer?.data ?? outer;
      // inner may be { data: Test[], total } or Test[] directly
      if (inner && typeof inner === "object" && Array.isArray(inner.data)) {
        return {
          tests: inner.data as Test[],
          total: inner.total as number,
          hasActiveSubscription: !!inner.hasActiveSubscription,
        };
      }
      // Fallback: direct array
      return {
        tests: Array.isArray(inner) ? inner : [],
        total: 0,
        hasActiveSubscription: false,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const tests: Test[] = testsData?.tests ?? [];
  const totalCount = testsData?.total ?? 0;
  const hasActiveSubscription = testsData?.hasActiveSubscription ?? false;
  const totalPages = Math.ceil(totalCount / LIMIT);

  // Fetch recent attempt history to determine CTAs
  const { data: historyData } = useQuery({
    queryKey: attemptKeys.history({ page: 1, limit: 50 }),
    queryFn: async () => {
      const res = await attemptsApi.getMyHistory(1, 50);
      // Server returns { data: AttemptSummary[], total, page, limit }
      const response = res.data as any;
      return (response?.data ?? response) as AttemptSummary[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const attempts: AttemptSummary[] = historyData ?? [];

  // No client-side filter needed as backend now handles categoryId
  const filteredTests = tests;

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                My Target Exam Tests
              </h1>
              <p className="text-muted-foreground">
                Select your target exam category to see tailored mock tests
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUpIcon className="h-4 w-4" />
              <span>{totalCount} tests available</span>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-10 h-11"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Category Filters */}
            {categories.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FilterIcon className="h-4 w-4" />
                  <span>Categories</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activeCategoryId === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategorySelect(null)}
                    className="gap-1"
                  >
                    All Categories
                  </Button>
                  {categories.map((cat: any) => (
                    <Button
                      key={cat.id}
                      variant={
                        activeCategoryId === cat.id ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleCategorySelect(cat.id)}
                      className="gap-1"
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Content Grid ───────────────────────────────────────────────────── */}
        {testsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <TestCardSkeleton key={i} />
            ))}
          </div>
        ) : testsError ? (
          <Card className="p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircleIcon className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl mb-2">Unable to load tests</CardTitle>
            <CardDescription className="mb-6 max-w-md mx-auto">
              We couldn't fetch the available tests. Please check your
              connection and try again.
            </CardDescription>
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCwIcon className="h-4 w-4" />
              Try Again
            </Button>
          </Card>
        ) : filteredTests.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpenIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2">
              {debouncedSearch ? "No tests found" : "No tests available"}
            </CardTitle>
            <CardDescription className="mb-6 max-w-md mx-auto">
              {debouncedSearch
                ? `No tests match "${debouncedSearch}". Try a different search term.`
                : "No tests are available right now. Check back soon for new content."}
            </CardDescription>
            {debouncedSearch && (
              <Button
                onClick={handleClearSearch}
                variant="outline"
                className="gap-2"
              >
                <XIcon className="h-4 w-4" />
                Clear Search
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTests.length} of {totalCount} tests
                {activeCategoryId && ` in this category`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test: Test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  attempts={attempts}
                  hasActiveSubscription={hasActiveSubscription}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
