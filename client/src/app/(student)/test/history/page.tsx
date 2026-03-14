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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { attemptsApi } from "@/api/attempts";
import { attemptKeys } from "@/api/query-keys";
import { unwrap } from "@/lib/unwrap";
import type { AttemptSummary, AttemptStatus } from "@/api/attempts";
import { formatTimeTaken } from "@/lib/utils/time";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

type FilterType = "ALL" | "SUBMITTED" | "STARTED" | "EXPIRED";

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AttemptStatus }) {
  const configs: Record<
    AttemptStatus,
    {
      label: string;
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    SUBMITTED: {
      label: "Submitted",
      icon: CheckCircle2Icon,
      variant: "default",
    },
    STARTED: {
      label: "In Progress",
      icon: ClockIcon,
      variant: "secondary",
    },
    EXPIRED: {
      label: "Expired",
      icon: XCircleIcon,
      variant: "destructive",
    },
  };

  const { label, icon: Icon, variant } = configs[status];

  return (
    <Badge variant={variant} className="gap-1 text-xs">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
      attemptsApi.getMyHistory(page, PAGE_SIZE).then((res) => res.data),
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
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Test History</h1>
        <p className="text-muted-foreground">
          All your past exam attempts · {totalCount} total
        </p>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <Tabs
        value={filter}
        onValueChange={(value) => {
          setFilter(value as FilterType);
          setPage(1);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ALL" className="gap-2">
            All
            <Badge variant="secondary" className="text-xs">
              {totalCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="SUBMITTED" className="gap-2">
            Submitted
            <Badge variant="secondary" className="text-xs">
              {counts.SUBMITTED ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="STARTED" className="gap-2">
            In Progress
            <Badge variant="secondary" className="text-xs">
              {counts.STARTED ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="EXPIRED" className="gap-2">
            Expired
            <Badge variant="secondary" className="text-xs">
              {counts.EXPIRED ?? 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {/* ── Table ────────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {isLoading ? (
              <HistorySkeleton />
            ) : isError ? (
              <Card className="p-8 text-center">
                <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Failed to load history
                </h3>
                <p className="text-muted-foreground mb-4">
                  Unable to fetch your test attempts. Please try again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="gap-2"
                >
                  <RefreshCwIcon className="h-4 w-4" /> Retry
                </Button>
              </Card>
            ) : attempts.length === 0 ? (
              <Card className="p-12 text-center">
                <InboxIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {filter === "ALL"
                    ? "No attempts yet"
                    : `No ${filter.toLowerCase()} attempts`}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {filter === "ALL"
                    ? "Start taking tests to see your history here."
                    : `You don't have any ${filter.toLowerCase()} attempts.`}
                </p>
                {filter === "ALL" && (
                  <Link href="/dashboard/tests">
                    <Button className="gap-2">
                      <PlayIcon className="h-4 w-4" /> Take a Test
                    </Button>
                  </Link>
                )}
              </Card>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt, index) => {
                  const isSubmitted = attempt.status === "SUBMITTED";
                  const isStarted = attempt.status === "STARTED";

                  return (
                    <Card
                      key={`${attempt.attemptId}-${index}`}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Test name */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate mb-1">
                              {attempt.testTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {attempt.seriesTitle} · Attempt #
                              {attempt.attemptNumber}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                            {/* Date */}
                            <div className="text-center lg:text-left">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Date
                              </p>
                              <p className="font-semibold text-sm">
                                {format(
                                  new Date(attempt.startTime),
                                  "dd MMM yyyy",
                                )}
                              </p>
                            </div>

                            {/* Score */}
                            <div className="text-center lg:text-left">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Score
                              </p>
                              <p className="font-bold text-foreground">
                                {isSubmitted
                                  ? `${attempt.score}/${attempt.totalMarks}`
                                  : "—"}
                              </p>
                            </div>

                            {/* Accuracy */}
                            <div className="text-center lg:text-left">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Accuracy
                              </p>
                              <p
                                className={cn(
                                  "font-bold text-sm",
                                  attempt.accuracy !== null &&
                                    attempt.accuracy >= 70
                                    ? "text-green-600 dark:text-green-400"
                                    : attempt.accuracy !== null &&
                                        attempt.accuracy >= 40
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-red-500 dark:text-red-400",
                                )}
                              >
                                {attempt.accuracy !== null
                                  ? `${Math.round(attempt.accuracy)}%`
                                  : "—"}
                              </p>
                            </div>

                            {/* Status */}
                            <div className="text-center lg:text-left">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                Status
                              </p>
                              <StatusBadge status={attempt.status} />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {isSubmitted && (
                                <>
                                  <Link
                                    href={`/test/${attempt.testId}/result?attemptId=${attempt.attemptId}`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1"
                                    >
                                      <BarChart3Icon className="h-3 w-3" />{" "}
                                      Result
                                    </Button>
                                  </Link>
                                  <Link
                                    href={`/test/${attempt.testId}/solutions?attemptId=${attempt.attemptId}`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1"
                                    >
                                      <BookOpenIcon className="h-3 w-3" />{" "}
                                      Solutions
                                    </Button>
                                  </Link>
                                </>
                              )}
                              {isStarted && (
                                <Link href={`/test/${attempt.testId}/attempt`}>
                                  <Button size="sm" className="gap-1">
                                    <PlayIcon className="h-3 w-3" /> Resume
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
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
                <Button
                  key={pg}
                  variant={pg === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pg)}
                  className="h-8 w-8 p-0"
                >
                  {pg}
                </Button>
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
