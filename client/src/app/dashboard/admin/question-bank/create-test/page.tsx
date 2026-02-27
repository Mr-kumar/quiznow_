"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  FileText,
  Plus,
} from "lucide-react";
import api from "@/lib/api";

interface Question {
  id: string;
  topicId: string | null;
  topic: any;
  translations: Array<{
    lang: string;
    content: string;
    options: string[];
    explanation?: string;
  }>;
  isActive: boolean;
}

interface Topic {
  id: string;
  name: string;
  subject: string;
}

export default function QuestionBankCreateTestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Test details
  const [testName, setTestName] = useState("");
  const [testCategory, setTestCategory] = useState("");
  const [testExam, setTestExam] = useState("");
  const [testSeries, setTestSeries] = useState("");
  const [testDuration, setTestDuration] = useState(60);
  const [testMarks, setTestMarks] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");

  useEffect(() => {
    fetchQuestions();
    fetchTopics();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, selectedSubject, selectedTopic]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/questions");
      setQuestions(res.data.data || res.data);
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

  const filterQuestions = () => {
    let filtered = questions;

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

    filtered = filtered.filter((q) => q.isActive);

    setFilteredQuestions(filtered);
  };

  const getUniqueSubjects = () => {
    const subjects = new Set(topics.map((t) => t.subject).filter(Boolean));
    return Array.from(subjects);
  };

  const getFilteredTopics = () => {
    if (selectedSubject === "all") return topics;
    return topics.filter((t) => t.subject === selectedSubject);
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map((q) => q.id));
    }
  };

  const calculateTotalMarks = () => {
    return selectedQuestions.length * 1; // 1 mark per question
  };

  const handleCreateTest = async () => {
    if (!testName || !testCategory || !testExam || !testSeries) {
      toast({
        title: "Missing Information",
        description: "Please fill in all test details",
        variant: "destructive",
      });
      return;
    }

    if (selectedQuestions.length === 0) {
      toast({
        title: "No Questions Selected",
        description: "Please select at least one question",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting test creation process...");

      // Step 1: Create category if needed
      let category: any = null;
      const existingCategoriesRes = await api.get("/categories");
      const existingCategories = existingCategoriesRes.data.data || existingCategoriesRes.data;
      const existingCategory = existingCategories.find(
        (c: any) => c.name === testCategory,
      );

      if (!existingCategory) {
        console.log("Creating new category:", testCategory);
        const categoryRes = await api.post("/categories", {
          name: testCategory,
          isActive: true,
        });
        category = categoryRes.data.data || categoryRes.data;
        console.log("Category created:", category);
      } else {
        category = existingCategory;
        console.log("Using existing category:", existingCategory);
      }

      // Step 2: Create exam if needed
      let exam: any = null;
      const existingExamsRes = await api.get("/exams");
      const existingExams = existingExamsRes.data.data || existingExamsRes.data;
      const existingExam = existingExams.find(
        (e: any) => e.name === testExam,
      );

      if (!existingExam) {
        console.log("Creating new exam:", testExam);
        const examRes = await api.post("/exams", {
          name: testExam,
          categoryId: category.id,
          isActive: true,
        });
        exam = examRes.data.data || examRes.data;
        console.log("Exam created:", exam);
      } else {
        exam = existingExam;
        console.log("Using existing exam:", existingExam);
      }

      // Step 3: Create test series
      console.log("Creating test series:", testSeries);
      const seriesRes = await api.post("/test-series", {
        title: testSeries,
        examId: exam.id,
        isActive: true,
      });
      const series = seriesRes.data.data || seriesRes.data;
      console.log("Test series created:", series);

      // Step 4: Create test
      console.log("Creating test:", testName);
      const testRes = await api.post("/tests", {
        title: testName,
        testSeriesId: series.id,
        duration: Number(testDuration),
        totalMarks: calculateTotalMarks(),
        passingMarks: 0,
        negativeMarking: 0,
      });
      const test = testRes.data.data || testRes.data;
      console.log("Test created:", test);

      // Step 5: Create section
      console.log("Creating section...");
      const sectionRes = await api.post("/sections", {
        testId: test.id,
        name: "Main Section",
        order: 1,
      });
      const section = sectionRes.data.data || sectionRes.data;
      console.log("Section created:", section);

      // Step 6: Inject questions into section
      console.log("Injecting questions:", selectedQuestions.length);
      await api.post(`/questions/inject-questions/${section.id}`, {
        questionIds: selectedQuestions,
      });
      console.log("Questions injected successfully");

      toast({
        title: "Test Created Successfully!",
        description: `Created test "${testName}" with ${selectedQuestions.length} questions`,
      });

      router.push("/dashboard/admin/tests");
    } catch (error: any) {
      console.error("Test creation error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to create test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestionPreview = (question: Question) => {
    const englishTranslation = question.translations.find(
      (t) => t.lang === "en",
    );
    return englishTranslation || question.translations[0];
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Create Test from Question Bank
          </h1>
          <p className="text-muted-foreground">
            Select questions from your Question Bank and create a complete test
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            Step {step} of 2
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 ${step >= 1 ? "text-blue-600" : "text-muted-foreground"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-muted"}`}
          >
            1
          </div>
          <span className="font-medium">Select Questions</span>
        </div>
        <div
          className={`flex-1 h-1 ${step >= 2 ? "bg-blue-600" : "bg-muted"}`}
        />
        <div
          className={`flex items-center gap-2 ${step >= 2 ? "text-blue-600" : "text-muted-foreground"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-muted"}`}
          >
            2
          </div>
          <span className="font-medium">Test Details</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select Topic" />
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
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedQuestions.length === filteredQuestions.length &&
                      filteredQuestions.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all ({filteredQuestions.length} questions)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedQuestions.length} selected
                  </Badge>
                  <Badge variant="outline">
                    {filteredQuestions.length} filtered
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <Card>
            <CardHeader>
              <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading questions...</div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions found matching your filters
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredQuestions.map((question) => {
                    const preview = getQuestionPreview(question);
                    return (
                      <div
                        key={question.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedQuestions.includes(question.id)
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                            : "border-border hover:bg-muted"
                        }`}
                        onClick={() => handleQuestionSelect(question.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedQuestions.includes(question.id)}
                            onChange={() => handleQuestionSelect(question.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium mb-2">
                              {preview.content}
                            </p>
                            <div className="space-y-1">
                              {preview.options.map((option, index) => (
                                <div
                                  key={index}
                                  className="text-sm text-muted-foreground"
                                >
                                  {String.fromCharCode(65 + index)}. {option}
                                </div>
                              ))}
                            </div>
                            {question.topic && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {question.topic.subject}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.topic.name}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={selectedQuestions.length === 0}
              className="flex items-center gap-2"
            >
              Continue to Test Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Name *</label>
                  <Input
                    placeholder="e.g. Top 100 Hardest Math Questions"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Duration (minutes) *
                  </label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={testDuration}
                    onChange={(e) => setTestDuration(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <Input
                    placeholder="e.g. Railways, SSC, Banking"
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exam *</label>
                  <Input
                    placeholder="e.g. RRB JE, SSC CGL, IBPS PO"
                    value={testExam}
                    onChange={(e) => setTestExam(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Test Series *</label>
                  <Input
                    placeholder="e.g. 2025 Mock Tests, Premium Masterclasses"
                    value={testSeries}
                    onChange={(e) => setTestSeries(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Questions
                    </p>
                    <p className="text-lg font-semibold">
                      {selectedQuestions.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Marks</p>
                    <p className="text-lg font-semibold">
                      {calculateTotalMarks()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-lg font-semibold">{testDuration} min</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Selected Questions Preview:</h4>
                <div className="text-sm text-muted-foreground">
                  {selectedQuestions.slice(0, 3).map((questionId, index) => {
                    const question = questions.find((q) => q.id === questionId);
                    const preview = question
                      ? getQuestionPreview(question)
                      : null;
                    return (
                      <div key={questionId} className="mb-1">
                        {index + 1}. {preview?.content.substring(0, 80)}...
                      </div>
                    );
                  })}
                  {selectedQuestions.length > 3 && (
                    <div className="text-muted-foreground">
                      ... and {selectedQuestions.length - 3} more questions
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Questions
            </Button>
            <Button
              onClick={handleCreateTest}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? "Creating Test..." : "Create Test"}
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
