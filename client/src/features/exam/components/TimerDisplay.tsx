"use client";

/**
 * features/exam/components/TimerDisplay.tsx
 *
 * Pure display component — reads from use-exam-timer hook.
 * Contains zero timer logic. All it does is render the time string
 * and apply colour based on isWarning / isCritical state.
 *
 * Separated from ExamHeader so only the timer text re-renders every second,
 * not the entire header (which contains SectionTabs and other expensive nodes).
 */

import React from "react";
import { cn } from "@/lib/utils";
import { ClockIcon } from "lucide-react";
import { useExamTimer } from "../hooks/use-exam-timer";

// ── Props ─────────────────────────────────────────────────────────────────────

interface TimerDisplayProps {
  /** Compact mode for mobile header (smaller text, no icon) */
  compact?: boolean;
  /** Callback for when the timer reaches zero */
  onExpired?: () => Promise<void> | void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TimerDisplay({
  compact = false,
  onExpired,
  className,
}: TimerDisplayProps) {
  const { display, isWarning, isCritical } = useExamTimer({ onExpired });

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${display}`}
      className={cn(
        "flex items-center gap-1.5 font-mono font-semibold tabular-nums select-none",
        "transition-colors duration-500",
        // Normal
        !isWarning && !isCritical && "text-slate-700 dark:text-slate-300",
        // Warning: < 5 min — orange
        isWarning && !isCritical && "text-amber-600 dark:text-amber-400",
        // Critical: < 1 min — red + pulse
        isCritical && "text-red-600 dark:text-red-400 animate-pulse",
        compact ? "text-sm" : "text-base",
        className,
      )}
    >
      {/* Clock icon — hidden in compact mode */}
      {!compact && (
        <ClockIcon
          className={cn(
            "shrink-0",
            compact ? "h-3.5 w-3.5" : "h-4 w-4",
            isCritical && "animate-pulse",
          )}
          aria-hidden="true"
        />
      )}

      {/* Time string */}
      <span>{display}</span>

      {/* Warning badge — shown only when < 5 min */}
      {isWarning && !compact && (
        <span
          className={cn(
            "ml-1 text-xs px-1.5 py-0.5 rounded font-sans",
            isCritical
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
          )}
        >
          {isCritical ? "Final minute!" : "< 5 min"}
        </span>
      )}
    </div>
  );
}
