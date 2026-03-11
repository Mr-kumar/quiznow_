/**
 * stores/language-store.ts
 *
 * Global language preference store.
 * Persisted to localStorage so the student's language choice survives
 * page refreshes and new sessions.
 *
 * Drives bilingual rendering throughout the exam:
 *  - QuestionPanel reads lang → finds correct QuestionTranslation
 *  - OptionButton reads lang → finds correct OptionTranslation
 *  - Falls back to "EN" if the requested translation is missing
 *
 * Maps to the Language enum in schema.prisma:
 *   enum Language { EN  HI }
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Lang = "EN" | "HI";

interface LanguageState {
  lang: Lang;

  /** Switch to English */
  setEnglish: () => void;

  /** Switch to Hindi */
  setHindi: () => void;

  /** Toggle between EN and HI */
  toggle: () => void;

  /** Set directly (useful for user preference from server profile) */
  setLang: (lang: Lang) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useLangStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: "EN", // Default — override from user profile on login if needed

      setEnglish: () => set({ lang: "EN" }),

      setHindi: () => set({ lang: "HI" }),

      toggle: () => set({ lang: get().lang === "EN" ? "HI" : "EN" }),

      setLang: (lang) => set({ lang }),
    }),
    {
      name: "quiznow-lang", // localStorage key — separate from auth storage
      // Only persist the lang value, not the actions
      partialize: (state) => ({ lang: state.lang }),
    },
  ),
);

// ── Helper — resolve translation text ─────────────────────────────────────────
// Used inside QuestionPanel and OptionButton to find the right translation.
// Call this outside React (e.g. in utility functions) when you can't use hooks.

export function resolveTranslation<T extends { lang: string }>(
  translations: T[],
  lang: Lang,
): T | undefined {
  // Safety check: if translations is undefined or empty, return undefined
  if (
    !translations ||
    !Array.isArray(translations) ||
    translations.length === 0
  ) {
    return undefined;
  }

  // Try requested language first, fall back to EN
  return (
    translations.find((t) => t.lang === lang) ??
    translations.find((t) => t.lang === "EN")
  );
}
