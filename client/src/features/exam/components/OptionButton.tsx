"use client";

/**
 * features/exam/components/OptionButton.tsx
 *
 * A single answer option (A / B / C / D).
 * The most-clicked component in the entire app — a student taps this
 * hundreds of times per exam. Must be instant with zero unnecessary re-renders.
 *
 * Wrapped in React.memo: only re-renders when isSelected changes for THIS option.
 * Without memo, clicking option A would re-render options B, C, D as well.
 */

import React from "react";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface OptionButtonProps {
  /** 0-based order from DB → maps to A/B/C/D label */
  order: number;
  /** The option text (already resolved to correct language by parent) */
  text: string;
  /** Whether this option is currently selected by the student */
  isSelected: boolean;
  /** Disabled during submit or when exam is expired */
  isDisabled?: boolean;
  /** Called when student taps/clicks this option */
  onSelect: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

function OptionButtonInner({
  order,
  text,
  isSelected,
  isDisabled = false,
  onSelect,
}: OptionButtonProps) {
  const label = OPTION_LABELS[order] ?? String(order + 1);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      aria-pressed={isSelected ? "true" : "false"}
      aria-label={`Option ${label}: ${text}`}
      className={cn(
        // Base styles
        "group relative w-full flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-left",
        "transition-all duration-150 ease-in-out",
        // Minimum touch target — 48px height (WCAG 2.5.5)
        "min-h-[52px]",
        // Keyboard focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        // Disabled
        isDisabled && "cursor-not-allowed opacity-60",
        // Selected state — blue background like NTA interface
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400"
          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/30",
        // Disabled + not selected
        isDisabled &&
          !isSelected &&
          "hover:border-slate-200 hover:bg-white dark:hover:border-slate-700 dark:hover:bg-slate-900",
      )}
    >
      {/* Label badge: A / B / C / D */}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          "text-sm font-semibold transition-colors duration-150",
          "mt-0.5", // align with first line of text
          isSelected
            ? "bg-blue-500 text-white dark:bg-blue-400 dark:text-blue-950"
            : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300",
          isDisabled &&
            "group-hover:bg-slate-100 group-hover:text-slate-600 dark:group-hover:bg-slate-800 dark:group-hover:text-slate-400",
        )}
        aria-hidden="true"
      >
        {label}
      </span>

      {/* Option text */}
      <span
        className={cn(
          "flex-1 text-sm leading-relaxed",
          isSelected
            ? "text-blue-900 dark:text-blue-100 font-medium"
            : "text-slate-700 dark:text-slate-300",
        )}
      >
        {text}
      </span>

      {/* Selection indicator dot — right side */}
      {isSelected && (
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 dark:bg-blue-400"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

// Memoize — only re-renders when its own props change
export const OptionButton = React.memo(OptionButtonInner);
OptionButton.displayName = "OptionButton";
