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
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  RefreshCwIcon,
  Share2Icon,
  Loader2Icon,
  AlertCircleIcon,
  HomeIcon,
  TrophyIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScoreCard } from "@/features/results/components/ScoreCard";
import { SectionBreakdown } from "@/features/results/components/SectionBreakdown";
import { useResult } from "@/features/results/hooks/use-result";
import { cn } from "@/lib/utils";

// ── Loading skeleton ─────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Score card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-8">
            <Skeleton className="h-36 w-36 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center space-y-2">
                  <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                  <Skeleton className="h-5 w-12 mx-auto" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section breakdown */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-11 w-full rounded" />
        ))}
      </div>
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
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircleIcon className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl">Could not load result</CardTitle>
          <p className="text-muted-foreground">{message}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCwIcon className="h-4 w-4" /> Retry
          </Button>
          <Button onClick={() => router.push("/dashboard")} className="gap-2">
            <HomeIcon className="h-4 w-4" /> Dashboard
          </Button>
        </div>
      </Card>
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/test/${testId}`}>
                  {result.testTitle}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Result</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {result.testTitle}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Attempt #{result.attemptNumber}
                </Badge>
                <Badge variant="outline">
                  {format(
                    new Date(result.submittedAt || result.startTime),
                    "dd MMM yyyy, HH:mm",
                  )}
                </Badge>
              </div>
            </div>

            {/* Share button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleShare(shareTitle, shareUrl)}
              className="shrink-0 gap-2"
            >
              <Share2Icon className="h-4 w-4" />
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
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              {/* View Solutions */}
              <Link href={solutionsUrl}>
                <Button type="button" className="w-full gap-2 h-12">
                  <BookOpenIcon className="h-4 w-4" />
                  Solutions &amp; Explanations
                </Button>
              </Link>

              {/* View Leaderboard */}
              <Link href={`/leaderboard/${testId}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 h-12"
                >
                  <TrophyIcon className="h-4 w-4" />
                  View Leaderboard
                </Button>
              </Link>

              {/* Retake */}
              <Link href={`/test/${testId}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 h-12"
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  Retake Test
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ── Back to dashboard ─────────────────────────────────────────────── */}
        <div className="flex justify-center pt-4">
          <Link href="/dashboard">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
