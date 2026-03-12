"use client";

/**
 * features/exam/components/ExamHeader.tsx
 *
 * Sticky top bar of the exam room.
 * Contains: Logo | Section Tabs | Language Toggle | Timer | Submit button
 *
 * TimerDisplay is intentionally isolated — it re-renders every second
 * but only its own DOM node updates. ExamHeader itself is React.memo'd
 * so SectionTabs, LanguageToggle, and the Submit button don't re-render
 * on every timer tick.
 *
 * Mobile layout collapses to:
 * [Logo] ... [Timer] [Palette icon] [Submit]
 * SectionTabs move below this bar in a separate scrollable row.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { LogOutIcon, LayoutGridIcon, BarChart3Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionTabs } from "./SectionTabs";
import { TimerDisplay } from "./TimerDisplay";
import { LanguageToggle } from "./LanguageToggle";
import { useUIStore } from "@/stores/ui-store";
import type { ExamSection } from "@/types/exam";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExamHeaderProps {
  testTitle: string;
  sections: ExamSection[];
  currentSectionIdx: number;
  onSectionChange: (sectionIdx: number, questionIdx: number) => void;
  onSubmitClick: () => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

function ExamHeaderInner({
  testTitle,
  sections,
  currentSectionIdx,
  onSectionChange,
  onSubmitClick,
  className,
}: ExamHeaderProps) {
  const togglePalette = useUIStore((s) => s.togglePalette);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-white dark:bg-slate-900",
        "border-b border-slate-200 dark:border-slate-700",
        "shadow-sm",
        className,
      )}
    >
      {/* ── Top row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 h-12 md:h-14">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
            <BarChart3Icon className="h-4 w-4 text-white" aria-hidden />
          </div>
          {/* Test title — truncated on small screens */}
          <span className="hidden sm:block text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[160px] truncate">
            {testTitle}
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        {/* Section tabs — hidden on mobile, shown in bottom row */}
        <div className="hidden md:flex flex-1 min-w-0 overflow-hidden">
          <SectionTabs
            sections={sections}
            currentSectionIdx={currentSectionIdx}
            onSectionChange={onSectionChange}
          />
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Language toggle — compact on mobile */}
          <LanguageToggle compact className="flex" />

          {/* Timer */}
          <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
            <TimerDisplay />
          </div>

          {/* Palette toggle — mobile only */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={togglePalette}
            aria-label="Open question palette"
            className="md:hidden h-8 w-8"
          >
            <LayoutGridIcon className="h-4 w-4" />
          </Button>

          {/* Submit button */}
          <Button
            type="button"
            size="sm"
            onClick={onSubmitClick}
            className="gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hidden sm:flex"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            Submit
          </Button>

          {/* Mobile: icon-only submit */}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onSubmitClick}
            aria-label="Submit exam"
            className="sm:hidden h-8 w-8"
          >
            <LogOutIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Mobile section tabs row ───────────────────────────────────────── */}
      <div className="md:hidden border-t border-slate-100 dark:border-slate-800 px-2 py-1.5">
        <SectionTabs
          sections={sections}
          currentSectionIdx={currentSectionIdx}
          onSectionChange={onSectionChange}
        />
      </div>
    </header>
  );
}

// Memo — prevents re-render on every timer tick (TimerDisplay handles its own)
export const ExamHeader = React.memo(ExamHeaderInner);
ExamHeader.displayName = "ExamHeader";
