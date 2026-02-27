"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
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
  Target,
  BookOpen,
  FileText,
  Users,
  Settings,
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

export default function QuestionBankPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [topics, setTopics] = useState<any[]>([]);

  // 🚀 NEW: Pagination state (Fixes "Memory Crash" issue)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Fetch questions and topics
  useEffect(() => {
    fetchQuestions();
    fetchTopics();
  }, []);

  // Filter questions based on search and filters
  useEffect(() => {
    let filtered = questions || [];

    if (searchTerm) {
      filtered = filtered.filter((q) =>
        q.translations.some((t) =>
          t.content.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

    if (selectedTopic && selectedTopic !== "all") {
      filtered = filtered.filter((q) => q.topic?.id === selectedTopic);
    }

    if (selectedSubject && selectedSubject !== "all") {
      filtered = filtered.filter((q) => q.topic?.subject === selectedSubject);
    }

    if (!showInactive) {
      filtered = filtered.filter((q) => q.isActive);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, selectedTopic, selectedSubject, showInactive]);

  const fetchQuestions = async (page: number = 1) => {
    setIsLoading(true);
    try {
      // 🚀 Use paginated endpoint (Fixes "Memory Crash" issue)
      const res = await api.get("/questions/paginated", {
        params: {
          page,
          limit: 50,
          search: searchTerm,
          topic: selectedTopic === "all" ? undefined : selectedTopic,
          subject: selectedSubject === "all" ? undefined : selectedSubject,
        },
      });

      const {
        questions: pageQuestions,
        currentPage,
        totalPages,
        total,
        hasMore,
        limit,
      } = res.data;

      setQuestions(pageQuestions || []);
      setPagination({
        page: currentPage,
        limit,
        total,
        pages: totalPages,
        hasNext: hasMore,
        hasPrev: currentPage > 1,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics");
      setTopics(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === (filteredQuestions?.length || 0)) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions((filteredQuestions || []).map((q) => q.id));
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;

    try {
      await api.put(`/questions/${editingQuestion.id}`, {
        topicId: editingQuestion.topic?.id,
        translations: editingQuestion.translations,
        isActive: editingQuestion.isActive,
      });

      toast({
        title: "Success",
        description: "Question updated successfully",
      });

      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await api.delete(`/questions/${questionId}`);
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      fetchQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const handleInjectIntoTest = async (testId: string) => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No Questions Selected",
        description: "Please select at least one question to inject",
        variant: "destructive",
      });
      return;
    }

    try {
      // This would need to be implemented in the backend
      await api.post(`/tests/${testId}/inject-questions`, {
        questionIds: selectedQuestions,
      });

      toast({
        title: "Success",
        description: `Successfully injected ${selectedQuestions.length} questions into test`,
      });

      setSelectedQuestions([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to inject questions",
        variant: "destructive",
      });
    }
  };

  const getUniqueSubjects = () => {
    const subjects = new Set(topics.map((t) => t.subject).filter(Boolean));
    return Array.from(subjects);
  };

  const getQuestionPreview = (question: Question) => {
    const englishTranslation = question.translations.find(
      (t) => t.lang === "en",
    );
    return (
      englishTranslation?.content || question.translations[0]?.content || ""
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            🏦 Question Bank
          </h1>
          <p className="text-muted-foreground">
            Global repository of all questions. Perfect for creating premium
            tests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              router.push("/dashboard/admin/question-bank/create-test")
            }
            className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Target className="h-4 w-4 mr-2" />
            Create Test from Selection
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
          <Button
            onClick={() => router.push("/dashboard/admin/questions")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Questions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
              <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Questions
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {questions?.length || 0}
                </p>
              </div>
              <Hash className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
              <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Active Questions
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {(questions || []).filter((q) => q.isActive).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Topics
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {topics.length}
                </p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Selected
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {selectedQuestions.length}
                </p>
              </div>
              <Plus className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full md:w-48">
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
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics
                  .filter(
                    (t) =>
                      !selectedSubject ||
                      selectedSubject === "all" ||
                      t.subject === selectedSubject,
                  )
                  .map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={(checked) =>
                  setShowInactive(checked as boolean)
                }
              />
              <Label htmlFor="show-inactive" className="text-sm">
                Show Inactive
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Actions */}
      {selectedQuestions.length > 0 && (
        <Card className="border-0 shadow-xl bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedQuestions.length} questions selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuestions([])}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Inject into Test
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
              Questions ({filteredQuestions?.length || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedQuestions.length ===
                    (filteredQuestions?.length || 0) &&
                  (filteredQuestions?.length || 0) > 0
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
          ) : (filteredQuestions?.length || 0) === 0 ? (
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
              {filteredQuestions.map((question) => (
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
                              {(question.sectionLinks?.length ?? 0)} tests
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
                          <Button variant="ghost" size="sm">
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
