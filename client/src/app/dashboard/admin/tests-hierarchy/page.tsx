"use client";

import { useState } from "react";
import { HierarchyView } from "@/components/admin/hierarchy-view";
import { SectionsEditor } from "@/components/admin/sections-editor";
import { useTestHierarchy } from "@/hooks/use-test-hierarchy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  FolderTree,
  Layers,
  GraduationCap,
  Library,
  ClipboardList,
  Clock,
  Star,
  Zap,
  MousePointerClick,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
});

const createExamSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  categoryId: z.string().min(1, "Please select a category"),
});

const createSeriesSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  examId: z.string().min(1, "Please select an exam"),
});

type CreateCategoryForm = z.infer<typeof createCategorySchema>;
type CreateExamForm = z.infer<typeof createExamSchema>;
type CreateSeriesForm = z.infer<typeof createSeriesSchema>;

// ── Type configs (mirrors hierarchy-view) ────────────────────────────────────

const TYPE_CONFIG = {
  category: {
    icon: Layers,
    label: "Category",
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/50",
    badge:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  exam: {
    icon: GraduationCap,
    label: "Exam",
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  series: {
    icon: Library,
    label: "Test Series",
    color: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-50 dark:bg-violet-950/50",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  },
  test: {
    icon: ClipboardList,
    label: "Test",
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
} as const;

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
        {value}
      </span>
    </div>
  );
}

// ── Details panel ─────────────────────────────────────────────────────────────

function DetailsPanel({
  item,
  onEdit,
  onDelete,
  onAddChild,
}: {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onAddChild: (type: string, parentId: string) => void;
}) {
  const cfg = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG];
  const Icon = cfg.icon;
  const childCount = item.children?.length ?? 0;

  const childTypeMap: Record<string, string | null> = {
    category: "exam",
    exam: "series",
    series: "test",
    test: null,
  };
  const childType = childTypeMap[item.type];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-9 w-9 shrink-0 rounded-lg flex items-center justify-center mt-0.5",
            cfg.iconBg,
          )}
        >
          <Icon className={cn("h-4.5 w-4.5", cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 break-words leading-snug">
            {item.name}
          </h3>
          <Badge
            variant="outline"
            className={cn("mt-1 text-[10px] font-medium h-4 px-1.5", cfg.badge)}
          >
            {cfg.label}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Metadata */}
      <div className="space-y-2">
        {/* Children count */}
        {childType && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-zinc-500">
              {TYPE_CONFIG[childType as keyof typeof TYPE_CONFIG]?.label ??
                "Children"}
              s
            </span>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {childCount}
            </span>
          </div>
        )}

        {/* Status */}
        {item.metadata?.isActive !== undefined && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-zinc-500">Status</span>
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                item.metadata.isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  item.metadata.isActive ? "bg-emerald-500" : "bg-zinc-400",
                )}
              />
              {item.metadata.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        )}

        {/* Test-specific */}
        {item.type === "test" && (
          <>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-zinc-500">Publication</span>
              {item.metadata?.isLive ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="text-xs text-zinc-400 font-medium">Draft</span>
              )}
            </div>

            {item.metadata?.durationMins && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-zinc-500">Duration</span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  {item.metadata.durationMins} min
                </span>
              </div>
            )}

            {item.metadata?.totalMarks && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-zinc-500">Total Marks</span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {item.metadata.totalMarks}
                </span>
              </div>
            )}

            {item.metadata?.isPremium && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-zinc-500">Tier</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400" />
                  Premium
                </span>
              </div>
            )}

            {item.metadata?.createdAt && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-zinc-500">Created</span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {new Date(item.metadata.createdAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        {/* Add child button */}
        {childType && (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs justify-start gap-2"
            onClick={() => onAddChild(childType, item.id)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add {TYPE_CONFIG[childType as keyof typeof TYPE_CONFIG]?.label}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs justify-start gap-2"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit {cfg.label}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs justify-start gap-2 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete {cfg.label}
        </Button>
      </div>
    </div>
  );
}

// ── Create dialog content ─────────────────────────────────────────────────────

function CreateDialogContent({
  createType,
  categories,
  exams,
  categoryForm,
  examForm,
  seriesForm,
  onCreateCategory,
  onCreateExam,
  onCreateSeries,
  onClose,
}: {
  createType: "category" | "exam" | "series";
  categories: any[];
  exams: any[];
  categoryForm: any;
  examForm: any;
  seriesForm: any;
  onCreateCategory: (data: CreateCategoryForm) => Promise<void>;
  onCreateExam: (data: CreateExamForm) => Promise<void>;
  onCreateSeries: (data: CreateSeriesForm) => Promise<void>;
  onClose: () => void;
}) {
  const cfg = TYPE_CONFIG[createType];
  const Icon = cfg.icon;

  // Breadcrumb
  const breadcrumb: string[] = {
    category: ["Category"],
    exam: ["Category", "Exam"],
    series: ["Category", "Exam", "Test Series"],
  }[createType];

  if (createType === "category") {
    return (
      <Form {...categoryForm}>
        <form
          onSubmit={categoryForm.handleSubmit(onCreateCategory)}
          className="space-y-4"
        >
          <FormField
            control={categoryForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Category Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Railways, SSC, Banking, Defence"
                    className="h-9 text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[11px]">
                  Top-level grouping for a competitive exam domain.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooterButtons
            onClose={onClose}
            submitLabel="Create Category"
            isSubmitting={categoryForm.formState.isSubmitting}
          />
        </form>
      </Form>
    );
  }

  if (createType === "exam") {
    return (
      <Form {...examForm}>
        <form
          onSubmit={examForm.handleSubmit(onCreateExam)}
          className="space-y-4"
        >
          <FormField
            control={examForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Exam Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. RRB JE, SSC CGL, IBPS PO"
                    className="h-9 text-sm"
                    {...field}
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
                <FormLabel className="text-xs font-medium">
                  Parent Category
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="py-4 text-center text-xs text-zinc-400">
                        No categories found
                      </div>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="text-sm"
                        >
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooterButtons
            onClose={onClose}
            submitLabel="Create Exam"
            isSubmitting={examForm.formState.isSubmitting}
          />
        </form>
      </Form>
    );
  }

  return (
    <Form {...seriesForm}>
      <form
        onSubmit={seriesForm.handleSubmit(onCreateSeries)}
        className="space-y-4"
      >
        <FormField
          control={seriesForm.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Series Title
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 2025 Mock Tests, Previous Year Papers"
                  className="h-9 text-sm"
                  {...field}
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
              <FormLabel className="text-xs font-medium">Parent Exam</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select an exam" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {exams.length === 0 ? (
                    <div className="py-4 text-center text-xs text-zinc-400">
                      No exams found
                    </div>
                  ) : (
                    exams.map((exam) => (
                      <SelectItem
                        key={exam.id}
                        value={exam.id}
                        className="text-sm"
                      >
                        {exam.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooterButtons
          onClose={onClose}
          submitLabel="Create Series"
          isSubmitting={seriesForm.formState.isSubmitting}
        />
      </form>
    </Form>
  );
}

function DialogFooterButtons({
  onClose,
  submitLabel,
  isSubmitting,
}: {
  onClose: () => void;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="outline" size="sm" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : submitLabel}
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TestsHierarchyPage() {
  const { hierarchy, isLoading, error, refresh } = useTestHierarchy();
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"category" | "exam" | "series">(
    "category",
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  // ── Forms ──────────────────────────────────────────────────────────────────

  const categoryForm = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: "" },
  });

  const examForm = useForm<CreateExamForm>({
    resolver: zodResolver(createExamSchema),
    defaultValues: { name: "", categoryId: "" },
  });

  const seriesForm = useForm<CreateSeriesForm>({
    resolver: zodResolver(createSeriesSchema),
    defaultValues: { title: "", examId: "" },
  });

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      // silently fail — form shows "No categories"
    }
  };

  const fetchExams = async () => {
    try {
      const res = await api.get("/exams");
      setExams(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      // silently fail
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleItemCreate = (type: string, parentId?: string) => {
    const t = type as "category" | "exam" | "series";
    setCreateType(t);
    setCreateDialogOpen(true);

    // Pre-fill parent
    if (t === "exam" && parentId) examForm.setValue("categoryId", parentId);
    if (t === "series" && parentId) seriesForm.setValue("examId", parentId);

    // Fetch options
    if (t === "exam") fetchCategories();
    if (t === "series") fetchExams();
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    categoryForm.reset();
    examForm.reset();
    seriesForm.reset();
  };

  const handleCreateCategory = async (data: CreateCategoryForm) => {
    await api.post("/categories", { name: data.name, isActive: true });
    toast({ title: `Category "${data.name}" created` });
    closeCreateDialog();
    refresh();
  };

  const handleCreateExam = async (data: CreateExamForm) => {
    await api.post("/exams", {
      name: data.name,
      categoryId: data.categoryId,
      isActive: true,
    });
    toast({ title: `Exam "${data.name}" created` });
    closeCreateDialog();
    refresh();
  };

  const handleCreateSeries = async (data: CreateSeriesForm) => {
    await api.post("/test-series", {
      title: data.title,
      examId: data.examId,
      isActive: true,
    });
    toast({ title: `Series "${data.title}" created` });
    closeCreateDialog();
    refresh();
  };

  const handleItemEdit = (item: any) => {
    toast({
      title: "Coming soon",
      description: `Edit for ${item.type}s is being built.`,
    });
  };

  const confirmDelete = (item: any) => setDeleteTarget(item);

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const endpointMap: Record<string, string> = {
      category: "categories",
      exam: "exams",
      series: "test-series",
      test: "tests",
    };
    setIsDeleting(true);
    try {
      await api.delete(`/${endpointMap[deleteTarget.type]}/${deleteTarget.id}`);
      toast({ title: `"${deleteTarget.name}" deleted` });
      if (selectedItem?.id === deleteTarget.id) setSelectedItem(null);
      setDeleteTarget(null);
      refresh();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.response?.data?.message || "Could not delete item.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const statsCategories = hierarchy.length;
  const statsExams = hierarchy.reduce(
    (n, c) => n + (c.children?.length ?? 0),
    0,
  );
  const statsSeries = hierarchy.reduce(
    (n, c) =>
      n +
      (c.children ?? []).reduce(
        (m: number, e: any) => m + (e.children?.length ?? 0),
        0,
      ),
    0,
  );
  const statsTests = hierarchy.reduce(
    (n, c) =>
      n +
      (c.children ?? []).reduce(
        (m: number, e: any) =>
          m +
          (e.children ?? []).reduce(
            (k: number, s: any) => k + (s.children?.length ?? 0),
            0,
          ),
        0,
      ),
    0,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5">
            <span>Admin</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-600 dark:text-zinc-300 font-medium">
              Manage Hierarchy
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Test Structure
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Categories → Exams → Test Series → Tests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => handleItemCreate("category")}
          >
            <Plus className="h-3.5 w-3.5" />
            New Category
          </Button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {!isLoading && !error && (
        <div className="flex flex-wrap gap-2">
          <StatPill
            icon={Layers}
            label="Categories"
            value={statsCategories}
            color="text-blue-500"
          />
          <StatPill
            icon={GraduationCap}
            label="Exams"
            value={statsExams}
            color="text-emerald-500"
          />
          <StatPill
            icon={Library}
            label="Series"
            value={statsSeries}
            color="text-violet-500"
          />
          <StatPill
            icon={ClipboardList}
            label="Tests"
            value={statsTests}
            color="text-amber-500"
          />
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {/* ── Tree (wide column) ── */}
        <div className="lg:col-span-2 xl:col-span-3">
          {isLoading ? (
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="py-4 px-5 border-b border-zinc-100 dark:border-zinc-800">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2"
                    style={{ paddingLeft: `${(i % 3) * 24}px` }}
                  >
                    <Skeleton className="h-6 w-6 rounded-md shrink-0" />
                    <Skeleton
                      className={cn(
                        "h-4 rounded",
                        i % 3 === 0 ? "w-40" : i % 3 === 1 ? "w-32" : "w-24",
                      )}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border border-red-200 dark:border-red-900 shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">
                  Failed to load hierarchy
                </p>
                <p className="text-xs text-zinc-500 mb-4">{error}</p>
                <Button size="sm" onClick={refresh} variant="outline">
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <HierarchyView
              data={hierarchy}
              selectedId={selectedItem?.id}
              onItemSelect={setSelectedItem}
              onItemEdit={handleItemEdit}
              onItemDelete={confirmDelete}
              onItemCreate={handleItemCreate}
            />
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-4">
          <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="py-4 px-5 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Details
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedItem ? selectedItem.name : "Nothing selected"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {selectedItem ? (
                <DetailsPanel
                  item={selectedItem}
                  onEdit={handleItemEdit}
                  onDelete={confirmDelete}
                  onAddChild={handleItemCreate}
                />
              ) : (
                <div className="py-10 text-center">
                  <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <MousePointerClick className="h-4.5 w-4.5 text-zinc-400" />
                  </div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Click any item in the tree to inspect it here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sections editor — only for tests */}
          {selectedItem?.type === "test" && (
            <SectionsEditor
              testId={selectedItem.id}
              testTitle={selectedItem.name}
            />
          )}
        </div>
      </div>

      {/* ── Create dialog ── */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => !open && closeCreateDialog()}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            {(() => {
              const cfg = TYPE_CONFIG[createType];
              const Icon = cfg.icon;
              return (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center",
                        cfg.iconBg,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", cfg.color)} />
                    </div>
                    <DialogTitle className="text-base">
                      Create {cfg.label}
                    </DialogTitle>
                  </div>
                  {/* Path breadcrumb */}
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium mt-0.5">
                    {(
                      {
                        category: ["Category"],
                        exam: ["Category", "Exam"],
                        series: ["Category", "Exam", "Series"],
                      }[createType] as string[]
                    ).map((step, i, arr) => (
                      <span key={step} className="flex items-center gap-1">
                        <span
                          className={
                            i === arr.length - 1
                              ? "text-zinc-600 dark:text-zinc-300"
                              : ""
                          }
                        >
                          {step}
                        </span>
                        {i < arr.length - 1 && (
                          <ChevronRight className="h-2.5 w-2.5" />
                        )}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </DialogHeader>
          <div className="pt-1">
            <CreateDialogContent
              createType={createType}
              categories={categories}
              exams={exams}
              categoryForm={categoryForm}
              examForm={examForm}
              seriesForm={seriesForm}
              onCreateCategory={handleCreateCategory}
              onCreateExam={handleCreateExam}
              onCreateSeries={handleCreateSeries}
              onClose={closeCreateDialog}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteTarget?.name}"</strong> and all its children will
              be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteConfirmed}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
