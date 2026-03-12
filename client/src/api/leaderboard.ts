/**
 * api/leaderboard.ts
 *
 * API client for leaderboard data.
 * Matches the actual backend response from leaderboard service.
 */

import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  score: number;
  timeTaken: number | null; // seconds
  createdAt: string; // ISO datetime (backend sends createdAt, not attemptedAt)
  accuracy: number;
}

export interface LeaderboardResponse {
  testId?: string;
  entries: LeaderboardEntry[];

  // Current user's position (always included, even if not in top N)
  currentUserEntry: LeaderboardEntry | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface UserTopicStat {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number | null;
}

// ── API Methods ───────────────────────────────────────────────────────────────

export const leaderboardApi = {
  /**
   * Get leaderboard for a specific test.
   * Ranked by score DESC, then timeTaken ASC (faster = better tiebreak).
   * Server attaches isCurrentUser flag to the authenticated user's entry.
   */
  getByTest: (testId: string, page = 1, limit = 50) =>
    api.get<LeaderboardResponse>(`/leaderboard/test/${testId}`, {
      params: { page, limit },
    }),

  /**
   * Get the current user's topic performance stats.
   * Maps to UserTopicStat model — accuracy per topic across all attempts.
   * Used on student dashboard (weak areas) and profile (topic heatmap).
   */
  getMyTopicStats: () => api.get<UserTopicStat[]>("/users/me/topic-stats"),

  /**
   * Get topic stats filtered by subject.
   * Useful for subject-wise breakdown on the profile page.
   */
  getMyTopicStatsBySubject: (subjectId: string) =>
    api.get<UserTopicStat[]>("/users/me/topic-stats", {
      params: { subjectId },
    }),
};
