import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminSubscriptionsApi } from "@/api/subscriptions";
import { subscriptionKeys } from "@/api/query-keys";
import { parseApiError } from "@/lib/errors";
import type {
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from "@/api/subscriptions";

interface UseSubscriptionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export function useSubscriptions(params: UseSubscriptionsParams = {}) {
  const { page = 1, limit = 10, search = "", status } = params;

  return useQuery({
    queryKey: subscriptionKeys.list({ page, limit, search, status }),
    queryFn: async () => {
      const res = await adminSubscriptionsApi.getAll(
        page,
        limit,
        search || undefined,
        status,
      );
      return (res.data as any)?.data ?? res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: [...subscriptionKeys.all(), "detail", id] as const,
    queryFn: async () => {
      const res = await adminSubscriptionsApi.getById(id);
      return (res.data as any)?.data ?? res.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminSubscriptionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      toast.success("Subscription created");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSubscriptionRequest;
    }) => adminSubscriptionsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...subscriptionKeys.all(), "detail", id] as const,
      });
      toast.success("Subscription updated");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminSubscriptionsApi.cancelSubscription(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...subscriptionKeys.all(), "detail", id] as const,
      });
      toast.success("Subscription cancelled");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

// useExtendSubscription is not supported by server
