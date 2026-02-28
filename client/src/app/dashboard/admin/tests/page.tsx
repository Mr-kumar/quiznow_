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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Trophy,
  Users,
  DollarSign,
  Zap,
  Play,
  Pause,
  Settings,
  BarChart3,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
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
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [testToPublish, setTestToPublish] = useState<Test | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [testToDuplicate, setTestToDuplicate] = useState<Test | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Load data
  const loadData = async () => {
    try {
      const [testsRes, seriesRes, examsRes] = await Promise.all([
        adminTestsApi.getAll(
          1,
          100,
          searchTerm,
          selectedSeries !== "all" ? selectedSeries : undefined,
        ),
        adminTestSeriesApi.getAll(1, 100),
        adminExamsApi.getAll(1, 100),
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
  }, [searchTerm, selectedSeries]);

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Test data has been updated",
    });
  };

  // Toggle publish status
  const handleTogglePublish = async (test: Test) => {
    try {
      const newStatus = !test.isLive;
      await api.patch(`/tests/${test.id}/publish`, { isLive: newStatus });

      setTests(
        tests.map((t) => (t.id === test.id ? { ...t, isLive: newStatus } : t)),
      );

      toast({
        title: newStatus ? "Test Published!" : "Test Unpublished",
        description: newStatus
          ? "Students can now see and take this test."
          : "Test is now hidden from students.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to toggle publish status",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  // Duplicate test
  const handleDuplicateTest = async () => {
    if (!testToDuplicate) return;

    try {
      const response = await api.post(`/tests/${testToDuplicate.id}/duplicate`);
      const newTest = response.data.data || response.data;

      toast({
        title: "Test Duplicated!",
        description: `"${testToDuplicate.title}" has been duplicated successfully.`,
      });

      setDuplicateDialogOpen(false);
      setTestToDuplicate(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Failed to duplicate test",
        description: error?.response?.data?.message || "Please try again",
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

  // Export test data
  const handleExportTest = async (test: Test) => {
    try {
      const response = await api.get(`/tests/${test.id}/export`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${test.title.replace(/\s+/g, "_")}_export.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: "Export Successful",
        description: "Test data has been exported to Excel",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (test: Test) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const openPublishDialog = (test: Test) => {
    setTestToPublish(test);
    setPublishDialogOpen(true);
  };

  const openDuplicateDialog = (test: Test) => {
    setTestToDuplicate(test);
    setDuplicateDialogOpen(true);
  };

  // Filter tests
  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSeries =
      selectedSeries === "all" || test.seriesId === selectedSeries;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "live" && test.isLive) ||
      (selectedStatus === "draft" && !test.isLive);

    return matchesSearch && matchesSeries && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: tests.length,
    live: tests.filter((t) => t.isLive).length,
    draft: tests.filter((t) => !t.isLive).length,
    premium: tests.filter((t) => t.isPremium).length,
    free: tests.filter((t) => !t.isPremium).length,
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
      accessorKey: "series.title",
      header: "Series",
      cell: ({ row }) => (
        <div className="text-sm">
          <Badge variant="outline" className="text-xs">
            {row.original.series?.title || "N/A"}
          </Badge>
        </div>
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
      header: "Marks",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("totalMarks")}</div>
      ),
    },
    {
      accessorKey: "passMarks",
      header: "Pass Marks",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.getValue("passMarks")}</div>
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
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const test = row.original;

        return (
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <Button
              size="sm"
              variant={test.isLive ? "outline" : "default"}
              onClick={() => handleTogglePublish(test)}
              className="h-8 px-3"
            >
              {test.isLive ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Publish
                </>
              )}
            </Button>

            {/* Action Dropdown */}
            <ActionDropdown>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/admin/tests/${test.id}`)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Test Assembly
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDuplicateDialog(test)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportTest(test)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(test)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </ActionDropdown>
          </div>
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
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Test Management Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete control over your test series and assessments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => router.push("/dashboard/admin/tests/create")}
            className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Tests
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.total}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              All tests in system
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-linear-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Live Tests
            </CardTitle>
            <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.live}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Available to students
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-linear-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Draft Tests
            </CardTitle>
            <Pause className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {stats.draft}
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Hidden from students
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-linear-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Premium Tests
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.premium}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Paid content
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-linear-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Free Tests
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {stats.free}
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              Free content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label>Search Tests</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by test name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full lg:w-48">
              <Label>Test Series</Label>
              <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                <SelectTrigger>
                  <SelectValue placeholder="All Series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Series</SelectItem>
                  {testSeries.map((series) => (
                    <SelectItem key={series.id} value={series.id}>
                      {series.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full lg:w-48">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Tests ({filteredTests.length})</span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BarChart3 className="w-4 h-4" />
              Real-time data
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredTests} />
        </CardContent>
      </Card>

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

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to duplicate "{testToDuplicate?.title}"?
            </p>
            <p className="text-sm text-gray-600">
              This will create a complete copy of the test including all
              sections and questions.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDuplicateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicateTest}>Duplicate Test</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
