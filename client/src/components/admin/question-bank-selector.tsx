"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Filter,
  Layers,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OptionTranslation {
  lang: "EN" | "HI";
  text: string;
}

interface QuestionOption {
  id: string;
  order: number;
  isCorrect: boolean;
  translations: OptionTranslation[];
}

interface QuestionTranslation {
  lang: "EN" | "HI";
  content: string;
  explanation?: string;
}

interface VaultQuestion {
  id: string;
  isActive: boolean;
  createdAt: string;
  translations: QuestionTranslation[];
  options: QuestionOption[];
  topic?: {
    id: string;
    name: string;
    subject?: { id: string; name: string };
  };
  _count?: { sectionLinks: number };
}

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  subjectId?: string;
  subject?: Subject;
}

interface BankSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** IDs already in this section — shown as disabled/checked */
  alreadyLinkedIds?: Set<string>;
  onConfirm: (questionIds: string[]) => Promise<void>;
  sectionName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickText(translations: QuestionTranslation[]): string {
  return (
    translations.find((t) => t.lang === "EN")?.content ??
    translations[0]?.content ??
    ""
  );
}

function pickOptionText(translations: OptionTranslation[]): string {
  return (
    translations.find((t) => t.lang === "EN")?.text ??
    translations[0]?.text ??
    ""
  );
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

// ─── Question Row ─────────────────────────────────────────────────────────────

function QuestionRow({
  question,
  selected,
  alreadyLinked,
  onToggle,
}: {
  question: VaultQuestion;
  selected: boolean;
  alreadyLinked: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const text = pickText(question.translations);
  const subjectName = question.topic?.subject?.name;
  const topicName = question.topic?.name;
  const usageCount = question._count?.sectionLinks ?? 0;

  return (
    <div
      className={cn(
        "group border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors",
        alreadyLinked
          ? "bg-emerald-50/60 dark:bg-emerald-950/10"
          : selected
            ? "bg-indigo-50/70 dark:bg-indigo-950/20"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Checkbox / already-linked indicator */}
        <button
          onClick={alreadyLinked ? undefined : onToggle}
          disabled={alreadyLinked}
          className={cn(
            "mt-0.5 shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
            alreadyLinked
              ? "border-emerald-400 bg-emerald-400 cursor-default"
              : selected
                ? "border-indigo-500 bg-indigo-500 cursor-pointer"
                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 cursor-pointer",
          )}
        >
          {(alreadyLinked || selected) && (
            <Check className="h-3 w-3 text-white stroke-3" />
          )}
        </button>

        {/* Question content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm leading-snug",
              alreadyLinked
                ? "text-slate-400 dark:text-slate-500"
                : "text-slate-800 dark:text-slate-200",
            )}
          >
            {text.length > 180 && !expanded
              ? text.slice(0, 180) + "…"
              : text || (
                  <span className="italic text-red-400 text-xs">
                    No content
                  </span>
                )}
          </p>

          {/* Tags row */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {subjectName && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                {subjectName}
              </span>
            )}
            {topicName && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                <Layers className="h-2.5 w-2.5" />
                {topicName}
              </span>
            )}
            {usageCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700">
                Used in {usageCount} section{usageCount !== 1 ? "s" : ""}
              </span>
            )}
            {alreadyLinked && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-2.5 w-2.5" />
                In this section
              </span>
            )}
          </div>

          {/* Expanded options */}
          {expanded && question.options.length > 0 && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {question.options.map((opt, i) => (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-start gap-1.5 px-2 py-1.5 rounded-md text-xs",
                    opt.isCorrect
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center mt-px",
                      opt.isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    {OPTION_LETTERS[i]}
                  </span>
                  <span className="leading-snug">
                    {pickOptionText(opt.translations)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="shrink-0 mt-0.5 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuestionBankSelector({
  open,
  onOpenChange,
  alreadyLinkedIds = new Set(),
  onConfirm,
  sectionName,
}: BankSelectorProps) {
  const [questions, setQuestions] = useState<VaultQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load filters ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setLoadingFilters(true);
    Promise.all([
      api.get("/topics/subjects").catch(() => ({ data: [] })),
      api
        .get("/topics", { params: { limit: 200 } })
        .catch(() => ({ data: { data: [] } })),
    ])
      .then(([subRes, topRes]) => {
        const rawSubs = subRes.data?.data ?? subRes.data ?? [];
        const rawTops =
          topRes.data?.data ?? topRes.data?.topics ?? topRes.data ?? [];
        setSubjects(Array.isArray(rawSubs) ? rawSubs : []);
        setTopics(Array.isArray(rawTops) ? rawTops : []);
      })
      .finally(() => setLoadingFilters(false));
  }, [open]);

  // ── Derived topic list (filtered by chosen subject) ─────────────────────────
  const visibleTopics =
    subjectFilter === "all"
      ? topics
      : topics.filter(
          (t) =>
            t.subject?.id === subjectFilter || t.subjectId === subjectFilter,
        );

  // ── Fetch questions ─────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(
    async (opts: { reset?: boolean; cursorOverride?: string } = {}) => {
      const { reset = false, cursorOverride } = opts;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const cursor = reset ? undefined : (cursorOverride ?? nextCursor);
        const params: Record<string, any> = {
          limit: 30,
          lang: "EN",
          ...(search.trim() && { search: search.trim() }),
          ...(subjectFilter !== "all" && {
            subject:
              subjects.find((s) => s.id === subjectFilter)?.name ??
              subjectFilter,
          }),
          ...(topicFilter !== "all" && { topicId: topicFilter }),
          ...(cursor && { cursor }),
        };

        const res = await api.get("/questions/cursor-paginated", { params });
        const payload = res.data;
        const rows: VaultQuestion[] = payload.data ?? [];
        const pagination = payload.pagination ?? {};

        setQuestions((prev) => (reset ? rows : [...prev, ...rows]));
        setNextCursor(pagination.nextCursor ?? null);
        setHasMore(pagination.hasMore ?? false);
      } catch {
        // silently fail — user can retry
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, subjectFilter, topicFilter, nextCursor, subjects],
  );

  // ── Reset + re-fetch when filters change ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const delay = search ? 350 : 0;
    searchTimer.current = setTimeout(() => {
      setNextCursor(null);
      fetchQuestions({ reset: true });
    }, delay);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search, subjectFilter, topicFilter]);

  // ── IntersectionObserver for infinite scroll ───────────────────────────────
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
        fetchQuestions({ reset: false });
      }
    },
    [hasMore, loadingMore, loading, fetchQuestions],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [handleIntersect]);

  // ── Reset selection when dialog opens ─────────────────────────────────────
  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  // ── Toggle individual question ─────────────────────────────────────────────
  const toggle = (id: string) => {
    if (alreadyLinkedIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Select all visible (not already linked) ────────────────────────────────
  const selectAllVisible = () => {
    const newable = questions
      .filter((q) => !alreadyLinkedIds.has(q.id))
      .map((q) => q.id);
    setSelected((prev) => {
      const next = new Set(prev);
      newable.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  // ── Confirm ────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (selected.size === 0) return;
    setConfirming(true);
    try {
      await onConfirm([...selected]);
      setSelected(new Set());
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  };

  // ── Subject change resets topic ────────────────────────────────────────────
  const handleSubjectChange = (val: string) => {
    setSubjectFilter(val);
    setTopicFilter("all");
  };

  const selectableCount = questions.filter(
    (q) => !alreadyLinkedIds.has(q.id),
  ).length;

  const hasActiveFilters =
    search || subjectFilter !== "all" || topicFilter !== "all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        {/* ── Header ── */}
        <DialogHeader className="shrink-0 px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Question Vault
                </DialogTitle>
                {sectionName && (
                  <p className="text-xs text-slate-400 mt-px">
                    Adding to{" "}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {sectionName}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Selection summary */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full">
                  {selected.size} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* ── Filters bar ── */}
        <div className="shrink-0 px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search question text…"
                className="pl-8 h-8 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Subject filter */}
            <Select value={subjectFilter} onValueChange={handleSubjectChange}>
              <SelectTrigger className="h-8 w-full sm:w-44 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3 w-3 text-slate-400" />
                  <SelectValue placeholder="All Subjects" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Topic filter */}
            <Select
              value={topicFilter}
              onValueChange={setTopicFilter}
              disabled={visibleTopics.length === 0}
            >
              <SelectTrigger className="h-8 w-full sm:w-44 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-slate-400" />
                  <SelectValue placeholder="All Topics" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {visibleTopics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-700"
                onClick={() => {
                  setSearch("");
                  setSubjectFilter("all");
                  setTopicFilter("all");
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* ── Select all / stats bar ── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-2 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={selectableCount > 0 ? selectAllVisible : undefined}
              disabled={selectableCount === 0}
              className={cn(
                "text-xs font-medium transition-colors",
                selectableCount > 0
                  ? "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer"
                  : "text-slate-300 dark:text-slate-600 cursor-default",
              )}
            >
              Select visible ({selectableCount})
            </button>

            {alreadyLinkedIds.size > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {alreadyLinkedIds.size} already in section
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            {loading ? "Loading…" : `${questions.length} loaded`}
          </span>
        </div>

        {/* ── Question list ── */}
        <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-1">
                  <Skeleton className="h-5 w-5 rounded-md shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-1.5">
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-4 w-20 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
              <BookOpen className="h-12 w-12 mb-3 text-slate-200 dark:text-slate-700" />
              <p className="text-sm font-medium">No questions found</p>
              <p className="text-xs mt-1">
                {hasActiveFilters
                  ? "Try clearing the filters"
                  : "Upload questions first via Excel"}
              </p>
            </div>
          ) : (
            <>
              {questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  selected={selected.has(q.id)}
                  alreadyLinked={alreadyLinkedIds.has(q.id)}
                  onToggle={() => toggle(q.id)}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="py-4 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading more…
                  </div>
                )}
                {!loadingMore && !hasMore && questions.length > 0 && (
                  <span className="text-xs text-slate-300 dark:text-slate-600">
                    All {questions.length} questions loaded
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer / Confirm ── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {selected.size === 0 ? (
              <span>Select questions to add them to the section</span>
            ) : (
              <span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {selected.size}
                </strong>{" "}
                question{selected.size !== 1 ? "s" : ""} ready to add
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => onOpenChange(false)}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-9 min-w-28 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              onClick={handleConfirm}
              disabled={selected.size === 0 || confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add {selected.size > 0 ? `${selected.size} ` : ""}Question
                  {selected.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
