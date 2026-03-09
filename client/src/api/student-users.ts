import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { User } from "./users";

export interface Subscription {
  id: string;
  plan: "FREE" | "PRO" | "PREMIUM";
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export const studentUsersApi = {
  getMe: () => api.get<ApiResponse<User>>("/users/me"),
  getMySubscription: () =>
    api.get<ApiResponse<Subscription>>("/users/me/subscription"),
};
