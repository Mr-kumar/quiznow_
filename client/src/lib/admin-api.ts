/**
 * BACKWARD-COMPATIBILITY BARREL
 *
 * All real implementations have moved to src/api/*.ts
 * This file re-exports everything so old import paths still compile
 * during migration. Once every page imports from @/api/* directly, delete this file.
 *
 * Run this to check when it's safe to delete:
 *   grep -r "from \"@/lib/admin-api\"" src/ --include="*.tsx" --include="*.ts"
 */

import api from "./api";
import type { PaginatedResponse } from "@/types/api";

// ─── Users ────────────────────────────────────────────────────────────────────
export type { User, CreateUserRequest, UpdateUserRequest } from "@/api/users";
export { adminUsersApi } from "@/api/users";

// ─── Tests (Categories / Exams / Series / Tests) ──────────────────────────────
export type {
  Category,
  Exam,
  TestSeries,
  Test,
  CreateTestRequest,
  UpdateTestRequest,
} from "@/api/tests";
export {
  adminTestsApi,
  adminCategoriesApi,
  adminExamsApi,
  adminTestSeriesApi,
} from "@/api/tests";

// ─── Analytics ────────────────────────────────────────────────────────────────
export type {
  DashboardMetrics,
  UserStats,
  TestStats,
  AttemptStats,
} from "@/api/analytics";
export { adminAnalyticsApi } from "@/api/analytics";

// ─── Questions ────────────────────────────────────────────────────────────────
export type {
  Question,
  Topic,
  Subject,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  CursorPaginationParams,
  CursorPaginationResponse,
} from "@/api/questions";
export { adminQuestionsApi } from "@/api/questions";

// adminTopicsApi shim — Topics are now managed via adminSubjectsApi in @/api/subjects
// This shim allows the questions/page.tsx and subjects/page.tsx to keep working
// until they are migrated to import from @/api/subjects directly.
import { adminTopicsApi as _topicsApi } from "@/api/subjects";

export const adminTopicsApi = {
  getAll: (subjectId?: string) => _topicsApi.getAll(subjectId),
  getById: (id: string) => _topicsApi.getById(id),
  create: (data: { name: string; subjectId: string; parentId?: string }) =>
    _topicsApi.create(data),
  update: (id: string, data: { name?: string; parentId?: string }) =>
    _topicsApi.update(id, data),
  delete: (id: string) => _topicsApi.delete(id),
  getUniqueSubjects: () => _topicsApi.getUniqueSubjects(),
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export type { AuditLog } from "@/api/audit-logs";
export { adminAuditLogsApi } from "@/api/audit-logs";

// ─── Plans ────────────────────────────────────────────────────────────────────
export type { Plan } from "@/api/plans";
export { adminPlansApi } from "@/api/plans";

// ─── Subscriptions ────────────────────────────────────────────────────────────
export type { Subscription } from "@/api/subscriptions";
export { adminSubscriptionsApi } from "@/api/subscriptions";

// ─── Settings ─────────────────────────────────────────────────────────────────
export type { AppSetting } from "@/api/settings";
export { adminSettingsApi } from "@/api/settings";
