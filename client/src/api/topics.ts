import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Topic } from "@/types/subjects";

export type { Topic };

export const adminTopicsApi = {
  getAll: (page = 1, limit = 1000) =>
    api.get<Topic[]>("/topics"), // Raw array, includes subject info
  
  getById: (id: string) =>
    api.get<Topic>(`/topics/${id}`),
  
  create: (topicData: { name: string; subjectId: string; parentId?: string }) =>
    api.post<Topic>("/topics", topicData),
  
  update: (id: string, topicData: { name?: string; subjectId?: string; parentId?: string }) =>
    api.patch<Topic>(`/topics/${id}`, topicData),
  
  delete: (id: string) =>
    api.delete<Topic>(`/topics/${id}`),
};
