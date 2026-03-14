import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface DashboardMetrics {
  totalUsers: number;
  activeTests: number;
  completedAttempts: number;
  avgPerformance: number;
  userGrowth: number;
  testGrowth: number;
  attemptGrowth: number;
  performanceGrowth: number;
}

export interface UserStats {
  total: number;
  students: number;
  instructors: number;
  admins: number;
  newThisMonth: number;
  activeThisMonth: number;
}

export interface TestStats {
  total: number;
  active: number;
  live: number;
  premium: number;
  createdThisMonth: number;
  completedThisMonth: number;
}

export interface AttemptStats {
  total: number;
  completed: number;
  started: number;
  expired: number;
  avgScore: number;
  avgDuration: number;
}

export interface RevenueStats {
  totalRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  recentPayments: any[];
}

export const adminAnalyticsApi = {
  getDashboardMetrics: () =>
    api.get<ApiResponse<DashboardMetrics>>("/admin/analytics/dashboard"),
  getUserStats: () => api.get<ApiResponse<UserStats>>("/admin/analytics/users"),
  getTestStats: () => api.get<ApiResponse<TestStats>>("/admin/analytics/tests"),
  getAttemptStats: () =>
    api.get<ApiResponse<AttemptStats>>("/admin/analytics/attempts"),
  getRevenueStats: async (): Promise<ApiResponse<RevenueStats>> => {
    const response = await api.get<ApiResponse<RevenueStats>>(
      "/admin/analytics/revenue",
    );
    return response.data;
  },
};
