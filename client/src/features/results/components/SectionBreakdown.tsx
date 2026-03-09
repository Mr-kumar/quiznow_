"use client";

/**
 * features/results/components/SectionBreakdown.tsx
 *
 * Per-section performance breakdown table.
 * Shows: Attempted / Correct / Wrong / Score / Max Marks for each section.
 * Visual progress bar shows correct-vs-wrong ratio per row.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { SectionResult } from "@/api/attempts";

// ── Props ─────────────────────────────────────────────────────────────────────

interface SectionBreakdownProps {
  sectionResults: SectionResult[];
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SectionBreakdown({
  sectionResults,
  className,
}: SectionBreakdownProps) {
  if (sectionResults.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Section-wise Breakdown
        </h3>
      </div>

      {/* Table — scrollable on mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {[
                "Section",
                "Attempted",
                "Correct",
                "Wrong",
                "Score",
                "Max",
                "Accuracy",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sectionResults.map((section) => {
              const accuracy =
                section.attempted > 0
                  ? Math.round((section.correct / section.attempted) * 100)
                  : 0;
              const correctPct =
                section.attempted > 0
                  ? (section.correct / section.attempted) * 100
                  : 0;

              return (
                <tr
                  key={section.sectionId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Section name */}
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {section.sectionName}
                  </td>

                  {/* Attempted */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 tabular-nums">
                    {section.attempted}
                    <span className="text-slate-400 dark:text-slate-600">
                      /{section.totalQuestions}
                    </span>
                  </td>

                  {/* Correct */}
                  <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400 tabular-nums">
                    {section.correct}
                  </td>

                  {/* Wrong */}
                  <td className="px-4 py-3 font-semibold text-red-500 dark:text-red-400 tabular-nums">
                    {section.wrong}
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {section.score}
                  </td>

                  {/* Max marks */}
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                    {section.totalMarks}
                  </td>

                  {/* Accuracy — progress bar */}
                  <td className="px-4 py-3 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={correctPct}
                        className={cn(
                          "h-2 flex-1",
                          accuracy >= 70
                            ? "[&>div]:bg-green-500"
                            : accuracy >= 40
                              ? "[&>div]:bg-amber-500"
                              : "[&>div]:bg-red-500",
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-semibold tabular-nums shrink-0 w-8 text-right",
                          accuracy >= 70
                            ? "text-green-600 dark:text-green-400"
                            : accuracy >= 40
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-500 dark:text-red-400",
                        )}
                      >
                        {accuracy}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Totals row */}
          {sectionResults.length > 1 &&
            (() => {
              const totals = sectionResults.reduce(
                (acc, s) => ({
                  attempted: acc.attempted + s.attempted,
                  correct: acc.correct + s.correct,
                  wrong: acc.wrong + s.wrong,
                  score: acc.score + s.score,
                  total: acc.total + s.totalMarks,
                  questions: acc.questions + s.totalQuestions,
                }),
                {
                  attempted: 0,
                  correct: 0,
                  wrong: 0,
                  score: 0,
                  total: 0,
                  questions: 0,
                },
              );
              const totalAcc =
                totals.attempted > 0
                  ? Math.round((totals.correct / totals.attempted) * 100)
                  : 0;

              return (
                <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                    Total
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {totals.attempted}/{totals.questions}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600 dark:text-green-400 tabular-nums">
                    {totals.correct}
                  </td>
                  <td className="px-4 py-3 font-bold text-red-500 dark:text-red-400 tabular-nums">
                    {totals.wrong}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {totals.score}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {totals.total}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                    {totalAcc}%
                  </td>
                </tr>
              );
            })()}
        </table>
      </div>
    </div>
  );
}
