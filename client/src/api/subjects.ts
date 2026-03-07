import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Subject, Topic } from "@/types/subjects";

export type { Subject, Topic };

export const adminSubjectsApi = {
  getAll: () => api.get<Subject[]>("/subjects"), // Raw array, not paginated

  getById: (id: string) => api.get<Subject>(`/subjects/${id}`),

  create: (subjectData: { name: string; isActive?: boolean }) =>
    api.post<Subject>("/subjects", subjectData),

  update: (id: string, subjectData: { name?: string; isActive?: boolean }) =>
    api.patch<Subject>(`/subjects/${id}`, subjectData),

  delete: (id: string) => api.delete<Subject>(`/subjects/${id}`),

  // Topics - these are separate endpoints, not nested under subjects
  // See api/topics.ts for topic operations
};
