import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export interface AuditLog {
  id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: any;
  createdAt: string;
}

export const adminAuditLogsApi = {
  getAll: (page = 1, limit = 10, search?: string, action?: string) =>
    api.get<{
      data: AuditLog[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>("/admin/audit-logs", {
      params: { page, limit, search, action },
    }),
  getByActor: (actorId: string, page = 1, limit = 10) =>
    api.get<PaginatedResponse<AuditLog>>(`/admin/audit-logs/actor/${actorId}`, {
      params: { page, limit },
    }),
  cleanup: (daysOld = 90) =>
    api.post<ApiResponse<void>>("/admin/audit-logs/cleanup", { daysOld }),
};
