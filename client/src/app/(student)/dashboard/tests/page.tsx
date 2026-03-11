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

import { useState, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { studentTestsApi, adminCategoriesApi } from "@/api/tests";
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

function getTestCTA(test: Test, attempts: AttemptSummary[]): TestCTA {
  if (test.isPremium) return "locked";
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
}

function TestCard({ test, attempts }: TestCardProps) {
  const cta = getTestCTA(test, attempts);
  const live = isLiveNow(test);

  const latestAttempt = attempts
    .filter((a) => a.testId === test.id && a.status === "SUBMITTED")
    .sort(
      (a, b) =>
        new Date(b.endTime ?? 0).getTime() - new Date(a.endTime ?? 0).getTime(),
    )[0];

  const inProgressAttempt = attempts.find(
    (a) => a.testId === test.id && a.status === "STARTED",
  );

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-white dark:bg-slate-900 transition-all duration-200 flex flex-col",
        live
          ? "border-green-400 dark:border-green-600 shadow-md shadow-green-500/10"
          : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md",
      )}
    >
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {live && (
              <Badge className="bg-green-500 text-white border-transparent text-[10px] px-2 h-4 animate-pulse">
                🔴 LIVE
              </Badge>
            )}
            {cta === "locked" && (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-300 dark:border-amber-700 text-[10px] px-2 h-4"
              >
                <LockIcon className="h-2.5 w-2.5 mr-1" />
                Premium
              </Badge>
            )}
            {cta === "resume" && (
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-300 dark:border-blue-700 text-[10px] px-2 h-4"
              >
                In Progress
              </Badge>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
            {test.title}
          </h3>

          {test.series && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {test.series.title}
              {test.series.exam && ` · ${test.series.exam.name}`}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <ClockIcon className="h-3.5 w-3.5" />
            {formatDuration(test.durationMins)}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <TargetIcon className="h-3.5 w-3.5" />
            {test.totalMarks} marks
          </span>
          {test.negativeMark > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <ZapIcon className="h-3 w-3" />-{test.negativeMark}
            </span>
          )}
        </div>

        {/* Last score if attempted */}
        {latestAttempt && cta === "result" && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
            Last score:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {latestAttempt.score}/{latestAttempt.totalMarks}
            </span>{" "}
            · Accuracy:{" "}
            <span
              className={cn(
                "font-semibold",
                (latestAttempt.accuracy ?? 0) >= 70
                  ? "text-green-600"
                  : (latestAttempt.accuracy ?? 0) >= 40
                    ? "text-amber-600"
                    : "text-red-500",
              )}
            >
              {latestAttempt.accuracy?.toFixed(1) ?? "—"}%
            </span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          {cta === "locked" ? (
            <Link href="/plans">
              <Button
                size="sm"
                className="w-full h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
              >
                <LockIcon className="h-3 w-3" />
                Unlock — View Plans
              </Button>
            </Link>
          ) : cta === "resume" ? (
            <Link
              href={`/test/${test.id}/attempt?attemptId=${inProgressAttempt?.attemptId ?? ""}`}
            >
              <Button
                size="sm"
                className="w-full h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RotateCcwIcon className="h-3 w-3" />
                Resume Test
              </Button>
            </Link>
          ) : cta === "result" ? (
            <div className="flex gap-2">
              <Link
                href={`/test/${test.id}/result?attemptId=${latestAttempt?.attemptId ?? ""}`}
                className="flex-1"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1.5"
                >
                  <BarChart2Icon className="h-3 w-3" />
                  Result
                </Button>
              </Link>
              <Link href={`/test/${test.id}`} className="flex-1">
                <Button
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RotateCcwIcon className="h-3 w-3" />
                  Retake
                </Button>
              </Link>
            </div>
          ) : cta === "upcoming" ? (
            <Button
              size="sm"
              disabled
              className="w-full h-8 text-xs"
              variant="outline"
            >
              Not started yet
            </Button>
          ) : (
            <Link href={`/test/${test.id}`}>
              <Button
                size="sm"
                className="w-full h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlayCircleIcon className="h-3 w-3" />
                Start Test
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function TestCardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-8 w-full rounded-xl" />
    </div>
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
      const res = await adminCategoriesApi.getAll();
      return (
        (res.data as unknown as { data?: typeof res.data }).data ??
        res.data ??
        []
      );
    },
    staleTime: 1000 * 60 * 10,
  });

  const {
    data: tests = [],
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
      );
      // Student API returns { success: true, data: tests } structure
      const response = res.data as any;
      console.log("[DEBUG] Student tests API response:", response);
      console.log("[DEBUG] Response data:", response?.data);
      const tests = response?.data ?? [];
      console.log("[DEBUG] Final tests array:", tests);
      return tests;
    },
    staleTime: 1000 * 60 * 2,
  });

  // Fetch recent attempt history to determine CTAs (page 1, 50 attempts)
  const { data: historyData } = useQuery({
    queryKey: attemptKeys.history({ page: 1, limit: 50 }),
    queryFn: async () => {
      const res = await attemptsApi.getMyHistory(1, 50);
      return (
        (res.data as unknown as { data?: AttemptSummary[] }).data ??
        (res.data as unknown as AttemptSummary[]) ??
        []
      );
    },
    staleTime: 1000 * 60 * 2,
  });

  const attempts: AttemptSummary[] = historyData ?? [];

  // Client-side category filter (API doesn't support categoryId filter on /tests)
  const filteredTests = useMemo(() => {
    console.log("[DEBUG] tests variable:", tests);
    console.log("[DEBUG] tests type:", typeof tests);
    console.log("[DEBUG] tests isArray:", Array.isArray(tests));

    // Safety check: ensure tests is always an array
    const safeTests = Array.isArray(tests) ? tests : [];

    if (!activeCategoryId) return safeTests;
    return safeTests.filter(
      (t: Test) => t.series?.exam?.categoryId === activeCategoryId,
    );
  }, [tests, activeCategoryId]);

  // Final safety check: ensure filteredTests is always an array
  const safeFilteredTests = Array.isArray(filteredTests) ? filteredTests : [];

  console.log("[DEBUG] filteredTests:", filteredTests);
  console.log("[DEBUG] filteredTests isArray:", Array.isArray(filteredTests));
  console.log("[DEBUG] safeFilteredTests:", safeFilteredTests);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Available Tests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            All tests you can take right now
          </p>
        </div>

        {/* ── Search + filter bar ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tests…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-9 h-9"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Category pills ──────────────────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <FilterIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <button
              onClick={() => {
                setActiveCategoryId(null);
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeCategoryId === null
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setPage(1);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeCategoryId === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Grid ───────────────────────────────────────────────────────── */}
        {testsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <TestCardSkeleton key={i} />
            ))}
          </div>
        ) : testsError ? (
          <div className="flex flex-col items-center py-16 text-center">
            <AlertCircleIcon className="h-10 w-10 text-red-400 mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Failed to load tests
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Check your connection and refresh.
            </p>
          </div>
        ) : safeFilteredTests.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <BookOpenIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No tests found
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
              {debouncedSearch
                ? `No tests match "${debouncedSearch}". Try a different search.`
                : "No tests available right now. Check back soon."}
            </p>
            {debouncedSearch && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSearch}
                className="mt-4 gap-1.5"
              >
                <XIcon className="h-3.5 w-3.5" />
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {safeFilteredTests.length} test
              {safeFilteredTests.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeFilteredTests.map((test: Test) => (
                <TestCard key={test.id} test={test} attempts={attempts} />
              ))}
            </div>

            {/* Pagination */}
            {(safeFilteredTests.length === LIMIT || page > 1) && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8"
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Page {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filteredTests.length < LIMIT}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
