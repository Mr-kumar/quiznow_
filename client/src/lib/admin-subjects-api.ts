import api from "./api";

export interface Subject {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    topics: number;
  };
}

export interface CreateSubjectDto {
  name: string;
}

export interface UpdateSubjectDto {
  name: string;
  isActive?: boolean;
}

export const adminSubjectsApi = {
  // Get all subjects
  getAll: () => api.get<Subject[]>("/subjects"),

  // Get subject by ID
  getById: (id: string) => api.get<Subject>(`/subjects/${id}`),

  // Create new subject
  create: (data: CreateSubjectDto) => api.post<Subject>("/subjects", data),

  // Update subject
  update: (id: string, data: UpdateSubjectDto) =>
    api.patch<Subject>(`/subjects/${id}`, data),

  // Delete subject
  delete: (id: string) => api.delete(`/subjects/${id}`),

  // Get subject with topics
  getWithTopics: (id: string) =>
    api.get<Subject>(`/subjects/${id}?include=topics`),
};
