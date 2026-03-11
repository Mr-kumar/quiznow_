/**
 * api/attempts.ts
 *
 * API client for the entire exam attempt lifecycle:
 *   1. Start attempt  — POST /tests/:id/start
 *   2. Save answer    — PATCH /attempts/:id/answers  (called on every option click)
 *   3. Submit         — POST /attempts/:id/submit
 *   4. Get result     — GET  /attempts/:id/result
 *   5. Get review     — GET  /attempts/:id/review    (solutions screen)
 *   6. My history     — GET  /users/me/attempts
 *   7. Suspicious     — PATCH /attempts/:id/suspicious
 *
 * All endpoints require Authorization: Bearer <token> (added by Axios interceptor).
 */

import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttemptStatus = "STARTED" | "SUBMITTED" | "EXPIRED";

/** Minimal attempt object returned when starting a test */
export interface StartAttemptResponse {
  attemptId: string; // BigInt serialized as string from server
  testId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startTime: string; // ISO datetime
  endTime: string | null;
}

/** Payload for saving a single answer */
export interface SaveAnswerRequest {
  questionId: string;
  optionId: string | null; // null = clear the answer
  isMarked?: boolean; // mark for review flag
  answeredAt: string; // ISO datetime — client records when answer was given
}

/** Server response after saving an answer */
export interface SaveAnswerResponse {
  questionId: string;
  optionId: string | null;
  isCorrect: boolean | null; // null during exam (revealed on result)
  isMarked: boolean;
  marksAwarded: number | null;
}

/** Full result after submission */
export interface AttemptResult {
  attemptId: string;
  testId: string;
  testTitle: string;
  status: AttemptStatus;
  attemptNumber: number;

  // Scores — match Attempt model exactly
  score: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  accuracy: number | null;
  timeTaken: number | null; // seconds

  // Test config (for result display)
  totalMarks: number;
  passMarks: number;
  passed: boolean;

  // Section breakdown
  sectionResults: SectionResult[];

  // Ranking
  rank: number | null;
  totalAttempts: number | null;

  startTime: string;
  endTime: string | null;
}

export interface SectionResult {
  sectionId: string;
  sectionName: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  score: number;
  totalMarks: number;
}

/** Single question in the review/solutions screen */
export interface ReviewQuestion {
  questionId: string;
  sectionId: string;
  sectionName: string;
  order: number;

  // Student's answer
  selectedOptionId: string | null;
  isCorrect: boolean;
  isMarked: boolean;
  marksAwarded: number;

  // Question content (translated per lang)
  content: string;
  imageUrl: string | null;
  explanation: string | null;

  // Options with correct flag revealed
  options: ReviewOption[];

  // Topic info (for weak area analysis)
  topicId: string | null;
  topicName: string | null;
  subjectName: string | null;
}

export interface ReviewOption {
  optionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

/** Attempt summary for history page */
export interface AttemptSummary {
  attemptId: string;
  testId: string;
  testTitle: string;
  seriesTitle: string;
  examName: string;
  attemptNumber: number;
  status: AttemptStatus;
  score: number;
  totalMarks: number;
  accuracy: number | null;
  timeTaken: number | null;
  startTime: string;
  endTime: string | null;
}

// ── API Methods ───────────────────────────────────────────────────────────────

export const attemptsApi = {
  /**
   * Start a new exam attempt.
   * The server creates an Attempt record and returns the attemptId.
   * Call this when the student clicks "Start Test" on the instructions page.
   */
  start: (testId: string) =>
    api.post<StartAttemptResponse>(`/student/tests/${testId}/start`),

  /**
   * Save a single answer. Called on every option click — fire and forget.
   * The server upserts AttemptAnswer (idempotent — safe to retry).
   */
  saveAnswer: (attemptId: string, payload: SaveAnswerRequest) =>
    api.patch<SaveAnswerResponse>(`/attempts/${attemptId}/answers`, payload),

  /**
   * Save multiple answers in one request.
   * Used to drain the retry queue on submit or after network recovery.
   */
  saveAnswersBatch: (attemptId: string, answers: SaveAnswerRequest[]) =>
    api.patch<{ saved: number }>(`/attempts/${attemptId}/answers/batch`, {
      answers,
    }),

  /**
   * Submit the attempt.
   * Server calculates score, updates UserTopicStat, creates LeaderboardEntry.
   * Returns the full result so we can render result page immediately.
   */
  submit: (attemptId: string) =>
    api.post<AttemptResult>(`/attempts/${attemptId}/submit`),

  /**
   * Get the full result for a submitted attempt.
   * Used by the result page when navigating directly (not immediately after submit).
   */
  getResult: (attemptId: string, lang: "EN" | "HI" = "EN") =>
    api.get<AttemptResult>(`/attempts/${attemptId}/result`, {
      params: { lang },
    }),

  /**
   * Get all questions with correct answers + student's answers.
   * Used by the solutions/review screen.
   */
  getReview: (attemptId: string, lang: "EN" | "HI" = "EN") =>
    api.get<ReviewQuestion[]>(`/attempts/${attemptId}/review`, {
      params: { lang },
    }),

  /**
   * Get all past attempts for the current user.
   * Used by the history page and student dashboard.
   */
  getMyHistory: (page = 1, limit = 10) =>
    api.get<{
      data: AttemptSummary[];
      total: number;
      page: number;
      limit: number;
    }>("/users/me/attempts", { params: { page, limit } }),

  /**
   * Report a suspicious event (tab switch, fullscreen exit, copy attempt).
   * Server increments Attempt.suspiciousScore.
   */
  reportSuspicious: (
    attemptId: string,
    eventType:
      | "TAB_SWITCH"
      | "FULLSCREEN_EXIT"
      | "COPY_ATTEMPT"
      | "WINDOW_BLUR",
  ) => api.patch(`/attempts/${attemptId}/suspicious`, { eventType }),
};
