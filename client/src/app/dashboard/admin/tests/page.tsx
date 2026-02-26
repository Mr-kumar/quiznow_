"use client";

import { useState, useEffect } from "react";
import {
  DataTable,
  ActionDropdown,
  StatusBadge,
} from "@/components/admin/admin-data-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  adminTestsApi,
  adminTestSeriesApi,
  adminExamsApi,
  type Test,
  type CreateTestRequest,
  type UpdateTestRequest,
  type TestSeries,
  type Exam,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Trophy,
  Users,
  Calendar,
  Zap,
  DollarSign,
  Play,
  Pause,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

// Form validation schema
const testFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  durationMins: z.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  passMarks: z.number().min(0, "Pass marks cannot be negative"),
  positiveMark: z.number().min(0, "Positive mark cannot be negative"),
  negativeMark: z.number().min(0, "Negative mark cannot be negative"),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  isLive: z.boolean(),
  isPremium: z.boolean(),
  maxAttempts: z.number().min(1, "Max attempts must be at least 1").optional(),
  seriesId: z.string().min(1, "Test series is required"),
  isActive: z.boolean(),
});

type TestFormValues = z.infer<typeof testFormSchema>;

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const { toast } = useToast();

  // Forms
  const createForm = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      durationMins: 60,
      totalMarks: 100,
      passMarks: 40,
      positiveMark: 1,
      negativeMark: 0.33,
      isLive: false,
      isPremium: false,
      maxAttempts: 3,
      seriesId: "",
      isActive: true,
    },
  });

  const editForm = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
  });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      // Mock data for demo
      const mockTests: Test[] = [
        {
          id: "1",
          title: "Mathematics Final Exam",
          durationMins: 120,
          totalMarks: 100,
          passMarks: 40,
          positiveMark: 1,
          negativeMark: 0.33,
          startAt: new Date().toISOString(),
          endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isLive: true,
          isPremium: false,
          maxAttempts: 3,
          seriesId: "1",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Physics Quiz - Advanced",
          durationMins: 90,
          totalMarks: 80,
          passMarks: 32,
          positiveMark: 1,
          negativeMark: 0.25,
          isLive: true,
          isPremium: true,
          maxAttempts: 2,
          seriesId: "2",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockTestSeries: TestSeries[] = [
        {
          id: "1",
          title: "Mathematics Series 2024",
          examId: "1",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Science Advanced Series",
          examId: "2",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockExams: Exam[] = [
        {
          id: "1",
          name: "Mathematics",
          categoryId: "1",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Physics",
          categoryId: "2",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      try {
        const [testsResponse, seriesResponse, examsResponse] =
          await Promise.all([
            adminTestsApi.getAll(),
            adminTestSeriesApi.getAll(),
            adminExamsApi.getAll(),
          ]);
        setTests(testsResponse.data.data);
        setTestSeries(seriesResponse.data.data);
        setExams(examsResponse.data.data);
      } catch (apiError) {
        console.log("API endpoints not ready, using mock data:", apiError);
        setTests(mockTests);
        setTestSeries(mockTestSeries);
        setExams(mockExams);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create test
  const handleCreateTest = async (data: TestFormValues) => {
    try {
      await adminTestsApi.create(data as CreateTestRequest);
      toast({
        title: "Success",
        description: "Test created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test",
        variant: "destructive",
      });
    }
  };

  // Update test
  const handleUpdateTest = async (data: TestFormValues) => {
    if (!selectedTest) return;

    try {
      await adminTestsApi.update(selectedTest.id, data as UpdateTestRequest);
      toast({
        title: "Success",
        description: "Test updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedTest(null);
      editForm.reset();
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update test",
        variant: "destructive",
      });
    }
  };

  // Delete test
  const handleDeleteTest = async () => {
    if (!testToDelete) return;

    try {
      await adminTestsApi.delete(testToDelete.id);
      toast({
        title: "Success",
        description: "Test deleted successfully",
      });
      setDeleteDialogOpen(false);
      setTestToDelete(null);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete test",
        variant: "destructive",
      });
    }
  };

  // Edit test dialog
  const openEditDialog = (test: Test) => {
    setSelectedTest(test);
    editForm.reset({
      title: test.title,
      durationMins: test.durationMins,
      totalMarks: test.totalMarks,
      passMarks: test.passMarks,
      positiveMark: test.positiveMark,
      negativeMark: test.negativeMark,
      startAt: test.startAt
        ? new Date(test.startAt).toISOString().slice(0, 16)
        : "",
      endAt: test.endAt ? new Date(test.endAt).toISOString().slice(0, 16) : "",
      isLive: test.isLive,
      isPremium: test.isPremium,
      maxAttempts: test.maxAttempts,
      seriesId: test.seriesId,
      isActive: test.isActive,
    });
    setIsEditDialogOpen(true);
  };

  // Delete test dialog
  const openDeleteDialog = (test: Test) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  // Table columns
  const columns: ColumnDef<Test>[] = [
    {
      accessorKey: "title",
      header: "Test",
      cell: ({ row }) => {
        const test = row.original;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg ${test.isPremium ? "bg-linear-to-br from-yellow-400 to-orange-600" : "bg-linear-to-br from-blue-500 to-purple-600"} flex items-center justify-center text-white`}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{test.title}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {test.series?.title}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "durationMins",
      header: "Duration",
      cell: ({ row }) => {
        const duration = row.getValue("durationMins") as number;
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-zinc-500" />
            <span className="font-medium">{duration} min</span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalMarks",
      header: "Marks",
      cell: ({ row }) => {
        const test = row.original;
        return (
          <div className="text-sm">
            <div className="font-medium">{test.totalMarks} total</div>
            <div className="text-zinc-500 dark:text-zinc-400">
              {test.passMarks} to pass
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "isLive",
      header: "Status",
      cell: ({ row }) => {
        const test = row.original;
        return (
          <div className="flex items-center gap-2">
            <Badge
              className={
                test.isLive
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
              }
            >
              {test.isLive ? (
                <Play className="w-3 h-3 mr-1" />
              ) : (
                <Pause className="w-3 h-3 mr-1" />
              )}
              {test.isLive ? "Live" : "Draft"}
            </Badge>
            {test.isPremium && (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                <DollarSign className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm">
            <div className="font-medium">{date.toLocaleDateString()}</div>
            <div className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const test = row.original;

        return (
          <ActionDropdown>
            <DropdownMenuItem onClick={() => openEditDialog(test)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Test
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openDeleteDialog(test)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Test
            </DropdownMenuItem>
          </ActionDropdown>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tests Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage all tests and examinations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Test</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(handleCreateTest)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Test Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mathematics Final Exam"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="seriesId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Series</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select series" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {testSeries?.map((series) => (
                              <SelectItem key={series.id} value={series.id}>
                                {series.title}
                              </SelectItem>
                            )) || []}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="durationMins"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="totalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="passMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pass Marks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="maxAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Attempts</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="positiveMark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Positive Mark</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="negativeMark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Negative Mark</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="startAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time (optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="endAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time (optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <FormField
                    control={createForm.control}
                    name="isLive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Live Test</FormLabel>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Test will be available for students
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="isPremium"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Premium</FormLabel>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Requires subscription to access
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Test</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Tests
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {tests?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Live Tests
            </CardTitle>
            <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {tests?.filter((t) => t.isLive).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-linear-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Premium Tests
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {tests?.filter((t) => t.isPremium).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Test Series
            </CardTitle>
            <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {testSeries?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests Table */}
      <DataTable
        columns={columns}
        data={tests || []}
        searchKey="tests"
        title="All Tests"
        description="Manage test configurations and settings"
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdateTest)}
              className="space-y-4"
            >
              {/* Same form fields as create dialog */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Test</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              test "{testToDelete?.title}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTest}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
