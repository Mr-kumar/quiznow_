"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  Search,
  Filter,
  CheckCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  FileText,
  Plus,
  BarChart3,
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
      const existingCategories =
        existingCategoriesRes.data.data || existingCategoriesRes.data;
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
      const existingExam = existingExams.find((e: any) => e.name === testExam);

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
          <h1 className="text-4xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            Create Test from Question Bank
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-lg">
            Select questions and configure test settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-4 py-1 text-base">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${step >= 1 ? "bg-blue-600" : "bg-zinc-300"}`}
            ></div>
            Step {step} of 2
          </Badge>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= 1
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              1
            </div>
            <span className="text-xs mt-2 font-medium text-center">
              Select Questions
            </span>
          </div>

          {/* Progress Line */}
          <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-blue-600 transition-all duration-300 ${
                step >= 2 ? "w-full" : "w-0"
              }`}
            ></div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= 2
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              2
            </div>
            <span className="text-xs mt-2 font-medium text-center">
              Test Details
            </span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* Filters Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-blue-600" />
                <span>Filter Questions</span>
              </CardTitle>
              <CardDescription>
                Refine questions by subject and topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-zinc-900"
                  />
                </div>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-900">
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
                  <SelectTrigger className="bg-white dark:bg-zinc-900">
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

              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={
                      selectedQuestions.length === filteredQuestions.length &&
                      filteredQuestions.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Select all ({filteredQuestions.length} questions)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 hover:bg-blue-700">
                    {selectedQuestions.length} selected
                  </Badge>
                  <Badge variant="secondary">
                    {filteredQuestions.length} filtered
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions List Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Questions
                  </CardTitle>
                  <CardDescription>
                    {filteredQuestions.length} available •{" "}
                    {selectedQuestions.length} selected
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600"></div>
                  <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                    Loading questions...
                  </p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                    No questions found matching your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-150 overflow-y-auto">
                  {filteredQuestions.map((question) => {
                    const preview = getQuestionPreview(question);
                    const isSelected = selectedQuestions.includes(question.id);
                    return (
                      <div
                        key={question.id}
                        className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                        }`}
                        onClick={() => handleQuestionSelect(question.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleQuestionSelect(question.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-zinc-900 dark:text-white mb-2 leading-relaxed">
                              {preview.content}
                            </p>
                            <div className="space-y-1.5 mb-3">
                              {preview.options.map((option, index) => (
                                <div
                                  key={index}
                                  className="text-sm text-zinc-600 dark:text-zinc-400"
                                >
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {String.fromCharCode(65 + index)}.
                                  </span>{" "}
                                  {option}
                                </div>
                              ))}
                            </div>
                            {question.topic && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {question.topic.subject}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
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
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setStep(2)}
              disabled={selectedQuestions.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Continue to Test Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {/* Test Details Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Test Details
              </CardTitle>
              <CardDescription>
                Configure basic test information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    Test Name
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Physics Mock Test 1"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    Duration (minutes)
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={testDuration}
                    onChange={(e) => setTestDuration(Number(e.target.value))}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    Category
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. JEE Main, NEET"
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value)}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    Exam
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. JEE Main June 2024"
                    value={testExam}
                    onChange={(e) => setTestExam(e.target.value)}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    Test Series
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. JEE Foundation Series"
                    value={testSeries}
                    onChange={(e) => setTestSeries(e.target.value)}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-0 shadow-lg bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Test Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Total Questions
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedQuestions.length}
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Total Marks
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {calculateTotalMarks()}
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Duration
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {testDuration || "—"}
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-1">
                      min
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Time/Question
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {testDuration && selectedQuestions.length > 0
                      ? (testDuration / selectedQuestions.length).toFixed(1)
                      : "—"}
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-1">
                      sec
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h4 className="font-bold text-zinc-700 dark:text-zinc-300">
                  Selected Questions Preview:
                </h4>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  {selectedQuestions.slice(0, 3).map((questionId, index) => {
                    const question = questions.find((q) => q.id === questionId);
                    const preview = question
                      ? getQuestionPreview(question)
                      : null;
                    return (
                      <div
                        key={questionId}
                        className="text-zinc-700 dark:text-zinc-300"
                      >
                        {index + 1}. {preview?.content.substring(0, 80)}...
                      </div>
                    );
                  })}
                  {selectedQuestions.length > 3 && (
                    <div className="text-zinc-500 dark:text-zinc-500 font-medium">
                      ... and {selectedQuestions.length - 3} more questions
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Questions
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTest}
                disabled={
                  isLoading ||
                  !testName ||
                  !testCategory ||
                  !testExam ||
                  !testSeries
                }
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Create Test
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
