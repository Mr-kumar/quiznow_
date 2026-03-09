/**
 * api/leaderboard.ts
 *
 * API client for leaderboard data.
 * Maps directly to the LeaderboardEntry model in the Prisma schema:
 *
 *   model LeaderboardEntry {
 *     id        BigInt   @id @default(autoincrement())
 *     testId    String
 *     userId    String
 *     score     Float
 *     createdAt DateTime @default(now())
 *     @@unique([testId, userId])
 *     @@index([testId, score(sort: Desc)])
 *   }
 */

import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  score: number;
  totalMarks: number;
  accuracy: number | null;
  timeTaken: number | null; // seconds
  attemptedAt: string; // ISO datetime
  isCurrentUser: boolean; // Server flags the authenticated user's entry
}

export interface LeaderboardResponse {
  testId: string;
  testTitle: string;
  totalParticipants: number;
  entries: LeaderboardEntry[];

  // Current user's position (always included, even if not in top N)
  currentUserEntry: LeaderboardEntry | null;

  // Pagination
  page: number;
  limit: number;
  totalPages: number;
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
    api.get<LeaderboardResponse>(`/tests/${testId}/leaderboard`, {
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
