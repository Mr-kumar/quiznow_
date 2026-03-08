"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
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
  Languages,
  Layers,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "EN" | "HI";

interface OptionTranslation {
  lang: Lang;
  text: string;
}

interface QuestionOption {
  id: string;
  order: number;
  isCorrect: boolean;
  translations: OptionTranslation[];
}

interface QuestionTranslation {
  lang: Lang;
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

/**
 * Pick the translation for `lang`. Falls back to the other lang so we never
 * show a blank question just because one translation is missing.
 */
function pickText(translations: QuestionTranslation[], lang: Lang): string {
  return (
    translations.find((t) => t.lang === lang)?.content ??
    translations.find((t) => t.lang !== lang)?.content ??
    translations[0]?.content ??
    ""
  );
}

function pickOptionText(translations: OptionTranslation[], lang: Lang): string {
  return (
    translations.find((t) => t.lang === lang)?.text ??
    translations.find((t) => t.lang !== lang)?.text ??
    translations[0]?.text ??
    ""
  );
}

/** Returns true if the question has a non-empty translation for `lang`. */
function hasLang(question: VaultQuestion, lang: Lang): boolean {
  return !!question.translations.find((t) => t.lang === lang)?.content?.trim();
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

const LANG_LABELS: Record<Lang, string> = {
  EN: "English",
  HI: "हिन्दी",
};

// ─── Language Toggle ──────────────────────────────────────────────────────────

function LangToggle({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      {(["EN", "HI"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={cn(
            "h-7 px-3 rounded-md text-xs font-semibold transition-all",
            value === l
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
          )}
        >
          {l === "EN" ? "EN" : "हि"}
        </button>
      ))}
    </div>
  );
}

// ─── Question Row ─────────────────────────────────────────────────────────────

function QuestionRow({
  question,
  lang,
  selected,
  alreadyLinked,
  onToggle,
}: {
  question: VaultQuestion;
  lang: Lang;
  selected: boolean;
  alreadyLinked: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const text = pickText(question.translations, lang);
  const subjectName = question.topic?.subject?.name;
  const topicName = question.topic?.name;
  const usageCount = question._count?.sectionLinks ?? 0;

  const hasEN = hasLang(question, "EN");
  const hasHI = hasLang(question, "HI");
  const isBilingual = hasEN && hasHI;
  // True when the chosen display lang has no content (we showed a fallback)
  const isFallback = !hasLang(question, lang);

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
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Checkbox */}
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

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Fallback language warning */}
          {isFallback && (
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
              <Languages className="h-3 w-3" />
              No {LANG_LABELS[lang]} translation — showing{" "}
              {lang === "EN" ? LANG_LABELS["HI"] : LANG_LABELS["EN"]}
            </p>
          )}

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

          {/* Tags */}
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

            {/* Language availability */}
            {isBilingual ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                <Languages className="h-2.5 w-2.5" />
                EN + हि
              </span>
            ) : (
              <>
                {hasEN && !hasHI && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                    EN only
                  </span>
                )}
                {hasHI && !hasEN && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    हि only
                  </span>
                )}
              </>
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
                  {/* Options rendered in selected language */}
                  <span className="leading-snug">
                    {pickOptionText(opt.translations, lang)}
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

  // ── Filters ────────────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>("EN");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // nextCursor lives in a ref so fetchQuestions doesn't need it in its deps,
  // which keeps the IntersectionObserver stable between page loads.
  const nextCursorRef = useRef<string | null>(null);

  // ── Load filter data once when dialog opens ─────────────────────────────────
  useEffect(() => {
    if (!open) return;
    Promise.all([
      api.get("/topics/subjects").catch(() => ({ data: [] })),
      api
        .get("/topics", { params: { limit: 200 } })
        .catch(() => ({ data: { data: [] } })),
    ]).then(([subRes, topRes]) => {
      const rawSubs = subRes.data?.data ?? subRes.data ?? [];
      const rawTops =
        topRes.data?.data ?? topRes.data?.topics ?? topRes.data ?? [];
      setSubjects(Array.isArray(rawSubs) ? rawSubs : []);
      setTopics(Array.isArray(rawTops) ? rawTops : []);
    });
  }, [open]);

  // ── Derived topic list filtered by chosen subject ───────────────────────────
  const visibleTopics =
    subjectFilter === "all"
      ? topics
      : topics.filter(
          (t) =>
            t.subject?.id === subjectFilter || t.subjectId === subjectFilter,
        );

  // ── Fetch questions ─────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(
    async (opts: { reset?: boolean } = {}) => {
      const { reset = false } = opts;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      try {
        const cursor = reset ? undefined : (nextCursorRef.current ?? undefined);
        const params: Record<string, any> = {
          limit: 30,
          // Send chosen language so the backend ranks/searches in the right script.
          // The backend must still return ALL translations so the client can
          // switch display language without re-fetching.
          lang: lang.toLowerCase(), // "en" or "hi"
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
        nextCursorRef.current = pagination.nextCursor ?? null;
        setNextCursor(pagination.nextCursor ?? null);
        setHasMore(pagination.hasMore ?? false);
      } catch {
        // silently fail — user can retry by scrolling / clearing filters
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [lang, search, subjectFilter, topicFilter, subjects],
  );

  // ── Re-fetch when any filter changes (search debounced) ────────────────────
  useEffect(() => {
    if (!open) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const delay = search ? 350 : 0;
    searchTimer.current = setTimeout(() => {
      nextCursorRef.current = null;
      setNextCursor(null);
      fetchQuestions({ reset: true });
    }, delay);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lang, search, subjectFilter, topicFilter]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
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

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const toggle = (id: string) => {
    if (alreadyLinkedIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const ids = questions
      .filter((q) => !alreadyLinkedIds.has(q.id))
      .map((q) => q.id);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
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

  const handleSubjectChange = (val: string) => {
    setSubjectFilter(val);
    setTopicFilter("all");
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const selectableCount = questions.filter(
    (q) => !alreadyLinkedIds.has(q.id),
  ).length;

  // Questions that will show a fallback (no translation in chosen lang)
  const missingLangCount = questions.filter(
    (q) => !hasLang(q, lang) && !alreadyLinkedIds.has(q.id),
  ).length;

  const hasActiveFilters =
    search || subjectFilter !== "all" || topicFilter !== "all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        {/* ── Header ── */}
        <DialogHeader className="shrink-0 px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
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

            <div className="flex items-center gap-3 ml-auto">
              {/* Selection counter */}
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

              {/* ─── Language toggle ─── */}
              <div className="flex flex-col items-end gap-0.5">
                <LangToggle value={lang} onChange={setLang} />
                <span className="text-[9px] text-slate-400 pr-0.5">
                  Display language
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ── Filters bar ── */}
        <div className="shrink-0 px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search — placeholder switches with language */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  lang === "HI" ? "प्रश्न खोजें…" : "Search question text…"
                }
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

        {/* ── Stats / select-all bar ── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-2 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
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

            {/* Warn when some questions have no translation for the active lang */}
            {!loading && missingLangCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Languages className="h-3 w-3" />
                {missingLangCount} without {LANG_LABELS[lang]} translation
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Languages className="h-3 w-3" />
              {LANG_LABELS[lang]}
            </span>
            <span className="text-[11px] text-slate-400">
              {loading ? "Loading…" : `${questions.length} loaded`}
            </span>
          </div>
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
              <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                <BookOpen className="h-7 w-7 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium">No questions found</p>
              <p className="text-xs mt-1 text-slate-400">
                {hasActiveFilters
                  ? "Try clearing the filters or switching language"
                  : "Upload questions first via Excel"}
              </p>
              {lang === "HI" && !hasActiveFilters && (
                <button
                  onClick={() => setLang("EN")}
                  className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 underline"
                >
                  Switch to English
                </button>
              )}
            </div>
          ) : (
            <>
              {questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  lang={lang}
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

        {/* ── Footer ── */}
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
