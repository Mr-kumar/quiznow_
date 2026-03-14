"use client";

/**
 * features/results/components/ScoreCard.tsx
 *
 * The hero card on the result page. Shows:
 *  - Score as a large number with ring chart
 *  - Correct / Wrong / Unattempted counts
 *  - Accuracy percentage
 *  - Time taken
 *  - Pass/Fail indicator
 *  - Rank (if available)
 */

import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  XCircleIcon,
  MinusCircleIcon,
  ClockIcon,
  TargetIcon,
  TrophyIcon,
  StarIcon,
} from "lucide-react";
import type { AttemptResult } from "@/api/attempts";
import { formatTimeTaken } from "@/lib/utils/time";

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Ring chart (SVG) ─────────────────────────────────────────────────────────

function ScoreRing({
  score,
  totalMarks,
  passed,
}: {
  score: number;
  totalMarks: number;
  passed: boolean;
}) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const pct = totalMarks > 0 ? Math.min(score / totalMarks, 1) : 0;
  const dashOffset = circumference * (1 - pct);
  const gradientId = passed ? "scoreGradientPass" : "scoreGradientFail";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <defs>
          <linearGradient id="scoreGradientPass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="scoreGradientFail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-[1200ms] ease-out delay-100"
        />
      </svg>
      {/* Score text in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-3xl font-bold tabular-nums",
            passed
              ? "text-green-700 dark:text-green-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {score}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          / {totalMarks}
        </span>
      </div>
    </div>
  );
}

// ── Stat box ──────────────────────────────────────────────────────────────────

function StatBox({
  icon: Icon,
  label,
  value,
  valueColor,
  bg,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  valueColor: string;
  bg: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-w-0">
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center",
          bg,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span
        className={cn(
          "text-xl font-bold tabular-nums leading-none",
          valueColor,
        )}
      >
        {value}
      </span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center">
        {label}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ScoreCardProps {
  result: AttemptResult;
  className?: string;
}

export function ScoreCard({ result, className }: ScoreCardProps) {
  const {
    score,
    totalMarks,
    correctCount,
    wrongCount,
    unattemptedCount,
    accuracy,
    timeTaken,
    passed,
    rank,
    totalAttempts,
    passMarks,
  } = result;

  const passPercentage =
    totalMarks > 0 ? Math.round((passMarks / totalMarks) * 100) : 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden",
        className,
      )}
    >
      {/* ── Pass / Fail banner ──────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-4",
          passed
            ? "bg-green-600 dark:bg-green-700"
            : "bg-red-600 dark:bg-red-700",
        )}
      >
        {passed ? (
          <CheckCircle2Icon className="h-4 w-4 text-white shrink-0" />
        ) : (
          <XCircleIcon className="h-4 w-4 text-white shrink-0" />
        )}
        <span className="text-sm font-bold text-white">
          {passed ? "PASSED" : "FAILED"} — Passing marks: {passMarks} (
          {passPercentage}%)
        </span>
      </div>

      {/* ── Score ring + rank ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-6">
        <ScoreRing score={score} totalMarks={totalMarks} passed={passed} />

        <div className="flex flex-col items-center sm:items-start gap-2">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {score} / {totalMarks}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {accuracy != null ? `${accuracy.toFixed(1)}% accuracy` : "—"}
          </p>

          {/* Rank badge */}
          {rank != null && (
            <div className="flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
              <TrophyIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Rank #{rank}
              </span>
              {totalAttempts != null && (
                <span className="text-xs text-amber-600/70 dark:text-amber-500">
                  of {totalAttempts.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 pb-5">
        <StatBox
          icon={CheckCircle2Icon}
          label="Correct"
          value={String(correctCount)}
          valueColor="text-green-600 dark:text-green-400"
          bg="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
        />
        <StatBox
          icon={XCircleIcon}
          label="Wrong"
          value={String(wrongCount)}
          valueColor="text-red-600 dark:text-red-400"
          bg="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
        />
        <StatBox
          icon={MinusCircleIcon}
          label="Unattempted"
          value={String(unattemptedCount)}
          valueColor="text-slate-500 dark:text-slate-400"
          bg="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        />
        <StatBox
          icon={ClockIcon}
          label="Time Taken"
          value={formatTimeTaken(timeTaken)}
          valueColor="text-blue-600 dark:text-blue-400"
          bg="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <StatBox
          icon={TargetIcon}
          label="Accuracy"
          value={accuracy != null ? `${accuracy.toFixed(1)}%` : "—"}
          valueColor="text-indigo-600 dark:text-indigo-400"
          bg="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
        />
        <StatBox
          icon={StarIcon}
          label="Attempt #"
          value={String(result.attemptNumber)}
          valueColor="text-slate-600 dark:text-slate-400"
          bg="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        />
      </div>
    </div>
  );
}
