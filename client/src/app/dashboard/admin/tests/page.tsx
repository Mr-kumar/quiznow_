"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Trophy,
  Users,
  DollarSign,
  Zap,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const { toast } = useToast();

  // Load data
  const loadData = async () => {
    try {
      const [testsRes, seriesRes, examsRes] = await Promise.all([
        adminTestsApi.getAll(),
        adminTestSeriesApi.getAll(),
        adminExamsApi.getAll(),
      ]);
      setTests(testsRes.data.data || []);
      setTestSeries(seriesRes.data.data || []);
      setExams(examsRes.data.data || []);
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

  const openDeleteDialog = (test: Test) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  // Table columns
  const columns: ColumnDef<Test>[] = [
    {
      accessorKey: "title",
      header: "Test Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "durationMins",
      header: "Duration",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {row.getValue("durationMins")} mins
        </div>
      ),
    },
    {
      accessorKey: "totalMarks",
      header: "Total Marks",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("totalMarks")}</div>
      ),
    },
    {
      accessorKey: "isLive",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.getValue("isLive") ? "ACTIVE" : "PENDING"}
          variant={row.getValue("isLive") ? "default" : "secondary"}
        />
      ),
    },
    {
      accessorKey: "isPremium",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isPremium") ? "default" : "secondary"}>
          {row.getValue("isPremium") ? "Premium" : "Free"}
        </Badge>
      ),
    },
    {
      accessorKey: "series.title",
      header: "Series",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.series?.title || "N/A"}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const test = row.original;

        return (
          <ActionDropdown>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/admin/tests/${test.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Test Assembly
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Tests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, edit, and manage your tests
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/admin/tests/create")}
          className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Test
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <DataTable columns={columns} data={tests} />
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the test "{testToDelete?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTest}
              className="bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
