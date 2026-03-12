/**
 * app/(public)/exams/page.tsx
 *
 * Browse all available exam series / test series.
 * Dark-first · Amber accent · Sora + DM Sans typography
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
  q?: string
): Promise<TestSeries[]> {
  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/test-series?${params.toString()}&limit=24`,
      { next: { revalidate: 300 } }
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
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  ADVANCED: {
    label: "Advanced",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

// ── Series card ───────────────────────────────────────────────────────────────

function SeriesCard({ series }: { series: TestSeries }) {
  const level = LEVEL_CONFIG[series.level ?? "BEGINNER"];

  return (
    <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-amber-500/20 hover:bg-white/[0.04] transition-all duration-300 flex flex-col">
      {/* Top color bar */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:from-amber-500/60 group-hover:via-orange-500/60 group-hover:to-amber-500/60 transition-all duration-500" />

      {/* Thumbnail area */}
      <div className="h-28 relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex items-center justify-center">
        {/* Abstract background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 right-2 h-20 w-20 rounded-full bg-amber-500/20 blur-xl" />
          <div className="absolute bottom-0 left-4 h-16 w-16 rounded-full bg-orange-500/20 blur-xl" />
        </div>
        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-900/30 group-hover:scale-110 transition-transform duration-300">
          <BookOpenIcon className="h-7 w-7 text-white" />
        </div>
        {series.isPremium && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/15 border border-amber-500/20 rounded-full px-2 py-0.5">
            <LockIcon className="h-2.5 w-2.5 text-amber-400" />
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
              Premium
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Title */}
        <div>
          <h3 className="text-sm font-bold text-white leading-tight mb-1">
            {series.title}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            {series.examName}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <BookOpenIcon className="h-3 w-3" />
            <span>{series.testCount} tests</span>
          </span>
          {series.freeTestCount > 0 && (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              {series.freeTestCount} free
            </span>
          )}
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${level.className}`}
          >
            {level.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed flex-1">
          {series.description}
        </p>

        {/* CTA */}
        <Link href={`/series/${series.id}`} className="mt-auto">
          <Button
            size="sm"
            className={`w-full gap-1.5 h-9 text-xs font-bold rounded-xl transition-all ${
              series.isPremium
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-[#080c18] hover:border-amber-500"
                : "bg-white/5 text-white border border-white/10 hover:bg-amber-500 hover:text-[#080c18] hover:border-amber-500"
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
    <div className="col-span-full flex flex-col items-center py-24 text-center">
      <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
        <SearchIcon className="h-7 w-7 text-slate-600" />
      </div>
      <h3 className="text-base font-bold text-slate-300 mb-2">
        {query ? `No results for "${query}"` : "No exam series found"}
      </h3>
      <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
        Try a different search term or browse all exam categories above.
      </p>
      <Link href="/exams" className="mt-6">
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-slate-400 hover:text-white hover:border-amber-500/30"
        >
          Clear filters
        </Button>
      </Link>
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
    <div
      className="bg-[#080c18] min-h-screen text-white"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-sora { font-family: 'Sora', sans-serif; }
        .grid-bg {
          background-image: 
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .glow-text {
          background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080c18]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-600/8 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-5">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold px-4 py-2 rounded-full">
            <SparklesIcon className="h-3.5 w-3.5 text-amber-400" />
            1000+ Tests · NTA-Style · Bilingual · Instant Results
          </div>

          <h1
            className="font-sora text-3xl sm:text-5xl font-black text-white"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Browse <span className="glow-text">Exam Test Series</span>
          </h1>

          <p className="text-slate-500 text-base max-w-lg mx-auto">
            Find the perfect test series for your preparation. Filter by exam
            category or search directly.
          </p>

          {/* Search bar */}
          <Suspense
            fallback={
              <div className="max-w-xl mx-auto h-11 bg-white/[0.04] border border-white/[0.06] rounded-xl animate-pulse" />
            }
          >
            <ExamSearchBar defaultValue={q} defaultCategory={category} />
          </Suspense>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Category pills ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {CATEGORIES.map(({ value, label, emoji }) => {
            const isActive =
              (value === "" && !category) || category === value;
            return (
              <Link
                key={value}
                href={value ? `/exams?category=${value}` : "/exams"}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-amber-500 text-[#080c18] shadow-lg shadow-amber-900/30"
                    : "bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:border-amber-500/20 hover:bg-white/[0.07]"
                }`}
              >
                <span>{emoji}</span>
                {label}
              </Link>
            );
          })}
        </div>

        {/* ── Results info bar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              {seriesList.length > 0 ? (
                <>
                  <span className="text-white font-bold">
                    {seriesList.length}
                  </span>{" "}
                  series found
                  {category && (
                    <span className="text-amber-400 font-semibold">
                      {" "}
                      in {activeCategory?.label ?? category.toUpperCase()}
                    </span>
                  )}
                  {q && (
                    <span className="text-slate-400"> for "{q}"</span>
                  )}
                </>
              ) : (
                "No series found"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
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

        {/* ── Bottom upgrade CTA ───────────────────────────────────────────── */}
        {seriesList.length > 0 && (
          <div className="mt-16 relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-amber-950/40" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <div className="absolute inset-0 grid-bg opacity-20" />

            <div className="relative z-10 p-8 sm:p-10 text-center">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
                <LockIcon className="h-3.5 w-3.5 text-amber-400" />
                Premium Access
              </div>
              <h3
                className="font-sora text-xl sm:text-2xl font-black text-white mb-3"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Want unlimited access to all test series?
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Get unlimited tests, PDF solutions, video explanations, and
                priority support with a premium plan.
              </p>
              <Link href="/plans">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-[#080c18] font-black gap-2 h-11 px-8 rounded-xl hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/30 border-0">
                  View Pricing Plans
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}