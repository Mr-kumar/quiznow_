/**
 * app/(public)/exams/page.tsx
 *
 * Browse all available exam series / test series.
 * Modern clean design with shadcn components
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
  FilterIcon,
  TrendingUpIcon,
  UsersIcon,
  ClockIcon,
  TargetIcon,
  StarIcon,
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
import { Separator } from "@/components/ui/separator";
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
      { next: { revalidate: 300 } },
    );

    if (!res.ok) throw new Error("API error");
    const json = await res.json();
    return (json?.data ?? json) as TestSeries[];
  } catch {
    return [];
  }
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "", label: "All Exams", emoji: "✨" },
  { value: "upsc", label: "UPSC", emoji: "🏛️" },
  { value: "ssc", label: "SSC", emoji: "📋" },
  { value: "banking", label: "Banking", emoji: "🏦" },
  { value: "railways", label: "Railways", emoji: "🚂" },
  { value: "gate", label: "GATE", emoji: "💻" },
  { value: "neet", label: "NEET", emoji: "🧬" },
  { value: "jee", label: "JEE", emoji: "⚗️" },
  { value: "cat", label: "CAT / MBA", emoji: "📊" },
  { value: "defence", label: "Defence", emoji: "🛡️" },
  { value: "state", label: "State PSC", emoji: "🗺️" },
];

const LEVEL_CONFIG = {
  BEGINNER: {
    label: "Beginner",
    variant: "default" as const,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    variant: "secondary" as const,
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  ADVANCED: {
    label: "Advanced",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

// ── Series card ───────────────────────────────────────────────────────────────

function SeriesCard({ series }: { series: TestSeries }) {
  const level = LEVEL_CONFIG[series.level ?? "BEGINNER"];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
            <BookOpenIcon className="h-6 w-6" />
          </div>
          {series.isPremium && (
            <Badge variant="secondary" className="gap-1">
              <LockIcon className="h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <CardTitle className="text-lg leading-tight mb-2">
            {series.title}
          </CardTitle>
          <CardDescription className="text-sm">
            {series.examName}
          </CardDescription>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BookOpenIcon className="h-4 w-4" />
            <span>{series.testCount} tests</span>
          </div>
          {series.freeTestCount > 0 && (
            <Badge
              variant="outline"
              className="text-green-600 border-green-200"
            >
              {series.freeTestCount} free
            </Badge>
          )}
          <Badge variant={level.variant} className={level.className}>
            {level.label}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {series.description}
        </p>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/series/${series.id}`} className="w-full">
          <Button className="w-full gap-2">
            {series.isPremium ? (
              <>
                <LockIcon className="h-4 w-4" />
                Unlock Series
              </>
            ) : (
              <>
                <PlayCircleIcon className="h-4 w-4" />
                Start Practicing
              </>
            )}
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="col-span-full flex flex-col items-center py-24 text-center">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">
            {query ? `No results for "${query}"` : "No exam series found"}
          </CardTitle>
          <CardDescription className="mb-6">
            Try a different search term or browse all exam categories above.
          </CardDescription>
          <Link href="/exams">
            <Button variant="outline" className="w-full">
              Clear filters
            </Button>
          </Link>
        </CardContent>
      </Card>
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

  const activeCategory = CATEGORIES.find((c) => c.value === (category ?? ""));

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .hero-gradient {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 50%, hsl(var(--accent)) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <section className="relative py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary text-primary-foreground">
            <SparklesIcon className="h-4 w-4 mr-2" />
            1000+ Tests · NTA-Style · Bilingual · Instant Results
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Browse <span className="hero-gradient">Exam Test Series</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find the perfect test series for your preparation. Filter by exam
            category or search directly.
          </p>

          {/* Search bar */}
          <Suspense
            fallback={
              <div className="max-w-xl mx-auto h-12 bg-muted rounded-xl animate-pulse" />
            }
          >
            <ExamSearchBar defaultValue={q} defaultCategory={category} />
          </Suspense>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Category Filters ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FilterIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Filter by Category
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label, emoji }) => {
              const isActive =
                (value === "" && !category) || category === value;
              return (
                <Button
                  key={value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link href={value ? `/exams?category=${value}` : "/exams"}>
                    <span className="mr-2">{emoji}</span>
                    {label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        {/* ── Results Info ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {seriesList.length > 0 ? (
                <>
                  <span className="font-semibold text-foreground">
                    {seriesList.length}
                  </span>{" "}
                  test series found
                  {category && (
                    <span className="text-primary">
                      {" "}
                      in {activeCategory?.label ?? category.toUpperCase()}
                    </span>
                  )}
                  {q && (
                    <span className="text-muted-foreground"> for "{q}"</span>
                  )}
                </>
              ) : (
                "No series found"
              )}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3Icon className="h-3 w-3" />
              Sorted by popularity
            </div>
          </div>
        </div>

        {/* ── Series Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {seriesList.length === 0 ? (
            <EmptyState query={q} />
          ) : (
            seriesList.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))
          )}
        </div>

        {/* ── Premium CTA ─────────────────────────────────────────────────── */}
        {seriesList.length > 0 && (
          <Card className="mt-16 bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <Badge variant="secondary" className="gap-2">
                  <LockIcon className="h-4 w-4" />
                  Premium Access
                </Badge>
                <h3 className="text-2xl font-bold text-foreground">
                  Want unlimited access to all test series?
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Get unlimited tests, PDF solutions, video explanations, and
                  priority support with a premium plan.
                </p>
                <Link href="/plans">
                  <Button size="lg" className="gap-2">
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
