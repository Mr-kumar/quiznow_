/**
 * app/(public)/exams/page.tsx  — Enhanced
 *
 * Multi-page feel: when no category is selected, show a VISUAL category
 * landing grid (like choosing your path). Once a category is chosen, show
 * a category hero + sub-exam chips + test series grid.
 *
 * This replaces the single flat filter-pill approach with:
 *  1. Category landing   → /exams
 *  2. Category page      → /exams?category=upsc
 *  3. Search results     → /exams?q=...
 *
 * URL: /exams?category=upsc&q=mock
 */

import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  SearchIcon,
  BookOpenIcon,
  BarChart3Icon,
  ArrowRightIcon,
  LockIcon,
  PlayCircleIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
  StarIcon,
  ArrowLeftIcon,
  FilterIcon,
  CheckCircleIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExamSearchBar } from "@/app/(public)/exams/ExamSearchBar";
import { EXAM_CATEGORIES as CATEGORIES } from "@/constants/exams";
import { publicApi } from "@/api/public";
import type { TestSeries } from "@/api/test-types";

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Browse Exams | QuizNow — India's Best Online Test Platform",
  description:
    "Practice with 1000+ mock tests for UPSC, SSC, Banking, Railways, NEET, JEE and more.",
};

// ── Category config is imported from shared constants ───────────────────────

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getExamSeries(
  category?: string,
  q?: string
): Promise<TestSeries[]> {
  try {
    const params: any = { limit: 24 };
    if (category) params.category = category;
    if (q) params.q = q;

    const res = await publicApi.getTestSeries(params);
    return (res.data as any) ?? res;
  } catch {
    return [];
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  BEGINNER: {
    label: "Beginner",
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  },
  ADVANCED: {
    label: "Advanced",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  },
} as const;

function SeriesCard({ series }: { series: TestSeries }) {
  const levelKey = (series.level ?? "BEGINNER") as keyof typeof LEVEL_CONFIG;
  const level = LEVEL_CONFIG[levelKey];
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-11 w-11 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shrink-0">
            <BookOpenIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {series.isPremium && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <LockIcon className="h-2.5 w-2.5" />
                Premium
              </Badge>
            )}
            {typeof series.freeTestCount === "number" &&
              series.freeTestCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200 dark:border-green-800 text-xs"
                >
                  {series.freeTestCount} free
                </Badge>
              )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-base leading-snug mb-1">
            {series.title}
          </CardTitle>
          <CardDescription className="text-xs">
            {series.examName}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpenIcon className="h-3.5 w-3.5" />
            <span>{series.testCount} tests</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${level.className}`}
          >
            {level.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {series.description}
        </p>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/series/${series.id}`} className="w-full">
          <Button size="sm" className="w-full gap-2 text-xs">
            {series.isPremium ? (
              <>
                <LockIcon className="h-3.5 w-3.5" />
                Unlock Series
              </>
            ) : (
              <>
                <PlayCircleIcon className="h-3.5 w-3.5" />
                Start Practicing
              </>
            )}
            <ArrowRightIcon className="h-3.5 w-3.5 ml-auto" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// ── Category Landing (no filter selected) ─────────────────────────────────────

export function CategoryLanding({ q }: { q?: string }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-16 bg-linear-to-br from-blue-50 via-background to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-600 text-white">
            <SparklesIcon className="h-3.5 w-3.5 mr-2" />
            1500+ Tests · NTA-Style · Bilingual · Instant Results
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Which exam are you
            <br />
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              preparing for?
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Select your exam category below to see tailored test series,
            previous year papers, and study material.
          </p>
          <Suspense
            fallback={
              <div className="max-w-xl mx-auto h-12 bg-muted rounded-xl animate-pulse" />
            }
          >
            <ExamSearchBar defaultValue={q} />
          </Suspense>
        </div>
      </section>

      {/* Category grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center gap-2 mb-8">
          <FilterIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">
            Choose your exam category
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/exams?category=${cat.id}`}>
              <div
                className={`group h-full rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${cat.lightBg} ${cat.darkBg} ${cat.border}`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className="text-xs font-semibold bg-white/70 dark:bg-black/30 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300 border border-white/50 dark:border-white/10">
                    {cat.count} tests
                  </span>
                </div>

                {/* Title */}
                <h3
                  className={`font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:${cat.accent} transition-colors leading-tight`}
                >
                  {cat.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  {cat.tagline}
                </p>

                {/* Sub-exam chips */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {cat.subs.slice(0, 3).map((sub) => (
                    <span
                      key={sub}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30 border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium"
                    >
                      {sub}
                    </span>
                  ))}
                  {cat.subs.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30 border border-white/50 dark:border-white/10 text-slate-400 dark:text-slate-500">
                      +{cat.subs.length - 3} more
                    </span>
                  )}
                </div>

                {/* Students */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <UsersIcon className="h-3.5 w-3.5" />
                    {cat.students} students
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats strip */}
        <div className="mt-12 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 flex flex-wrap items-center justify-around gap-4 text-white">
          {[
            { n: "1500+", l: "Mock Tests" },
            { n: "8", l: "Exam Categories" },
            { n: "2M+", l: "Students" },
            { n: "10 yrs", l: "Previous Year Papers" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-2xl font-bold">{s.n}</p>
              <p className="text-sm text-blue-100">{s.l}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Category Page (category selected) ────────────────────────────────────────

function CategoryPage({
  cat,
  seriesList,
  q,
  level,
}: {
  cat: (typeof CATEGORIES)[0];
  seriesList: TestSeries[];
  q?: string;
  level?: string;
}) {
  // Data-driven level filters based on actual series.level values
  const availableLevels = Array.from(
    new Set(
      seriesList.map((s) => s.level).filter((l): l is string => Boolean(l))
    )
  );
  const filteredSeries =
    level && availableLevels.includes(level)
      ? seriesList.filter((s) => s.level === level)
      : seriesList;

  return (
    <div className="min-h-screen bg-background">
      {/* Category hero */}
      <section
        className={`relative py-12 border-b border-slate-200 dark:border-slate-800 ${cat.lightBg} ${cat.darkBg}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/exams"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            All Exams
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-5xl">{cat.emoji}</span>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                    {cat.label}
                  </h1>
                  <p className="text-muted-foreground mt-1">{cat.tagline}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
                <span className={`font-semibold ${cat.accent}`}>
                  {cat.count} test series
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {cat.students} enrolled
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <StarIcon className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  4.8 rating
                </span>
              </div>
            </div>

            {/* Sub-exam filter chips */}
            <div className="flex flex-wrap gap-2 md:max-w-sm">
              {cat.subs.map((sub) => (
                <Link
                  key={sub}
                  href={`/exams?category=${cat.id}&q=${encodeURIComponent(
                    sub
                  )}`}
                >
                  <span
                    className={`inline-block text-xs font-medium px-3 py-1.5 rounded-full border bg-white/70 dark:bg-black/30 border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors cursor-pointer ${
                      q === sub ? "bg-blue-600 text-white border-blue-600" : ""
                    }`}
                  >
                    {sub}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-3 mt-5">
            {cat.highlights.map((h) => (
              <div
                key={h}
                className="flex items-center gap-1.5 text-xs bg-white/70 dark:bg-black/30 border border-white/50 dark:border-white/10 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-200"
              >
                <CheckCircleIcon className={`h-3.5 w-3.5 ${cat.accent}`} />
                {h}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Suspense
                fallback={
                  <div className="h-11 bg-muted rounded-xl animate-pulse" />
                }
              >
                <ExamSearchBar defaultValue={q} defaultCategory={cat.id} />
              </Suspense>
            </div>
            <p className="text-sm text-muted-foreground shrink-0">
              <span className="font-semibold text-foreground">
                {filteredSeries.length}
              </span>{" "}
              series found
              {q && <span className="text-muted-foreground"> for "{q}"</span>}
              {level && availableLevels.includes(level) && (
                <span className="text-muted-foreground">
                  {" "}
                  · level <span className="font-semibold">{level}</span>
                </span>
              )}
            </p>
          </div>

          {/* Level filters — driven by series.level, no hard-coded labels */}
          {availableLevels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/exams?category=${cat.id}${
                  q ? `&q=${encodeURIComponent(q)}` : ""
                }`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  !level
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white/80 dark:bg-black/30 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
              >
                <FilterIcon className="h-3 w-3" />
                All levels
              </Link>
              {availableLevels.map((lvl) => (
                <Link
                  key={lvl}
                  href={`/exams?category=${cat.id}${
                    q ? `&q=${encodeURIComponent(q)}` : ""
                  }&level=${encodeURIComponent(lvl)}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    level === lvl
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white/80 dark:bg-black/30 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                >
                  <FilterIcon className="h-3 w-3" />
                  {lvl}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Series grid */}
        {filteredSeries.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <Card className="max-w-md w-full">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg mb-2">
                  {q ? `No results for "${q}"` : "No series yet"}
                </CardTitle>
                <CardDescription className="mb-5">
                  Try searching for a specific sub-exam or browse all
                  categories.
                </CardDescription>
                <Link href={`/exams?category=${cat.id}`}>
                  <Button variant="outline" className="w-full">
                    Clear search
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredSeries.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
        )}

        {/* Premium CTA */}
        {seriesList.length > 0 && (
          <Card className="mt-14 bg-linear-to-br from-blue-600 to-indigo-600 border-0 text-white">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <Badge className="bg-white/20 text-white border-0">
                  <LockIcon className="h-3.5 w-3.5 mr-1.5" />
                  Premium Access
                </Badge>
                <h3 className="text-2xl font-bold">
                  Unlock all {cat.count} {cat.shortLabel} test series
                </h3>
                <p className="text-blue-100 max-w-md mx-auto">
                  Get unlimited tests, PDF solutions, video explanations, and
                  priority support.
                </p>
                <Link href="/plans">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 font-bold gap-2 mt-2"
                  >
                    View Pricing Plans
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string; level?: string }>;
}

export default async function ExamsPage({ searchParams }: PageProps) {
  const { category, q, level } = await searchParams;

  // No category selected → show visual landing
  if (!category && !q) {
    return <CategoryLanding />;
  }

  // Search without category
  if (!category && q) {
    const seriesList = await getExamSeries(undefined, q);
    return (
      <div className="min-h-screen bg-background">
        <section className="py-12 bg-muted/30 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href="/exams"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              All Exams
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Search results for "<span className="text-blue-600">{q}</span>"
            </h1>
            <Suspense
              fallback={
                <div className="h-11 bg-muted rounded-xl animate-pulse" />
              }
            >
              <ExamSearchBar defaultValue={q} />
            </Suspense>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-sm text-muted-foreground mb-6">
            <span className="font-semibold text-foreground">
              {seriesList.length}
            </span>{" "}
            series found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {seriesList.length === 0 ? (
              <div className="col-span-full flex flex-col items-center py-20 text-center">
                <SearchIcon className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-semibold text-lg">No results found</p>
                <Link href="/exams" className="mt-4">
                  <Button variant="outline">Browse all exams</Button>
                </Link>
              </div>
            ) : (
              seriesList.map((s) => <SeriesCard key={s.id} series={s} />)
            )}
          </div>
        </div>
      </div>
    );
  }

  // Category selected → show category page
  const cat = CATEGORIES.find((c) => c.id === category);
  if (!cat) {
    return <CategoryLanding />;
  }

  const seriesList = await getExamSeries(category, q);
  return <CategoryPage cat={cat} seriesList={seriesList} q={q} level={level} />;
}
