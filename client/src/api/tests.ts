import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

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

export interface Exam {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface TestSeries {
  id: string;
  title: string;
  examId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  exam?: Exam;
}

export interface Test {
  id: string;
  title: string;
  // DB column names (what the server actually returns)
  durationMins: number;
  totalMarks: number;
  passMarks: number;
  negativeMark: number;
  startAt?: string;
  endAt?: string;
  isLive: boolean;
  isPremium: boolean;
  seriesId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  series?: TestSeries;
}

// DTO field names = what the server's CreateTestDto expects (with forbidNonWhitelisted)
export interface CreateTestRequest {
  title: string;
  testSeriesId: string; // server DTO field name
  duration: number; // server DTO field name (stored as durationMins in DB)
  totalMarks: number;
  passingMarks: number; // server DTO field name (stored as passMarks in DB)
  negativeMarking: number; // server DTO field name (stored as negativeMark in DB)
  startAt?: string;
  endAt?: string;
}

// Wizard response — POST /tests/wizard returns { test, section }
export interface CreateTestWizardResponse {
  test: Test;
  section: {
    id: string;
    testId: string;
    name: string;
    order: number;
  };
}

export interface UpdateTestRequest {
  title?: string;
  isLive?: boolean;
  isPremium?: boolean;
  isActive?: boolean;
  duration?: number;
  totalMarks?: number;
  passingMarks?: number;
  negativeMarking?: number;
  startAt?: string;
  endAt?: string;
}

export const adminTestsApi = {
  // Returns raw Test[] (no wrapper)
  getAll: (page?: number, limit?: number, search?: string, seriesId?: string) =>
    api.get<Test[]>("/tests", {
      params: { page, limit, search, seriesId },
    }),

  getById: (id: string) => api.get<Test>(`/tests/${id}`),

  // POST /tests/wizard — creates test + default section in one transaction
  create: (testData: CreateTestRequest) =>
    api.post<CreateTestWizardResponse>("/tests/wizard", testData),

  update: (id: string, testData: UpdateTestRequest) =>
    api.patch<Test>(`/tests/${id}`, testData),

  togglePublish: (id: string, isLive: boolean) =>
    api.patch<Test>(`/tests/${id}/publish`, { isLive }),

  delete: (id: string) => api.delete(`/tests/${id}`),

  duplicate: (id: string) => api.post<Test>(`/tests/${id}/duplicate`),
};

export const adminCategoriesApi = {
  getAll: () => api.get<Category[]>("/categories"),
  getTree: () => api.get<Category[]>("/categories/tree"),
  create: (data: { name: string; parentId?: string }) =>
    api.post<Category>("/categories", data),
  update: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const adminExamsApi = {
  getAll: (categoryId?: string) =>
    api.get<Exam[]>("/exams", { params: categoryId ? { categoryId } : {} }),
  getById: (id: string) => api.get<Exam>(`/exams/${id}`),
  create: (data: { name: string; categoryId: string }) =>
    api.post<Exam>("/exams", data),
  update: (id: string, data: Partial<Exam>) =>
    api.patch<Exam>(`/exams/${id}`, data),
  delete: (id: string) => api.delete(`/exams/${id}`),
};

export const adminTestSeriesApi = {
  getAll: (examId?: string) =>
    api.get<TestSeries[]>("/test-series", {
      params: examId ? { examId } : {},
    }),
  getById: (id: string) => api.get<TestSeries>(`/test-series/${id}`),
  create: (data: { title: string; examId: string }) =>
    api.post<TestSeries>("/test-series", data),
  update: (id: string, data: Partial<TestSeries>) =>
    api.patch<TestSeries>(`/test-series/${id}`, data),
  delete: (id: string) => api.delete(`/test-series/${id}`),
};
