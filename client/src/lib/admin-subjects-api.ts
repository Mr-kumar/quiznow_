/**
 * Subjects & Topics API
 * Single source of truth — replaces the old admin-subjects-api.ts
 * The Subject type and adminSubjectsApi live here.
 * Topics are in admin-api.ts (adminTopicsApi) and import Subject from here.
 */
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
  name?: string;
  isActive?: boolean;
}

export const adminSubjectsApi = {
  getAll: () => api.get<Subject[]>("/subjects"),
  getById: (id: string) => api.get<Subject>(`/subjects/${id}`),
  create: (data: CreateSubjectDto) => api.post<Subject>("/subjects", data),
  update: (id: string, data: UpdateSubjectDto) =>
    api.patch<Subject>(`/subjects/${id}`, data),
  softDelete: (id: string) =>
    api.patch<Subject>(`/subjects/${id}/soft-delete`, {}),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};
