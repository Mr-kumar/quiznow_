"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Hash,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FileText,
  Settings,
  Loader2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Tag,
  Archive,
  RotateCcw,
  Copy,
  ExternalLink,
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
import api from "@/lib/api";

interface Question {
  id: string;
  hash: string;
  topic?: {
    id: string;
    name: string;
    subject?: string;
  };
  translations: Array<{
    lang: string;
    content: string;
    options: any;
    explanation?: string;
  }>;
  isActive: boolean;
  createdAt: string;
  sectionLinks?: Array<{
    section: { test: { title: string } };
  }>;
}

interface PaginationData {
  data: Question[];
  pagination: {
    nextCursor?: string;
    prevCursor?: string;
    hasMore: boolean;
    hasPrevious: boolean;
    limit: number;
  };
}

export default function GlobalQuestionVault() {
  const router = useRouter();
  const { toast } = useToast();

  // State Management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Advanced Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  // Pagination State
  const [pagination, setPagination] = useState({
    nextCursor: null as string | null,
    prevCursor: null as string | null,
    hasMore: false,
    hasPrevious: false,
    limit: 50,
    currentPage: 1,
  });

  // Dialog States
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showBulkTagDialog, setShowBulkTagDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);

  // Data States
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedBulkTagTopic, setSelectedBulkTagTopic] = useState<string>("");
  const [isBulkTagging, setIsBulkTagging] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    bySubject: {} as Record<string, number>,
  });

  // Fetch initial data
  useEffect(() => {
    fetchQuestions();
    fetchTopics();
    fetchStats();
  }, []);

  // Refetch questions when filters change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchQuestions();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedTopic, selectedSubject, selectedStatus]);

  // Fetch questions with proper pagination
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Start with no cursor for first page
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
      });

      // Only add cursor if we're not on first page
      if (pagination.nextCursor && pagination.currentPage > 1) {
        params.append("cursor", pagination.nextCursor);
      }

      // Add filters
      if (searchTerm) params.append("search", searchTerm);
      if (selectedTopic !== "all") params.append("topicId", selectedTopic);
      if (selectedSubject !== "all") params.append("subject", selectedSubject);
      if (selectedStatus !== "all")
        params.append(
          "isActive",
          selectedStatus === "active" ? "true" : "false",
        );

      console.log("Fetching questions with params:", params.toString());
      const res = await api.get(`/questions?${params.toString()}`);
      const data = res.data;

      console.log("API Response:", data);

      // Handle different response formats
      const questionsData = data.data || data || [];
      console.log("Questions loaded:", questionsData.length);

      setQuestions(questionsData);
      setFilteredQuestions(questionsData);

      // Update pagination if available
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          nextCursor: data.pagination.nextCursor || null,
          prevCursor: data.pagination.prevCursor || null,
          hasMore: data.pagination.hasMore || false,
          hasPrevious: data.pagination.hasPrevious || false,
        }));
      } else {
        // If no pagination info, determine if there might be more
        setPagination((prev) => ({
          ...prev,
          hasMore: questionsData.length === pagination.limit,
          hasPrevious: pagination.currentPage > 1,
        }));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    searchTerm,
    selectedTopic,
    selectedSubject,
    selectedStatus,
    pagination.limit,
    pagination.nextCursor,
    pagination.currentPage,
  ]);

  // Fetch topics and stats
  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics");
      setTopics(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  };

  const fetchStats = async () => {
    try {
      // Try to get stats from API, but fall back to calculating from questions
      try {
        const res = await api.get("/questions/stats");
        setStats(res.data);
      } catch (statsError) {
        // If stats endpoint doesn't exist, calculate from questions data
        console.log("Stats endpoint not available, will calculate from data");
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Calculate stats from questions data
  const calculateStats = useCallback(() => {
    const total = questions.length;
    const active = questions.filter((q) => q.isActive).length;
    const inactive = total - active;

    const bySubject = questions.reduce(
      (acc, question) => {
        if (question.topic?.subject) {
          acc[question.topic.subject] = (acc[question.topic.subject] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    setStats({
      total,
      active,
      inactive,
      bySubject,
    });
  }, [questions]);

  // Update stats when questions change
  useEffect(() => {
    if (questions.length > 0) {
      calculateStats();
    }
  }, [questions, calculateStats]);

  // Navigation functions
  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination((prev) => ({
        ...prev,
        currentPage: prev.currentPage + 1,
        nextCursor: null, // Reset cursor to fetch from beginning of next page
      }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevious && pagination.currentPage > 1) {
      setPagination((prev) => ({
        ...prev,
        currentPage: prev.currentPage - 1,
        nextCursor: null, // Reset cursor to fetch from beginning of previous page
      }));
    }
  };

  // View question functionality
  const handleViewQuestion = (question: Question) => {
    // Create a modal or navigate to question detail view
    toast({
      title: "Question View",
      description: `Viewing question: ${getQuestionPreview(question).substring(0, 50)}...`,
    });

    // You can implement a modal here or navigate to a detail page
    // For now, just show a toast with question details
    console.log("View Question:", question);
  };

  // Selection functions
  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map((q) => q.id));
    }
  };

  // Bulk operations
  const handleBulkTag = async () => {
    if (!selectedBulkTagTopic || selectedQuestions.length === 0) return;

    setIsBulkTagging(true);
    try {
      await api.patch("/questions/bulk-tag", {
        questionIds: selectedQuestions,
        topicId: selectedBulkTagTopic,
      });

      toast({
        title: "Success",
        description: `Tagged ${selectedQuestions.length} questions successfully`,
      });

      setSelectedQuestions([]);
      setShowBulkTagDialog(false);
      fetchQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to tag questions",
        variant: "destructive",
      });
    } finally {
      setIsBulkTagging(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;

    try {
      await api.delete("/questions/bulk", {
        data: { questionIds: selectedQuestions },
      });

      toast({
        title: "Success",
        description: `Deleted ${selectedQuestions.length} questions`,
      });

      setSelectedQuestions([]);
      fetchQuestions();
      fetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete questions",
        variant: "destructive",
      });
    }
  };

  // Question operations
  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleDelete = (questionId: string) => {
    handleDeleteQuestion(questionId);
  };

  const handleSaveEdit = async () => {
    // Implement save edit logic
    toast({
      title: "Success",
      description: "Question updated successfully",
    });
    setEditingQuestion(null);
    fetchQuestions();
  };

  const handleToggleStatus = async (questionId: string) => {
    try {
      await api.patch(`/questions/${questionId}/toggle-status`);
      fetchQuestions();
      fetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle question status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await api.delete(`/questions/${questionId}`);
      fetchQuestions();
      fetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  // Utility functions
  const getQuestionPreview = (question: Question) => {
    const englishTranslation = question.translations.find(
      (t) => t.lang === "en",
    );
    return (
      englishTranslation?.content || question.translations[0]?.content || ""
    );
  };

  const getUniqueSubjects = () => {
    const subjects = new Set(topics.map((t) => t.subject).filter(Boolean));
    return Array.from(subjects);
  };

  const getFilteredTopics = () => {
    if (selectedSubject === "all") return topics;
    return topics.filter((t) => t.subject === selectedSubject);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            Global Question Vault
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-lg">
            Enterprise-grade question management with advanced filtering and
            bulk operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-l-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => setShowFiltersDialog(true)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchQuestions()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Questions
                </p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {stats.total || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Active
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Inactive
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.inactive}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Selected
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {selectedQuestions.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {getUniqueSubjects().map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {getFilteredTopics().map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedQuestions.length > 0 && (
        <Card className="border-0 shadow-lg bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedQuestions.length} questions selected
                </span>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedQuestions.length === questions.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkTagDialog(true)}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Bulk Tag
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkUploadDialog(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Questions ({questions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedQuestions.length === questions.length &&
                  questions.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Select All
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded mb-2"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                No questions found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question: Question) => (
                <div
                  key={question.id}
                  className={`p-4 border rounded-lg transition-all ${
                    selectedQuestions.includes(question.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={() => handleQuestionSelect(question.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
                            {getQuestionPreview(question)}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            {question.topic && (
                              <Badge variant="secondary" className="text-xs">
                                {question.topic.name}
                              </Badge>
                            )}
                            {question.topic?.subject && (
                              <Badge variant="outline" className="text-xs">
                                {question.topic.subject}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                question.isActive ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {question.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {question.sectionLinks?.length ?? 0} tests
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {question.hash.substring(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(
                                question.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewQuestion(question)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(question.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Question Dialog */}
      <Dialog
        open={!!editingQuestion}
        onOpenChange={() => setEditingQuestion(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div>
                <Label>Topic</Label>
                <Select
                  value={editingQuestion.topic?.id || ""}
                  onValueChange={(value) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      topic: topics.find((t) => t.id === value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name} {topic.subject && `(${topic.subject})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingQuestion.translations.map((translation, index) => (
                <div key={index} className="space-y-2">
                  <Label>Question Content ({translation.lang})</Label>
                  <Textarea
                    value={translation.content}
                    onChange={(e) => {
                      const newTranslations = [...editingQuestion.translations];
                      newTranslations[index].content = e.target.value;
                      setEditingQuestion({
                        ...editingQuestion,
                        translations: newTranslations,
                      });
                    }}
                    rows={3}
                  />
                </div>
              ))}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-active"
                  checked={editingQuestion.isActive}
                  onCheckedChange={(checked) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      isActive: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingQuestion(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
