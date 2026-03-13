import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features?: string[];
  isPopular?: boolean;
  badge?: string;
  accesses?: PlanAccess[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanAccess {
  id: string;
  planId: string;
  examId?: string;
  seriesId?: string;
  exam?: { id: string; name: string };
  series?: { id: string; title: string };
}

export interface AddPlanAccessDto {
  examId?: string;
  seriesId?: string;
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

  addAccess: async (
    planId: string,
    data: AddPlanAccessDto
  ): Promise<PlanAccess> => {
    const res = await api.post(`/admin/plans/${planId}/access`, data);
    return res.data;
  },

  removeAccess: async (planId: string, accessId: string): Promise<void> => {
    await api.delete(`/admin/plans/${planId}/access/${accessId}`);
  },

  getAccesses: async (planId: string): Promise<PlanAccess[]> => {
    const res = await api.get(`/admin/plans/${planId}/access`);
    return res.data;
  },
};
