/**
 * features/exam/stores/exam-store.ts
 *
 * The single source of truth for everything the STUDENT DOES during an exam.
 * Holds: navigation, answers, timer endpoint, suspicious events.
 *
 * Deliberately NO Zustand persist middleware — exam state is session-only.
 * sessionStorage is used manually for one purpose only: refresh recovery.
 * If the student closes the tab, state is gone. If they refresh accidentally,
 * restoreFromSession() picks up where they left off.
 *
 * KEY DESIGN: exam-store holds what the student DID.
 *             use-exam-loader holds what the test CONTAINS.
 *             Never mix these two concerns.
 */

import { create } from "zustand";
import { attemptsApi } from "@/api/attempts";
import type { ExamStatus, AnswerEntry, SessionSnapshot } from "@/types/exam";

// ── Session storage key ───────────────────────────────────────────────────────

const SESSION_KEY = "quiznow_exam_session";

// ── State interface ───────────────────────────────────────────────────────────

interface ExamState {
  // ── Identity ────────────────────────────────────────────────────────────
  attemptId: string | null;
  testId: string | null;
  status: ExamStatus;

  // ── Navigation ──────────────────────────────────────────────────────────
  currentSectionIdx: number;
  currentQuestionIdx: number;

  // ── Answers ─────────────────────────────────────────────────────────────
  // Record<questionId, AnswerEntry>
  answers: Record<string, AnswerEntry>;

  // ── Timer ────────────────────────────────────────────────────────────────
  // Absolute end timestamp — use-exam-timer derives countdown from this.
  // Storing countdown in state would re-render the whole tree every second.
  endTimestamp: number | null;

  // ── Visited tracking ─────────────────────────────────────────────────────
  // "Visited" = the student navigated to that question at least once.
  // Palette: NOT_VISITED if absent, NOT_ANSWERED if present but no optionId.
  visitedQuestions: Set<string>;

  // ── Anti-cheat ───────────────────────────────────────────────────────────
  suspiciousEvents: number;

  // ── Actions ──────────────────────────────────────────────────────────────
  startExam: (attemptId: string, testId: string, durationMins: number) => void;
  setAnswer: (questionId: string, optionId: string | null) => void;
  toggleMark: (questionId: string) => void;
  navigate: (
    sectionIdx: number,
    questionIdx: number,
    questionId: string,
  ) => void;
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

  // ── Computed helpers (call with getState() in non-React contexts) ─────────
  getAnswerStatus: (questionId: string) => AnswerEntry | undefined;
  isQuestionVisited: (questionId: string) => boolean;
  getAnsweredCount: () => number;
  getMarkedCount: () => number;
}

// ── Session storage helpers ───────────────────────────────────────────────────

function writeSession(state: Partial<ExamState>) {
  if (typeof sessionStorage === "undefined") return;
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
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // sessionStorage full or unavailable — silently continue
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
  } catch {
    return null;
  }
}

// ── Initial state ─────────────────────────────────────────────────────────────

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

// ── Store ─────────────────────────────────────────────────────────────────────

export const useExamStore = create<ExamState>()((set, get) => ({
  ...INITIAL,

  // ─── startExam ───────────────────────────────────────────────────────────
  // Called from instructions page after POST /tests/:id/start succeeds.
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

    // Write to sessionStorage for refresh recovery
    writeSession(nextState);
  },

  // ─── setAnswer ───────────────────────────────────────────────────────────
  // Called on every option click. null = clear the answer.
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

      // Sync to sessionStorage on every answer change
      writeSession({ ...state, answers: updated });

      return { answers: updated };
    });
  },

  // ─── toggleMark ──────────────────────────────────────────────────────────
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

  // ─── navigate ────────────────────────────────────────────────────────────
  // Tracks which questions have been visited (for palette NOT_VISITED state).
  navigate: (sectionIdx, questionIdx, questionId) => {
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
  },

  // ─── submitExam ──────────────────────────────────────────────────────────
  // Sets status to SUBMITTED and clears sessionStorage.
  // The actual API call (POST /attempts/:id/submit) is made by the page component
  // BEFORE calling submitExam() so we have the result to show.
  submitExam: () => {
    clearSession();
    set({ status: "SUBMITTED" });
  },

  // ─── flagSuspicious ──────────────────────────────────────────────────────
  // Called by use-anticheat.ts. Increments counter and fires PATCH to server.
  flagSuspicious: (eventType = "TAB_SWITCH") => {
    set((state) => ({ suspiciousEvents: state.suspiciousEvents + 1 }));

    const { attemptId } = get();
    if (attemptId) {
      // Fire and forget — don't await, never block the UI
      attemptsApi.reportSuspicious(attemptId, eventType).catch(() => {
        // Silent failure — suspicious score is advisory, not critical
      });
    }
  },

  // ─── restoreFromSession ──────────────────────────────────────────────────
  // Call this on attempt/page.tsx mount to recover from accidental refresh.
  // Returns true if session was restored, false if no session found.
  restoreFromSession: () => {
    const snapshot = readSession();
    if (!snapshot) return false;

    // Check the exam isn't already expired
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

  // ─── reset ───────────────────────────────────────────────────────────────
  reset: () => {
    clearSession();
    set({ ...INITIAL, visitedQuestions: new Set() });
  },

  // ─── Computed helpers ────────────────────────────────────────────────────

  getAnswerStatus: (questionId) => get().answers[questionId],

  isQuestionVisited: (questionId) => get().visitedQuestions.has(questionId),

  getAnsweredCount: () =>
    Object.values(get().answers).filter((a) => a.optionId !== null).length,

  getMarkedCount: () =>
    Object.values(get().answers).filter((a) => a.isMarked).length,
}));

// ── Selector exports — use these in components for precise subscriptions ──────
// Instead of: const store = useExamStore() — which re-renders on any change
// Use:        const answer = useExamStore(selectAnswer(questionId))

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
