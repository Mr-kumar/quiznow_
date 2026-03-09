"use client";

/**
 * features/results/components/PerformanceChartInner.tsx
 *
 * The actual Recharts implementation — only loaded client-side via
 * dynamic import in PerformanceChart.tsx (ssr: false).
 *
 * Exported as a named export so next/dynamic can pick it up:
 *   .then(m => m.PerformanceChartInner)
 */

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SectionResult } from "@/api/attempts";

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-lg p-3 text-xs dark:bg-slate-900 dark:border-slate-700">
      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 truncate max-w-[160px]">
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-slate-600 dark:text-slate-400 capitalize">
            {p.name}:
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Chart data shape ──────────────────────────────────────────────────────────

interface ChartRow {
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
}

// ── Inner component ───────────────────────────────────────────────────────────

interface PerformanceChartInnerProps {
  sectionResults: SectionResult[];
}

export function PerformanceChartInner({
  sectionResults,
}: PerformanceChartInnerProps) {
  const chartData = useMemo<ChartRow[]>(() => {
    return sectionResults.map((s) => ({
      // Shorten long section names for axis display
      name:
        s.sectionName.length > 14
          ? s.sectionName.slice(0, 12) + "…"
          : s.sectionName,
      correct: s.correct,
      wrong: s.wrong,
      skipped: s.totalQuestions - s.attempted,
      total: s.totalQuestions,
    }));
  }, [sectionResults]);

  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.correct + d.wrong + d.skipped, 1)),
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        barSize={sectionResults.length <= 3 ? 40 : 24}
        barGap={4}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-800"
        />
        <XAxis
          dataKey="name"
          tick={{
            fontSize: 11,
            fill: "currentColor",
          }}
          className="text-slate-500 dark:text-slate-400"
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-slate-400"
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          domain={[0, maxVal]}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            fill: "currentColor",
            className: "text-slate-100 dark:text-slate-800 opacity-50",
          }}
        />

        {/* Correct — green */}
        <Bar
          dataKey="correct"
          name="correct"
          fill="#22c55e"
          radius={[3, 3, 0, 0]}
        />

        {/* Wrong — red */}
        <Bar
          dataKey="wrong"
          name="wrong"
          fill="#f87171"
          radius={[3, 3, 0, 0]}
        />

        {/* Skipped — slate */}
        <Bar
          dataKey="skipped"
          name="skipped"
          fill="#cbd5e1"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
