import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminTestsApi } from "@/api/tests";
import { testKeys } from "@/api/query-keys";
import { parseApiError } from "@/lib/errors";
import type { CreateTestRequest, UpdateTestRequest } from "@/api/tests";

export function useCreateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestRequest) => adminTestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      toast.success("Test created successfully");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestRequest }) =>
      adminTestsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(id) });
      toast.success("Test updated");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminTestsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      toast.success("Test deleted");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}
