import { useQuery } from "@tanstack/react-query";
import { adminTestSeriesApi } from "@/api/admin-tests";

export function useHierarchyCounts() {
  return useQuery({
    queryKey: ["hierarchy-counts"],
    queryFn: async () => {
      try {
        const response = await adminTestSeriesApi.getAll();
        // Handle axios response with data property
        const testSeries = response?.data || [];

        return {
          testSeriesCount: testSeries.length,
        };
      } catch (error) {
        console.error("Failed to fetch hierarchy counts:", error);
        return {
          testSeriesCount: 0,
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
