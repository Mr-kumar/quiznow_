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
