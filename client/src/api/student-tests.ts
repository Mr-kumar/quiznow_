import api from "@/lib/api";

// Student Tests API (for students, not admins)
export const studentTestsApi = {
  getAll: (
    page?: number,
    limit?: number,
    search?: string,
    seriesId?: string,
    categoryId?: string
  ) =>
    api.get("/student/tests", {
      params: { page, limit, search, seriesId, categoryId },
    }),

  getById: (id: string) => api.get(`/student/tests/${id}`),

  getSections: (id: string) => api.get(`/student/tests/${id}/sections`),

  start: (id: string) => api.post(`/student/tests/${id}/start`),
};
