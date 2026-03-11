/**
 * app/(public)/series/[seriesId]/page.tsx
 *
 * Test Series Page — shows all tests within a series.
 * URL: /series/[seriesId]
 *
 * Layout:
 *  [Hero — series title, exam name, test count]
 *  [CountdownBanner if live test is upcoming]
 *  [Test cards grid — title, duration, marks, CTA]
 *
 * Server Component — SSR, revalidate 300s.
 * Premium tests wrapped with SubscriptionGate concept (visual lock on card).
 * SubscriptionGate actual auth check happens on the instructions page.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ClockIcon,
  TargetIcon,
  PlayCircleIcon,
  LockIcon,
  ArrowLeftIcon,
  TrophyIcon,
  CalendarIcon,
  ZapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Test, TestSeries } from "@/api/tests";

// ── Data fetching ─────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function getSeries(seriesId: string): Promise<TestSeries | null> {
  try {
    const res = await fetch(`${API}/public/test-series/${seriesId}`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error();
    const json = await res.json();
    return (json?.data ?? json) as TestSeries;
  } catch {
    return null;
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}): Promise<Metadata> {
  const { seriesId } = await params;
  const series = await getSeries(seriesId);
  if (!series) return { title: "Series Not Found | QuizNow" };
  return {
    title: `${series.title} — Mock Tests | QuizNow`,
    description: `Take ${series.title} mock tests. NTA-style exam interface with instant results and detailed explanations.`,
  };
}

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

function isUpcoming(test: Test): boolean {
  if (!test.startAt) return false;
  return new Date(test.startAt).getTime() > Date.now();
}

function isExpired(test: Test): boolean {
  if (!test.endAt) return false;
  return new Date(test.endAt).getTime() < Date.now();
}

// ── Test card ─────────────────────────────────────────────────────────────────

function TestCard({ test }: { test: Test }) {
  const live = isLiveNow(test);
  const upcoming = isUpcoming(test);
  const expired = isExpired(test);
  const locked = test.isPremium; // visual only — actual gate on instructions page

  return (
    <div
      className={`group rounded-2xl border-2 bg-white dark:bg-slate-900 overflow-hidden transition-all duration-200 ${
        live
          ? "border-green-400 dark:border-green-600 shadow-lg shadow-green-500/10"
          : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
      }`}
    >
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {live && (
                <Badge className="bg-green-500 text-white border-transparent text-[10px] px-2 h-4 animate-pulse">
                  🔴 LIVE
                </Badge>
              )}
              {upcoming && (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-300 dark:border-amber-700 text-[10px] px-2 h-4"
                >
                  <CalendarIcon className="h-2.5 w-2.5 mr-1" />
                  Upcoming
                </Badge>
              )}
              {expired && (
                <Badge
                  variant="outline"
                  className="text-slate-400 border-slate-300 text-[10px] px-2 h-4"
                >
                  Expired
                </Badge>
              )}
              {locked && (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-300 dark:border-amber-700 text-[10px] px-2 h-4"
                >
                  <LockIcon className="h-2.5 w-2.5 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
              {test.title}
            </h3>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <ClockIcon className="h-3.5 w-3.5 shrink-0" />
            {formatDuration(test.durationMins)}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <TargetIcon className="h-3.5 w-3.5 shrink-0" />
            {test.totalMarks} marks
          </div>
          {test.passMarks > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <TrophyIcon className="h-3.5 w-3.5 shrink-0" />
              Pass: {test.passMarks}
            </div>
          )}
          {test.negativeMark > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-400 dark:text-red-500">
              <ZapIcon className="h-3 w-3 shrink-0" />-{test.negativeMark}{" "}
              negative
            </div>
          )}
        </div>

        {/* CTA */}
        <Link href={`/test/${test.id}`}>
          <Button
            size="sm"
            disabled={expired}
            className={`w-full h-8 text-xs gap-1.5 ${
              locked
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : live
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : expired
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {locked ? (
              <>
                <LockIcon className="h-3 w-3" />
                Unlock & Start
              </>
            ) : expired ? (
              "Expired"
            ) : upcoming ? (
              <>
                <CalendarIcon className="h-3 w-3" />
                Set Reminder
              </>
            ) : (
              <>
                <PlayCircleIcon className="h-3 w-3" />
                Start Test
              </>
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = await params;
  const series = await getSeries(seriesId);

  if (!series) notFound();

  // Use tests from the series response instead of separate API call
  const tests = (series as any).tests || [];

  const liveTests = tests.filter(isLiveNow);
  const upcomingTests = tests.filter(isUpcoming);
  const regularTests = tests.filter(
    (t: Test) => !isLiveNow(t) && !isUpcoming(t),
  );

  return (
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
            {series.exam && (
              <>
                <span>›</span>
                <Link
                  href={`/exams/${series.examId}`}
                  className="hover:text-blue-600"
                >
                  {series.exam.name}
                </Link>
              </>
            )}
            <span>›</span>
            <span className="text-slate-600 dark:text-slate-400">
              {series.title}
            </span>
          </nav>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {series.title}
              </h1>
              {series.exam && (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {series.exam.name}
                </p>
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {tests.length} test{tests.length !== 1 ? "s" : ""} available
                {liveTests.length > 0 && (
                  <span className="ml-2 text-green-600 font-medium">
                    · {liveTests.length} live now
                  </span>
                )}
              </p>
            </div>
            <Link href={series.exam ? `/exams/${series.examId}` : "/exams"}>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {tests.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <TargetIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No tests yet
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
              Tests for this series are being added. Check back soon.
            </p>
          </div>
        ) : (
          <>
            {liveTests.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Live Now
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveTests.map((t: Test) => (
                    <TestCard key={t.id} test={t} />
                  ))}
                </div>
              </div>
            )}

            {upcomingTests.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">
                  Upcoming
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingTests.map((t: Test) => (
                    <TestCard key={t.id} test={t} />
                  ))}
                </div>
              </div>
            )}

            {regularTests.length > 0 && (
              <div>
                {(liveTests.length > 0 || upcomingTests.length > 0) && (
                  <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    All Tests
                  </h2>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularTests.map((t: Test) => (
                    <TestCard key={t.id} test={t} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Login CTA for unauthenticated users */}
        <div className="rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900 p-6 text-center">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
            Track your progress
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Sign in to save your scores, see your rank, and access detailed
            analytics.
          </p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              <ZapIcon className="h-4 w-4" />
              Sign In Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
