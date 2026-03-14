import api from "@/lib/api";
import type { Category, TestSeries, Test } from "./test-types";

// Public API (no auth required)
export const publicApi = {
  getTestSeries: (params: {
    examId?: string;
    category?: string;
    q?: string;
    limit?: number;
  }) => api.get<TestSeries[]>("/public/test-series", { params }),

  getTestSeriesById: (id: string) =>
    api.get<TestSeries>(`/public/test-series/${id}`),

  getLatestTests: (limit: number = 6) =>
    api.get<Test[]>("/public/test-series/latest-tests", { params: { limit } }),

  getCategories: () => api.get<Category[]>("/categories/tree"),
};
