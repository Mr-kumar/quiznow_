import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminPlansApi } from "@/api/plans";
import { planKeys } from "@/api/query-keys";
import { parseApiError } from "@/lib/errors";
import type { CreatePlanRequest, UpdatePlanRequest } from "@/api/plans";

interface UsePlansParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function usePlans(params: UsePlansParams = {}) {
  const { page = 1, limit = 10, search = "" } = params;

  return useQuery({
    queryKey: planKeys.list({ page, limit, search }),
    queryFn: async () => {
      const res = await adminPlansApi.getAll(page, limit, search || undefined);
      return (res.data as any)?.data ?? res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5, // 5 min - plans don't change often
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: async () => {
      const res = await adminPlansApi.getById(id);
      return (res.data as any)?.data ?? res.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlanRequest) => adminPlansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      toast.success("Plan created");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanRequest }) =>
      adminPlansApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(id) });
      toast.success("Plan updated");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminPlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      toast.success("Plan deleted");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}
