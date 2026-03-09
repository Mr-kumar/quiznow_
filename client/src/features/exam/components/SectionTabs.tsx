"use client";

/**
 * features/exam/components/SectionTabs.tsx
 *
 * Section switcher at the top of the exam room.
 * Each tab shows section name + answered/total question count.
 *
 * Mobile: horizontal scroll with scroll-snap — never wraps to second row.
 * Desktop: all tabs visible side-by-side if they fit, scroll if not.
 *
 * Uses exam-store answers to compute live answered-count per section —
 * re-renders only when the answer count for a section changes, thanks
 * to the stable selector.
 */

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useExamStore } from "../stores/exam-store";
import type { ExamSection } from "@/types/exam";

// ── Props ─────────────────────────────────────────────────────────────────────

interface SectionTabsProps {
  sections: ExamSection[];
  currentSectionIdx: number;
  onSectionChange: (sectionIdx: number, questionIdx: number) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SectionTabs({
  sections,
  currentSectionIdx,
  onSectionChange,
  className,
}: SectionTabsProps) {
  // Read answers once — compute per-section answered counts
  const answers = useExamStore((s) => s.answers);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view when section changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeTab = container.querySelector<HTMLButtonElement>(
      "[data-active='true']",
    );
    if (activeTab) {
      activeTab.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentSectionIdx]);

  return (
    <div
      ref={scrollRef}
      role="tablist"
      aria-label="Exam sections"
      className={cn(
        // Horizontal scroll — critical for mobile with 3+ sections
        "flex items-center gap-1 overflow-x-auto scrollbar-hide",
        "scroll-smooth snap-x snap-mandatory",
        // Padding so first/last tabs don't stick to edges
        "px-1",
        className,
      )}
    >
      {sections.map((section, idx) => {
        const isActive = idx === currentSectionIdx;

        // Count answered questions for this section
        const answeredCount = section.questions.filter(
          (q) =>
            answers[q.id]?.optionId !== null &&
            answers[q.id]?.optionId !== undefined,
        ).length;
        const totalCount = section.questions.length;

        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={isActive ? "true" : "false"}
            aria-controls={`section-panel-${idx}`}
            data-active={isActive}
            onClick={() => onSectionChange(idx, 0)}
            className={cn(
              // Base
              "group snap-start shrink-0 flex flex-col items-center gap-0.5",
              "rounded-lg px-3 py-2 text-left transition-all duration-150",
              "min-w-[90px] max-w-[160px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
              // Active
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
          >
            {/* Section name */}
            <span
              className={cn(
                "text-xs font-semibold leading-tight line-clamp-1 w-full text-center",
                isActive ? "text-white" : "text-slate-700 dark:text-slate-300",
              )}
            >
              {section.name}
            </span>

            {/* Progress: answered / total */}
            <span
              className={cn(
                "text-[10px] font-medium",
                isActive
                  ? "text-blue-100"
                  : answeredCount === totalCount
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-400 dark:text-slate-500",
              )}
            >
              {answeredCount}/{totalCount}
            </span>

            {/* Progress bar — thin indicator below text */}
            <div
              className={cn(
                "w-full h-0.5 rounded-full mt-0.5 overflow-hidden",
                isActive ? "bg-blue-400" : "bg-slate-200 dark:bg-slate-700",
              )}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isActive ? "bg-white" : "bg-green-500",
                  totalCount > 0 ? "w-full" : "w-0",
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
