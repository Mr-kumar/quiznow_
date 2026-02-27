"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  FolderTree,
  BookOpen,
  Layers,
  Plus,
} from "lucide-react";
import { BulkQuestionUpload } from "@/components/admin/bulk-upload";
import { QuestionBankSelector } from "@/components/admin/question-bank-selector";

export default function CreateTestWizard() {
  const router = useRouter();
  const { toast } = useToast();

  // Wizard State
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [injectionMethod, setInjectionMethod] = useState<
    "excel" | "question-bank"
  >("excel");

  // Data State
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);
  const [createdSectionId, setCreatedSectionId] = useState<string | null>(null);
  const [questionBankSelectedQuestions, setQuestionBankSelectedQuestions] =
    useState<string[]>([]);
  const [uploadedQuestionsCount, setUploadedQuestionsCount] =
    useState<number>(0);

  // Hierarchy Data States
  const [categories, setCategories] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);

  // New Entity Creation States
  const [newCatName, setNewCatName] = useState("");
  const [newExamName, setNewExamName] = useState("");
  const [newSeriesTitle, setNewSeriesTitle] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    categoryId: "",
    examId: "",
    seriesId: "",
    title: "",
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    negativeMark: 0.33,
  });

  // Fetch functions
  const fetchCategories = () =>
    api
      .get("/categories")
      .then((res) => setCategories(res.data.data || res.data))
      .catch(console.error);
  const fetchExams = (catId: string) =>
    api
      .get(`/exams?categoryId=${catId}`)
      .then((res) => setExams(res.data.data || res.data))
      .catch(console.error);
  const fetchSeries = (examId: string) =>
    api
      .get(`/test-series?examId=${examId}`)
      .then((res) => setSeries(res.data.data || res.data))
      .catch(console.error);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.categoryId) {
      fetchExams(formData.categoryId);
      setFormData((prev) => ({ ...prev, examId: "", seriesId: "" }));
    }
  }, [formData.categoryId]);

  useEffect(() => {
    if (formData.examId) {
      fetchSeries(formData.examId);
      setFormData((prev) => ({ ...prev, seriesId: "" }));
    }
  }, [formData.examId]);

  // --- ON-THE-FLY CREATION HANDLERS ---
  const handleCreateCategory = async () => {
    try {
      const res = await api.post("/categories", {
        name: newCatName,
        isActive: true,
      });
      const newCat = res.data.data || res.data;
      setCategories([...categories, newCat]);
      setFormData({ ...formData, categoryId: newCat.id });
      setNewCatName("");
      toast({ title: "Category Created!" });
    } catch (e) {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleCreateExam = async () => {
    try {
      const res = await api.post("/exams", {
        name: newExamName,
        categoryId: formData.categoryId,
        isActive: true,
      });
      const newExam = res.data.data || res.data;
      setExams([...exams, newExam]);
      setFormData({ ...formData, examId: newExam.id });
      setNewExamName("");
      toast({ title: "Exam Created!" });
    } catch (e) {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleCreateSeries = async () => {
    try {
      const res = await api.post("/test-series", {
        title: newSeriesTitle,
        examId: formData.examId,
        isActive: true,
      });
      const newSeries = res.data.data || res.data;
      setSeries([...series, newSeries]);
      setFormData({ ...formData, seriesId: newSeries.id });
      setNewSeriesTitle("");
      toast({ title: "Series Created!" });
    } catch (e) {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleCreateTestAndSection = async () => {
    console.log("Function called. Current formData:", formData);
    console.log("Series ID check:", formData.seriesId);
    console.log("Title check:", formData.title);

    if (!formData.seriesId || !formData.title) {
      toast({
        title: "Incomplete",
        description: "Select Hierarchy and enter a title.",
        variant: "destructive",
      });
      return;
    }

    // Check if there are any questions selected or uploaded
    const hasQuestions =
      questionBankSelectedQuestions.length > 0 || uploadedQuestionsCount > 0;

    console.log("Question counts check:", {
      questionBankSelectedQuestions: questionBankSelectedQuestions.length,
      uploadedQuestionsCount: uploadedQuestionsCount,
      hasQuestions: hasQuestions,
    });

    if (!hasQuestions) {
      toast({
        title: "No Questions",
        description:
          "Please select questions from Question Bank or upload questions before creating a test.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create the Test
      const testPayload = {
        title: formData.title,
        duration: Number(formData.duration),
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        negativeMarking: Number(formData.negativeMark),
        testSeriesId: formData.seriesId,
      };

      console.log("Creating test with payload:", testPayload);
      console.log("Series ID from formData:", formData.seriesId);
      console.log("Current formData state:", formData);

      const testRes = await api.post("/tests", testPayload);
      const testId = testRes.data.data?.id || testRes.data.id;
      console.log("Test created with ID:", testId);
      setCreatedTestId(testId);

      // 2. Automatically Create a Default Section for this Test
      const sectionPayload = {
        testId: testId,
        name: "General Section",
        order: 1,
      };
      const secRes = await api.post("/sections", sectionPayload);
      const sectionId = secRes.data.data?.id || secRes.data.id;
      console.log("Section created with ID:", sectionId);
      setCreatedSectionId(sectionId);

      // 3. Inject Question Bank questions if any were selected
      if (questionBankSelectedQuestions.length > 0) {
        await api.post(`/questions/inject-questions/${sectionId}`, {
          questionIds: questionBankSelectedQuestions,
        });
        console.log(
          "Injected Question Bank questions:",
          questionBankSelectedQuestions.length,
        );
      }

      const totalQuestions =
        questionBankSelectedQuestions.length + uploadedQuestionsCount;

      toast({
        title: "Test Created Successfully! 🎉",
        description: `Test "${formData.title}" created with ${totalQuestions} questions`,
      });

      router.push("/dashboard/admin/tests"); // Redirect to tests list
    } catch (error: any) {
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error occurred during test creation");

      toast({
        title: "Database Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to create Test. Check your testSeriesId.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (uploadedCount: number) => {
    // Track uploaded questions count
    setUploadedQuestionsCount(uploadedCount);

    toast({
      title: "Boom! 🚀",
      description: `${uploadedCount} questions uploaded successfully!`,
    });
    // Don't redirect - let user create the test
  };

  const handleQuestionBankInjection = (questionIds: string[]) => {
    // Store selected questions in state for validation
    setQuestionBankSelectedQuestions(questionIds);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div
          className={`flex flex-col items-center gap-2 ${step >= 1 ? "text-blue-600" : "text-zinc-400"}`}
        >
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-full font-bold shadow-md ${step >= 1 ? "bg-blue-600 text-white" : "bg-zinc-100"}`}
          >
            1
          </div>
          <span className="text-xs font-semibold">Hierarchy & Rules</span>
        </div>
        <div
          className={`h-1 w-24 rounded ${step >= 2 ? "bg-blue-600" : "bg-zinc-200"}`}
        ></div>
        <div
          className={`flex flex-col items-center gap-2 ${step >= 2 ? "text-blue-600" : "text-zinc-400"}`}
        >
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-full font-bold shadow-md ${step >= 2 ? "bg-blue-600 text-white" : "bg-zinc-100"}`}
          >
            2
          </div>
          <span className="text-xs font-semibold">Inject Excel</span>
        </div>
      </div>

      {step === 1 && (
        <Card className="shadow-xl">
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white rounded-t-xl">
            <CardTitle className="text-2xl flex items-center gap-2">
              <FolderTree /> Step 1: Content Hierarchy
            </CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              Place this test exactly where it belongs, or create new categories
              instantly.
            </CardDescription>
          </div>
          <CardDescription>Create the container for your exam.</CardDescription>
          <CardContent className="space-y-8 p-6">
            {/* CASCADING SELECTION BOX */}
            <div className="grid md:grid-cols-3 gap-6 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl border">
              {/* CATEGORY */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2 text-indigo-600">
                    <Layers className="w-4 h-4" /> Category
                  </Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Category</DialogTitle>
                      </DialogHeader>
                      <Input
                        placeholder="e.g. Railways, SSC"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                      />
                      <Button onClick={handleCreateCategory}>Create</Button>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  value={formData.categoryId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, categoryId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* EXAM */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2 text-indigo-600">
                    <BookOpen className="w-4 h-4" /> Exam
                  </Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        disabled={!formData.categoryId}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Exam</DialogTitle>
                      </DialogHeader>
                      <Input
                        placeholder="e.g. RRB JE"
                        value={newExamName}
                        onChange={(e) => setNewExamName(e.target.value)}
                      />
                      <Button onClick={handleCreateExam}>Create</Button>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  value={formData.examId}
                  disabled={!formData.categoryId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, examId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SERIES */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2 text-indigo-600">
                    <FolderTree className="w-4 h-4" /> Series
                  </Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        disabled={!formData.examId}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Test Series</DialogTitle>
                      </DialogHeader>
                      <Input
                        placeholder="e.g. 2025 Mock Tests"
                        value={newSeriesTitle}
                        onChange={(e) => setNewSeriesTitle(e.target.value)}
                      />
                      <Button onClick={handleCreateSeries}>Create</Button>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  value={formData.seriesId}
                  disabled={!formData.examId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, seriesId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Series" />
                  </SelectTrigger>
                  <SelectContent>
                    {series.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* TEST DETAILS */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Test Details</Label>
              <div className="grid gap-4">
                <Input
                  placeholder="Test Title (e.g., Civil Engineering Mock 1)"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="text-lg py-6"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Duration (Mins)</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Total Marks</Label>
                    <Input
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalMarks: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Pass Marks</Label>
                    <Input
                      type="number"
                      value={formData.passingMarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passingMarks: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Negative Mark</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.negativeMark}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          negativeMark: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end p-6 border-t">
            <Button
              size="lg"
              onClick={handleCreateTestAndSection}
              disabled={
                isLoading ||
                !formData.title ||
                !formData.seriesId ||
                (questionBankSelectedQuestions.length === 0 &&
                  uploadedQuestionsCount === 0)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Test...
                </>
              ) : (
                <>
                  Create Test
                  {questionBankSelectedQuestions.length > 0 && (
                    <span className="ml-2 text-sm">
                      ({questionBankSelectedQuestions.length} from QB)
                    </span>
                  )}
                  {uploadedQuestionsCount > 0 && (
                    <span className="ml-2 text-sm">
                      ({uploadedQuestionsCount} uploaded)
                    </span>
                  )}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && createdSectionId && (
        <Card className="border-green-200 shadow-xl">
          <CardHeader className="bg-green-50/50 pb-8 border-b">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 /> Step 2: Inject Questions
            </CardTitle>
            <CardDescription>
              Choose your injection method: Excel upload for bulk data entry, or
              Question Bank for curated selection.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            {/* Injection Method Selection */}
            <div className="flex gap-4 mb-8">
              <Button
                variant={injectionMethod === "excel" ? "default" : "outline"}
                onClick={() => setInjectionMethod("excel")}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Excel Upload
              </Button>
              <Button
                variant={
                  injectionMethod === "question-bank" ? "default" : "outline"
                }
                onClick={() => setInjectionMethod("question-bank")}
                className="flex-1"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Question Bank
              </Button>
            </div>

            {/* Content based on selected method */}
            {injectionMethod === "excel" ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                    📥 Direct Excel Flow
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Upload your Excel file and we'll automatically parse, hash,
                    and deduplicate questions. New questions get added to the
                    Question Bank, duplicates get linked.
                  </p>
                </div>
                <BulkQuestionUpload
                  sectionId={createdSectionId}
                  onSuccess={handleUploadSuccess}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                    🏦 Question Bank Selection
                  </h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Select from your existing Question Bank. Perfect for
                    creating premium tests from your curated question
                    collection.
                  </p>
                </div>
                <QuestionBankSelector
                  onQuestionsSelected={handleQuestionBankInjection}
                  maxQuestions={200}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
