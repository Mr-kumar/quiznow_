"use client";

/**
 * app/(student)/leaderboard/[testId]/page.tsx
 *
 * Test Leaderboard — ranked list of all submissions for a test.
 *
 * Layout:
 *  [Your Rank banner — always visible even if not in top 50]
 *  [Top 3 podium (for motivational visual)]
 *  [Full ranked table — Rank | Avatar | Name | Score | Accuracy | Time]
 *  [Pagination]
 *
 * Current user's row is highlighted in blue.
 * Table sorted by: score DESC, timeTaken ASC (faster = better tiebreak).
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";
import {
  TrophyIcon,
  Medal,
  ClockIcon,
  TargetIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ArrowLeftIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { leaderboardApi } from "@/api/leaderboard";
import { leaderboardKeys } from "@/api/query-keys";
import { unwrap } from "@/lib/unwrap";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, LeaderboardResponse } from "@/api/leaderboard";
import { formatTimeTaken } from "@/lib/utils/time";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRankColor(rank: number): string {
  if (rank === 1) return "text-amber-500";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-700";
  return "text-slate-500 dark:text-slate-400";
}

// ── Podium (top 3) ────────────────────────────────────────────────────────────

function PodiumSlot({
  entry,
  position,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}) {
  const heights = { 1: "h-20", 2: "h-14", 3: "h-10" } as const;
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;
  const orders = { 1: "order-2", 2: "order-1", 3: "order-3" } as const;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", orders[position])}>
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-linear-to-br from-blue-400 to-indigo-600 text-white text-xs font-bold">
          {getInitials(entry.user?.name || "User")}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[80px] text-center">
        {entry.user?.name || "Anonymous"}
      </span>
      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
        {entry.score}
      </span>
      <div
        className={cn(
          "w-16 rounded-t-lg flex items-end justify-center pb-1.5 text-lg",
          heights[position],
          position === 1
            ? "bg-amber-100 dark:bg-amber-950/40"
            : position === 2
              ? "bg-slate-100 dark:bg-slate-800"
              : "bg-amber-50 dark:bg-amber-950/20",
        )}
      >
        {medals[position]}
      </div>
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  currentUserId,
}: {
  entry: LeaderboardEntry;
  currentUserId: string | null;
}) {
  const isMe = currentUserId === entry.userId;

  return (
    <tr
      className={cn(
        "border-b border-slate-100 dark:border-slate-800 transition-colors",
        isMe
          ? "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/30",
      )}
    >
      {/* Rank */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-sm font-bold tabular-nums w-6 text-right",
              getRankColor(entry.rank),
            )}
          >
            {entry.rank}
          </span>
          {entry.rank <= 3 && (
            <span className="text-xs">
              {["🥇", "🥈", "🥉"][entry.rank - 1]}
            </span>
          )}
        </div>
      </td>

      {/* User */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback
              className={cn(
                "text-[10px] font-bold",
                isMe
                  ? "bg-blue-600 text-white"
                  : "bg-linear-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 text-slate-700 dark:text-slate-300",
              )}
            >
              {getInitials(entry.user?.name || "User")}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "text-sm font-medium truncate max-w-[140px]",
              isMe
                ? "text-blue-700 dark:text-blue-400 font-semibold"
                : "text-slate-800 dark:text-slate-200",
            )}
          >
            {entry.user?.name || "Anonymous"}
            {isMe && (
              <span className="ml-1.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                You
              </span>
            )}
          </span>
        </div>
      </td>

      {/* Score */}
      <td className="px-4 py-3 tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100">
        {entry.score}
      </td>

      {/* Accuracy */}
      <td className="px-4 py-3 tabular-nums text-sm font-medium">
        <span
          className={cn(
            entry.accuracy !== null && entry.accuracy >= 70
              ? "text-green-600 dark:text-green-400"
              : entry.accuracy !== null && entry.accuracy >= 40
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-500 dark:text-red-400",
          )}
        >
          {entry.accuracy !== null ? `${Math.round(entry.accuracy)}%` : "—"}
        </span>
      </td>

      {/* Time taken */}
      <td className="px-4 py-3 tabular-nums text-sm text-slate-500 dark:text-slate-400">
        {formatTimeTaken(entry.timeTaken)}
      </td>
    </tr>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-16 w-full rounded-xl" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2 px-1">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const params = useParams<{ testId: string }>();
  const testId = params.testId;
  const [page, setPage] = useState(1);
  const LIMIT = 50;
  const { user } = useAuthStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: leaderboardKeys.test(testId, page),
    queryFn: () =>
      leaderboardApi
        .getByTest(testId, page, LIMIT)
        .then(unwrap<LeaderboardResponse>),
    staleTime: 1000 * 60 * 2, // 2 min
    placeholderData: (prev) => prev,
  });

  const entries = data?.entries ?? [];
  const totalPages =
    data?.pagination?.total && data?.pagination?.limit
      ? Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit))
      : 1;
  const myEntry = data?.currentUserEntry;

  // Podium — top 3 (only if we have them)
  const podiumEntries = entries.filter((e) => e.rank <= 3).slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1.5 gap-1 text-slate-500"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Leaderboard
            </h1>
          </div>
          {data && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="h-3.5 w-3.5" />
                {(data.pagination?.total ?? 0).toLocaleString()} participants
              </span>
            </p>
          )}
        </div>
      </div>

      {/* ── Your rank banner ──────────────────────────────────────────────── */}
      {myEntry && (
        <div className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <TrophyIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-100">Your Rank</p>
              <p className="text-2xl font-bold leading-none">
                #{myEntry.rank}
                {data && (
                  <span className="text-sm font-normal text-blue-200 ml-1">
                    / {(data.pagination?.total ?? 0).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-xs text-blue-200">Score</p>
              <p className="text-lg font-bold tabular-nums">{myEntry.score}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Accuracy</p>
              <p className="text-lg font-bold tabular-nums">
                {myEntry.accuracy !== null
                  ? `${Math.round(myEntry.accuracy)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Time</p>
              <p className="text-sm font-bold tabular-nums">
                {formatTimeTaken(myEntry.timeTaken)}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <LeaderboardSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertCircleIcon className="h-6 w-6 text-red-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Failed to load leaderboard.
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
      ) : (
        <>
          {/* ── Podium (top 3) ─────────────────────────────────────────── */}
          {podiumEntries.length === 3 && page === 1 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <div className="flex items-end justify-center gap-4">
                {/* Render order: 2nd, 1st, 3rd */}
                {[podiumEntries[1], podiumEntries[0], podiumEntries[2]].map(
                  (e, idx) =>
                    e && (
                      <PodiumSlot
                        key={`podium-${e.userId}-${e.rank || idx}`}
                        entry={e}
                        position={[2, 1, 3][idx] as 1 | 2 | 3}
                      />
                    ),
                )}
              </div>
            </div>
          )}

          {/* ── Full table ─────────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    {["Rank", "Student", "Score", "Accuracy", "Time"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-sm text-slate-400 dark:text-slate-500"
                      >
                        No submissions yet for this test.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry, index) => (
                      <LeaderboardRow
                        key={`table-${entry.userId}-${entry.rank || index}`}
                        entry={entry}
                        currentUserId={user?.id || null}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="gap-1"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" /> Prev
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-400 px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="gap-1"
              >
                Next <ChevronRightIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
