"use client";

import { useState } from "react";
import { HierarchyView } from "@/components/admin/hierarchy-view";
import { useTestHierarchy } from "@/hooks/use-test-hierarchy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Folder, RefreshCw } from "lucide-react";
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

  function HierarchySkeleton() {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Test Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            📂 Manage Hierarchy
          </h1>
          <p className="text-muted-foreground">
            Build your content structure: Categories → Exams → Test Series
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleItemCreate("category")}>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hierarchy View */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <HierarchySkeleton />
          ) : error ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="text-red-600 mb-4">
                  <Folder className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Error Loading Hierarchy
                </h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refresh}>Try Again</Button>
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
        <div>
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedItem.name}
                    </h3>
                    <Badge className="mt-1">{selectedItem.type}</Badge>
                  </div>

                  {selectedItem.metadata && (
                    <div className="space-y-2">
                      {selectedItem.metadata.isActive !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Status
                          </span>
                          <Badge
                            variant={
                              selectedItem.metadata.isActive
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedItem.metadata.isActive
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </div>
                      )}

                      {selectedItem.metadata.isLive && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Live Status
                          </span>
                          <Badge className="bg-red-100 text-red-800">
                            Live
                          </Badge>
                        </div>
                      )}

                      {selectedItem.metadata.isPremium && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Premium
                          </span>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Premium
                          </Badge>
                        </div>
                      )}

                      {selectedItem.metadata.durationMins && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Duration
                          </span>
                          <span className="text-sm">
                            {selectedItem.metadata.durationMins} minutes
                          </span>
                        </div>
                      )}

                      {selectedItem.metadata.totalMarks && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Marks
                          </span>
                          <span className="text-sm">
                            {selectedItem.metadata.totalMarks}
                          </span>
                        </div>
                      )}

                      {selectedItem.metadata.createdAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Created
                          </span>
                          <span className="text-sm">
                            {new Date(
                              selectedItem.metadata.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-2">
                    <Button
                      onClick={() => handleItemEdit(selectedItem)}
                      className="w-full"
                    >
                      Edit {selectedItem.type}
                    </Button>
                    <Button
                      onClick={() => handleItemDelete(selectedItem)}
                      variant="destructive"
                      className="w-full"
                    >
                      Delete {selectedItem.type}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Select an item from the hierarchy to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
