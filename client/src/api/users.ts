import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  // Present only in admin users listing responses; indicates active paid access
  subscriptions?: {
    id: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    expiresAt: string;
    plan: {
      id: string;
      name: string;
      price: number;
      durationDays: number;
    };
  }[];
}

export interface DeepUserProfile {
  user: User;
  stats: {
    totalAttempts: number;
    avgScore: number;
    avgAccuracy: number;
    avgTimeTaken: number;
  };
  recentAttempts: any[];
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
    api.get<PaginatedResponse<User>>("/admin/users", {
      params: { page, limit, search },
    }),
  getById: (id: string) => api.get<ApiResponse<User>>(`/admin/users/${id}`),
  getDeepProfile: (id: string) =>
    api.get<ApiResponse<DeepUserProfile>>(`/admin/users/${id}/profile`),
  create: (userData: CreateUserRequest) =>
    api.post<ApiResponse<User>>("/admin/users", userData),
  update: (id: string, userData: UpdateUserRequest) =>
    api.patch<ApiResponse<User>>(`/admin/users/${id}`, userData),
  updateStatus: (id: string, status: UserStatus) =>
    api.patch<ApiResponse<User>>(`/admin/users/${id}/status`, { status }),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/admin/users/${id}`),
};

export const publicUsersApi = {
  getProfile: (id: string) => api.get<any>(`/public/users/${id}/profile`),
};
