//All past attempts, performance trend
"use client";

/**
 * app/(student)/test/history/page.tsx
 *
 * All past attempts — paginated table.
 *
 * Columns: Test Name | Date | Score | Accuracy | Status | Actions
 * Status badges: SUBMITTED (green) | STARTED (orange) | EXPIRED (red)
 * Actions: [View Result] [Solutions] for SUBMITTED | [Resume] for STARTED
 *
 * Pagination: 10 per page, uses URL search params for deep-linking.
 * Filter: All | Submitted | In Progress | Expired
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  BarChart3Icon,
  BookOpenIcon,
  PlayIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { attemptsApi } from "@/api/attempts";
import { attemptKeys } from "@/api/query-keys";
import { unwrap } from "@/lib/unwrap";
import type { AttemptSummary, AttemptStatus } from "@/api/attempts";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

type FilterType = "ALL" | "SUBMITTED" | "STARTED" | "EXPIRED";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeTaken(secs: number | null): string {
  if (!secs) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AttemptStatus }) {
  const configs: Record<
    AttemptStatus,
    {
      label: string;
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
      cls: string;
    }
  > = {
    SUBMITTED: {
      label: "Submitted",
      icon: CheckCircle2Icon,
      cls: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-green-200 dark:border-green-800",
    },
    STARTED: {
      label: "In Progress",
      icon: ClockIcon,
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    },
    EXPIRED: {
      label: "Expired",
      icon: XCircleIcon,
      cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800",
    },
  };

  const { label, icon: Icon, cls } = configs[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Filter tab ────────────────────────────────────────────────────────────────

function FilterTab({
  value,
  label,
  active,
  count,
  onClick,
}: {
  value: FilterType;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            active ? "bg-white/25" : "bg-slate-200 dark:bg-slate-700",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: attemptKeys.history({
      page,
      limit: PAGE_SIZE,
      status: filter !== "ALL" ? filter : undefined,
    }),
    queryFn: () =>
      attemptsApi
        .getMyHistory(page, PAGE_SIZE)
        .then(
          unwrap<{
            data: AttemptSummary[];
            total: number;
            page: number;
            limit: number;
          }>,
        ),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const allAttempts = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Client-side filter (server has all records, filter on client for UX responsiveness)
  const attempts =
    filter === "ALL"
      ? allAttempts
      : allAttempts.filter((a) => a.status === filter);

  // Count per status for filter badges
  const counts = allAttempts.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<AttemptStatus, number>,
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Test History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          All your past exam attempts · {totalCount} total
        </p>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <FilterTab
          value="ALL"
          label="All"
          active={filter === "ALL"}
          count={totalCount}
          onClick={() => {
            setFilter("ALL");
            setPage(1);
          }}
        />
        <FilterTab
          value="SUBMITTED"
          label="Submitted"
          active={filter === "SUBMITTED"}
          count={counts.SUBMITTED ?? 0}
          onClick={() => {
            setFilter("SUBMITTED");
            setPage(1);
          }}
        />
        <FilterTab
          value="STARTED"
          label="In Progress"
          active={filter === "STARTED"}
          count={counts.STARTED ?? 0}
          onClick={() => {
            setFilter("STARTED");
            setPage(1);
          }}
        />
        <FilterTab
          value="EXPIRED"
          label="Expired"
          active={filter === "EXPIRED"}
          count={counts.EXPIRED ?? 0}
          onClick={() => {
            setFilter("EXPIRED");
            setPage(1);
          }}
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          {["Test Name", "Date", "Score", "Accuracy", "Status", "Actions"].map(
            (h) => (
              <span
                key={h}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {h}
              </span>
            ),
          )}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="p-4">
            <HistorySkeleton />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <AlertCircleIcon className="h-6 w-6 text-red-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Failed to load history.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="gap-1.5"
            >
              <RefreshCwIcon className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : attempts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center px-4">
            <InboxIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {filter === "ALL"
                ? "No attempts yet"
                : `No ${filter.toLowerCase()} attempts`}
            </p>
            {filter === "ALL" && (
              <Link href="/dashboard/tests" className="mt-3">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <PlayIcon className="h-3.5 w-3.5" /> Take a Test
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {attempts.map((attempt) => {
              const isSubmitted = attempt.status === "SUBMITTED";
              const isStarted = attempt.status === "STARTED";

              return (
                <div
                  key={attempt.attemptId}
                  className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 sm:gap-4 sm:items-center px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Test name */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {attempt.testTitle}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {attempt.seriesTitle} · Attempt #{attempt.attemptNumber}
                    </p>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                    {format(new Date(attempt.startTime), "dd MMM yyyy")}
                  </p>

                  {/* Score */}
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {isSubmitted
                      ? `${attempt.score}/${attempt.totalMarks}`
                      : "—"}
                  </p>

                  {/* Accuracy */}
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      attempt.accuracy !== null && attempt.accuracy >= 70
                        ? "text-green-600 dark:text-green-400"
                        : attempt.accuracy !== null && attempt.accuracy >= 40
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-500 dark:text-red-400",
                    )}
                  >
                    {attempt.accuracy !== null
                      ? `${Math.round(attempt.accuracy)}%`
                      : "—"}
                  </p>

                  {/* Status */}
                  <StatusBadge status={attempt.status} />

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isSubmitted && (
                      <>
                        <Link
                          href={`/test/${attempt.testId}/result?attemptId=${attempt.attemptId}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <BarChart3Icon className="h-3 w-3" /> Result
                          </Button>
                        </Link>
                        <Link
                          href={`/test/${attempt.testId}/solutions?attemptId=${attempt.attemptId}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <BookOpenIcon className="h-3 w-3" /> Solutions
                          </Button>
                        </Link>
                      </>
                    )}
                    {isStarted && (
                      <Link href={`/test/${attempt.testId}/attempt`}>
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <PlayIcon className="h-3 w-3" /> Resume
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages} · {totalCount} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            {/* Page number pills */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = i + 1;
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setPage(pg)}
                  className={cn(
                    "h-8 w-8 rounded-md text-xs font-semibold transition-colors",
                    pg === page
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  {pg}
                </button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}