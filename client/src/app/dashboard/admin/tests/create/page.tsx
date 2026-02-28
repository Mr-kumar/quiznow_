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
  Target,
  FileText,
  Settings,
  Clock,
  Award,
} from "lucide-react";
import { BulkQuestionUpload } from "@/components/admin/bulk-upload";
import { QuestionBankSelector } from "@/components/admin/question-bank-selector";

export default function CreateTestWizard() {
  const router = useRouter();
  const { toast } = useToast();

  // Wizard State
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);
  const [createdSectionId, setCreatedSectionId] = useState<string | null>(null);

  // Question Selection States
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

  // Test Mode: "full" or "section"
  const [testMode, setTestMode] = useState<"full" | "section">("full");

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

  // Load initial data
  useEffect(() => {
    fetchCategories();
  }, []);

  // Cascade loads
  useEffect(() => {
    if (formData.categoryId) fetchExams(formData.categoryId);
  }, [formData.categoryId]);

  useEffect(() => {
    if (formData.examId) fetchSeries(formData.examId);
  }, [formData.examId]);

  // New entity creation handlers
  const handleCreateCategory = async () => {
    if (!newCatName) return;
    try {
      const res = await api.post("/categories", { name: newCatName });
      const newCategory = res.data.data || res.data;
      setCategories([...categories, newCategory]);
      setFormData({ ...formData, categoryId: newCategory.id });
      setNewCatName("");
      toast({ title: "Category Created!" });
    } catch (e) {
      console.error("Error creating category:", e);
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleCreateExam = async () => {
    if (!newExamName || !formData.categoryId) return;
    try {
      const res = await api.post("/exams", {
        name: newExamName,
        categoryId: formData.categoryId,
      });
      const newExam = res.data.data || res.data;
      setExams([...exams, newExam]);
      setFormData({ ...formData, examId: newExam.id });
      setNewExamName("");
      toast({ title: "Exam Created!" });
    } catch (e) {
      console.error("Error creating exam:", e);
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleCreateSeries = async () => {
    if (!newSeriesTitle || !formData.examId) return;
    try {
      const res = await api.post("/test-series", {
        title: newSeriesTitle,
        examId: formData.examId,
      });
      const newSeries = res.data.data || res.data;
      setSeries([...series, newSeries]);
      setFormData({ ...formData, seriesId: newSeries.id });
      setNewSeriesTitle("");
      toast({ title: "Series Created!" });
    } catch (e) {
      console.error("Error creating series:", e);
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  // --- MAIN WIZARD SUBMIT (HANDLES BOTH MODES) ---
  const handleCreateTest = async () => {
    if (!formData.seriesId || !formData.title) {
      toast({
        title: "Incomplete",
        description: "Select Hierarchy and enter a title.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 🌟 Create test first
      const testRes = await api.post("/tests/wizard", {
        title: formData.title,
        duration: Number(formData.duration),
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        negativeMarking: Number(formData.negativeMark),
        testSeriesId: formData.seriesId,
      });

      const testId = testRes.data?.test?.id || testRes.data?.test?.id;
      const sectionId = testRes.data?.section?.id || testRes.data?.section?.id;

      toast({
        title: "Test Created!",
        description:
          testMode === "full"
            ? "Upload your Excel file below."
            : "Redirecting to Test Assembly Dashboard...",
      });

      if (testMode === "full") {
        // Full Mode: Stay on page, show upload
        setCreatedTestId(testId);
        setCreatedSectionId(sectionId);
        setStep(2);
      } else {
        // Section Mode: Redirect to Test Assembly Dashboard
        router.push(`/dashboard/admin/tests/${testId}`);
      }
    } catch (error: any) {
      console.error("Test creation error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create test.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (uploadedCount: number) => {
    // Track uploaded questions count
    setUploadedQuestionsCount(uploadedCount);
  };

  const handleQuestionBankSuccess = (selectedCount: number) => {
    // Track selected questions count
    setQuestionBankSelectedQuestions(Array(selectedCount).fill("dummy"));
  };

  const isFormValid = formData.title && formData.seriesId;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Build your exam with our step-by-step wizard
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">
            1
          </div>
          <span className="font-medium">Setup</span>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
        <div
          className={`flex items-center gap-2 ${step === 2 ? "text-blue-600" : "text-gray-400"}`}
        >
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
              step === 2
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            2
          </div>
          <span className="font-medium">Questions</span>
        </div>
      </div>

      {step === 1 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Choose your test mode and configure basic settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* TEST MODE SELECTOR */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <Label className="text-blue-700 font-semibold text-lg">
                  Choose Test Mode
                </Label>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    testMode === "full"
                      ? "border-blue-500 bg-blue-100 text-blue-700 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  onClick={() => setTestMode("full")}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6" />
                    <span className="font-semibold text-lg">Full Test</span>
                  </div>
                  <p className="text-sm opacity-75">
                    Single Excel file upload, no sections needed
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Quick and simple</span>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    testMode === "section"
                      ? "border-blue-500 bg-blue-100 text-blue-700 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  onClick={() => setTestMode("section")}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Layers className="w-6 h-6" />
                    <span className="font-semibold text-lg">Section Test</span>
                  </div>
                  <p className="text-sm opacity-75">
                    Multiple sections with visual dashboard
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Settings className="w-4 h-4" />
                    <span>Advanced control</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HIERARCHY SELECTION */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FolderTree className="w-5 h-5" />
                Test Organization
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                {/* CATEGORY */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-indigo-600">
                    <Layers className="w-4 h-4" /> Category
                  </Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, categoryId: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full">
                        <Plus className="w-3 h-3 mr-1" />
                        New Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Category name"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                        />
                        <Button
                          onClick={handleCreateCategory}
                          disabled={!newCatName}
                        >
                          Create Category
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* EXAM */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-indigo-600">
                    <BookOpen className="w-4 h-4" /> Exam
                  </Label>
                  <Select
                    value={formData.examId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, examId: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        disabled={!formData.categoryId}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        New Exam
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Exam</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Exam name"
                          value={newExamName}
                          onChange={(e) => setNewExamName(e.target.value)}
                        />
                        <Button
                          onClick={handleCreateExam}
                          disabled={!newExamName}
                        >
                          Create Exam
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* SERIES */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-indigo-600">
                    <Award className="w-4 h-4" /> Test Series
                  </Label>
                  <Select
                    value={formData.seriesId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, seriesId: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select series" />
                    </SelectTrigger>
                    <SelectContent>
                      {series.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        disabled={!formData.examId}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        New Series
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Test Series</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Series title"
                          value={newSeriesTitle}
                          onChange={(e) => setNewSeriesTitle(e.target.value)}
                        />
                        <Button
                          onClick={handleCreateSeries}
                          disabled={!newSeriesTitle}
                        >
                          Create Series
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* TEST DETAILS */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Test Details
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Test Title</Label>
                  <Input
                    placeholder="e.g., RRB JE Full Mock 1"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Duration (minutes)
                  </Label>
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

                <div className="space-y-2">
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

                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label>Negative Marking</Label>
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
          </CardContent>

          <CardFooter className="flex justify-end p-6 border-t">
            <Button
              size="lg"
              onClick={handleCreateTest}
              disabled={isLoading || !isFormValid}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Test...
                </>
              ) : (
                <>
                  {testMode === "full"
                    ? "Create Test & Upload Excel"
                    : "Create Test & Build Sections"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && createdSectionId && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Upload Questions
            </CardTitle>
            <CardDescription>
              Add questions to your test using Excel upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkQuestionUpload
              sectionId={createdSectionId}
              onSuccess={handleUploadSuccess}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
