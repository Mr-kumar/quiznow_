import api from "./api";

// Base types for API responses
interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// User Management API
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

export interface UpdateUserRequest {
  name?: string;
  role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

export const adminUsersApi = {
  getAll: (page = 1, limit = 10, search?: string) =>
    api.get<PaginatedResponse<User>>("/admin/users", {
      params: { page, limit, search },
    }),

  getById: (id: string) => api.get<ApiResponse<User>>(`/admin/users/${id}`),

  create: (userData: CreateUserRequest) =>
    api.post<ApiResponse<User>>("/admin/users", userData),

  update: (id: string, userData: UpdateUserRequest) =>
    api.patch<ApiResponse<User>>(`/admin/users/${id}`, userData),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/admin/users/${id}`),
};

// Category Management API
export interface Category {
  id: string;
  name: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  parentId?: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  parentId?: string;
  isActive?: boolean;
}

export const adminCategoriesApi = {
  getAll: (page = 1, limit = 10, search?: string) =>
    api.get<PaginatedResponse<Category>>("/categories", {
      params: { page, limit, search },
    }),

  getById: (id: string) => api.get<ApiResponse<Category>>(`/categories/${id}`),

  create: (categoryData: CreateCategoryRequest) =>
    api.post<ApiResponse<Category>>("/categories", categoryData),

  update: (id: string, categoryData: UpdateCategoryRequest) =>
    api.patch<ApiResponse<Category>>(`/categories/${id}`, categoryData),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/categories/${id}`),

  getTree: () => api.get<ApiResponse<Category[]>>("/categories/tree"),
};

// Exam Management API
export interface Exam {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface CreateExamRequest {
  name: string;
  categoryId: string;
  isActive?: boolean;
}

export interface UpdateExamRequest {
  name?: string;
  categoryId?: string;
  isActive?: boolean;
}

export const adminExamsApi = {
  getAll: (page = 1, limit = 10, search?: string, categoryId?: string) =>
    api.get<PaginatedResponse<Exam>>("/exams", {
      params: { page, limit, search, categoryId },
    }),

  getById: (id: string) => api.get<ApiResponse<Exam>>(`/exams/${id}`),

  create: (examData: CreateExamRequest) =>
    api.post<ApiResponse<Exam>>("/exams", examData),

  update: (id: string, examData: UpdateExamRequest) =>
    api.patch<ApiResponse<Exam>>(`/exams/${id}`, examData),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/exams/${id}`),
};

// Test Series Management API
export interface TestSeries {
  id: string;
  title: string;
  examId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  exam?: Exam;
}

export interface CreateTestSeriesRequest {
  title: string;
  examId: string;
  isActive?: boolean;
}

export interface UpdateTestSeriesRequest {
  title?: string;
  examId?: string;
  isActive?: boolean;
}

export const adminTestSeriesApi = {
  getAll: (page = 1, limit = 10, search?: string, examId?: string) =>
    api.get<PaginatedResponse<TestSeries>>("/test-series", {
      params: { page, limit, search, examId },
    }),

  getById: (id: string) =>
    api.get<ApiResponse<TestSeries>>(`/test-series/${id}`),

  create: (seriesData: CreateTestSeriesRequest) =>
    api.post<ApiResponse<TestSeries>>("/test-series", seriesData),

  update: (id: string, seriesData: UpdateTestSeriesRequest) =>
    api.patch<ApiResponse<TestSeries>>(`/test-series/${id}`, seriesData),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/test-series/${id}`),
};

// Test Management API
export interface Test {
  id: string;
  title: string;
  durationMins: number;
  totalMarks: number;
  passMarks: number;
  positiveMark: number;
  negativeMark: number;
  startAt?: string;
  endAt?: string;
  isLive: boolean;
  isPremium: boolean;
  maxAttempts?: number;
  seriesId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  series?: TestSeries;
}

export interface CreateTestRequest {
  title: string;
  durationMins: number;
  totalMarks: number;
  passMarks: number;
  positiveMark?: number;
  negativeMark?: number;
  startAt?: string;
  endAt?: string;
  isLive?: boolean;
  isPremium?: boolean;
  maxAttempts?: number;
  seriesId: string;
  isActive?: boolean;
}

export interface UpdateTestRequest {
  title?: string;
  durationMins?: number;
  totalMarks?: number;
  passMarks?: number;
  positiveMark?: number;
  negativeMark?: number;
  startAt?: string;
  endAt?: string;
  isLive?: boolean;
  isPremium?: boolean;
  maxAttempts?: number;
  seriesId?: string;
  isActive?: boolean;
}

export const adminTestsApi = {
  getAll: (page = 1, limit = 10, search?: string, seriesId?: string) =>
    api.get<PaginatedResponse<Test>>("/tests", {
      params: { page, limit, search, seriesId },
    }),

  getById: (id: string) => api.get<ApiResponse<Test>>(`/tests/${id}`),

  create: (testData: CreateTestRequest) =>
    api.post<ApiResponse<Test>>("/tests", testData),

  update: (id: string, testData: UpdateTestRequest) =>
    api.patch<ApiResponse<Test>>(`/tests/${id}`, testData),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/tests/${id}`),
};

// Analytics API
export interface DashboardMetrics {
  totalUsers: number;
  activeTests: number;
  completedAttempts: number;
  avgPerformance: number;
  userGrowth: number;
  testGrowth: number;
  attemptGrowth: number;
  performanceGrowth: number;
}

export interface UserStats {
  total: number;
  students: number;
  instructors: number;
  admins: number;
  newThisMonth: number;
  activeThisMonth: number;
}

export interface TestStats {
  total: number;
  active: number;
  live: number;
  premium: number;
  createdThisMonth: number;
  completedThisMonth: number;
}

export interface AttemptStats {
  total: number;
  completed: number;
  started: number;
  expired: number;
  avgScore: number;
  avgDuration: number;
}

export const adminAnalyticsApi = {
  getDashboardMetrics: () =>
    api.get<ApiResponse<DashboardMetrics>>("/admin/analytics/dashboard"),

  getUserStats: () => api.get<ApiResponse<UserStats>>("/admin/analytics/users"),

  getTestStats: () => api.get<ApiResponse<TestStats>>("/admin/analytics/tests"),

  getAttemptStats: () =>
    api.get<ApiResponse<AttemptStats>>("/admin/analytics/attempts"),
};

export const adminQuestionsApi = {
  bulkUpload: (file: File, sectionId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sectionId", sectionId);

    return api.post<{ success: boolean; count: number }>(
      "/questions/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },
};

// Plans Management API
export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanRequest {
  name: string;
  price: number;
  durationDays: number;
}

export interface UpdatePlanRequest {
  name?: string;
  price?: number;
  durationDays?: number;
}

export const adminPlansApi = {
  getAll: (page = 1, limit = 10, search?: string) =>
    api.get<PaginatedResponse<Plan>>("/admin/plans", {
      params: { page, limit, search },
    }),

  getById: (id: string) => api.get<ApiResponse<Plan>>(`/admin/plans/${id}`),

  create: (planData: CreatePlanRequest) =>
    api.post<ApiResponse<Plan>>("/admin/plans", planData),

  update: (id: string, planData: UpdatePlanRequest) =>
    api.patch<ApiResponse<Plan>>(`/admin/plans/${id}`, planData),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/admin/plans/${id}`),
};

// Subscriptions Management API
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  startAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
  user?: User;
}

export interface CreateSubscriptionRequest {
  userId: string;
  planId: string;
}

export interface UpdateSubscriptionRequest {
  status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
}

export const adminSubscriptionsApi = {
  getAll: (page = 1, limit = 10, search?: string, userId?: string) =>
    api.get<PaginatedResponse<Subscription>>("/admin/subscriptions", {
      params: { page, limit, search, userId },
    }),

  getById: (id: string) =>
    api.get<ApiResponse<Subscription>>(`/admin/subscriptions/${id}`),

  create: (subscriptionData: CreateSubscriptionRequest) =>
    api.post<ApiResponse<Subscription>>(
      "/admin/subscriptions",
      subscriptionData,
    ),

  update: (id: string, subscriptionData: UpdateSubscriptionRequest) =>
    api.patch<ApiResponse<Subscription>>(
      `/admin/subscriptions/${id}`,
      subscriptionData,
    ),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/admin/subscriptions/${id}`),
};

// Settings Management API
export interface AdminSetting {
  id: string;
  key: string;
  value: any;
  createdAt: string;
  updatedAt: string;
}

export const adminSettingsApi = {
  getAll: () => api.get<Record<string, any>>("/admin/settings"),

  get: (key: string) =>
    api.get<ApiResponse<AdminSetting>>(`/admin/settings/${key}`),

  update: (key: string, value: any) =>
    api.post<ApiResponse<AdminSetting>>("/admin/settings", { key, value }),

  updateBatch: (settings: Array<{ key: string; value: any }>) =>
    api.post<ApiResponse<AdminSetting[]>>("/admin/settings/batch", settings),

  delete: (key: string) =>
    api.delete<ApiResponse<void>>(`/admin/settings/${key}`),
};

// Audit Logs API
export interface AuditLog {
  id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: any;
  createdAt: string;
}

export const adminAuditLogsApi = {
  getAll: (page = 1, limit = 10, search?: string, action?: string) =>
    api.get<PaginatedResponse<AuditLog>>("/admin/audit-logs", {
      params: { page, limit, search, action },
    }),

  getByActor: (actorId: string, page = 1, limit = 10) =>
    api.get<PaginatedResponse<AuditLog>>(`/admin/audit-logs/actor/${actorId}`, {
      params: { page, limit },
    }),

  cleanup: (daysOld = 90) => api.post("/admin/audit-logs/cleanup", { daysOld }),
};

// Topics Management API
export interface Topic {
  id: string;
  name: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicRequest {
  name: string;
  subject?: string;
}

export interface UpdateTopicRequest {
  name?: string;
  subject?: string;
}

export const adminTopicsApi = {
  getAll: (page = 1, limit = 10, search?: string) =>
    api.get<PaginatedResponse<Topic>>("/topics", {
      params: { page, limit, search },
    }),

  getById: (id: string) => api.get<ApiResponse<Topic>>(`/topics/${id}`),

  create: (topicData: CreateTopicRequest) =>
    api.post<ApiResponse<Topic>>("/topics", topicData),

  update: (id: string, topicData: UpdateTopicRequest) =>
    api.patch<ApiResponse<Topic>>(`/topics/${id}`, topicData),

  delete: (id: string) => api.delete<ApiResponse<void>>(`/topics/${id}`),

  getUniqueSubjects: () =>
    api.get<ApiResponse<string[]>>("/topics/subjects/unique"),
};
