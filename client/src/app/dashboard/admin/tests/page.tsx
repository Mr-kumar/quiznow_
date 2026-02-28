"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Layers,
  Trash2,
  Clock,
  Award,
  Search,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  BookOpen,
  Zap,
  ArrowUp,
  ArrowDown,
  Edit2,
} from "lucide-react";
import api from "@/lib/api";

export default function ManageTestsCommandCenter() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHierarchy = async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [categoriesRes, examsRes, seriesRes, testsRes] = await Promise.all([
        api.get("/categories"),
        api.get("/exams"),
        api.get("/test-series"),
        api.get("/tests"),
      ]);

      const allCategories = categoriesRes.data.data || categoriesRes.data;
      const allExams = examsRes.data.data || examsRes.data;
      const allSeries = seriesRes.data.data || seriesRes.data;
      const allTests = (testsRes.data.data || testsRes.data).filter(
        (t: any) => t.isActive !== false,
      );

      console.log("All Tests Fetched:", allTests);
      console.log("All Series Fetched:", allSeries);

      // Build hierarchy by grouping data
      const categoriesWithData = allCategories.map((category: any) => {
        const exams = allExams.filter((e: any) => e.categoryId === category.id);

        const examsWithSeries = exams.map((exam: any) => {
          const series = allSeries.filter((s: any) => s.examId === exam.id);

          const seriesWithTests = series.map((s: any) => {
            // Try multiple field names for series relationship
            const tests = allTests.filter((t: any) => {
              return (
                t.seriesId === s.id ||
                t.testSeriesId === s.id ||
                (t.series && t.series.id === s.id)
              );
            });

            console.log(
              `Series ${s.id} (${s.title || s.name}) found ${tests.length} tests`,
            );

            return { ...s, tests };
          });

          return { ...exam, series: seriesWithTests };
        });

        return { ...category, exams: examsWithSeries };
      });

      setCategories(categoriesWithData);
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
      toast({
        title: "Failed to load hierarchy",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const toggleLiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await api.patch(`/tests/${id}/publish`, {
        isLive: !currentStatus,
      });

      if (response.status === 200 || response.status === 201) {
        toast({
          title: !currentStatus
            ? "Test Published! 🟢"
            : "Test moved to Draft ⚪",
          description: !currentStatus
            ? "Students can now see and take this test."
            : "This test is now hidden from students.",
        });
        fetchHierarchy();
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to update test status";

      toast({
        title: "Failed to Update Status",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (
      !confirm(
        "Archive this test? It will be hidden but data will be preserved.",
      )
    )
      return;

    try {
      const response = await api.patch(`/tests/${id}`, { isActive: false });

      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Test Archived ✓",
          description: "Test has been safely archived.",
        });
        fetchHierarchy();
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to archive test";

      toast({
        title: "Failed to Archive Test",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Filter tests by search term recursively
  const getFilteredCategories = () => {
    if (!searchTerm) return categories;

    return categories
      .map((category) => ({
        ...category,
        exams: category.exams
          .map((exam: any) => ({
            ...exam,
            series: exam.series
              .map((s: any) => ({
                ...s,
                tests: s.tests.filter((t: any) =>
                  t.title?.toLowerCase().includes(searchTerm.toLowerCase()),
                ),
              }))
              .filter((s: any) => s.tests.length > 0),
          }))
          .filter((exam: any) => exam.series.length > 0),
      }))
      .filter((category) => category.exams.length > 0);
  };

  // Get orphaned tests (not assigned to any series)
  const getOrphanedTests = () => {
    const allTestsInHierarchy = new Set<string>();
    categories.forEach((cat) => {
      cat.exams?.forEach((exam: any) => {
        exam.series?.forEach((series: any) => {
          series.tests?.forEach((test: any) => {
            allTestsInHierarchy.add(test.id);
          });
        });
      });
    });

    // Fetch all tests and find orphaned ones
    const allTests: any[] = [];
    categories.forEach((cat) => {
      cat.exams?.forEach((exam: any) => {
        exam.series?.forEach((series: any) => {
          series.tests?.forEach((test: any) => {
            allTests.push(test);
          });
        });
      });
    });

    return allTests;
  };

  const filteredCategories = getFilteredCategories();

  const handleReorder = async (testId: string, direction: "up" | "down") => {
    const flatTests: any[] = [];
    categories.forEach((cat) => {
      cat.exams?.forEach((exam: any) => {
        exam.series?.forEach((series: any) => {
          series.tests?.forEach((test: any) => {
            flatTests.push({ ...test, seriesId: series.id });
          });
        });
      });
    });

    const index = flatTests.findIndex((t) => t.id === testId);
    if (
      (direction === "up" && index <= 0) ||
      (direction === "down" && index >= flatTests.length - 1)
    )
      return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    [flatTests[index], flatTests[newIndex]] = [
      flatTests[newIndex],
      flatTests[index],
    ];

    toast({
      title: "Position updated",
      description: `Test moved ${direction}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading test hierarchy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-6 py-6 bg-white">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-linear-to-br from-indigo-500 to-blue-600 rounded-lg">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Tests</h1>
            <p className="text-sm text-gray-500">
              View, organize & publish tests
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
            <FolderOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              {searchTerm ? "No tests found" : "No categories available"}
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="space-y-2">
              {/* Category Header */}
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id,
                  )
                }
                className="w-full flex items-center gap-2 p-3 bg-linear-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-lg border border-indigo-100 transition-all text-left"
              >
                {expandedCategory === category.id ? (
                  <ChevronDown className="h-4 w-4 text-indigo-600 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-indigo-600 shrink-0" />
                )}
                <FolderOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-gray-900 text-sm flex-1">
                  {category.name}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-indigo-100 text-indigo-700 text-xs"
                >
                  {category.exams.reduce(
                    (total: number, exam: any) =>
                      total +
                      exam.series.reduce(
                        (seriesTotal: number, s: any) =>
                          seriesTotal + s.tests.length,
                        0,
                      ),
                    0,
                  )}{" "}
                  tests
                </Badge>
              </button>

              {/* Exams & Tests */}
              {expandedCategory === category.id && (
                <div className="ml-4 space-y-2 border-l-2 border-indigo-200 pl-4">
                  {category.exams.map((exam: any) => (
                    <div key={exam.id} className="space-y-2">
                      {/* Exam Header */}
                      <button
                        onClick={() =>
                          setExpandedExam(
                            expandedExam === exam.id ? null : exam.id,
                          )
                        }
                        className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all text-left"
                      >
                        {expandedExam === exam.id ? (
                          <ChevronDown className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        )}
                        <BookOpen className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium text-gray-800 text-xs flex-1">
                          {exam.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-white text-blue-600 text-xs border-blue-200"
                        >
                          {exam.series.reduce(
                            (total: number, s: any) => total + s.tests.length,
                            0,
                          )}
                        </Badge>
                      </button>

                      {/* Test Series & Tests */}
                      {expandedExam === exam.id && (
                        <div className="ml-3 space-y-2 border-l-2 border-blue-200 pl-3">
                          {exam.series.map((series: any) => (
                            <div key={series.id} className="space-y-1.5">
                              {/* Series Header */}
                              <button
                                onClick={() =>
                                  setExpandedSeries(
                                    expandedSeries === series.id
                                      ? null
                                      : series.id,
                                  )
                                }
                                className="w-full flex items-center gap-2 p-2 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all text-left"
                              >
                                {expandedSeries === series.id ? (
                                  <ChevronDown className="h-3 w-3 text-purple-600 shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-purple-600 shrink-0" />
                                )}
                                <Zap className="h-3 w-3 text-purple-600 shrink-0" />
                                <span className="font-medium text-gray-800 text-xs flex-1">
                                  {series.title || series.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-white text-purple-600 border-purple-200"
                                >
                                  {series.tests.length}
                                </Badge>
                              </button>

                              {/* Tests List */}
                              {expandedSeries === series.id && (
                                <div className="ml-2 space-y-1.5 border-l-2 border-purple-200 pl-3">
                                  {series.tests.map(
                                    (test: any, idx: number) => (
                                      <div
                                        key={test.id}
                                        className="p-2.5 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-indigo-300 transition-all text-xs group"
                                      >
                                        <div className="flex items-start gap-2.5">
                                          {/* Test Info */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                              <h4 className="font-semibold text-gray-900 truncate leading-snug">
                                                {test.title}
                                              </h4>
                                              <Badge
                                                className={
                                                  test.isLive
                                                    ? "bg-green-100 text-green-700 text-xs"
                                                    : "bg-gray-100 text-gray-700 text-xs"
                                                }
                                              >
                                                {test.isLive ? "Live" : "Draft"}
                                              </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-gray-600">
                                              <span className="flex items-center gap-0.5 text-xs">
                                                <Clock className="h-3 w-3" />
                                                {test.durationMins}m
                                              </span>
                                              <span className="flex items-center gap-0.5 text-xs">
                                                <Award className="h-3 w-3" />
                                                {test.totalMarks}pts
                                              </span>
                                            </div>
                                          </div>

                                          {/* Publish Toggle */}
                                          <Switch
                                            checked={test.isLive}
                                            onCheckedChange={() =>
                                              toggleLiveStatus(
                                                test.id,
                                                test.isLive,
                                              )
                                            }
                                            className="shrink-0 h-5"
                                          />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
                                            asChild
                                          >
                                            <Link
                                              href={`/dashboard/admin/tests/${test.id}`}
                                            >
                                              <Edit2 className="h-3 w-3 mr-0.5" />
                                              Edit
                                            </Link>
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-1.5 text-xs text-blue-600 hover:bg-blue-50"
                                            onClick={() =>
                                              handleReorder(test.id, "up")
                                            }
                                          >
                                            <ArrowUp className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-1.5 text-xs text-blue-600 hover:bg-blue-50"
                                            onClick={() =>
                                              handleReorder(test.id, "down")
                                            }
                                          >
                                            <ArrowDown className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-1.5 text-xs text-red-600 hover:bg-red-50"
                                            onClick={() =>
                                              handleSoftDelete(test.id)
                                            }
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
