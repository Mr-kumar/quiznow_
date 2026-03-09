/**
 * types/exam.ts
 *
 * All shared types for the student exam experience.
 * Separate from admin types — the API response shape for students
 * includes resolved translations and structured sections.
 *
 * These map directly to the Prisma schema:
 *   Test → ExamTest
 *   Section + SectionQuestion → ExamSection
 *   Question + QuestionTranslation + QuestionOption + OptionTranslation → ExamQuestion
 */

import type { Lang } from "@/stores/language-store";

// ── Question types ────────────────────────────────────────────────────────────

export interface OptionTranslation {
  id: string;
  optionId: string;
  lang: Lang;
  text: string;
}

export interface ExamOption {
  id: string;
  questionId: string;
  order: number; // 0–3 → maps to A/B/C/D
  isCorrect: boolean; // Hidden during exam, revealed in solutions
  translations: OptionTranslation[];
}

export interface QuestionTranslation {
  id: string;
  questionId: string;
  lang: Lang;
  content: string;
  explanation: string | null;
  imageUrl: string | null;
}

export interface ExamQuestion {
  id: string;
  topicId: string | null;
  isActive: boolean;
  hash: string;
  translations: QuestionTranslation[];
  options: ExamOption[];
  // Topic info — for weak area tagging in results
  topic?: {
    id: string;
    name: string;
    subject?: {
      id: string;
      name: string;
    };
  };
}

// ── Section types ─────────────────────────────────────────────────────────────

export interface ExamSection {
  id: string;
  testId: string;
  name: string;
  durationMins: number | null; // Per-section timer (e.g. JEE Paper 2)
  order: number;
  questions: ExamQuestion[]; // Pre-sorted by SectionQuestion.order
}

// ── Test config types ─────────────────────────────────────────────────────────

export interface ExamTest {
  id: string;
  title: string;
  durationMins: number;
  totalMarks: number;
  passMarks: number;
  positiveMark: number;
  negativeMark: number;
  startAt: string | null;
  endAt: string | null;
  isLive: boolean;
  isPremium: boolean;
  maxAttempts: number | null;
  isActive: boolean;
  seriesId: string;
  series?: {
    id: string;
    title: string;
    exam?: {
      id: string;
      name: string;
      category?: {
        id: string;
        name: string;
      };
    };
  };
}

// ── Exam store types ──────────────────────────────────────────────────────────

export type ExamStatus = "IDLE" | "STARTED" | "SUBMITTED" | "EXPIRED";

export interface AnswerEntry {
  optionId: string | null;
  isMarked: boolean;
  answeredAt: string; // ISO string
}

// What gets serialised to sessionStorage for refresh recovery
export interface SessionSnapshot {
  attemptId: string;
  testId: string;
  endTimestamp: number;
  answers: Record<string, AnswerEntry>;
  visitedQuestions: string[]; // Set serialised as array
  currentSectionIdx: number;
  currentQuestionIdx: number;
}

// ── Palette status ────────────────────────────────────────────────────────────

export type QuestionStatus =
  | "NOT_VISITED" // Gray   — never opened
  | "NOT_ANSWERED" // Red    — opened but no option selected
  | "ANSWERED" // Green  — option selected
  | "MARKED_ONLY" // Orange — marked for review, no answer
  | "MARKED_ANSWERED"; // Purple — marked for review + has answer

export const PALETTE_COLORS: Record<QuestionStatus, string> = {
  NOT_VISITED: "bg-slate-200 text-slate-600 border-slate-300",
  NOT_ANSWERED: "bg-red-100 text-red-700 border-red-300",
  ANSWERED: "bg-green-500 text-white border-green-600",
  MARKED_ONLY: "bg-orange-400 text-white border-orange-500",
  MARKED_ANSWERED: "bg-purple-500 text-white border-purple-600",
};
