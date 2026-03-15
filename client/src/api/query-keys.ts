/**
 * api/query-keys.ts  (UPDATED — added exam, attempt, leaderboard keys)
 *
 * Centralised query key factory. Every useQuery / useMutation must use
 * keys from here — never inline string arrays.
 *
 * Pattern: keys.lists() → keys.list(params) → keys.detail(id)
 * This lets us invalidate at any granularity:
 *   queryClient.invalidateQueries({ queryKey: testKeys.lists() })
 *   → invalidates ALL test list queries (any params)
 */

// ── Admin keys (existing) ──────────────────────────────────────────────────────

export const userKeys = {
  all: () => ["users"] as const,
  lists: () => [...userKeys.all(), "list"] as const,
  list: (params: object) => [...userKeys.lists(), params] as const,
  detail: (id: string) => [...userKeys.all(), "detail", id] as const,
};

export const questionKeys = {
  all: () => ["questions"] as const,
  detail: (id: string) => [...questionKeys.all(), "detail", id] as const,
  cursor: (params: object) =>
    [...questionKeys.all(), "cursor", params] as const,
};

export const testKeys = {
  all: () => ["tests"] as const,
  lists: () => [...testKeys.all(), "list"] as const,
  list: (params: object) => [...testKeys.lists(), params] as const,
  detail: (id: string) => [...testKeys.all(), "detail", id] as const,
};

export const analyticsKeys = {
  all: () => ["analytics"] as const,
  metrics: () => [...analyticsKeys.all(), "metrics"] as const,
  users: () => [...analyticsKeys.all(), "users"] as const,
  tests: () => [...analyticsKeys.all(), "tests"] as const,
  attempts: () => [...analyticsKeys.all(), "attempts"] as const,
  revenue: () => [...analyticsKeys.all(), "revenue"] as const,
};

export const auditLogKeys = {
  all: () => ["audit-logs"] as const,
  lists: () => [...auditLogKeys.all(), "list"] as const,
  list: (params: object) => [...auditLogKeys.lists(), params] as const,
};

export const settingsKeys = {
  all: () => ["settings"] as const,
};

export const subjectKeys = {
  all: () => ["subjects"] as const,
  lists: () => [...subjectKeys.all(), "list"] as const,
  list: (params: object) => [...subjectKeys.lists(), params] as const,
  detail: (id: string) => [...subjectKeys.all(), "detail", id] as const,
  topics: (subjectId: string) =>
    [...subjectKeys.all(), subjectId, "topics"] as const,
};

export const planKeys = {
  all: () => ["plans"] as const,
  lists: () => [...planKeys.all(), "list"] as const,
  list: (params: object) => [...planKeys.lists(), params] as const,
  detail: (id: string) => [...planKeys.all(), "detail", id] as const,
};

export const subscriptionKeys = {
  all: () => ["subscriptions"] as const,
  lists: () => [...subscriptionKeys.all(), "list"] as const,
  list: (params: object) => [...subscriptionKeys.lists(), params] as const,
  detail: (id: string) => [...subscriptionKeys.all(), "detail", id] as const,
};

// ── NEW: Student exam keys ────────────────────────────────────────────────────

/**
 * Exam loader keys — scoped under "exam" to never collide with admin test cache.
 * staleTime: Infinity on all — test content never changes mid-exam.
 */
export const examKeys = {
  all: () => ["exam"] as const,
  test: (testId: string) => [...examKeys.all(), "test", testId] as const,
  sections: (testId: string) =>
    [...examKeys.all(), "sections", testId] as const,
};

/**
 * Attempt keys — result and review data per attempt.
 * staleTime: Infinity on result — it's immutable once submitted.
 */
export const attemptKeys = {
  all: () => ["attempts"] as const,
  result: (attemptId: string) =>
    [...attemptKeys.all(), "result", attemptId] as const,
  review: (attemptId: string, lang?: string) =>
    [...attemptKeys.all(), "review", attemptId, lang ?? "EN"] as const,
  history: (params: object) =>
    [...attemptKeys.all(), "history", params] as const,
};

/**
 * Leaderboard keys.
 * staleTime: 2 min — updates frequently as more students submit.
 */
export const leaderboardKeys = {
  all: () => ["leaderboard"] as const,
  test: (testId: string, page?: number) =>
    [...leaderboardKeys.all(), "test", testId, page ?? 1] as const,
};

/**
 * Student profile / topic stats keys.
 */
export const studentKeys = {
  all: () => ["student"] as const,
  topicStats: () => [...studentKeys.all(), "topic-stats"] as const,
  topicStatsBySubject: (subjectId: string) =>
    [...studentKeys.topicStats(), subjectId] as const,
  profile: () => [...studentKeys.all(), "profile"] as const,
  subscription: () => [...studentKeys.all(), "subscription"] as const,
};

/**
 * Public keys (no auth)
 */
export const publicKeys = {
  all: () => ["public"] as const,
  testSeries: (params: object) =>
    [...publicKeys.all(), "test-series", params] as const,
  testSeriesDetail: (id: string) =>
    [...publicKeys.all(), "test-series", "detail", id] as const,
  latestTests: (limit: number) =>
    [...publicKeys.all(), "latest-tests", limit] as const,
  categories: () => [...publicKeys.all(), "categories"] as const,
  subjects: () => [...publicKeys.all(), "subjects"] as const,
  subjectDetail: (id: string) =>
    [...publicKeys.subjects(), "detail", id] as const,
  userProfile: (id: string) =>
    [...publicKeys.all(), "user-profile", id] as const,
};
