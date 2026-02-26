import { useEffect, useState } from "react";
import {
  adminCategoriesApi,
  adminExamsApi,
  adminTestSeriesApi,
  adminTestsApi,
} from "@/lib/admin-api";

interface HierarchyItem {
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

  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          categoriesResponse,
          examsResponse,
          seriesResponse,
          testsResponse,
        ] = await Promise.all([
          adminCategoriesApi.getAll(),
          adminExamsApi.getAll(),
          adminTestSeriesApi.getAll(),
          adminTestsApi.getAll(),
        ]);

        const categories = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data?.data || [];
        const exams = Array.isArray(examsResponse.data)
          ? examsResponse.data
          : examsResponse.data?.data || [];
        const series = Array.isArray(seriesResponse.data)
          ? seriesResponse.data
          : seriesResponse.data?.data || [];
        const tests = Array.isArray(testsResponse.data)
          ? testsResponse.data
          : testsResponse.data?.data || [];

        // Build hierarchy
        const hierarchyData: HierarchyItem[] = categories.map((category) => {
          const categoryExams = exams.filter(
            (exam) => exam.categoryId === category.id,
          );

          return {
            id: category.id,
            name: category.name,
            type: "category",
            metadata: {
              isActive: category.isActive,
              createdAt: category.createdAt,
            },
            children: categoryExams.map((exam) => {
              const examSeries = series.filter(
                (testSeries) => testSeries.examId === exam.id,
              );

              return {
                id: exam.id,
                name: exam.name,
                type: "exam",
                metadata: {
                  isActive: exam.isActive,
                  createdAt: exam.createdAt,
                },
                children: examSeries.map((testSeries) => {
                  const seriesTests = tests.filter(
                    (test) => test.seriesId === testSeries.id,
                  );

                  return {
                    id: testSeries.id,
                    name: testSeries.title,
                    type: "series",
                    metadata: {
                      isActive: testSeries.isActive,
                      createdAt: testSeries.createdAt,
                    },
                    children: seriesTests.map((test) => ({
                      id: test.id,
                      name: test.title,
                      type: "test",
                      metadata: {
                        isActive: test.isActive,
                        isLive: test.isLive,
                        isPremium: test.isPremium,
                        durationMins: test.durationMins,
                        totalMarks: test.totalMarks,
                        createdAt: test.createdAt,
                      },
                    })),
                  };
                }),
              };
            }),
          };
        });

        setHierarchy(hierarchyData);
      } catch (err) {
        setError("Failed to load test hierarchy");
        console.error("Hierarchy loading error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHierarchy();
  }, []);

  const refresh = async () => {
    const loadHierarchy = async () => {
      try {
        setError(null);

        // Fetch all data in parallel
        const [
          categoriesResponse,
          examsResponse,
          seriesResponse,
          testsResponse,
        ] = await Promise.all([
          adminCategoriesApi.getAll(),
          adminExamsApi.getAll(),
          adminTestSeriesApi.getAll(),
          adminTestsApi.getAll(),
        ]);

        const categories = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data?.data || [];
        const exams = Array.isArray(examsResponse.data)
          ? examsResponse.data
          : examsResponse.data?.data || [];
        const series = Array.isArray(seriesResponse.data)
          ? seriesResponse.data
          : seriesResponse.data?.data || [];
        const tests = Array.isArray(testsResponse.data)
          ? testsResponse.data
          : testsResponse.data?.data || [];

        // Build hierarchy
        const hierarchyData: HierarchyItem[] = categories.map((category) => {
          const categoryExams = exams.filter(
            (exam) => exam.categoryId === category.id,
          );

          return {
            id: category.id,
            name: category.name,
            type: "category",
            metadata: {
              isActive: category.isActive,
              createdAt: category.createdAt,
            },
            children: categoryExams.map((exam) => {
              const examSeries = series.filter(
                (testSeries) => testSeries.examId === exam.id,
              );

              return {
                id: exam.id,
                name: exam.name,
                type: "exam",
                metadata: {
                  isActive: exam.isActive,
                  createdAt: exam.createdAt,
                },
                children: examSeries.map((testSeries) => {
                  const seriesTests = tests.filter(
                    (test) => test.seriesId === testSeries.id,
                  );

                  return {
                    id: testSeries.id,
                    name: testSeries.title,
                    type: "series",
                    metadata: {
                      isActive: testSeries.isActive,
                      createdAt: testSeries.createdAt,
                    },
                    children: seriesTests.map((test) => ({
                      id: test.id,
                      name: test.title,
                      type: "test",
                      metadata: {
                        isActive: test.isActive,
                        isLive: test.isLive,
                        isPremium: test.isPremium,
                        durationMins: test.durationMins,
                        totalMarks: test.totalMarks,
                        createdAt: test.createdAt,
                      },
                    })),
                  };
                }),
              };
            }),
          };
        });

        setHierarchy(hierarchyData);
      } catch (err) {
        setError("Failed to refresh test hierarchy");
        console.error("Hierarchy refresh error:", err);
      }
    };

    await loadHierarchy();
  };

  return { hierarchy, isLoading, error, refresh };
}
