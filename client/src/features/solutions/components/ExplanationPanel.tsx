"use client";

/**
 * features/solutions/components/ExplanationPanel.tsx
 *
 * Renders the explanation for a single question on the solutions page.
 * Handles: plain text, Markdown, LaTeX/math, and empty-state gracefully.
 *
 * Used inside SolutionQuestion as a collapsible panel.
 * Can also be used standalone if you want explanation always visible.
 *
 * Falls back to a "No explanation available" message if explanation is null/empty.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { LightbulbIcon } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExplanationPanelProps {
  /** Explanation text — may contain Markdown + LaTeX */
  explanation: string | null;
  /** If true, shows the bulb icon + "Explanation" label header */
  showHeader?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExplanationPanel({
  explanation,
  showHeader = true,
  className,
}: ExplanationPanelProps) {
  const hasContent = explanation && explanation.trim().length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4",
        className,
      )}
    >
      {showHeader && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <LightbulbIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Explanation
          </span>
        </div>
      )}

      {hasContent ? (
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <MarkdownRenderer
            content={explanation!}
            mode="explanation"
            withMath
          />
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          No explanation available for this question.
        </p>
      )}
    </div>
  );
}
