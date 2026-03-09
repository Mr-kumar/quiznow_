/**
 * app/(public)/exams/[examId]/page.tsx
 *
 * Exam Detail Page — shows all test series for a specific exam.
 * URL: /exams/[examId]
 *
 * Server Component — SSR, revalidate 300s.
 * generateMetadata: dynamic title + OG per exam.
 * JSON-LD: Course schema for SEO rich results.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BookOpenIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LockIcon,
  PlayCircleIcon,
  LayersIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Exam, TestSeries } from "@/api/tests";

// ── Data fetching ─────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function getExam(examId: string): Promise<Exam | null> {
  try {
    const res = await fetch(`${API}/exams/${examId}`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error();
    const json = await res.json();
    return (json?.data ?? json) as Exam;
  } catch {
    return null;
  }
}

async function getSeriesForExam(examId: string): Promise<TestSeries[]> {
  try {
    const res = await fetch(`${API}/test-series?examId=${examId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error();
    const json = await res.json();
    return ((json?.data ?? json) as TestSeries[]) ?? [];
  } catch {
    return [];
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ examId: string }>;
}): Promise<Metadata> {
  const { examId } = await params;
  const exam = await getExam(examId);
  if (!exam) return { title: "Exam Not Found | QuizNow" };
  return {
    title: `${exam.name} Mock Tests & Practice Papers | QuizNow`,
    description: `Prepare for ${exam.name} with India's best mock tests. NTA-style, bilingual, instant results with explanations.`,
    openGraph: {
      title: `${exam.name} Mock Tests | QuizNow`,
      description: `Practice with ${exam.name} mock tests. Instant results and detailed analytics.`,
    },
  };
}

// ── Series card ───────────────────────────────────────────────────────────────

function SeriesCard({ series }: { series: TestSeries }) {
  return (
    <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 flex flex-col">
      <div className="h-24 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
          <LayersIcon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
            {series.title}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            <CalendarIcon className="h-3 w-3" />
            {new Date(series.createdAt).getFullYear()}
          </div>
        </div>
        <Link href={`/series/${series.id}`} className="mt-auto">
          <Button
            size="sm"
            className="w-full h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlayCircleIcon className="h-3 w-3" />
            View Tests
            <ArrowRightIcon className="h-3 w-3 ml-auto" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const [exam, seriesList] = await Promise.all([
    getExam(examId),
    getSeriesForExam(examId),
  ]);
  if (!exam) notFound();

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${exam.name} Mock Tests`,
    description: `Practice for ${exam.name} with NTA-style mock tests`,
    provider: {
      "@type": "Organization",
      name: "QuizNow",
      url: "https://quiznow.in",
    },
  };

  return (
    <>
      <JsonLd data={courseSchema} />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Hero */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-4">
              <Link href="/" className="hover:text-blue-600">
                Home
              </Link>
              <span>›</span>
              <Link href="/exams" className="hover:text-blue-600">
                Exams
              </Link>
              <span>›</span>
              <span className="text-slate-600 dark:text-slate-400">
                {exam.name}
              </span>
            </nav>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {exam.name}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {seriesList.length} test series available
                </p>
                {exam.category && (
                  <Badge variant="outline" className="text-xs">
                    {exam.category.name}
                  </Badge>
                )}
              </div>
              <Link href="/exams">
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <ArrowLeftIcon className="h-3.5 w-3.5" /> All Exams
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Series grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {seriesList.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <BookOpenIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No test series yet
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
                We're adding {exam.name} series soon. Check back shortly.
              </p>
              <Link href="/exams" className="mt-4">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowLeftIcon className="h-3.5 w-3.5" /> Browse Other Exams
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                {seriesList.length} series found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {seriesList.map((s) => (
                  <SeriesCard key={s.id} series={s} />
                ))}
              </div>
            </>
          )}

          <div className="mt-10 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-center text-white">
            <LockIcon className="h-6 w-6 mx-auto mb-2 opacity-80" />
            <h3 className="font-semibold mb-1">
              Unlock all premium test series
            </h3>
            <p className="text-blue-100 text-sm mb-4">
              Unlimited access to {exam.name} and 30+ exam categories.
            </p>
            <Link href="/plans">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 gap-1.5 text-sm font-semibold">
                View Plans <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
