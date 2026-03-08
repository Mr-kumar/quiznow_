"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import {
  Loader2,
  ChevronRight,
  FolderTree,
  BookOpen,
  Layers,
  Plus,
  Target,
  FileText,
  Settings,
  Clock,
  Award,
  CheckCircle2,
} from "lucide-react";
import BulkQuestionUpload from "@/components/admin/bulk-upload";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCreateTest } from "@/features/admin-tests/hooks/use-test-mutations";

function StepDot({
  num,
  label,
  active,
  done,
}: {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-indigo-600 text-white"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500",
        )}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : num}
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          active ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function QuickCreateDialog({
  label,
  disabled,
  placeholder,
  onSubmit,
}: {
  label: string;
  disabled?: boolean;
  placeholder: string;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      await onSubmit(value.trim());
      setOpen(false);
      setValue("");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-7 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
        >
          <Plus className="h-3.5 w-3.5" />
          New {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Create ${label}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  icon?: React.ElementType;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </Label>
      <Input
        type="number"
        step={step ?? "1"}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 text-sm"
      />
      {hint && <p className="text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}

export default function CreateTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);
  const [createdSectionId, setCreatedSectionId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [form, setForm] = useState({
    categoryId: "",
    examId: "",
    seriesId: "",
    title: "",
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    negativeMark: 0.33,
  });
  const [testMode, setTestMode] = useState<"full" | "section">("full");

  // Use feature hook for test creation
  const createMutation = useCreateTest();
  const upd = (k: keyof typeof form, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data.data ?? r.data))
      .catch(console.error);
  }, []);
  useEffect(() => {
    if (!form.categoryId) return;
    setExams([]);
    upd("examId", "");
    setSeries([]);
    upd("seriesId", "");
    api
      .get(`/exams?categoryId=${form.categoryId}`)
      .then((r) => setExams(r.data.data ?? r.data))
      .catch(console.error);
  }, [form.categoryId]);
  useEffect(() => {
    if (!form.examId) return;
    setSeries([]);
    upd("seriesId", "");
    api
      .get(`/test-series?examId=${form.examId}`)
      .then((r) => setSeries(r.data.data ?? r.data))
      .catch(console.error);
  }, [form.examId]);

  const createCategory = async (name: string) => {
    const res = await api.post("/categories", { name });
    const cat = res.data.data ?? res.data;
    setCategories((p) => [...p, cat]);
    upd("categoryId", cat.id);
    toast({ title: "Category created" });
  };
  const createExam = async (name: string) => {
    const res = await api.post("/exams", { name, categoryId: form.categoryId });
    const exam = res.data.data ?? res.data;
    setExams((p) => [...p, exam]);
    upd("examId", exam.id);
    toast({ title: "Exam created" });
  };
  const createSeries = async (title: string) => {
    const res = await api.post("/test-series", { title, examId: form.examId });
    const s = res.data.data ?? res.data;
    setSeries((p) => [...p, s]);
    upd("seriesId", s.id);
    toast({ title: "Series created" });
  };

  const handleSubmit = async () => {
    if (!form.seriesId || !form.title.trim()) {
      toast({ title: "Fill in all required fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await createMutation.mutateAsync({
        title: form.title,
        duration: form.duration, // server DTO: duration (not durationMins)
        totalMarks: form.totalMarks,
        passingMarks: form.passingMarks, // server DTO: passingMarks (not passMarks)
        negativeMarking: form.negativeMark, // server DTO: negativeMarking
        testSeriesId: form.seriesId, // server DTO: testSeriesId
      });
      // Wizard returns { test, section } — wrapped in AxiosResponse
      const testId = res?.data?.test?.id;
      const sectionId = res?.data?.section?.id;
      if (!testId) {
        toast({
          title: "Unexpected response from server",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Test created!" });
      if (testMode === "full") {
        setCreatedTestId(testId);
        setCreatedSectionId(sectionId ?? null); // wizard always returns a section
        setStep(2);
      } else {
        router.push(`/dashboard/admin/tests/${testId}`);
      }
    } catch (err: any) {
      toast({
        title: "Failed to create test",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = form.title.trim() && form.seriesId;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
          <span>Admin</span>
          <ChevronRight className="h-3 w-3" />
          <span>Tests</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-600 dark:text-zinc-300 font-medium">
            Create
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          New Test
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <StepDot num={1} label="Setup" active={step === 1} done={step > 1} />
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700 max-w-16" />
        <StepDot num={2} label="Questions" active={step === 2} done={false} />
      </div>

      {step === 1 && (
        <div className="space-y-5">
          {/* Mode selector */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Test Mode
                </span>
              </div>
            </div>
            <div className="p-4 grid sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    mode: "full" as const,
                    icon: FileText,
                    title: "Full Test",
                    desc: "Upload an Excel file with all questions at once",
                    tag: "Quick",
                  },
                  {
                    mode: "section" as const,
                    icon: Layers,
                    title: "Section Test",
                    desc: "Multiple sections with individual question management",
                    tag: "Advanced",
                  },
                ] as const
              ).map(({ mode, icon: Icon, title, desc, tag }) => (
                <button
                  key={mode}
                  onClick={() => setTestMode(mode)}
                  className={cn(
                    "text-left p-4 rounded-lg border-2 transition-all",
                    testMode === mode
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        testMode === mode ? "text-indigo-600" : "text-zinc-400",
                      )}
                    />
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        testMode === mode
                          ? "text-indigo-700 dark:text-indigo-400"
                          : "text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {title}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-auto",
                        testMode === mode
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-zinc-100 text-zinc-500",
                      )}
                    >
                      {tag}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Hierarchy */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Placement
                </span>
                <span className="text-xs text-zinc-400">
                  Category → Exam → Series
                </span>
              </div>
            </div>
            <div className="p-5 grid sm:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    Category
                  </Label>
                  <QuickCreateDialog
                    label="Category"
                    placeholder="e.g. Government Jobs"
                    onSubmit={createCategory}
                  />
                </div>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => upd("categoryId", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select…" />
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
              {/* Exam */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    Exam
                  </Label>
                  <QuickCreateDialog
                    label="Exam"
                    placeholder="e.g. RRB JE"
                    disabled={!form.categoryId}
                    onSubmit={createExam}
                  />
                </div>
                <Select
                  value={form.examId}
                  onValueChange={(v) => upd("examId", v)}
                  disabled={!form.categoryId}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue
                      placeholder={
                        form.categoryId ? "Select…" : "Pick category first"
                      }
                    />
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
              {/* Series */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    Series
                  </Label>
                  <QuickCreateDialog
                    label="Series"
                    placeholder="e.g. Full Mock Series"
                    disabled={!form.examId}
                    onSubmit={createSeries}
                  />
                </div>
                <Select
                  value={form.seriesId}
                  onValueChange={(v) => upd("seriesId", v)}
                  disabled={!form.examId}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue
                      placeholder={form.examId ? "Select…" : "Pick exam first"}
                    />
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
          </div>

          {/* Details */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Test Details
                </span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Test Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="e.g. RRB JE Full Mock Test 1"
                  value={form.title}
                  onChange={(e) => upd("title", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <NumberField
                  label="Duration (min)"
                  value={form.duration}
                  onChange={(v) => upd("duration", v)}
                  icon={Clock}
                  hint="In minutes"
                />
                <NumberField
                  label="Total Marks"
                  value={form.totalMarks}
                  onChange={(v) => upd("totalMarks", v)}
                  hint="Max score"
                />
                <NumberField
                  label="Pass Marks"
                  value={form.passingMarks}
                  onChange={(v) => upd("passingMarks", v)}
                  hint="Minimum"
                />
                <NumberField
                  label="Negative Mark"
                  value={form.negativeMark}
                  onChange={(v) => upd("negativeMark", v)}
                  step="0.01"
                  hint="Per wrong ans"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isLoading || !isValid}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-48"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : testMode === "full" ? (
                "Create & Upload Questions"
              ) : (
                "Create & Build Sections"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && createdSectionId && createdTestId && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                <div>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Upload Questions
                  </span>
                  <p className="text-xs text-zinc-400">
                    Excel file for this test
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <BulkQuestionUpload
                sectionId={createdSectionId}
                onSuccess={() => {}}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500"
              onClick={() => setStep(1)}
            >
              ← Back
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-xs"
              onClick={() =>
                router.push(`/dashboard/admin/tests/${createdTestId}`)
              }
            >
              View Test Dashboard →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
