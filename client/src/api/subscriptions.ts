import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startAt: string; // Fixed: was startsAt, matches server
  expiresAt: string; // Fixed: was endsAt, matches server
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  plan?: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
  };
}

// Minimal create payload — server computes startsAt/endsAt from planId
export interface CreateSubscriptionRequest {
  userId: string;
  planId: string;
}

export interface UpdateSubscriptionRequest {
  status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
}

export const adminSubscriptionsApi = {
  getAll: (page = 1, limit = 10, search?: string, status?: string) =>
    api.get<PaginatedResponse<Subscription>>("/admin/subscriptions", {
      params: { page, limit, search, status },
    }),
  getById: (id: string) =>
    api.get<ApiResponse<Subscription>>(`/admin/subscriptions/${id}`),
  create: (data: CreateSubscriptionRequest) =>
    api.post<ApiResponse<Subscription>>("/admin/subscriptions", data),
  update: (id: string, data: UpdateSubscriptionRequest) =>
    api.patch<ApiResponse<Subscription>>(`/admin/subscriptions/${id}`, data),
  // Cancel maps to DELETE (soft-cancel via status=CANCELLED)
  cancel: (id: string) =>
    api.delete<ApiResponse<void>>(`/admin/subscriptions/${id}`),
  // Extend is not supported by server
  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/admin/subscriptions/${id}`),
};
