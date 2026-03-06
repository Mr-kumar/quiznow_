"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  adminQuestionsApi,
  adminTopicsApi,
  type Question,
  type Topic,
} from "@/lib/admin-api";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Search,
  Tag,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  ChevronRight,
  Database,
  TrendingUp,
  Hash,
  Globe,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pick the translation matching the active language, fall back to first. */
function pickTranslation(
  translations: Question["translations"] | undefined,
  lang: string,
) {
  const upper = lang.toUpperCase();
  return translations?.find((t) => t.lang === upper) ?? translations?.[0];
}

/** Pick the option text matching the active language, fall back to first. */
function pickOptionText(
  option: Question["options"][number],
  lang: string,
): string {
  const upper = lang.toUpperCase();
  const tr =
    option.translations?.find((t) => t.lang === upper) ??
    option.translations?.[0];
  return tr?.text ?? "";
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
      <div className={`p-1 rounded-md ${accent}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="text-white/60 text-xs">{label}</span>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  );
}

// ─── Question Row ─────────────────────────────────────────────────────────────

function QuestionRow({
  q,
  activeLang,
  isSelected,
  onToggle,
  onPreview,
  onEdit,
  onDelete,
}: {
  q: Question;
  activeLang: string;
  isSelected: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = pickTranslation(q.translations, activeLang);
  const usage = (q as any)._count?.sectionLinks ?? q.usageCount ?? 0;
  const options = (q.options ?? []).slice().sort((a, b) => a.order - b.order);

  return (
    <div
      className={`group relative flex gap-4 px-5 py-4 border-b border-slate-100 transition-all duration-150 hover:bg-indigo-50/40 ${
        isSelected
          ? "bg-indigo-50 border-l-2 border-l-indigo-500"
          : "border-l-2 border-l-transparent"
      } ${!q.isActive ? "opacity-50" : ""}`}
    >
      {/* Checkbox */}
      <div className="flex items-start pt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          aria-label="Select question"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onPreview}>
        {/* Question text */}
        <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-relaxed group-hover:text-indigo-700 transition-colors">
          {t?.content ?? (
            <span className="text-slate-400 italic">
              No {activeLang.toUpperCase()} translation
            </span>
          )}
        </p>

        {/* Options preview */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {options.slice(0, 4).map((opt, i) => {
            const text = pickOptionText(opt, activeLang);
            return (
              <span
                key={opt.id}
                className={`text-xs flex items-center gap-1 ${
                  opt.isCorrect
                    ? "text-emerald-600 font-medium"
                    : "text-slate-400"
                }`}
              >
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                    opt.isCorrect
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="truncate max-w-[130px]">{text}</span>
                {opt.isCorrect && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Topic badges */}
      <div className="hidden md:flex flex-col items-end justify-start gap-1.5 shrink-0 min-w-[140px]">
        {q.topic ? (
          <>
            {q.topic.subject?.name && (
              <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full truncate max-w-[136px]">
                {q.topic.subject.name}
              </span>
            )}
            <span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full truncate max-w-[136px]">
              {q.topic.name}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Untagged
          </span>
        )}
      </div>

      {/* Usage */}
      <div className="hidden lg:flex items-start justify-center shrink-0 min-w-[68px]">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            usage > 0
              ? "text-indigo-700 bg-indigo-100"
              : "text-slate-400 bg-slate-100"
          }`}
        >
          {usage} {usage === 1 ? "test" : "tests"}
        </span>
      </div>

      {/* Status */}
      <div className="hidden sm:flex items-start justify-center shrink-0 min-w-[68px]">
        <span
          className={`text-[11px] font-medium px-2 py-1 rounded-full ${
            q.isActive
              ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
              : "text-slate-500 bg-slate-100 border border-slate-200"
          }`}
        >
          {q.isActive ? "Active" : "Archived"}
        </span>
      </div>

      {/* Row actions */}
      <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onPreview}
          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Preview"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Archive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle>Archive this question?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500">
                The question will be hidden from future tests. Existing attempt
                results and student history are fully preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={onDelete}
              >
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GlobalQuestionVaultPage() {
  const { toast } = useToast();

  // ── Topics / subjects ────────────────────────────────────────────────────
  const [topics, setTopics] = useState<Topic[]>([]);
  // FIX: getUniqueSubjects returns full Subject objects, not strings
  const [subjectObjects, setSubjectObjects] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // ── Selection ────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkTopicId, setBulkTopicId] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  // ── Sheets ───────────────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  // ── Edit form ─────────────────────────────────────────────────────────────
  const [editContent, setEditContent] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrect, setEditCorrect] = useState<number>(0);
  const [editExplanation, setEditExplanation] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Cursor pagination ────────────────────────────────────────────────────
  const {
    data,
    loading,
    error,
    updateFilters,
    filters,
    reset,
    loadMore,
    hasMore,
  } = useCursorPagination({ initialLimit: 50, initialLang: "en" });

  // ── Infinite scroll (ref-based to prevent re-creation loop) ──────────────
  const [observerEl, setObserverEl] = useState<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (!observerEl) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current
        ) {
          loadMoreRef.current();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(observerEl);
    return () => io.disconnect();
  }, [observerEl]);

  // ── Load topics + subjects ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [topicsRes, subjectsRes] = await Promise.all([
          adminTopicsApi.getAll(1, 200),
          adminTopicsApi.getUniqueSubjects(),
        ]);

        const topicList: Topic[] = topicsRes.data.data ?? topicsRes.data ?? [];
        setTopics(topicList);

        // FIX: subjects are objects {id, name}, not plain strings
        const raw: any[] = subjectsRes.data.data ?? subjectsRes.data ?? [];
        const mapped = raw
          .map((s) =>
            typeof s === "string"
              ? { id: s, name: s }
              : { id: s.id ?? s.name, name: s.name },
          )
          .filter((s) => Boolean(s.name));

        // Deduplicate by name
        const seen = new Set<string>();
        const unique = mapped.filter((s) => {
          if (seen.has(s.name)) return false;
          seen.add(s.name);
          return true;
        });
        setSubjectObjects(unique);
      } catch {
        setTopics([]);
        setSubjectObjects([]);
      }
    };
    load();
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeLang = (filters as any).lang ?? "en";

  const topicOptions = useMemo(() => {
    if (!filters.subject || filters.subject === "all") return topics;
    // FIX: topic.subject is an object {id, name}, not a string
    return topics.filter((t) => t.subject?.name === filters.subject);
  }, [topics, filters.subject]);

  const activeFiltersCount = [
    filters.search,
    filters.subject && filters.subject !== "all",
    filters.topicId && filters.topicId !== "all",
  ].filter(Boolean).length;

  const allVisibleSelected =
    data.length > 0 && data.every((q) => selected.includes(q.id));

  // ── Selection handlers ────────────────────────────────────────────────────
  const onToggleSelect = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const onSelectAllVisible = useCallback(() => {
    const ids = data.map((q) => q.id);
    const allSelected =
      ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected(
      allSelected
        ? selected.filter((id) => !ids.includes(id))
        : [...new Set([...selected, ...ids])],
    );
  }, [data, selected]);

  // ── Sheet openers ─────────────────────────────────────────────────────────
  const openPreview = useCallback((q: Question) => {
    setActiveQuestion(q);
    setPreviewOpen(true);
  }, []);

  const openEdit = useCallback(
    (q: Question) => {
      const t = pickTranslation(q.translations, activeLang);
      setActiveQuestion(q);
      setEditContent(t?.content ?? "");
      setEditExplanation(t?.explanation ?? "");

      // FIX: options are on q.options[], not on the translation object
      const sorted = (q.options ?? [])
        .slice()
        .sort((a, b) => a.order - b.order);
      setEditOptions(sorted.map((opt) => pickOptionText(opt, activeLang)));
      const ci = sorted.findIndex((o) => o.isCorrect);
      setEditCorrect(ci >= 0 ? ci : 0);

      setEditOpen(true);
    },
    [activeLang],
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  const doBulkTag = async () => {
    if (!bulkTopicId || selected.length === 0) return;
    try {
      await adminQuestionsApi.bulkTag(selected, bulkTopicId);
      toast({
        title: "Updated",
        description: `${selected.length} questions reassigned`,
      });
      setBulkOpen(false);
      setSelected([]);
      reset();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e.response?.data?.message ?? "Bulk tag failed",
        variant: "destructive",
      });
    }
  };

  const doSoftDelete = async (id: string) => {
    try {
      await adminQuestionsApi.softDelete(id);
      toast({
        title: "Archived",
        description: "Question hidden from future tests",
      });
      reset();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e.response?.data?.message ?? "Archive failed",
        variant: "destructive",
      });
    }
  };

  const doSave = async () => {
    if (!activeQuestion) return;
    try {
      setSaving(true);
      await adminQuestionsApi.update(activeQuestion.id, {
        content: editContent,
        options: editOptions,
        explanation: editExplanation,
        correctAnswer: editCorrect,
      } as any);
      toast({ title: "Saved", description: "Question updated successfully" });
      setEditOpen(false);
      reset();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e.response?.data?.message ?? "Update failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.06] bg-grid-pattern" />
        {/* Glow orbs */}
        <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 right-8 h-60 w-60 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        <div className="relative px-6 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-white/40 mb-4">
            <span>Admin</span>
            <ChevronRight className="h-3 w-3" />
            <span>Assessment</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/70">Question Vault</span>
          </nav>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
                <Database className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Global Question Vault
                </h1>
                <p className="text-sm text-white/50 mt-0.5">
                  Master question bank — shared across all test series
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatPill
                label="Loaded"
                value={data.length + (hasMore ? "+" : "")}
                icon={Hash}
                accent="bg-indigo-500/60"
              />
              <StatPill
                label="Active"
                value={data.filter((q) => q.isActive).length}
                icon={TrendingUp}
                accent="bg-emerald-500/60"
              />
              <StatPill
                label="Lang"
                value={activeLang.toUpperCase()}
                icon={Globe}
                accent="bg-violet-500/60"
              />
            </div>
          </div>

          {/* ── Filter bar ────────────────────────────────────────────────── */}
          <div className="mt-5 flex gap-2 flex-wrap items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Search questions…"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400/50"
              />
              {filters.search && (
                <button
                  onClick={() => updateFilters({ search: "" })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Subject */}
            <select
              value={filters.subject || "all"}
              onChange={(e) =>
                updateFilters({
                  subject: e.target.value === "all" ? "" : e.target.value,
                  topicId: "",
                })
              }
              className="h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 min-w-[140px] cursor-pointer"
              aria-label="Filter by subject"
            >
              <option value="all" className="bg-slate-900 text-white">
                All Subjects
              </option>
              {subjectObjects.map((s) => (
                <option
                  key={s.id}
                  value={s.name}
                  className="bg-slate-900 text-white"
                >
                  {s.name}
                </option>
              ))}
            </select>

            {/* Topic */}
            <select
              value={filters.topicId || "all"}
              onChange={(e) =>
                updateFilters({
                  topicId: e.target.value === "all" ? "" : e.target.value,
                })
              }
              className="h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 min-w-[140px] cursor-pointer"
              aria-label="Filter by topic"
            >
              <option value="all" className="bg-slate-900 text-white">
                All Topics
              </option>
              {topicOptions.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  className="bg-slate-900 text-white"
                >
                  {t.name}
                </option>
              ))}
            </select>

            {/* Language */}
            <select
              value={activeLang}
              onChange={(e) => updateFilters({ lang: e.target.value })}
              className="h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 cursor-pointer"
              aria-label="Select language"
            >
              <option value="en" className="bg-slate-900 text-white">
                🇬🇧 English
              </option>
              <option value="hi" className="bg-slate-900 text-white">
                🇮🇳 Hindi
              </option>
            </select>

            {/* Clear all */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() =>
                  updateFilters({ search: "", subject: "", topicId: "" })
                }
                className="h-9 px-3 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-sm hover:bg-red-500/30 transition-colors flex items-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Clear {activeFiltersCount}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk Selection Bar ────────────────────────────────────────────── */}
      {selected.length > 0 && (
        <div className="sticky top-0 z-30 bg-indigo-600 shadow-lg border-b border-indigo-500">
          <div className="px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {selected.length}
              </div>
              <span className="text-white font-medium text-sm">
                {selected.length} question{selected.length !== 1 ? "s" : ""}{" "}
                selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected([])}
                className="text-indigo-200 hover:text-white text-sm flex items-center gap-1 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Deselect all
              </button>
              <button
                onClick={() => setBulkOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors shadow"
              >
                <Tag className="h-3.5 w-3.5" />
                Reassign Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        {/* Error */}
        {error && !loading && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            {error}
          </div>
        )}

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={onSelectAllVisible}
              aria-label="Select all visible"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
            />
            <div className="flex-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Question
            </div>
            <div className="hidden md:block text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px] text-right">
              Topic
            </div>
            <div className="hidden lg:block text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[68px] text-center">
              Usage
            </div>
            <div className="hidden sm:block text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[68px] text-center">
              Status
            </div>
            <div className="w-[88px] text-xs font-semibold text-slate-500 uppercase tracking-wider text-right shrink-0">
              Actions
            </div>
          </div>

          {/* Skeleton loader */}
          {loading && data.length === 0 && (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-5 py-4">
                  <Skeleton className="h-4 w-4 shrink-0 mt-1 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                    <div className="flex gap-4">
                      <Skeleton className="h-3 w-20 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col gap-1.5">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <BookOpen className="h-14 w-14 mb-4 opacity-20" />
              <p className="font-semibold text-slate-600 text-base">
                No questions found
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Try adjusting your filters or search
              </p>
            </div>
          )}

          {/* Rows */}
          {data.length > 0 && (
            <div className="divide-y divide-slate-100">
              {data.map((q) => (
                <QuestionRow
                  key={q.id}
                  q={q}
                  activeLang={activeLang}
                  isSelected={selected.includes(q.id)}
                  onToggle={() => onToggleSelect(q.id)}
                  onPreview={() => openPreview(q)}
                  onEdit={() => openEdit(q)}
                  onDelete={() => doSoftDelete(q.id)}
                />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div
            ref={setObserverEl}
            className="flex items-center justify-center py-5 border-t border-slate-100"
          >
            {loading && data.length > 0 ? (
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                Loading more…
              </span>
            ) : hasMore ? (
              <span className="text-xs text-slate-400">Scroll for more</span>
            ) : data.length > 0 ? (
              <span className="text-xs text-slate-400">
                All {data.length} questions loaded
              </span>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-t border-slate-200">
            <span className="text-xs text-slate-400">
              {selected.length > 0
                ? `${selected.length} of ${data.length} selected`
                : `${data.length} questions loaded`}
            </span>
            {selected.length > 0 && (
              <button
                onClick={() => setBulkOpen(true)}
                className="text-xs text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <Tag className="h-3.5 w-3.5" />
                Bulk reassign
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk Tag Dialog ───────────────────────────────────────────────── */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="border-slate-200 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Reassign Topic
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-sm text-slate-700">
                Reassigning{" "}
                <span className="font-semibold text-indigo-700">
                  {selected.length} question{selected.length !== 1 ? "s" : ""}
                </span>{" "}
                to a new topic.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Select topic
              </label>
              {/* FIX: SelectGroup must be INSIDE SelectContent, not wrapping SelectTrigger */}
              <Select value={bulkTopicId} onValueChange={setBulkTopicId}>
                <SelectTrigger className="border-slate-200 focus:ring-indigo-500 h-10">
                  <SelectValue placeholder="Choose a topic…" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {/* FIX: t.subject is an object — use .name */}
                      {t.subject?.name
                        ? `${t.subject.name} — ${t.name}`
                        : t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setBulkOpen(false)}
                className="border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={doBulkTag}
                disabled={!bulkTopicId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Apply to {selected.length}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Preview Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          side="right"
          className="w-[440px] sm:w-[500px] border-l border-slate-200 p-0 flex flex-col"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Eye className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-slate-900">
                  Question Preview
                </SheetTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeLang.toUpperCase()} translation
                </p>
              </div>
            </div>
          </SheetHeader>

          {activeQuestion &&
            (() => {
              const t = pickTranslation(
                activeQuestion.translations,
                activeLang,
              );
              const sorted = (activeQuestion.options ?? [])
                .slice()
                .sort((a, b) => a.order - b.order);

              return (
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {/* Question text */}
                  <section>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Question
                    </p>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">
                      {t?.content ?? (
                        <span className="text-slate-400 italic">
                          No {activeLang.toUpperCase()} translation
                        </span>
                      )}
                    </p>
                  </section>

                  {/* Options */}
                  <section>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Options
                    </p>
                    <div className="space-y-2">
                      {sorted.map((opt, i) => {
                        const text = pickOptionText(opt, activeLang);
                        return (
                          <div
                            key={opt.id}
                            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
                              opt.isCorrect
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <span
                              className={`h-5 w-5 shrink-0 rounded-md flex items-center justify-center text-[11px] font-bold mt-0.5 ${
                                opt.isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span
                              className={`flex-1 ${
                                opt.isCorrect
                                  ? "text-emerald-800 font-medium"
                                  : "text-slate-600"
                              }`}
                            >
                              {text || (
                                <em className="text-slate-400">Empty</em>
                              )}
                            </span>
                            {opt.isCorrect && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Explanation */}
                  {t?.explanation && (
                    <section>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Explanation
                      </p>
                      <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
                        <p className="text-sm text-amber-800 leading-relaxed">
                          {t.explanation}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Meta badges */}
                  <section className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Info
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          activeQuestion.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {activeQuestion.isActive ? "Active" : "Archived"}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {(activeQuestion as any)._count?.sectionLinks ?? 0} test
                        {(activeQuestion as any)._count?.sectionLinks !== 1
                          ? "s"
                          : ""}
                      </span>
                      {activeQuestion.topic && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                          {activeQuestion.topic.subject?.name
                            ? `${activeQuestion.topic.subject.name} › `
                            : ""}
                          {activeQuestion.topic.name}
                        </span>
                      )}
                    </div>
                  </section>
                </div>
              );
            })()}

          <SheetFooter className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-200"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>
            {activeQuestion && (
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  setPreviewOpen(false);
                  openEdit(activeQuestion);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ────────────────────────────────────────────────────── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent
          side="right"
          className="w-[440px] sm:w-[500px] border-l border-slate-200 p-0 flex flex-col"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Edit className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-slate-900">
                  Edit Question
                </SheetTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Editing {activeLang.toUpperCase()} translation
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Question text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Question Text
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter question text…"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Options
                <span className="text-slate-400 font-normal normal-case ml-1.5">
                  — click ✓ to mark correct answer
                </span>
              </label>
              <div className="space-y-2">
                {editOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      value={opt}
                      onChange={(e) => {
                        const next = [...editOptions];
                        next[idx] = e.target.value;
                        setEditOptions(next);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className={`flex-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                        editCorrect === idx
                          ? "border-emerald-300 bg-emerald-50/60 focus:ring-emerald-300/40 text-emerald-800"
                          : "border-slate-200 bg-white focus:ring-indigo-300/40 focus:border-indigo-400 text-slate-700"
                      }`}
                    />
                    <button
                      onClick={() => setEditCorrect(idx)}
                      title="Mark as correct"
                      className={`shrink-0 p-2 rounded-lg border transition-all ${
                        editCorrect === idx
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                          : "border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditOptions((o) => [...o, ""])}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  + Add option
                </button>
                {editOptions.length > 2 && (
                  <button
                    onClick={() => setEditOptions((o) => o.slice(0, -1))}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    − Remove last
                  </button>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Explanation
                <span className="text-slate-400 font-normal normal-case ml-1.5">
                  (optional)
                </span>
              </label>
              <textarea
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                placeholder="Why is this the correct answer?"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-200"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={doSave}
              disabled={saving || !editContent.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
