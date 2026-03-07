import { useCallback, useEffect, useState } from "react";
import {
  adminCategoriesApi,
  adminExamsApi,
  adminTestSeriesApi,
  adminTestsApi,
} from "@/lib/admin-api";

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

/** Safely extract array from either shape: T[] or { data: T[] } */
function toArray<T>(res: any): T[] {
  return Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
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

    const [catResult, examResult, seriesResult, testResult] =
      await Promise.allSettled([
        adminCategoriesApi.getAll(),
        adminExamsApi.getAll(),
        adminTestSeriesApi.getAll(),
        adminTestsApi.getAll(),
      ]);

    const categories =
      catResult.status === "fulfilled" ? toArray<any>(catResult.value) : [];
    const exams =
      examResult.status === "fulfilled" ? toArray<any>(examResult.value) : [];
    const series =
      seriesResult.status === "fulfilled"
        ? toArray<any>(seriesResult.value)
        : [];
    const tests =
      testResult.status === "fulfilled" ? toArray<any>(testResult.value) : [];

    if (catResult.status === "rejected") {
      setError("Failed to load hierarchy — categories unavailable");
      console.error("Categories fetch error:", catResult.reason);
    }

    const hierarchyData: HierarchyItem[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: "category" as const,
      metadata: {
        isActive: category.isActive,
        createdAt: category.createdAt,
      },
      children: exams
        .filter((exam) => exam.categoryId === category.id)
        .map((exam) => ({
          id: exam.id,
          name: exam.name,
          type: "exam" as const,
          metadata: { isActive: exam.isActive, createdAt: exam.createdAt },
          children: series
            .filter((s) => s.examId === exam.id)
            .map((s) => ({
              id: s.id,
              name: s.title,
              type: "series" as const,
              metadata: { isActive: s.isActive, createdAt: s.createdAt },
              children: tests
                .filter((t) => t.seriesId === s.id)
                .map((t) => ({
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
