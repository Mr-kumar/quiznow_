"use client";

import { useState } from "react";
import { HierarchyView } from "@/components/admin/hierarchy-view";
import { SectionsEditor } from "@/components/admin/sections-editor";
import { useTestHierarchy } from "@/hooks/use-test-hierarchy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  BookOpen,
  BarChart3,
  RefreshCw,
  Edit2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const createExamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
});

const createSeriesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  examId: z.string().min(1, "Exam is required"),
});

type CreateCategoryForm = z.infer<typeof createCategorySchema>;
type CreateExamForm = z.infer<typeof createExamSchema>;
type CreateSeriesForm = z.infer<typeof createSeriesSchema>;

export default function TestsHierarchyPage() {
  const { hierarchy, isLoading, error, refresh } = useTestHierarchy();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"category" | "exam" | "series">(
    "category",
  );
  const [parentId, setParentId] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const { toast } = useToast();

  const categoryForm = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: "" },
  });

  const examForm = useForm<CreateExamForm>({
    resolver: zodResolver(createExamSchema),
    defaultValues: { name: "", categoryId: "" },
  });

  const seriesForm = useForm<CreateSeriesForm>({
    resolver: zodResolver(createSeriesSchema),
    defaultValues: { title: "", examId: "" },
  });

  // Fetch categories and exams for forms
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await api.get("/exams");
      setExams(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
    }
  };

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
  };

  const handleItemEdit = (item: any) => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit Feature",
      description: `Edit ${item.type}: ${item.name} - Coming soon!`,
    });
  };

  const handleItemDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;

    try {
      await api.delete(
        `/${item.type === "category" ? "categories" : item.type + "s"}/${item.id}`,
      );
      toast({
        title: "Success",
        description: `${item.type} deleted successfully`,
      });
      refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const handleItemCreate = (type: string, parentId?: string) => {
    setCreateType(type as "category" | "exam" | "series");
    setParentId(parentId || "");
    setCreateDialogOpen(true);

    // Pre-fill parent relationships
    if (type === "exam" && parentId) {
      examForm.setValue("categoryId", parentId);
    }
    if (type === "series" && parentId) {
      seriesForm.setValue("examId", parentId);
    }

    // Fetch required data
    if (type === "exam") fetchCategories();
    if (type === "series") fetchExams();
  };

  const handleCreateCategory = async (data: CreateCategoryForm) => {
    try {
      await api.post("/categories", { name: data.name, isActive: true });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setCreateDialogOpen(false);
      categoryForm.reset();
      refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const handleCreateExam = async (data: CreateExamForm) => {
    try {
      await api.post("/exams", {
        name: data.name,
        categoryId: data.categoryId,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Exam created successfully",
      });
      setCreateDialogOpen(false);
      examForm.reset();
      refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create exam",
        variant: "destructive",
      });
    }
  };

  const handleCreateSeries = async (data: CreateSeriesForm) => {
    try {
      await api.post("/test-series", {
        title: data.title,
        examId: data.examId,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Test Series created successfully",
      });
      setCreateDialogOpen(false);
      seriesForm.reset();
      refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create test series",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            Manage Hierarchy
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-base">
            Organize your test structure: Categories → Exams → Test Series
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={refresh} variant="outline" className="gap-2 h-11">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => handleItemCreate("category")}
            className="bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 gap-2 h-11 px-6 text-white shadow-lg"
          >
            <Plus className="h-5 w-5" />
            New Category
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hierarchy View */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-t-lg border-b border-indigo-100 dark:border-indigo-800/30">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Test Hierarchy
                </CardTitle>
                <CardDescription>
                  Loading your test structure...
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                    >
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-40 rounded" />
                      <Skeleton className="h-6 w-20 rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
                  Error Loading Hierarchy
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
                <Button
                  onClick={refresh}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <HierarchyView
              data={hierarchy}
              onItemSelect={handleItemSelect}
              onItemEdit={handleItemEdit}
              onItemDelete={handleItemDelete}
              onItemCreate={handleItemCreate}
            />
          )}
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-t-lg border-b border-indigo-100 dark:border-indigo-800/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Item Details
              </CardTitle>
              <CardDescription>
                View and manage selected hierarchy item
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {selectedItem ? (
                <div className="space-y-6">
                  {/* Item Name & Type */}
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-3">
                      {selectedItem.name}
                    </h3>
                    <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white capitalize font-medium">
                      {selectedItem.type}
                    </Badge>
                  </div>

                  {/* Relevant Metadata - Only show type-specific info */}
                  {selectedItem.metadata && (
                    <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      {/* Status Badge */}
                      {selectedItem.metadata.isActive !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Status
                          </span>
                          <Badge
                            className={
                              selectedItem.metadata.isActive
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-zinc-400 hover:bg-zinc-500 text-white"
                            }
                          >
                            {selectedItem.metadata.isActive
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </div>
                      )}

                      {/* Test-specific metadata */}
                      {selectedItem.type === "test" && (
                        <>
                          {selectedItem.metadata.isLive && (
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                Publication
                              </span>
                              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                ✓ Live
                              </Badge>
                            </div>
                          )}

                          {!selectedItem.metadata.isLive && (
                            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                Publication
                              </span>
                              <Badge className="bg-zinc-400 hover:bg-zinc-500 text-white">
                                ○ Draft
                              </Badge>
                            </div>
                          )}

                          {selectedItem.metadata.durationMins && (
                            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                Duration
                              </span>
                              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                {selectedItem.metadata.durationMins} min
                              </span>
                            </div>
                          )}

                          {selectedItem.metadata.totalMarks && (
                            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                Total Marks
                              </span>
                              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                {selectedItem.metadata.totalMarks}
                              </span>
                            </div>
                          )}

                          {selectedItem.metadata.isPremium && (
                            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                Type
                              </span>
                              <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                ⭐ Premium
                              </Badge>
                            </div>
                          )}
                        </>
                      )}

                      {/* Created Date - only for important items */}
                      {selectedItem.metadata.createdAt &&
                        selectedItem.type === "test" && (
                          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              Created
                            </span>
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {new Date(
                                selectedItem.metadata.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <Button
                      onClick={() => handleItemEdit(selectedItem)}
                      className="w-full bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 gap-2 text-white shadow-md"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit {selectedItem.type}
                    </Button>
                    <Button
                      onClick={() => handleItemDelete(selectedItem)}
                      className="w-full bg-red-600 hover:bg-red-700 gap-2 text-white shadow-md"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete {selectedItem.type}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-500 dark:text-zinc-400 py-12">
                  <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6 text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium">
                    Select an item from the hierarchy to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sections Editor - Only show for tests */}
          {selectedItem?.type === "test" && (
            <SectionsEditor
              testId={selectedItem.id}
              testTitle={selectedItem.name}
            />
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New{" "}
              {createType.charAt(0).toUpperCase() + createType.slice(1)}
            </DialogTitle>
          </DialogHeader>

          {createType === "category" && (
            <Form {...categoryForm}>
              <form
                onSubmit={categoryForm.handleSubmit(handleCreateCategory)}
                className="space-y-4"
              >
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Railways, SSC, Banking"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Category</Button>
                </div>
              </form>
            </Form>
          )}

          {createType === "exam" && (
            <Form {...examForm}>
              <form
                onSubmit={examForm.handleSubmit(handleCreateExam)}
                className="space-y-4"
              >
                <FormField
                  control={examForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. RRB JE, SSC CGL, IBPS PO"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={examForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Exam</Button>
                </div>
              </form>
            </Form>
          )}

          {createType === "series" && (
            <Form {...seriesForm}>
              <form
                onSubmit={seriesForm.handleSubmit(handleCreateSeries)}
                className="space-y-4"
              >
                <FormField
                  control={seriesForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Series Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 2025 Mock Tests, Previous Year Papers"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={seriesForm.control}
                  name="examId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Exam</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select an exam</option>
                          {exams.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                              {exam.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Test Series</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
