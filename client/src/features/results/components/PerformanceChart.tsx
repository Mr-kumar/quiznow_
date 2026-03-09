"use client";

/**
 * features/results/components/PerformanceChart.tsx
 *
 * Section-wise performance bar chart on the result page.
 *
 * Shows two bars per section:
 *   - Correct (green) — correct answers
 *   - Wrong (red)     — wrong answers
 *
 * Uses Recharts BarChart loaded via dynamic import (ssr: false) because:
 *  1. Recharts is 200kB — don't parse it on the server
 *  2. It uses window/ResizeObserver internally — no SSR support
 *
 * Fallback: a clean skeleton is shown while the chart loads.
 *
 * REQUIRES: recharts (already in package.json for admin analytics)
 */

import dynamic from "next/dynamic";
import React, { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SectionResult } from "@/api/attempts";

// ── Dynamic import ────────────────────────────────────────────────────────────
// ssr: false prevents server-render errors for window-dependent Recharts code

const RechartsChart = dynamic(
  () => import("./PerformanceChartInner").then((m) => m.PerformanceChartInner),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="flex items-end justify-around gap-4 h-44 px-4 py-2">
      {[60, 85, 45, 70, 55].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col gap-1 items-center">
          <Skeleton className={`w-full rounded`} style={{ height: `${h}%` }} />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PerformanceChartProps {
  sectionResults: SectionResult[];
  className?: string;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PerformanceChart({
  sectionResults,
  className,
}: PerformanceChartProps) {
  if (!sectionResults || sectionResults.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Section-wise Performance
        </h3>
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-green-500 shrink-0" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Correct
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-red-400 shrink-0" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Wrong
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-700 shrink-0" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Skipped
            </span>
          </div>
        </div>
      </div>
      <RechartsChart sectionResults={sectionResults} />
    </div>
  );
}
