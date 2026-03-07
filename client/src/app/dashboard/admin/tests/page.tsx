"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
  ChevronRight,
  ChevronDown,
  Search,
  Pencil,
  Trash2,
  Clock,
  Award,
  Layers,
  GraduationCap,
  Library,
  X,
  RefreshCw,
  Plus,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTestHierarchy } from "@/hooks/use-test-hierarchy";
import type { HierarchyItem } from "@/hooks/use-test-hierarchy";
import {
  useUpdateTest,
  useDeleteTest,
} from "@/features/admin-tests/hooks/use-test-mutations";
import type { UpdateTestRequest } from "@/api/tests";

// ─── Local Test shape (mapped from HierarchyItem for TestRow) ─────────────────
interface Test {
  id: string;
  title: string;
  isLive: boolean;
  isPremium?: boolean;
  isActive: boolean;
  durationMins: number;
  totalMarks: number;
}

/** Map a HierarchyItem of type "test" to the local Test shape. */
function toTest(item: HierarchyItem): Test {
  return {
    id: item.id,
    title: item.name,
    isLive: item.metadata?.isLive ?? false,
    isPremium: item.metadata?.isPremium,
    isActive: item.metadata?.isActive ?? true,
    durationMins: item.metadata?.durationMins ?? 0,
    totalMarks: item.metadata?.totalMarks ?? 0,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Count live tests recursively under a category HierarchyItem. */
function countTests(cat: HierarchyItem): number {
  if (cat.type !== "category" || !cat.children) return 0;
  return cat.children.reduce((n, exam) => {
    if (exam.type !== "exam") return n;
    return (
      n +
      (exam.children?.reduce((m, series) => {
        if (series.type !== "series") return m;
        return (
          m +
          (series.children?.filter(
            (t) => t.type === "test" && t.metadata?.isLive,
          ).length ?? 0)
        );
      }, 0) ?? 0)
    );
  }, 0);
}

// ─── Test Row ─────────────────────────────────────────────────────────────────
function TestRow({
  test,
  onToggleLive,
  onArchive,
}: {
  test: Test;
  onToggleLive: (id: string, current: boolean) => void;
  onArchive: (t: Test) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
        "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700",
        "hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {test.title}
          </span>
          {test.isLive ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-[10px] font-medium text-zinc-400">DRAFT</span>
          )}
          {test.isPremium && (
            <Star className="h-3 w-3 text-amber-500 fill-amber-400 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {test.durationMins}m
          </span>
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            {test.totalMarks} pts
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={test.isLive}
          onCheckedChange={() => onToggleLive(test.id, test.isLive)}
          className="h-4 data-[state=checked]:bg-emerald-500"
        />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-zinc-400 hover:text-indigo-600"
            asChild
          >
            <Link href={`/dashboard/admin/tests/${test.id}`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-zinc-400 hover:text-red-500"
            onClick={() => onArchive(test)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tree Header ──────────────────────────────────────────────────────────────
function TreeHeader({
  label,
  count,
  isOpen,
  onToggle,
  icon: Icon,
  iconColor,
  iconBg,
  level,
}: {
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  level: 0 | 1 | 2;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-2 rounded-lg transition-colors text-left",
        level === 0 ? "py-2.5 px-3" : level === 1 ? "py-2 px-3" : "py-1.5 px-3",
        "hover:bg-zinc-100 dark:hover:bg-zinc-800/60",
        isOpen && "bg-zinc-50 dark:bg-zinc-800/40",
      )}
    >
      {isOpen ? (
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      )}
      <div
        className={cn(
          "shrink-0 flex items-center justify-center rounded-md",
          level === 0 ? "h-6 w-6" : "h-5 w-5",
          iconBg,
        )}
      >
        <Icon
          className={cn(iconColor, level === 0 ? "h-3.5 w-3.5" : "h-3 w-3")}
        />
      </div>
      <span
        className={cn(
          "flex-1 truncate text-zinc-800 dark:text-zinc-200",
          level === 0
            ? "text-sm font-bold"
            : level === 1
              ? "text-sm font-semibold"
              : "text-xs font-semibold",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[10px] font-semibold tabular-nums shrink-0",
          count > 0 ? "text-zinc-500" : "text-zinc-300",
        )}
      >
        {count} tests
      </span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ManageTestsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [openExams, setOpenExams] = useState<Set<string>>(new Set());
  const [openSeries, setOpenSeries] = useState<Set<string>>(new Set());
  // FIX: archiveTarget is HierarchyItem, not local Test — so we can use item.id
  const [archiveTarget, setArchiveTarget] = useState<HierarchyItem | null>(
    null,
  );
  const [archiving, setArchiving] = useState(false);

  const {
    hierarchy: categories,
    isLoading: loading,
    error,
    refresh: fetchHierarchy, // FIX: no-arg function — do NOT pass true
  } = useTestHierarchy();

  const updateMutation = useUpdateTest();
  const deleteMutation = useDeleteTest();

  const handleToggleLive = async (id: string, current: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { isLive: !current } as UpdateTestRequest,
      });
    } catch {
      // Error handled by mutation hook (sonner toast)
    }
  };

  // FIX: parameterless — uses archiveTarget from state instead of receiving Test arg
  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await deleteMutation.mutateAsync(archiveTarget.id);
      setArchiveTarget(null);
    } catch {
      // Error handled by mutation hook
    } finally {
      setArchiving(false);
    }
  };

  // ─── Filter tree by search ─────────────────────────────────────────────────
  // FIX: HierarchyItem uses `.children`, not `.exams` / `.series` / `.tests`
  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();

    return categories
      .map((cat) => ({
        ...cat,
        children: (cat.children ?? [])
          .map((exam) => ({
            ...exam,
            children: (exam.children ?? [])
              .map((series) => ({
                ...series,
                children: (series.children ?? []).filter(
                  (t) => t.type === "test" && t.name.toLowerCase().includes(q),
                ),
              }))
              .filter((s) => s.children.length > 0),
          }))
          .filter((e) => e.children.length > 0),
      }))
      .filter((c) => c.children.length > 0);
  }, [categories, search]);

  // Auto-expand tree nodes that contain search matches
  // FIX: use HierarchyItem.children filtering, not .exams / .series
  useMemo(() => {
    if (!search.trim()) return;
    const cats = new Set<string>();
    const exms = new Set<string>();
    const sers = new Set<string>();
    filtered.forEach((cat) => {
      cats.add(cat.id);
      (cat.children ?? []).forEach((exam) => {
        exms.add(exam.id);
        (exam.children ?? []).forEach((s) => sers.add(s.id));
      });
    });
    setOpenCategories(cats);
    setOpenExams(exms);
    setOpenSeries(sers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filtered]);

  const toggle = (
    set: Set<string>,
    setter: (s: Set<string>) => void,
    id: string,
  ) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const totalTests = categories.reduce(
    (acc, category) => acc + countTests(category),
    0,
  );
  const liveTests = categories.reduce(
    (acc, cat) =>
      acc +
      (cat.children?.reduce((n, exam) => {
        if (exam.type !== "exam") return n;
        return (
          n +
          (exam.children?.reduce((m, series) => {
            if (series.type !== "series") return m;
            return (
              m +
              (series.children?.filter(
                (t) => t.type === "test" && t.metadata?.isLive,
              ).length ?? 0)
            );
          }, 0) ?? 0)
        );
      }, 0) ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <span>Admin</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-600 dark:text-zinc-300 font-medium">
              Manage Tests
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Tests
          </h1>
          {!loading && (
            <p className="text-sm text-zinc-500 mt-0.5">
              {totalTests} total · {liveTests} live
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            // FIX: fetchHierarchy takes no arguments
            onClick={() => {
              setRefreshing(true);
              fetchHierarchy().finally(() => setRefreshing(false));
            }}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700"
            asChild
          >
            <Link href="/dashboard/admin/tests/create">
              <Plus className="h-3.5 w-3.5" />
              New Test
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tests…"
          className="pl-8 h-8 text-xs"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tree */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2.5">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton
                className={cn("h-4 rounded", i % 2 === 0 ? "w-40" : "w-28")}
              />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
          <Layers className="h-10 w-10 text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-500">
            {search ? "No tests match your search" : "No categories yet"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-xs text-indigo-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-0.5">
          {filtered.map((category) => {
            // FIX: use children filtered by type, not .exams
            const exams = (category.children ?? []).filter(
              (c) => c.type === "exam",
            );
            return (
              <div key={category.id}>
                <TreeHeader
                  label={category.name}
                  count={countTests(category)}
                  isOpen={openCategories.has(category.id)}
                  onToggle={() =>
                    toggle(openCategories, setOpenCategories, category.id)
                  }
                  icon={Layers}
                  iconColor="text-blue-600 dark:text-blue-400"
                  iconBg="bg-blue-50 dark:bg-blue-950/40"
                  level={0}
                />
                {openCategories.has(category.id) && (
                  <div className="ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-700 space-y-0.5 mt-0.5 mb-1">
                    {exams.length === 0 ? (
                      <p className="py-2 text-xs text-zinc-400 pl-2">
                        No exams
                      </p>
                    ) : (
                      exams.map((exam) => {
                        const seriesList = (exam.children ?? []).filter(
                          (c) => c.type === "series",
                        );
                        const examTestCount = seriesList.reduce(
                          (n, s) =>
                            n +
                            (s.children?.filter((t) => t.type === "test")
                              .length ?? 0),
                          0,
                        );
                        return (
                          <div key={exam.id}>
                            <TreeHeader
                              label={exam.name}
                              count={examTestCount}
                              isOpen={openExams.has(exam.id)}
                              onToggle={() =>
                                toggle(openExams, setOpenExams, exam.id)
                              }
                              icon={GraduationCap}
                              iconColor="text-emerald-600 dark:text-emerald-400"
                              iconBg="bg-emerald-50 dark:bg-emerald-950/40"
                              level={1}
                            />
                            {openExams.has(exam.id) && (
                              <div className="ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-700 space-y-0.5 mt-0.5 mb-1">
                                {seriesList.length === 0 ? (
                                  <p className="py-2 text-xs text-zinc-400 pl-2">
                                    No test series
                                  </p>
                                ) : (
                                  seriesList.map((series) => {
                                    const tests = (
                                      series.children ?? []
                                    ).filter((c) => c.type === "test");
                                    return (
                                      <div key={series.id}>
                                        <TreeHeader
                                          label={series.name}
                                          count={tests.length}
                                          isOpen={openSeries.has(series.id)}
                                          onToggle={() =>
                                            toggle(
                                              openSeries,
                                              setOpenSeries,
                                              series.id,
                                            )
                                          }
                                          icon={Library}
                                          iconColor="text-violet-600 dark:text-violet-400"
                                          iconBg="bg-violet-50 dark:bg-violet-950/40"
                                          level={2}
                                        />
                                        {openSeries.has(series.id) && (
                                          <div className="ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-700 space-y-1.5 mt-1.5 mb-2">
                                            {tests.length === 0 ? (
                                              <p className="py-2 text-xs text-zinc-400 pl-2">
                                                No tests yet
                                              </p>
                                            ) : (
                                              tests.map((testItem) => (
                                                <TestRow
                                                  key={testItem.id}
                                                  test={toTest(testItem)}
                                                  onToggleLive={
                                                    handleToggleLive
                                                  }
                                                  // FIX: pass HierarchyItem to archiveTarget setter
                                                  onArchive={() =>
                                                    setArchiveTarget(testItem)
                                                  }
                                                />
                                              ))
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Archive Dialog */}
      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(v) => !v && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this test?</AlertDialogTitle>
            <AlertDialogDescription>
              {/* FIX: HierarchyItem uses .name not .title */}
              <strong>"{archiveTarget?.name}"</strong> will be hidden from
              students. All attempt data is preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* FIX: handleArchive is now parameterless — it reads archiveTarget from state */}
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleArchive}
              disabled={archiving}
            >
              {archiving ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
