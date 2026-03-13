"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  TrophyIcon,
  SearchIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ClockIcon,
  BarChart2Icon,
  LayersIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { studentTestsApi } from "@/api/tests";
import { testKeys } from "@/api/query-keys";
import { useDebounce } from "@/hooks/use-debounce";
import type { Test } from "@/api/tests";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Group {
  seriesId: string;
  seriesName: string;
  tests: Test[];
}

// ─── Accent colour per series index ───────────────────────────────────────────
const ACCENTS = [
  { dot: "bg-violet-500", badge: "bg-violet-50 text-violet-600", header: "bg-violet-50 border-violet-100", icon: "bg-violet-500", chevron: "text-violet-500" },
  { dot: "bg-sky-500",    badge: "bg-sky-50 text-sky-600",       header: "bg-sky-50 border-sky-100",       icon: "bg-sky-500",    chevron: "text-sky-500" },
  { dot: "bg-emerald-500",badge: "bg-emerald-50 text-emerald-600",header:"bg-emerald-50 border-emerald-100",icon:"bg-emerald-500",chevron:"text-emerald-500"},
  { dot: "bg-amber-500",  badge: "bg-amber-50 text-amber-600",   header: "bg-amber-50 border-amber-100",   icon: "bg-amber-500",  chevron: "text-amber-500" },
  { dot: "bg-rose-500",   badge: "bg-rose-50 text-rose-600",     header: "bg-rose-50 border-rose-100",     icon: "bg-rose-500",   chevron: "text-rose-500" },
  { dot: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-600", header: "bg-indigo-50 border-indigo-100", icon: "bg-indigo-500", chevron: "text-indigo-500"},
];
const a = (i: number) => ACCENTS[i % ACCENTS.length];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LeaderboardIndexPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeSeries, setActiveSeries] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchInput, 400);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: testKeys.list({ page: 1, search: debouncedSearch }),
    queryFn: async () => {
      const res = await studentTestsApi.getAll(1, 100, debouncedSearch || undefined);
      const inner = (res.data as any)?.data ?? res.data;
      if (inner && typeof inner === "object" && Array.isArray(inner.data)) return inner.data as Test[];
      return Array.isArray(inner) ? inner : ([] as Test[]);
    },
    staleTime: 1000 * 60 * 5,
  });

  const tests = data ?? [];

  const groups: Group[] = useMemo(() => {
    const map: Record<string, Group> = {};
    tests.forEach((test) => {
      const id = test.seriesId || "unassigned";
      const name = test.series?.title || "Standalone Tests";
      if (!map[id]) map[id] = { seriesId: id, seriesName: name, tests: [] };
      map[id].tests.push(test);
    });
    return Object.values(map).sort((a, b) => a.seriesName.localeCompare(b.seriesName));
  }, [tests]);

  const selectedId = activeSeries ?? groups[0]?.seriesId ?? null;
  const selectedGroup = groups.find((g) => g.seriesId === selectedId) ?? groups[0];
  const selectedIndex = groups.findIndex((g) => g.seriesId === selectedId);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center">
              <TrophyIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">Leaderboards</p>
              {!isLoading && !isError && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {tests.length} tests across {groups.length} series
                </p>
              )}
            </div>
          </div>

          {/* Right: search */}
          <div className="relative w-60">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search tests…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 placeholder:text-slate-400 rounded-lg focus-visible:ring-slate-300"
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : tests.length === 0 ? (
          <EmptyState searched={!!debouncedSearch} />
        ) : (
          <div className="flex gap-5 items-start">

            {/* ──────────────────────────────────────────────────────── */}
            {/* LEFT: Series navigation */}
            {/* ──────────────────────────────────────────────────────── */}
            <aside className="w-52 shrink-0 sticky top-24">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-2">
                Series
              </p>
              <nav className="space-y-0.5">
                {groups.map((group, gi) => {
                  const col = a(gi);
                  const isActive = group.seriesId === selectedId;
                  return (
                    <button
                      key={group.seriesId}
                      onClick={() => setActiveSeries(group.seriesId)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-sm",
                        isActive
                          ? "bg-white shadow-sm border border-slate-200 font-semibold text-slate-900"
                          : "text-slate-500 hover:bg-white hover:text-slate-700"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full shrink-0", col.dot)} />
                      <span className="flex-1 truncate leading-tight">{group.seriesName}</span>
                      <span className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                        isActive ? col.badge : "bg-slate-100 text-slate-400"
                      )}>
                        {group.tests.length}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* ──────────────────────────────────────────────────────── */}
            {/* RIGHT: Test list */}
            {/* ──────────────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {selectedGroup && (
                <>
                  {/* Series header banner */}
                  <div className={cn(
                    "flex items-center justify-between rounded-2xl border p-5 mb-4",
                    a(selectedIndex).header
                  )}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <LayersIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          Series
                        </span>
                      </div>
                      <p className="text-xl font-bold text-slate-900">{selectedGroup.seriesName}</p>
                      <p className="text-sm text-slate-500">
                        {selectedGroup.tests.length} test{selectedGroup.tests.length !== 1 ? "s" : ""} — click any to view rankings
                      </p>
                    </div>
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", a(selectedIndex).icon)}>
                      <TrophyIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Test rows */}
                  <div className="space-y-2">
                    {selectedGroup.tests.map((test, ti) => (
                      <TestRow
                        key={test.id}
                        test={test}
                        position={ti + 1}
                        accentIndex={selectedIndex}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ─── Test Row ─────────────────────────────────────────────────────────────────
function TestRow({
  test,
  position,
  accentIndex,
}: {
  test: Test;
  position: number;
  accentIndex: number;
}) {
  const col = a(accentIndex);
  const isTop3 = position <= 3;

  return (
    <Link href={`/leaderboard/${test.id}`} className="group block">
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-4 hover:border-slate-300 hover:shadow-sm transition-all">

        {/* Position badge */}
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black transition-all",
          isTop3
            ? cn(col.icon, "text-white")
            : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
        )}>
          {position}
        </div>

        {/* Test name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 truncate leading-tight">
            {test.title}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <MetaChip icon={<BarChart2Icon className="h-3 w-3" />} label={`${test.totalMarks} marks`} />
            {test.durationMins && (
              <MetaChip icon={<ClockIcon className="h-3 w-3" />} label={`${test.durationMins} min`} />
            )}
            {test.isLive && <LiveBadge />}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "text-xs font-semibold hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity",
            col.chevron
          )}>
            View rankings
          </span>
          <div className={cn(
            "h-7 w-7 rounded-full border flex items-center justify-center transition-all",
            "border-slate-200 group-hover:border-current",
            col.chevron
          )}>
            <ChevronRightIcon className="h-3.5 w-3.5 group-hover:translate-x-px transition-transform" />
          </div>
        </div>

      </div>
    </Link>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────
function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
      {icon}
      {label}
    </span>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </span>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex gap-5">
      <div className="w-52 shrink-0 space-y-1.5">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-24 rounded-2xl mb-4" />
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
      <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
        <AlertCircleIcon className="h-5 w-5 text-red-400" />
      </div>
      <div>
        <p className="font-semibold text-slate-700">Failed to load leaderboards</p>
        <p className="text-sm text-slate-400 mt-1">Something went wrong. Please try again.</p>
      </div>
      <Button onClick={onRetry} variant="outline" size="sm" className="gap-2 mt-1">
        <RefreshCwIcon className="h-4 w-4" /> Retry
      </Button>
    </div>
  );
}

function EmptyState({ searched }: { searched: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-3 text-center">
      <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
        <TrophyIcon className="h-5 w-5 text-amber-400" />
      </div>
      <p className="font-semibold text-slate-700">
        {searched ? "No tests matched your search" : "No leaderboards yet"}
      </p>
      <p className="text-sm text-slate-400 max-w-xs">
        {searched
          ? "Try different keywords or clear the search."
          : "Leaderboards will appear once tests are published."}
      </p>
    </div>
  );
}