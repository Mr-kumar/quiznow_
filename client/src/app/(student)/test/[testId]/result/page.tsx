//Score, accuracy, section breakdown
"use client";

/**
 * app/(student)/test/[testId]/result/page.tsx
 *
 * Result Page — shown immediately after exam submission.
 *
 * URL: /test/[testId]/result?attemptId=xxx
 *
 * The attemptId comes from the query string. This lets students:
 *  - View the result immediately after submitting (router.push from attempt page)
 *  - Revisit the result later via a bookmarked or shared URL
 *  - Navigate directly from their history page
 *
 * Layout:
 *   [Result Header — test title, breadcrumb, action buttons]
 *   [ScoreCard — ring chart, pass/fail, core stats]
 *   [SectionBreakdown — per-section table]
 *   [Action Bar — View Solutions / Retake / Share]
 *
 * This page is fully CSR ("use client") because:
 *  1. It reads attemptId from useSearchParams()
 *  2. It uses React Query (client-only)
 *  3. Result data is private — no SSR/caching benefit
 */

import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  RefreshCwIcon,
  Share2Icon,
  Loader2Icon,
  AlertCircleIcon,
  HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreCard } from "@/features/results/components/ScoreCard";
import { SectionBreakdown } from "@/features/results/components/SectionBreakdown";
import { useResult } from "@/features/results/hooks/use-result";
import { cn } from "@/lib/utils";

// ── Loading skeleton ─────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-64" />
      </div>
      {/* Score card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Skeleton className="h-10 w-full" />
        <div className="flex items-center justify-center gap-8 p-8">
          <Skeleton className="h-36 w-36 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 px-4 pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2"
            >
              <Skeleton className="h-8 w-8 rounded-full mx-auto" />
              <Skeleton className="h-5 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      {/* Section breakdown */}
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

// ── Error screen ──────────────────────────────────────────────────────────────

function ResultError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
          <AlertCircleIcon className="h-7 w-7 text-red-500" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Could not load result
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {message}
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-1.5"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" /> Retry
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <HomeIcon className="h-3.5 w-3.5" /> Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Share handler ─────────────────────────────────────────────────────────────

async function handleShare(title: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // User cancelled share sheet — fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    // Clipboard copy succeeded — show toast via sonner if available
    // For now just alert (Sprint 6 will add toast infrastructure)
  } catch {
    // Ignore clipboard errors
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResultPage() {
  const params = useParams<{ testId: string }>();
  const searchParams = useSearchParams();
  const testId = params.testId;
  const attemptId = searchParams.get("attemptId");

  const { result, isLoading, isError, error, refetch } = useResult(attemptId);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return <ResultSkeleton />;

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !result) {
    return (
      <ResultError
        message={
          error ?? "The result could not be loaded. The attempt may not exist."
        }
        onRetry={refetch}
      />
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const solutionsUrl = `/test/${testId}/solutions?attemptId=${attemptId}`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = `${result.testTitle} — Score: ${result.score}/${result.totalMarks}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="space-y-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <Link
              href="/dashboard"
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <span>›</span>
            <Link
              href={`/test/${testId}`}
              className="hover:text-blue-600 transition-colors"
            >
              {result.testTitle}
            </Link>
            <span>›</span>
            <span className="text-slate-600 dark:text-slate-400">Result</span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {result.testTitle}
            </h1>
            {/* Share button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleShare(shareTitle, shareUrl)}
              className="shrink-0 gap-1.5"
            >
              <Share2Icon className="h-3.5 w-3.5" />
              Share
            </Button>
          </div>
        </div>

        {/* ── Score card ──────────────────────────────────────────────────── */}
        <ScoreCard result={result} />

        {/* ── Section breakdown ────────────────────────────────────────────── */}
        {result.sectionResults.length > 0 && (
          <SectionBreakdown sectionResults={result.sectionResults} />
        )}

        {/* ── Action buttons ────────────────────────────────────────────────── */}
        <div className={cn("grid gap-3", "grid-cols-1 sm:grid-cols-3")}>
          {/* View Solutions */}
          <Link href={solutionsUrl} className="sm:col-span-2">
            <Button
              type="button"
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-11"
            >
              <BookOpenIcon className="h-4 w-4" />
              View Solutions &amp; Explanations
            </Button>
          </Link>

          {/* Retake */}
          <Link href={`/test/${testId}`}>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 h-11"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Retake Test
            </Button>
          </Link>
        </div>

        {/* ── Back to dashboard ─────────────────────────────────────────────── */}
        <div className="flex justify-center pt-2 pb-6">
          <Link href="/dashboard">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}