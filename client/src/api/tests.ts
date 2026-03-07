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
  testSeriesId: string; // Fixed: was seriesId
  duration: number; // Fixed: was durationMins
  totalMarks: number;
  passingMarks: number; // Fixed: was passMarks
  negativeMarking: number; // Fixed: was negativeMark
  startAt?: string;
  endAt?: string;
  isLive?: boolean;
  isPremium?: boolean;
  maxAttempts?: number;
  isActive?: boolean;
}

export interface UpdateTestRequest {
  title?: string;
  testSeriesId?: string; // Fixed: was seriesId
  duration?: number; // Fixed: was durationMins
  totalMarks?: number;
  passingMarks?: number; // Fixed: was passMarks
  negativeMarking?: number; // Fixed: was negativeMark
  startAt?: string;
  endAt?: string;
  isLive?: boolean;
  isPremium?: boolean;
  maxAttempts?: number;
  isActive?: boolean;
}

export const adminTestsApi = {
  getAll: (page = 1, limit = 10, search?: string, seriesId?: string) =>
    api.get<Test[]>("/tests", {
      params: { page, limit, search, seriesId },
    }),
  getById: (id: string) => api.get<Test>(`/tests/${id}`),
  create: (testData: CreateTestRequest) => api.post<Test>("/tests", testData),
  update: (id: string, testData: UpdateTestRequest) =>
    api.patch<Test>(`/tests/${id}`, testData),
  delete: (id: string) => api.delete<Test>(`/tests/${id}`),
};
