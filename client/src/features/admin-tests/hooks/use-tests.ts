import { useQuery } from "@tanstack/react-query";
import { adminTestsApi } from "@/api/admin-tests";
import { testKeys } from "@/api/query-keys";

interface UseTestsParams {
  page?: number;
  limit?: number;
  search?: string;
  seriesId?: string;
}

export function useTests(params: UseTestsParams = {}) {
  const { page = 1, limit = 10, search = "", seriesId } = params;

  return useQuery({
    queryKey: testKeys.list({ page, limit, search, seriesId }),
    queryFn: async () => {
      const res = await adminTestsApi.getAll(
        page,
        limit,
        search || undefined,
        seriesId,
      );
      return (res.data as any)?.data ?? res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

export function useTest(id: string) {
  return useQuery({
    queryKey: testKeys.detail(id),
    queryFn: async () => {
      const res = await adminTestsApi.getById(id);
      return (res.data as any)?.data ?? res.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
