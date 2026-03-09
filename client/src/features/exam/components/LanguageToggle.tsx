"use client";

/**
 * features/exam/components/LanguageToggle.tsx
 *
 * EN / हिंदी toggle. Writes to language-store (Zustand, persisted).
 * All question/option components re-read lang automatically on switch.
 *
 * Graceful fallback: if a question has no HI translation, QuestionPanel
 * silently shows EN. This component never breaks — it just stores preference.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { useLangStore } from "@/stores/language-store";
import type { Lang } from "@/stores/language-store";

// ── Props ─────────────────────────────────────────────────────────────────────

interface LanguageToggleProps {
  className?: string;
  /** Compact — icon-only pill for tight mobile headers */
  compact?: boolean;
}

// ── Language config ────────────────────────────────────────────────────────────

const LANGS: { value: Lang; label: string; labelShort: string }[] = [
  { value: "EN", label: "English", labelShort: "EN" },
  { value: "HI", label: "हिंदी", labelShort: "हिं" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function LanguageToggle({
  className,
  compact = false,
}: LanguageToggleProps) {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  return (
    <div
      role="group"
      aria-label="Select question language"
      className={cn(
        "flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5",
        className,
      )}
    >
      {LANGS.map(({ value, label, labelShort }) => {
        const isActive = lang === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setLang(value)}
            aria-pressed={isActive}
            aria-label={`Switch to ${label}`}
            className={cn(
              "relative rounded-md px-3 py-1 text-xs font-semibold transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
              isActive
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
              compact ? "px-2" : "px-3",
            )}
          >
            {compact ? labelShort : label}
          </button>
        );
      })}
    </div>
  );
}
