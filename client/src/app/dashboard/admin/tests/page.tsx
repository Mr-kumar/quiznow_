"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Layers,
  BookOpen,
  FolderOpen,
  ListOrdered,
  Clock,
  Star,
  Zap,
  ZapOff,
  Copy,
  Trash2,
  Edit2,
  Pencil,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Settings2,
  CheckCircle2,
  Eye,
  EyeOff,
  Hash,
  Download,
  MoreHorizontal,
  Filter,
  X,
} from "lucide-react";
import { useTestHierarchy } from "@/hooks/use-test-hierarchy";
import {
  adminTestsApi,
  adminCategoriesApi,
  adminExamsApi,
  adminTestSeriesApi,
  type Test,
  type Category,
  type Exam,
  type TestSeries,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType = "category" | "exam" | "series";

interface SelectedNode {
  type: NodeType;
  id: string;
  name: string;
}

// ─── Form Schemas ─────────────────────────────────────────────────────────────

const createTestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  testSeriesId: z.string().min(1, "Test Series is required"),
  duration: z.number().int().min(1, "Duration must be at least 1 min"),
  totalMarks: z.number().int().min(1, "Total marks required"),
  passingMarks: z.number().int().min(0),
  positiveMark: z.number().min(0), // ✅ CORRECT: positiveMark (without "ing")
  negativeMarking: z.number().min(0),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
});

const editTestSchema = createTestSchema.partial().extend({
  title: z.string().min(1).optional(),
  isLive: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentId: z.string().optional(),
});

const createExamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
});

const createSeriesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  examId: z.string().min(1, "Exam is required"),
});

type CreateTestValues = z.infer<typeof createTestSchema>;
type CreateCategoryValues = z.infer<typeof createCategorySchema>;
type CreateExamValues = z.infer<typeof createExamSchema>;
type CreateSeriesValues = z.infer<typeof createSeriesSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toArray<T>(res: any): T[] {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function Chip({
  icon,
  label,
  value,
  color = "slate",
}: {
  icon: React.ReactNode;
  label?: string;
  value: string | number;
  color?: "slate" | "emerald" | "indigo" | "amber" | "red";
}) {
  const palette = {
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    emerald:
      "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
    indigo:
      "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400",
    amber:
      "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
    red: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
        palette[color],
      )}
    >
      {icon}
      {value}
      {label && <span className="font-normal opacity-70">{label}</span>}
    </span>
  );
}

// ─── Hierarchy sidebar ────────────────────────────────────────────────────────

function HierarchySidebar({
  selected,
  onSelect,
}: {
  selected: SelectedNode | null;
  onSelect: (node: SelectedNode | null) => void;
}) {
  const { hierarchy, isLoading, error, refresh } = useTestHierarchy();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-red-500 mb-2">{error}</p>
        <button
          onClick={refresh}
          className="text-xs text-indigo-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5 overflow-y-auto h-full">
      {/* All tests shortcut */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all",
          !selected
            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-semibold"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50",
        )}
      >
        <ListOrdered className="h-3.5 w-3.5 shrink-0" />
        All Tests
      </button>

      {hierarchy.map((category) => {
        const catOpen = expanded[category.id] ?? false;
        const catActive =
          selected?.id === category.id && selected?.type === "category";

        return (
          <div key={category.id}>
            <div
              className={cn(
                "flex items-center gap-1 rounded-lg transition-all group",
                catActive
                  ? "bg-indigo-50 dark:bg-indigo-950/40"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
              )}
            >
              <button
                onClick={() => toggle(category.id)}
                className="shrink-0 h-7 w-5 flex items-center justify-center text-slate-400"
              >
                {catOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              <button
                onClick={() =>
                  onSelect({
                    type: "category",
                    id: category.id,
                    name: category.name,
                  })
                }
                className={cn(
                  "flex-1 flex items-center gap-2 py-1.5 pr-2.5 text-xs text-left",
                  catActive
                    ? "text-indigo-700 dark:text-indigo-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300",
                )}
              >
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span className="truncate">{category.name}</span>
                <span className="ml-auto shrink-0 text-[10px] text-slate-400">
                  {category.children?.length ?? 0}
                </span>
              </button>
            </div>

            {catOpen &&
              category.children?.map((exam) => {
                const examOpen = expanded[exam.id] ?? false;
                const examActive =
                  selected?.id === exam.id && selected?.type === "exam";

                return (
                  <div key={exam.id} className="ml-4">
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-lg transition-all",
                        examActive
                          ? "bg-indigo-50 dark:bg-indigo-950/40"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      )}
                    >
                      <button
                        onClick={() => toggle(exam.id)}
                        className="shrink-0 h-7 w-4 flex items-center justify-center text-slate-400"
                      >
                        {examOpen ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          onSelect({
                            type: "exam",
                            id: exam.id,
                            name: exam.name,
                          })
                        }
                        className={cn(
                          "flex-1 flex items-center gap-2 py-1.5 pr-2 text-xs text-left",
                          examActive
                            ? "text-indigo-700 dark:text-indigo-400 font-semibold"
                            : "text-slate-600 dark:text-slate-400",
                        )}
                      >
                        <BookOpen className="h-3 w-3 shrink-0 text-blue-400" />
                        <span className="truncate">{exam.name}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-slate-400">
                          {exam.children?.length ?? 0}
                        </span>
                      </button>
                    </div>

                    {examOpen &&
                      exam.children?.map((series) => {
                        const seriesActive =
                          selected?.id === series.id &&
                          selected?.type === "series";
                        const testCount = series.children?.length ?? 0;

                        return (
                          <button
                            key={series.id}
                            onClick={() =>
                              onSelect({
                                type: "series",
                                id: series.id,
                                name: series.name,
                              })
                            }
                            className={cn(
                              "w-full ml-4 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all text-left",
                              seriesActive
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-semibold"
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            )}
                          >
                            <Layers className="h-3 w-3 shrink-0 text-violet-400" />
                            <span className="truncate flex-1">
                              {series.name}
                            </span>
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                              {testCount}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Test card ────────────────────────────────────────────────────────────────

function TestCard({
  test,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePublish,
  onAssemble,
  isPublishing,
  isDuplicating,
}: {
  test: Test;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePublish: () => void;
  onAssemble: () => void;
  isPublishing: boolean;
  isDuplicating: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-white dark:bg-slate-900 p-4 transition-all hover:shadow-md",
        test.isLive
          ? "border-emerald-200 dark:border-emerald-800/60"
          : test.isActive
            ? "border-slate-200 dark:border-slate-800"
            : "border-slate-100 dark:border-slate-800/50 opacity-60",
      )}
    >
      {/* Live indicator */}
      {test.isLive && (
        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      )}

      {/* Title row */}
      <div className="flex items-start gap-3 mb-3 pr-6">
        <div
          className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
            test.isLive
              ? "bg-linear-to-br from-emerald-400 to-teal-500"
              : "bg-linear-to-br from-indigo-400 to-violet-500",
          )}
        >
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {test.title}
          </p>
          {test.series?.title && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {test.series.title}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <Chip
          icon={<Clock className="h-2.5 w-2.5" />}
          value={test.durationMins}
          label="min"
          color="slate"
        />
        <Chip
          icon={<Hash className="h-2.5 w-2.5" />}
          value={test.totalMarks}
          label="marks"
          color="slate"
        />
        {test.negativeMark > 0 && (
          <Chip
            icon={<span className="text-[9px] font-black">-</span>}
            value={test.negativeMark}
            label="neg"
            color="amber"
          />
        )}
        <Chip
          icon={<CheckCircle2 className="h-2.5 w-2.5" />}
          value={test.passMarks}
          label="pass"
          color="slate"
        />
        {test.isPremium && (
          <Chip
            icon={<Star className="h-2.5 w-2.5" />}
            value="Premium"
            color="amber"
          />
        )}
        {test.isLive ? (
          <Chip
            icon={<Zap className="h-2.5 w-2.5" />}
            value="Live"
            color="emerald"
          />
        ) : (
          <Chip icon={<span />} value="Draft" color="slate" />
        )}
      </div>

      {/* Schedule */}
      {(test.startAt || test.endAt) && (
        <p className="text-[10px] text-slate-400 mb-3">
          {test.startAt && <>From {formatDate(test.startAt)}</>}
          {test.startAt && test.endAt && " → "}
          {test.endAt && formatDate(test.endAt)}
        </p>
      )}

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-1 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button
          size="sm"
          className="flex-1 min-w-[80px] h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700 px-2"
          onClick={onAssemble}
        >
          <Settings2 className="h-3 w-3 mr-1" />
          Assemble
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 text-[10px]",
              test.isLive
                ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                : "text-slate-600",
            )}
            onClick={onTogglePublish}
            disabled={isPublishing}
            title={test.isLive ? "Unpublish" : "Publish"}
          >
            {isPublishing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : test.isLive ? (
              <ZapOff className="h-3 w-3" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-slate-500 hover:text-amber-600"
            onClick={onEdit}
            title="Edit"
          >
            <Edit2 className="h-3 w-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
            onClick={onDuplicate}
            disabled={isDuplicating}
            title="Duplicate"
          >
            {isDuplicating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 hover:border-red-200"
            onClick={onDelete}
            title="Delete"
            disabled={test.isLive}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh: refreshHierarchy } = useTestHierarchy();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [series, setSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">(
    "all",
  );

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [createTestOpen, setCreateTestOpen] = useState(false);
  const [editTestTarget, setEditTestTarget] = useState<Test | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Test | null>(null);
  const [createCatOpen, setCreateCatOpen] = useState(false);
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const [createSeriesOpen, setCreateSeriesOpen] = useState(false);

  // ── In-flight state ────────────────────────────────────────────────────────
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Forms ──────────────────────────────────────────────────────────────────
  const createTestForm = useForm<CreateTestValues>({
    resolver: zodResolver(createTestSchema),
    defaultValues: {
      title: "",
      testSeriesId: "",
      duration: 60,
      totalMarks: 100,
      passingMarks: 33,
      positiveMark: 4, // ✅ CORRECT: positiveMark
      negativeMarking: 0,
    },
  });

  const editTestForm = useForm<Partial<CreateTestValues>>({
    resolver: zodResolver(editTestSchema),
    defaultValues: {},
  });

  const catForm = useForm<CreateCategoryValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: "" },
  });

  const examForm = useForm<CreateExamValues>({
    resolver: zodResolver(createExamSchema),
    defaultValues: { name: "", categoryId: "" },
  });

  const seriesForm = useForm<CreateSeriesValues>({
    resolver: zodResolver(createSeriesSchema),
    defaultValues: { title: "", examId: "" },
  });

  // Pre-fill create test series from selected context
  useEffect(() => {
    if (createTestOpen && selected?.type === "series") {
      createTestForm.setValue("testSeriesId", selected.id);
    }
  }, [createTestOpen, selected, createTestForm]);

  // Pre-fill edit form
  // ✅ FIXED: All field names now match the schema exactly
  useEffect(() => {
    if (editTestTarget) {
      editTestForm.reset({
        title: editTestTarget.title,
        testSeriesId: editTestTarget.seriesId, // ✅ FIXED: was seriesId, now testSeriesId
        duration: editTestTarget.durationMins,
        totalMarks: editTestTarget.totalMarks,
        passingMarks: editTestTarget.passMarks,
        positiveMark: editTestTarget.positiveMark, // ✅ FIXED: was positiveMarking, now positiveMark
        negativeMarking: editTestTarget.negativeMark,
        startAt: editTestTarget.startAt?.slice(0, 16),
        endAt: editTestTarget.endAt?.slice(0, 16),
      });
    }
  }, [editTestTarget, editTestForm]);

  // ── Fetch all data ─────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [testsRes, catsRes, examsRes, seriesRes] = await Promise.allSettled(
        [
          adminTestsApi.getAll(),
          adminCategoriesApi.getAll(),
          adminExamsApi.getAll(),
          adminTestSeriesApi.getAll(),
        ],
      );

      if (testsRes.status === "fulfilled")
        setTests(toArray<Test>(testsRes.value));
      if (catsRes.status === "fulfilled")
        setCategories(toArray<Category>(catsRes.value));
      if (examsRes.status === "fulfilled")
        setExams(toArray<Exam>(examsRes.value));
      if (seriesRes.status === "fulfilled")
        setSeries(toArray<TestSeries>(seriesRes.value));

      if (testsRes.status === "rejected")
        setError("Failed to load tests — server error");
    } catch {
      setError("Unexpected error loading data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Filtered tests ─────────────────────────────────────────────────────────
  const filtered = tests.filter((t) => {
    if (selected?.type === "series" && t.seriesId !== selected.id) return false;
    if (selected?.type === "exam") {
      const s = series.find((s) => s.id === t.seriesId);
      if (!s || s.examId !== selected.id) return false;
    }
    if (selected?.type === "category") {
      const s = series.find((s) => s.id === t.seriesId);
      const e = exams.find((e) => e.id === s?.examId);
      if (!e || e.categoryId !== selected.id) return false;
    }
    if (statusFilter === "live" && !t.isLive) return false;
    if (statusFilter === "draft" && t.isLive) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        t.series?.title?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const liveCount = filtered.filter((t) => t.isLive).length;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateTest = async (values: CreateTestValues) => {
    setSubmitting(true);
    try {
      await adminTestsApi.create(values);
      toast({
        title: "Test created",
        description: `"${values.title}" is ready to assemble`,
      });
      setCreateTestOpen(false);
      createTestForm.reset();
      loadAll();
      refreshHierarchy();
    } catch (e: any) {
      toast({
        title: "Failed to create test",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTest = async (values: Partial<CreateTestValues>) => {
    if (!editTestTarget) return;
    setSubmitting(true);
    try {
      // ✅ FIXED: Send positiveMark (not positiveMarking)
      await adminTestsApi.update(editTestTarget.id, {
        title: values.title,
        duration: values.duration,
        totalMarks: values.totalMarks,
        passingMarks: values.passingMarks,
        positiveMark: values.positiveMark, // ✅ FIXED: correct field name
        negativeMarking: values.negativeMarking,
        startAt: values.startAt || undefined,
        endAt: values.endAt || undefined,
      });
      toast({ title: "Test updated" });
      setEditTestTarget(null);
      loadAll();
    } catch (e: any) {
      toast({
        title: "Failed to update",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (test: Test) => {
    if (publishingId) return;
    setPublishingId(test.id);
    const next = !test.isLive;
    try {
      await adminTestsApi.togglePublish(test.id, next);
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, isLive: next } : t)),
      );
      toast({ title: next ? "Test is now Live 🟢" : "Test moved to Draft" });
    } catch (e: any) {
      toast({
        title: "Failed to update publish status",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleDuplicate = async (test: Test) => {
    if (duplicatingId) return;
    setDuplicatingId(test.id);
    try {
      await adminTestsApi.duplicate(test.id);
      toast({
        title: "Test duplicated",
        description: "A copy has been created",
      });
      loadAll();
      refreshHierarchy();
    } catch (e: any) {
      toast({
        title: "Duplication failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminTestsApi.delete(deleteTarget.id);
      toast({ title: "Test deleted" });
      setDeleteTarget(null);
      setTests((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      refreshHierarchy();
    } catch (e: any) {
      toast({
        title: "Failed to delete",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateCategory = async (values: CreateCategoryValues) => {
    setSubmitting(true);
    try {
      await adminCategoriesApi.create(values);
      toast({ title: "Category created" });
      setCreateCatOpen(false);
      catForm.reset();
      loadAll();
      refreshHierarchy();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateExam = async (values: CreateExamValues) => {
    setSubmitting(true);
    try {
      await adminExamsApi.create(values);
      toast({ title: "Exam created" });
      setCreateExamOpen(false);
      examForm.reset();
      loadAll();
      refreshHierarchy();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSeries = async (values: CreateSeriesValues) => {
    setSubmitting(true);
    try {
      await adminTestSeriesApi.create(values);
      toast({ title: "Series created" });
      setCreateSeriesOpen(false);
      seriesForm.reset();
      loadAll();
      refreshHierarchy();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* ── Top header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Test Management
            </h1>
          </div>

          <div className="flex-1" />

          {/* Quick create buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setCreateCatOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Category
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setCreateExamOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Exam
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setCreateSeriesOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Series
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setCreateTestOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Test
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400"
            onClick={loadAll}
            title="Refresh tests"
            aria-label="Refresh tests"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-5 py-5 gap-5">
        {/* ── Hierarchy sidebar ── */}
        <div className="hidden lg:flex flex-col w-56 shrink-0">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col sticky top-20">
            <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Browse
              </span>
              <button
                onClick={() => refreshHierarchy()}
                className="text-slate-400 hover:text-slate-600"
                title="Refresh hierarchy"
                aria-label="Refresh hierarchy"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-180px)]">
              <HierarchySidebar selected={selected} onSelect={setSelected} />
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* ── Context breadcrumb + stats ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setSelected(null)}
                className={cn(
                  "font-medium transition-colors",
                  !selected
                    ? "text-slate-800 dark:text-slate-200"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                All Tests
              </button>
              {selected && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selected.name}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {filtered.length} tests
                {liveCount > 0 && (
                  <span className="ml-1.5 text-emerald-600 font-semibold">
                    · {liveCount} live
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* ── Filters row ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tests…"
                className="pl-8 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as any)}
            >
              <SelectTrigger className="h-9 w-[130px] text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3 w-3 text-slate-400" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="live">Live only</SelectItem>
                <SelectItem value="draft">Draft only</SelectItem>
              </SelectContent>
            </Select>

            <div className="sm:hidden">
              <Button
                size="sm"
                className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setCreateTestOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Test
              </Button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
              <button onClick={loadAll} className="ml-auto text-xs underline">
                Retry
              </button>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {search || statusFilter !== "all"
                  ? "No tests match your filters"
                  : "No tests yet"}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filter"
                  : "Create your first test to get started"}
              </p>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  if (search || statusFilter !== "all") {
                    setSearch("");
                    setStatusFilter("all");
                  } else {
                    setCreateTestOpen(true);
                  }
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {search || statusFilter !== "all"
                  ? "Clear filters"
                  : "Create Test"}
              </Button>
            </div>
          )}

          {/* ── Test grid ── */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  onEdit={() => setEditTestTarget(test)}
                  onDelete={() => setDeleteTarget(test)}
                  onDuplicate={() => handleDuplicate(test)}
                  onTogglePublish={() => handleTogglePublish(test)}
                  onAssemble={() =>
                    router.push(`/dashboard/admin/tests/${test.id}`)
                  }
                  isPublishing={publishingId === test.id}
                  isDuplicating={duplicatingId === test.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          DIALOGS
      ════════════════════════════════════════════════ */}

      {/* ── Create Test ── */}
      <Dialog open={createTestOpen} onOpenChange={setCreateTestOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center">
                <Plus className="h-3.5 w-3.5 text-white" />
              </div>
              Create New Test
            </DialogTitle>
          </DialogHeader>

          <Form {...createTestForm}>
            <form
              onSubmit={createTestForm.handleSubmit(handleCreateTest)}
              className="space-y-4 pt-1"
            >
              <FormField
                control={createTestForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Test Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Mock Test 1: Full Length"
                        className="h-9 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createTestForm.control}
                name="testSeriesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Test Series
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select series" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {series.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-slate-400">
                            No series found — create one first
                          </div>
                        ) : (
                          series.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={createTestForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Duration (mins)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createTestForm.control}
                  name="totalMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Total Marks
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* ✅ FIXED: Changed from positiveMarking to positiveMark */}
                <FormField
                  control={createTestForm.control}
                  name="positiveMark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Positive Marking
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createTestForm.control}
                  name="passingMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Passing Marks
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createTestForm.control}
                  name="negativeMarking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Negative Marking
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          step={0.25}
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={createTestForm.control}
                  name="startAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Start At{" "}
                        <span className="font-normal normal-case text-slate-400">
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="h-9 text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={createTestForm.control}
                  name="endAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        End At{" "}
                        <span className="font-normal normal-case text-slate-400">
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="h-9 text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateTestOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 min-w-28"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Create Test"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Test ── */}
      <Dialog
        open={!!editTestTarget}
        onOpenChange={(v) => !v && setEditTestTarget(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Test</DialogTitle>
            {editTestTarget?.isLive && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                This test is live — the server will reject changes. Unpublish
                first.
              </p>
            )}
          </DialogHeader>

          <Form {...editTestForm}>
            <form
              onSubmit={editTestForm.handleSubmit(handleEditTest)}
              className="space-y-4 pt-1"
            >
              <FormField
                control={editTestForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Title
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editTestForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Duration (mins)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTestForm.control}
                  name="totalMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Total Marks
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* ✅ FIXED: Changed from positiveMarking to positiveMark */}
                <FormField
                  control={editTestForm.control}
                  name="positiveMark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Positive Marking
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="h-9 text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTestForm.control}
                  name="negativeMarking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Negative Marking
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step={0.25}
                          className="h-9 text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editTestForm.control}
                  name="startAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Start At
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="h-9 text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTestForm.control}
                  name="endAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        End At
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="h-9 text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTestTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !!editTestTarget?.isLive}
                  className="bg-indigo-600 hover:bg-indigo-700 min-w-28"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Test ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Delete test?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes{" "}
              <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong> and all its
              sections and question links. Questions remain in the Vault.
              <br />
              <span className="text-amber-600 text-xs font-medium mt-1 block">
                You cannot delete a live test — unpublish it first.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete Forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Create Category ── */}
      <Dialog open={createCatOpen} onOpenChange={setCreateCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-amber-500" />
              New Category
            </DialogTitle>
          </DialogHeader>
          <Form {...catForm}>
            <form
              onSubmit={catForm.handleSubmit(handleCreateCategory)}
              className="space-y-4 pt-1"
            >
              <FormField
                control={catForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Engineering"
                        className="h-9 text-sm"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateCatOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Create Exam ── */}
      <Dialog open={createExamOpen} onOpenChange={setCreateExamOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              New Exam
            </DialogTitle>
          </DialogHeader>
          <Form {...examForm}>
            <form
              onSubmit={examForm.handleSubmit(handleCreateExam)}
              className="space-y-4 pt-1"
            >
              <FormField
                control={examForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Exam Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. RRB JE 2026"
                        className="h-9 text-sm"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={examForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Category
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateExamOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Create Series ── */}
      <Dialog open={createSeriesOpen} onOpenChange={setCreateSeriesOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-500" />
              New Test Series
            </DialogTitle>
          </DialogHeader>
          <Form {...seriesForm}>
            <form
              onSubmit={seriesForm.handleSubmit(handleCreateSeries)}
              className="space-y-4 pt-1"
            >
              <FormField
                control={seriesForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Series Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Full Length Mock Tests 2026"
                        className="h-9 text-sm"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={seriesForm.control}
                name="examId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Exam
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select exam" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exams.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateSeriesOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
