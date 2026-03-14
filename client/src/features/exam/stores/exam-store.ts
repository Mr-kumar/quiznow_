"use client";

/**
 * FIXED VERSION: features/exam/stores/exam-store.ts (navigation section)
 *
 * Changes:
 * 1. ✅ Added validation to navigate() method
 * 2. ✅ Better session storage size handling
 * 3. ✅ More defensive error handling
 */

import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { attemptsApi } from "@/api/attempts";
import type { ExamStatus, AnswerEntry, SessionSnapshot } from "@/types/exam";

const SESSION_KEY = "quiznow_exam_session";
const MAX_SESSION_SIZE_BYTES = 4_500_000; // 4.5MB (under 5MB limit)

interface ExamState {
  attemptId: string | null;
  testId: string | null;
  status: ExamStatus;
  currentSectionIdx: number;
  currentQuestionIdx: number;
  answers: Record<string, AnswerEntry>;
  endTimestamp: number | null;
  visitedQuestions: Set<string>;
  suspiciousEvents: number;

  startExam: (attemptId: string, testId: string, durationMins: number) => void;
  setAnswer: (questionId: string, optionId: string | null) => void;
  toggleMark: (questionId: string) => void;
  // ✅ UPDATED: Added sections parameter for validation
  navigate: (
    sectionIdx: number,
    questionIdx: number,
    questionId: string,
    totalSections?: number, // ← For validation
    questionsPerSection?: number[], // ← For validation
  ) => boolean; // ← Returns whether navigation succeeded
  submitExam: () => void;
  flagSuspicious: (
    eventType?:
      | "TAB_SWITCH"
      | "FULLSCREEN_EXIT"
      | "COPY_ATTEMPT"
      | "WINDOW_BLUR",
  ) => void;
  restoreFromSession: () => boolean;
  reset: () => void;

  getAnswerStatus: (questionId: string) => AnswerEntry | undefined;
  isQuestionVisited: (questionId: string) => boolean;
  getAnsweredCount: () => number;
  getMarkedCount: () => number;
}

// ── Session storage helpers ───────────────────────────────────────────────

/**
 * ✅ IMPROVED: Session storage writer with size limit handling
 */
function writeSession(state: Partial<ExamState>) {
  if (typeof sessionStorage === "undefined") return;
  let json: string | undefined;

  try {
    const snapshot: SessionSnapshot = {
      attemptId: state.attemptId!,
      testId: state.testId!,
      endTimestamp: state.endTimestamp!,
      answers: state.answers ?? {},
      visitedQuestions: Array.from(state.visitedQuestions ?? []),
      currentSectionIdx: state.currentSectionIdx ?? 0,
      currentQuestionIdx: state.currentQuestionIdx ?? 0,
    };

    json = JSON.stringify(snapshot);

    // ✅ NEW: Check size before writing
    if (json.length > MAX_SESSION_SIZE_BYTES) {
      console.warn(
        "Session data too large, compressing answer history",
        json.length,
      );

      // ✅ FIXED: Keep all answered, drop only visited-with-no-answer (lowest value data)
      const compressedAnswers = Object.fromEntries(
        Object.entries(snapshot.answers).filter(([, a]) => a.optionId !== null),
      );

      const compressedSnapshot: SessionSnapshot = {
        ...snapshot,
        answers: compressedAnswers,
      };

      json = JSON.stringify(compressedSnapshot);

      if (json.length > MAX_SESSION_SIZE_BYTES) {
        console.error("Session data still too large, clearing old answers");
        compressedSnapshot.answers = {};
        json = JSON.stringify(compressedSnapshot);
      }
    }

    sessionStorage.setItem(SESSION_KEY, json);
  } catch (e) {
    // ✅ IMPROVED: More explicit error handling
    if (e instanceof Error) {
      if (e.message.includes("QuotaExceededError")) {
        console.error(
          "Session storage quota exceeded",
          SESSION_KEY,
          "size:",
          json?.length,
        );
      } else {
        console.error("Failed to save session:", e.message);
      }
    }
    // Silently continue — exam continues even if session save fails
  }
}

function clearSession() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

function readSession(): SessionSnapshot | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionSnapshot;
  } catch (e) {
    console.error("Failed to read session:", e);
    return null;
  }
}

// ── Initial state ─────────────────────────────────────────────────────────

const INITIAL: Pick<
  ExamState,
  | "attemptId"
  | "testId"
  | "status"
  | "currentSectionIdx"
  | "currentQuestionIdx"
  | "answers"
  | "endTimestamp"
  | "visitedQuestions"
  | "suspiciousEvents"
> = {
  attemptId: null,
  testId: null,
  status: "IDLE",
  currentSectionIdx: 0,
  currentQuestionIdx: 0,
  answers: {},
  endTimestamp: null,
  visitedQuestions: new Set(),
  suspiciousEvents: 0,
};

// ── Store ─────────────────────────────────────────────────────────────────

export const useExamStore = create<ExamState>()((set, get) => ({
  ...INITIAL,

  startExam: (attemptId, testId, durationMins) => {
    const endTimestamp = Date.now() + durationMins * 60 * 1000;

    const nextState = {
      ...INITIAL,
      attemptId,
      testId,
      status: "STARTED" as ExamStatus,
      endTimestamp,
      visitedQuestions: new Set<string>(),
    };

    set(nextState);
    writeSession(nextState);
  },

  setAnswer: (questionId, optionId) => {
    set((state) => {
      const existing = state.answers[questionId];
      const updated: Record<string, AnswerEntry> = {
        ...state.answers,
        [questionId]: {
          optionId,
          isMarked: existing?.isMarked ?? false,
          answeredAt: new Date().toISOString(),
        },
      };

      writeSession({ ...state, answers: updated });
      return { answers: updated };
    });
  },

  toggleMark: (questionId) => {
    set((state) => {
      const existing = state.answers[questionId];
      const updated: Record<string, AnswerEntry> = {
        ...state.answers,
        [questionId]: {
          optionId: existing?.optionId ?? null,
          isMarked: !existing?.isMarked,
          answeredAt: existing?.answeredAt ?? new Date().toISOString(),
        },
      };

      writeSession({ ...state, answers: updated });
      return { answers: updated };
    });
  },

  // ✅ FIXED: Added validation and returns boolean
  navigate: (
    sectionIdx,
    questionIdx,
    questionId,
    totalSections = 999, // Default to no validation if not provided
    questionsPerSection,
  ) => {
    // ✅ NEW: Validate indices
    if (sectionIdx < 0 || sectionIdx >= totalSections) {
      console.warn(
        `Invalid section index: ${sectionIdx} (total: ${totalSections})`,
      );
      return false;
    }

    if (questionsPerSection) {
      const maxQuestionIdx = questionsPerSection[sectionIdx];
      if (questionIdx < 0 || questionIdx >= maxQuestionIdx) {
        console.warn(
          `Invalid question index: ${questionIdx} (section ${sectionIdx} has ${maxQuestionIdx} questions)`,
        );
        return false;
      }
    } else if (questionIdx < 0 || questionIdx > 999) {
      // Soft validation if section layout not provided
      console.warn(`Suspicious question index: ${questionIdx}`);
      return false;
    }

    set((state) => {
      const visited = new Set(state.visitedQuestions);
      visited.add(questionId);

      const nextState = {
        currentSectionIdx: sectionIdx,
        currentQuestionIdx: questionIdx,
        visitedQuestions: visited,
      };

      writeSession({ ...state, ...nextState });
      return nextState;
    });

    return true; // ✅ NEW: Return success
  },

  submitExam: () => {
    clearSession();
    set({ status: "SUBMITTED" });
  },

  flagSuspicious: (eventType = "TAB_SWITCH") => {
    set((state) => ({ suspiciousEvents: state.suspiciousEvents + 1 }));

    const { attemptId } = get();
    if (attemptId) {
      attemptsApi.reportSuspicious(attemptId, eventType).catch(() => {
        // Silent failure
      });
    }
  },

  restoreFromSession: () => {
    const snapshot = readSession();
    if (!snapshot) return false;

    if (snapshot.endTimestamp && Date.now() > snapshot.endTimestamp) {
      clearSession();
      return false;
    }

    set({
      attemptId: snapshot.attemptId,
      testId: snapshot.testId,
      status: "STARTED",
      endTimestamp: snapshot.endTimestamp,
      answers: snapshot.answers,
      visitedQuestions: new Set(snapshot.visitedQuestions),
      currentSectionIdx: snapshot.currentSectionIdx,
      currentQuestionIdx: snapshot.currentQuestionIdx,
    });

    return true;
  },

  reset: () => {
    clearSession();
    set({ ...INITIAL, visitedQuestions: new Set() });
  },

  getAnswerStatus: (questionId) => get().answers[questionId],
  isQuestionVisited: (questionId) => get().visitedQuestions.has(questionId),
  getAnsweredCount: () =>
    Object.values(get().answers).filter((a) => a.optionId !== null).length,
  getMarkedCount: () =>
    Object.values(get().answers).filter((a) => a.isMarked).length,
}));

// ── Selectors ─────────────────────────────────────────────────────────────

export const selectAnswer =
  (questionId: string) =>
  (state: ExamState): AnswerEntry | undefined =>
    state.answers[questionId];

export const selectIsVisited =
  (questionId: string) =>
  (state: ExamState): boolean =>
    state.visitedQuestions.has(questionId);

export const selectNavigation = (state: ExamState) => ({
  currentSectionIdx: state.currentSectionIdx,
  currentQuestionIdx: state.currentQuestionIdx,
});

export const selectTimestamp = (state: ExamState) => state.endTimestamp;
export const selectStatus = (state: ExamState) => state.status;
export const selectAttemptId = (state: ExamState) => state.attemptId;
