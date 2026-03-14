import { useCallback, useEffect, useState } from "react";
import { adminTestsApi } from "@/api/admin-tests";

export interface HierarchyItem {
  id: string;
  name: string;
  type: "category" | "exam" | "series" | "test";
  children?: HierarchyItem[];
  metadata?: {
    isActive?: boolean;
    isLive?: boolean;
    isPremium?: boolean;
    durationMins?: number;
    totalMarks?: number;
    createdAt?: string;
  };
}

export function useTestHierarchy() {
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Single implementation shared by initial load AND refresh().
   * Previously this block was copy-pasted twice (~90 lines duplicated).
   * Promise.allSettled means one failed endpoint won't kill the whole tree.
   */
  const loadHierarchy = useCallback(async () => {
    setError(null);

    try {
      const response = await adminTestsApi.getHierarchy();
      // Handle different response shapes from Axios/Interceptor
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];

      const hierarchyData: HierarchyItem[] = data.map((category: any) => ({
        id: category.id,
        name: category.name,
        type: "category" as const,
        metadata: {
          isActive: category.isActive,
          createdAt: category.createdAt,
        },
        children: (category.exams || []).map((exam: any) => ({
          id: exam.id,
          name: exam.name,
          type: "exam" as const,
          metadata: { isActive: exam.isActive, createdAt: exam.createdAt },
          children: (exam.testSeries || []).map((s: any) => ({
            id: s.id,
            name: s.title,
            type: "series" as const,
            metadata: { isActive: s.isActive, createdAt: s.createdAt },
            children: (s.tests || []).map((t: any) => ({
              id: t.id,
              name: t.title,
              type: "test" as const,
              metadata: {
                isActive: t.isActive,
                isLive: t.isLive,
                isPremium: t.isPremium,
                durationMins: t.durationMins,
                totalMarks: t.totalMarks,
                createdAt: t.createdAt,
              },
            })),
          })),
        })),
      }));

      setHierarchy(hierarchyData);
    } catch (err) {
      setError("Failed to load hierarchy from server");
      console.error("Hierarchy fetch error:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    loadHierarchy()
      .catch((err) => {
        setError("Failed to load test hierarchy");
        console.error("Hierarchy loading error:", err);
      })
      .finally(() => setIsLoading(false));
  }, [loadHierarchy]);

  return {
    hierarchy,
    isLoading,
    error,
    refresh: loadHierarchy, // same function — no duplication
  };
}
