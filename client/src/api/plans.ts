import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number; // in days - renamed from duration to match pages
  features?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Explicit request DTOs — never use Omit<Plan,...> for write operations
export interface CreatePlanRequest {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features?: string[];
  isActive?: boolean;
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  features?: string[];
  isActive?: boolean;
}

export const adminPlansApi = {
  getAll: (page = 1, limit = 10, search?: string) =>
    api.get<PaginatedResponse<Plan>>("/admin/plans", {
      params: { page, limit, search },
    }),
  getById: (id: string) => api.get<ApiResponse<Plan>>(`/admin/plans/${id}`),
  create: (data: CreatePlanRequest) =>
    api.post<ApiResponse<Plan>>("/admin/plans", data),
  update: (id: string, data: UpdatePlanRequest) =>
    api.patch<ApiResponse<Plan>>(`/admin/plans/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/admin/plans/${id}`),
};
