import api from "@/lib/api";
import type { Subject, Topic } from "@/types/subjects";

export type { Subject, Topic };

export const adminSubjectsApi = {
  // GET /subjects → returns Subject[] (raw array, no pagination wrapper)
  getAll: () => api.get<Subject[]>("/subjects"),

  getById: (id: string) => api.get<Subject>(`/subjects/${id}`),

  create: (data: { name: string; isActive?: boolean }) =>
    api.post<Subject>("/subjects", data),

  update: (id: string, data: { name?: string; isActive?: boolean }) =>
    api.patch<Subject>(`/subjects/${id}`, data),

  softDelete: (id: string) => api.patch<Subject>(`/subjects/${id}/soft-delete`),

  delete: (id: string) => api.delete(`/subjects/${id}`),
};

export const adminTopicsApi = {
  // GET /topics → returns Topic[] (raw array)
  getAll: (subjectId?: string) =>
    api.get<Topic[]>("/topics", {
      params: subjectId ? { subjectId } : {},
    }),

  // GET /topics/subjects → unique subjects list
  getUniqueSubjects: () =>
    api.get<Array<{ id: string; name: string }>>("/topics/subjects"),

  getById: (id: string) => api.get<Topic>(`/topics/${id}`),

  // POST /topics body: { name, subjectId, parentId? }
  create: (data: { name: string; subjectId: string; parentId?: string }) =>
    api.post<Topic>("/topics", data),

  update: (id: string, data: { name?: string; parentId?: string }) =>
    api.patch<Topic>(`/topics/${id}`, data),

  delete: (id: string) => api.delete(`/topics/${id}`),
};
