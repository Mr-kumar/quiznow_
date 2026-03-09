"use client";

/**
 * features/solutions/components/SolutionFilter.tsx
 *
 * Reusable filter bar for the solutions review screen.
 *
 * Renders five filter tabs:
 *   All | Correct ✓ | Wrong ✗ | Unattempted — | Marked ⚑
 *
 * Each tab shows a count badge. Active tab is highlighted.
 * Calls onFilterChange when a tab is clicked.
 *
 * Designed to be sticky inside a scroll container — the parent is
 * responsible for positioning (sticky top-0 z-10 etc.).
 *
 * Props:
 *   active        — current active filter key
 *   counts        — { all, correct, wrong, unattempted, marked }
 *   onFilterChange — callback with the new filter key
 *   className     — additional wrapper classes
 */

import React from "react";
import {
  ListIcon,
  CheckCircle2Icon,
  XCircleIcon,
  MinusCircleIcon,
  BookmarkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SolutionFilterKey =
  | "all"
  | "correct"
  | "wrong"
  | "unattempted"
  | "marked";

export interface SolutionFilterCounts {
  all: number;
  correct: number;
  wrong: number;
  unattempted: number;
  marked: number;
}

export interface SolutionFilterProps {
  active: SolutionFilterKey;
  counts: SolutionFilterCounts;
  onFilterChange: (key: SolutionFilterKey) => void;
  className?: string;
}

// ── Filter config ─────────────────────────────────────────────────────────────

interface FilterConfig {
  key: SolutionFilterKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeClass: string;
  badgeClass: string;
}

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "all",
    label: "All",
    shortLabel: "All",
    icon: ListIcon,
    activeClass:
      "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900",
    badgeClass: "bg-white/20 dark:bg-black/20",
  },
  {
    key: "correct",
    label: "Correct",
    shortLabel: "✓",
    icon: CheckCircle2Icon,
    activeClass: "bg-green-600 text-white",
    badgeClass: "bg-white/20",
  },
  {
    key: "wrong",
    label: "Wrong",
    shortLabel: "✗",
    icon: XCircleIcon,
    activeClass: "bg-red-500 text-white",
    badgeClass: "bg-white/20",
  },
  {
    key: "unattempted",
    label: "Skipped",
    shortLabel: "—",
    icon: MinusCircleIcon,
    activeClass: "bg-slate-500 text-white",
    badgeClass: "bg-white/20",
  },
  {
    key: "marked",
    label: "Marked",
    shortLabel: "⚑",
    icon: BookmarkIcon,
    activeClass: "bg-purple-600 text-white",
    badgeClass: "bg-white/20",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SolutionFilter({
  active,
  counts,
  onFilterChange,
  className,
}: SolutionFilterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1",
        className,
      )}
      role="tablist"
      aria-label="Filter questions"
    >
      {FILTER_CONFIGS.map(
        ({ key, label, icon: Icon, activeClass, badgeClass }) => {
          const isActive = active === key;
          const count = counts[key];

          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(key)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                isActive
                  ? activeClass
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums min-w-[18px] text-center",
                  isActive
                    ? badgeClass
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
                )}
              >
                {count}
              </span>
            </button>
          );
        },
      )}
    </div>
  );
}
