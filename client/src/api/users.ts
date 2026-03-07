import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

export interface UpdateUserRequest {
  name?: string;
  role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

export const adminUsersApi = {
  getAll: (page = 1, limit = 10, search?: string) =>
    api.get<{ success: boolean; message: string; data: User[] }>(
      "/admin/users",
      {
        params: { page, limit, search },
      },
    ),
  getById: (id: string) =>
    api.get<{ success: boolean; message: string; data: User }>(
      `/admin/users/${id}`,
    ),
  create: (userData: CreateUserRequest) =>
    api.post<ApiResponse<User>>("/admin/users", userData),
  update: (id: string, userData: UpdateUserRequest) =>
    api.patch<ApiResponse<User>>(`/admin/users/${id}`, userData),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/admin/users/${id}`),
};
