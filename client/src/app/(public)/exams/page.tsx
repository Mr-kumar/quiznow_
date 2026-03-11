/**
 * app/(public)/exams/page.tsx
 *
 * Browse all available exam series / test series.
 *
 * Layout:
 *  [Hero — "Browse Exams" headline + search bar]
 *  [Category filter pills]
 *  [Test series grid — cards with title, count, level, CTA]
 *
 * Server Component — fetches exam series from API at build/request time.
 * Falls back to empty state gracefully if API is down.
 *
 * URL: /exams?category=upsc&q=mock
 */

import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  SearchIcon,
  BookOpenIcon,
  ClockIcon,
  BarChart3Icon,
  ArrowRightIcon,
  LockIcon,
  PlayCircleIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExamSearchBar } from "@/app/(public)/exams/ExamSearchBar";

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Browse Exams | QuizNow — India's Best Online Test Platform",
  description:
    "Practice with 1000+ mock tests for UPSC, SSC, Banking, Railways, NEET, JEE and more.",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface TestSeries {
  id: string;
  title: string;
  examName: string;
  description: string;
  category: string;
  testCount: number;
  freeTestCount: number;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  isPremium: boolean;
  thumbnail?: string;
  latestYear?: string;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getExamSeries(
  category?: string,
  q?: string,
): Promise<TestSeries[]> {
  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/test-series?${params.toString()}&limit=24`,
      { next: { revalidate: 300 } }, // 5 min cache
    );

    if (!res.ok) throw new Error("API error");
    const json = await res.json();
    return (json?.data ?? json) as TestSeries[];
  } catch {
    // Return empty — page degrades gracefully
    return [];
  }
}

// ── Category filter config ────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "", label: "All Exams" },
  { value: "upsc", label: "UPSC" },
  { value: "ssc", label: "SSC" },
  { value: "banking", label: "Banking" },
  { value: "railways", label: "Railways" },
  { value: "gate", label: "GATE" },
  { value: "neet", label: "NEET / Medical" },
  { value: "jee", label: "JEE / Engineering" },
  { value: "cat", label: "CAT / MBA" },
  { value: "defence", label: "Defence" },
  { value: "state", label: "State PSC" },
];

const LEVEL_BADGE: Record<string, string> = {
  BEGINNER:
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  INTERMEDIATE:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  ADVANCED: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

// ── Series card ───────────────────────────────────────────────────────────────

function SeriesCard({ series }: { series: TestSeries }) {
  return (
    <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 flex flex-col">
      {/* Card thumbnail */}
      <div className="h-28 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
        <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <BookOpenIcon className="h-7 w-7 text-white" />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Title + badges */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {series.title}
            </h3>
            {series.isPremium && (
              <LockIcon className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {series.examName}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <BookOpenIcon className="h-3 w-3" />
            {series.testCount} tests
          </span>
          {series.freeTestCount > 0 && (
            <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">
              {series.freeTestCount} free
            </span>
          )}
          <Badge
            className={`text-[10px] h-4 px-1.5 ${LEVEL_BADGE[series.level || "BEGINNER"]}`}
            variant="secondary"
          >
            {series.level
              ? series.level.charAt(0) + series.level.slice(1).toLowerCase()
              : "Beginner"}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed flex-1">
          {series.description}
        </p>

        {/* CTA */}
        <Link href={`/series/${series.id}`} className="mt-auto">
          <Button
            size="sm"
            className={`w-full gap-1.5 h-8 text-xs ${
              series.isPremium
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {series.isPremium ? (
              <LockIcon className="h-3 w-3" />
            ) : (
              <PlayCircleIcon className="h-3 w-3" />
            )}
            {series.isPremium ? "Unlock Series" : "Start Practicing"}
            <ArrowRightIcon className="h-3 w-3 ml-auto" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="col-span-full flex flex-col items-center py-16 text-center">
      <SearchIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {query ? `No results for "${query}"` : "No exam series found"}
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
        Try a different search term or browse all exam categories.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function ExamsPage({ searchParams }: PageProps) {
  const { category, q } = await searchParams;

  const seriesList = await getExamSeries(category, q);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Browse Exam Test Series
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-lg mx-auto">
            1000+ mock tests · NTA-style interface · Bilingual · Instant results
          </p>

          {/* Search bar — client component for real-time filtering */}
          <Suspense
            fallback={
              <div className="max-w-xl mx-auto h-11 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            }
          >
            <ExamSearchBar defaultValue={q} defaultCategory={category} />
          </Suspense>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Category pills ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {CATEGORIES.map(({ value, label }) => {
            const isActive = (value === "" && !category) || category === value;
            return (
              <Link
                key={value}
                href={value ? `/exams?category=${value}` : "/exams"}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* ── Results count ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {seriesList.length > 0
              ? `${seriesList.length} series found${category ? ` in ${category.toUpperCase()}` : ""}${q ? ` for "${q}"` : ""}`
              : "No series found"}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <BarChart3Icon className="h-3.5 w-3.5" />
            Sorted by popularity
          </div>
        </div>

        {/* ── Series grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {seriesList.length === 0 ? (
            <EmptyState query={q} />
          ) : (
            seriesList.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))
          )}
        </div>

        {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
        {seriesList.length > 0 && (
          <div className="mt-12 text-center py-8 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/50">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Want access to all premium test series?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Get unlimited tests, PDF solutions, and priority support.
            </p>
            <Link href="/plans">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                View Pricing Plans
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
