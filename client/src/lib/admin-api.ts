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
export { adminTestsApi } from "@/api/tests";

// Categories API — used by use-test-hierarchy.ts
export const adminCategoriesApi = {
  getAll: (page = 1, limit = 100, search?: string) =>
    api.get<import("@/api/tests").Category[]>("/categories", {
      params: { page, limit, search },
    }),
  getTree: () => api.get<import("@/api/tests").Category[]>("/categories/tree"),
  create: (data: { name: string; parentId?: string; isActive?: boolean }) =>
    api.post("/categories", data),
  update: (id: string, data: Partial<import("@/api/tests").Category>) =>
    api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Exams API — used by use-test-hierarchy.ts
export const adminExamsApi = {
  getAll: (page = 1, limit = 100, search?: string, categoryId?: string) =>
    api.get<PaginatedResponse<import("@/api/tests").Exam>>("/exams", {
      params: { page, limit, search, categoryId },
    }),
  getById: (id: string) => api.get(`/exams/${id}`),
  create: (data: { name: string; categoryId: string; isActive?: boolean }) =>
    api.post("/exams", data),
  update: (id: string, data: any) => api.patch(`/exams/${id}`, data),
  delete: (id: string) => api.delete(`/exams/${id}`),
};

// Test Series API — used by use-test-hierarchy.ts
export const adminTestSeriesApi = {
  getAll: (page = 1, limit = 100, search?: string, examId?: string) =>
    api.get<import("@/api/tests").TestSeries[]>("/test-series", {
      params: { page, limit, search, examId },
    }),
  getById: (id: string) => api.get(`/test-series/${id}`),
  create: (data: { title: string; examId: string; isActive?: boolean }) =>
    api.post("/test-series", data),
  update: (id: string, data: any) => api.patch(`/test-series/${id}`, data),
  delete: (id: string) => api.delete(`/test-series/${id}`),
};

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
import { adminSubjectsApi as _subjectsApi } from "@/api/subjects";
import { adminTopicsApi as _topicsApi } from "@/api/topics";

export const adminTopicsApi = {
  getAll: (page = 1, limit = 200) => _topicsApi.getAll(page, limit),
  getById: (id: string) => _topicsApi.getById(id),
  create: (data: { name: string; subjectId: string; parentId?: string }) =>
    _topicsApi.create(data),
  update: (
    id: string,
    data: { name?: string; subjectId?: string; parentId?: string },
  ) => _topicsApi.update(id, data),
  delete: (id: string) => _topicsApi.delete(id),
  getUniqueSubjects: () => _subjectsApi.getAll(),
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
export type { AppSettings } from "@/api/settings";
export { adminSettingsApi } from "@/api/settings";
