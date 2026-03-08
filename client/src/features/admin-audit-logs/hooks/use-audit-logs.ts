import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminAuditLogsApi } from "@/api/audit-logs";
import { auditLogKeys } from "@/api/query-keys";
import { parseApiError } from "@/lib/errors";

interface UseAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
}

export function useAuditLogs(params: UseAuditLogsParams = {}) {
  const { page = 1, limit = 10, search = "", action } = params;

  return useQuery({
    queryKey: auditLogKeys.list({ page, limit, search, action }),
    queryFn: async () => {
      const res = await adminAuditLogsApi.getAll(
        page,
        limit,
        search || undefined,
        action,
      );
      console.log("Audit Logs API Response:", res);
      console.log("Audit Logs Response data:", res.data);
      // Return the complete response structure as expected by the server
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 1, // 1 min - audit logs change frequently
  });
}

export function useAuditLogsByActor(
  actorId: string,
  params: Omit<UseAuditLogsParams, "search" | "action"> = {},
) {
  const { page = 1, limit = 10 } = params;

  return useQuery({
    queryKey: [...auditLogKeys.list({ page, limit }), "actor", actorId],
    queryFn: async () => {
      const res = await adminAuditLogsApi.getByActor(actorId, page, limit);
      return (res.data as any)?.data ?? res.data;
    },
    enabled: !!actorId,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 1, // 1 min
  });
}

export function useCleanupAuditLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (daysOld: number = 90) => adminAuditLogsApi.cleanup(daysOld),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditLogKeys.lists() });
      toast.success("Audit logs cleaned up successfully");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}
