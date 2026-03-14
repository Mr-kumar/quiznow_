import { useQuery } from "@tanstack/react-query";
import { adminUsersApi } from "@/api/users";
import { userKeys } from "@/api/query-keys";

interface UseUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useUsers(params: UseUsersParams = {}) {
  const { page = 1, limit = 10, search = "" } = params;

  return useQuery({
    queryKey: userKeys.list({ page, limit, search }),
    queryFn: async () => {
      const res = await adminUsersApi.getAll(page, limit, search || undefined);
      return res.data; // Now returns PaginatedResponse<User> consistently
    },
    placeholderData: (prev) => prev, // keeps old data visible while fetching next page
    staleTime: 1000 * 60 * 2, // 2 min — user lists don't change often
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const res = await adminUsersApi.getById(id);
      return res.data; // Now returns ApiResponse<User> consistently
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useDeepProfile(id: string) {
  return useQuery({
    queryKey: [...userKeys.detail(id), "deep-profile"],
    queryFn: async () => {
      const res = await adminUsersApi.getDeepProfile(id);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
