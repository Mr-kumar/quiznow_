import api from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startAt: string; // server field name (NOT startsAt)
  expiresAt: string; // server field name (NOT endsAt)
  paymentOrderId?: string;
  paymentId?: string;
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

  getById: (id: string) => api.get<Subscription>(`/admin/subscriptions/${id}`),

  create: (data: CreateSubscriptionRequest) =>
    api.post<Subscription>("/admin/subscriptions", data),

  update: (id: string, data: UpdateSubscriptionRequest) =>
    api.patch<Subscription>(`/admin/subscriptions/${id}`, data),

  // Server only has DELETE /admin/subscriptions/:id for cancellation (soft cancel → status=CANCELLED)
  // There is no PATCH .../cancel or .../extend endpoint on the server
  cancel: (id: string) =>
    api.delete<Subscription>(`/admin/subscriptions/${id}`),

  delete: (id: string) => api.delete(`/admin/subscriptions/${id}`),
  cancelSubscription: async (id: string): Promise<Subscription> => {
    const response = await api.delete(`/admin/subscriptions/${id}/cancel`);
    return response.data;
  },
};
