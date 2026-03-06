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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Search,
  Tag,
  Edit,
  Trash2,
  Eye,
  ImageIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Pick the translation matching the active language, fall back to first. */
function pickTranslation(
  translations: Question["translations"] | undefined,
  lang: string,
) {
  const upper = lang.toUpperCase(); // "en" → "EN"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GlobalQuestionVaultPage() {
  const { toast } = useToast();

  // ── Topics / subjects for filter dropdowns ───────────────────────────────
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  // ── Selection state ──────────────────────────────────────────────────────
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkTopicId, setBulkTopicId] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  // ── Sheet state ──────────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  // ── Edit form state ───────────────────────────────────────────────────────
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

  // ── IntersectionObserver for infinite scroll ─────────────────────────────
  const [observerEl, setObserverEl] = useState<HTMLDivElement | null>(null);

  // CRITICAL FIX: Keep loadMore in a ref so the observer never needs to be
  // recreated when loadMore changes — prevents the infinite-fetch loop.
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Also keep hasMore + loading in refs so the observer callback is never stale.
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
  }, [observerEl]); // ← only the element itself; all other values via refs

  // ── Load topics + subjects ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [topicsRes, subjectsRes] = await Promise.all([
          adminTopicsApi.getAll(1, 200), // enough for filter dropdown
          adminTopicsApi.getUniqueSubjects(),
        ]);

        const topicList: Topic[] = topicsRes.data.data ?? topicsRes.data ?? [];
        setTopics(topicList);

        const raw: any[] = subjectsRes.data.data ?? subjectsRes.data ?? [];
        const names: string[] = Array.from(
          new Set(
            raw
              .map((s) => (typeof s === "string" ? s : s?.name))
              .filter(Boolean),
          ),
        );
        setSubjects(names);
      } catch {
        // Non-fatal — filters just won't be populated
        setTopics([]);
        setSubjects([]);
      }
    };
    load();
  }, []);

  // ── Derived filter options ───────────────────────────────────────────────

  const activeLang = (filters as any).lang ?? "en";

  const subjectOptions = useMemo(() => ["all", ...subjects], [subjects]);

  const topicOptions = useMemo(() => {
    if (!filters.subject || filters.subject === "all") return topics;
    // BUG FIX: topic.subject is an object {id, name}, not a plain string.
    return topics.filter((t) => t.subject?.name === filters.subject);
  }, [topics, filters.subject]);

  // ── Selection handlers ───────────────────────────────────────────────────

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

  // ── Sheet openers ────────────────────────────────────────────────────────

  const openPreview = useCallback((q: Question) => {
    setActiveQuestion(q);
    setPreviewOpen(true);
  }, []);

  const openEdit = useCallback(
    (q: Question) => {
      // BUG FIX: read content/explanation from the correct language translation.
      const t = pickTranslation(q.translations, activeLang);
      setActiveQuestion(q);
      setEditContent(t?.content ?? "");
      setEditExplanation(t?.explanation ?? "");

      // BUG FIX: options live on q.options[], NOT on the translation object.
      // Pick each option's text for the active language.
      const opts = (q.options ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((opt) => pickOptionText(opt, activeLang));
      setEditOptions(opts);

      // Find which option index is correct
      const correctIdx = (q.options ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .findIndex((o) => o.isCorrect);
      setEditCorrect(correctIdx >= 0 ? correctIdx : 0);

      setEditOpen(true);
    },
    [activeLang],
  );

  // ── Actions ──────────────────────────────────────────────────────────────

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
        description: e.response?.data?.message ?? "Delete failed",
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
      toast({ title: "Saved", description: "Question updated" });
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Global Question Vault
            </div>

            {/* Bulk assign */}
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={selected.length === 0}>
                  <Tag className="h-4 w-4 mr-2" />
                  Bulk Assign Topic ({selected.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Assign Topic</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Reassign <strong>{selected.length}</strong> question
                    {selected.length !== 1 ? "s" : ""} to a new topic.
                  </p>
                  {/* BUG FIX: SelectGroup belongs INSIDE SelectContent, not
                      wrapping SelectTrigger. Wrong structure broke the dropdown. */}
                  <Select value={bulkTopicId} onValueChange={setBulkTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {/* BUG FIX: t.subject is an object — use .name */}
                          {t.subject?.name
                            ? `${t.subject.name} — ${t.name}`
                            : t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setBulkOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={doBulkTag} disabled={!bulkTopicId}>
                      Apply
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* ── Filters ─────────────────────────────────────────────────── */}
          <div className="grid gap-2 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions…"
                className="pl-10"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
            </div>

            {/* Subject filter */}
            {/* BUG FIX: SelectGroup was wrapping SelectTrigger (wrong).
                It belongs inside SelectContent only. */}
            <Select
              value={filters.subject || "all"}
              onValueChange={(v) =>
                updateFilters({ subject: v === "all" ? "" : v, topicId: "" })
              }
            >
              <SelectTrigger aria-label="Filter by subject">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All Subjects" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Topic filter */}
            <Select
              value={filters.topicId || "all"}
              onValueChange={(v) =>
                updateFilters({ topicId: v === "all" ? "" : v })
              }
            >
              <SelectTrigger aria-label="Filter by topic">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topicOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Language */}
            <Select
              value={activeLang}
              onValueChange={(v) => updateFilters({ lang: v })}
            >
              <SelectTrigger aria-label="Language">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {error && !loading && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Table ───────────────────────────────────────────────────── */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all visible"
                      onChange={onSelectAllVisible}
                      checked={
                        data.length > 0 &&
                        data.every((q) => selected.includes(q.id))
                      }
                    />
                  </TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-44 text-center">Topic</TableHead>
                  <TableHead className="w-32 text-center">Usage</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* Skeleton rows on initial load */}
                {loading && data.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-5 w-24 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-5 w-20 mx-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-24 inline-block" />
                        </TableCell>
                      </TableRow>
                    ))
                  : data.map((q) => {
                      // BUG FIX: match language case — backend stores "EN"/"HI"
                      const t = pickTranslation(q.translations, activeLang);
                      const usage =
                        (q as any)._count?.sectionLinks ?? q.usageCount ?? 0;
                      const isSelected = selected.includes(q.id);

                      return (
                        <TableRow
                          key={q.id}
                          className={!q.isActive ? "opacity-50" : ""}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleSelect(q.id)}
                              aria-label="Select row"
                            />
                          </TableCell>

                          <TableCell>
                            <button
                              className="text-left w-full"
                              onClick={() => openPreview(q)}
                            >
                              <div className="font-medium text-sm line-clamp-2 flex items-start gap-2">
                                {t?.content ?? (
                                  <span className="text-muted-foreground italic">
                                    No {activeLang.toUpperCase()} translation
                                  </span>
                                )}
                                {t?.imageUrl && (
                                  <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                              </div>
                            </button>

                            {/* BUG FIX: options are on q.options[], not t.options */}
                            <div className="mt-1 text-xs text-muted-foreground">
                              {(q.options ?? [])
                                .slice()
                                .sort((a, b) => a.order - b.order)
                                .slice(0, 2)
                                .map((opt, i) => (
                                  <span key={opt.id} className="mr-3">
                                    {String.fromCharCode(65 + i)}.{" "}
                                    {pickOptionText(opt, activeLang)}
                                  </span>
                                ))}
                            </div>

                            <div className="mt-1">
                              <Badge
                                variant={q.isActive ? "secondary" : "outline"}
                              >
                                {q.isActive ? "Active" : "Archived"}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            {q.topic ? (
                              <div className="flex flex-col items-center gap-1">
                                {/* BUG FIX: topic.subject is object — use .name */}
                                {q.topic.subject?.name && (
                                  <Badge variant="outline" className="text-xs">
                                    {q.topic.subject.name}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {q.topic.name}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Untagged
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {usage} test{usage !== 1 ? "s" : ""}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openPreview(q)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(q)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Archive Question?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This hides the question from future tests
                                    without affecting existing attempts or
                                    results.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => doSoftDelete(q.id)}
                                  >
                                    Archive
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                {/* Sentinel row for IntersectionObserver */}
                <TableRow>
                  <TableCell colSpan={5}>
                    <div
                      ref={setObserverEl}
                      className="h-8 flex items-center justify-center text-xs text-muted-foreground"
                    >
                      {hasMore
                        ? loading
                          ? "Loading more…"
                          : "Scroll to load more"
                        : data.length > 0
                          ? "All questions loaded"
                          : !loading && "No questions found"}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
              <span className="text-sm text-muted-foreground">
                {selected.length > 0
                  ? `${selected.length} selected`
                  : "None selected"}
              </span>
              <span className="text-sm text-muted-foreground">
                Showing {data.length} questions
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Preview Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-[420px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle>Question Preview</SheetTitle>
          </SheetHeader>

          {activeQuestion &&
            (() => {
              const t = pickTranslation(
                activeQuestion.translations,
                activeLang,
              );
              return (
                <div className="p-4 space-y-4 overflow-y-auto">
                  {/* Question text */}
                  <div className="text-sm font-medium leading-relaxed">
                    {t?.content ?? (
                      <span className="text-muted-foreground italic">
                        No {activeLang.toUpperCase()} translation available
                      </span>
                    )}
                  </div>

                  {/* Options — BUG FIX: from q.options[], using active language */}
                  <div className="space-y-2">
                    {(activeQuestion.options ?? [])
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((opt, i) => (
                        <div
                          key={opt.id}
                          className={`text-sm px-3 py-2 rounded-md border ${
                            opt.isCorrect
                              ? "border-green-400 bg-green-50 text-green-700 font-medium"
                              : "border-zinc-200 bg-zinc-50"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}.{" "}
                          {pickOptionText(opt, activeLang)}
                          {opt.isCorrect && (
                            <CheckCircle2 className="inline h-3.5 w-3.5 ml-2 text-green-600" />
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Explanation — BUG FIX: use active language translation */}
                  {t?.explanation && (
                    <div className="text-sm text-muted-foreground border-t pt-3">
                      <span className="font-medium text-foreground">
                        Explanation:{" "}
                      </span>
                      {t.explanation}
                    </div>
                  )}

                  {/* Image — BUG FIX: from active translation */}
                  {t?.imageUrl && (
                    <img
                      src={t.imageUrl}
                      alt="Question illustration"
                      className="rounded-md border w-full object-contain max-h-48"
                    />
                  )}

                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <Badge variant="outline">
                      Used in{" "}
                      {(activeQuestion as any)._count?.sectionLinks ?? 0} test
                      {(activeQuestion as any)._count?.sectionLinks !== 1
                        ? "s"
                        : ""}
                    </Badge>
                    <Badge
                      variant={
                        activeQuestion.isActive ? "secondary" : "outline"
                      }
                    >
                      {activeQuestion.isActive ? "Active" : "Archived"}
                    </Badge>
                    {activeQuestion.topic && (
                      <Badge variant="outline">
                        {activeQuestion.topic.subject?.name
                          ? `${activeQuestion.topic.subject.name} › ${activeQuestion.topic.name}`
                          : activeQuestion.topic.name}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })()}
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ────────────────────────────────────────────────────── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-[420px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle>Edit Question</SheetTitle>
          </SheetHeader>

          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-sm font-medium">Question text</label>
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Question text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Options{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (click ✓ to mark correct)
                </span>
              </label>
              {editOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 text-center">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...editOptions];
                      next[idx] = e.target.value;
                      setEditOptions(next);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    className="flex-1"
                  />
                  <Button
                    variant={editCorrect === idx ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditCorrect(idx)}
                    title="Mark as correct"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOptions((o) => [...o, ""])}
                >
                  Add option
                </Button>
                {editOptions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditOptions((o) => o.slice(0, o.length - 1))
                    }
                  >
                    Remove last
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Explanation</label>
              <Input
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                placeholder="Explanation (optional)"
              />
            </div>
          </div>

          <SheetFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={saving}>
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
