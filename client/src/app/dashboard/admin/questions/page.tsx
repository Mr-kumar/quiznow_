"use client";

import { useEffect, useMemo, useState } from "react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
} from "lucide-react";

export default function GlobalQuestionVaultPage() {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkTopicId, setBulkTopicId] = useState<string>("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrect, setEditCorrect] = useState<number>(0);
  const [editExplanation, setEditExplanation] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, loading, updateFilters, filters, reset, loadMore, hasMore } =
    useCursorPagination({ initialLimit: 50, initialLang: "en" });

  const [observerEl, setObserverEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!observerEl) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(observerEl);
    return () => io.disconnect();
  }, [observerEl, hasMore, loading, loadMore]);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topicsResponse = await adminTopicsApi.getAll(1, 100);
        setTopics(topicsResponse.data.data || []);

        const subjectsResponse = await adminTopicsApi.getUniqueSubjects();
        const raw = subjectsResponse.data.data || [];
        const names = Array.isArray(raw)
          ? raw
              .map((s: any) => (typeof s === "string" ? s : s?.name))
              .filter(Boolean)
          : [];
        setSubjects(names);
      } catch (error) {
        console.error("Failed to load topics/subjects:", error);
      }
    };

    loadTopics();
  }, []);

  const onToggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onSelectAllVisible = () => {
    const ids = data.map((q) => q.id);
    const allSelected = ids.every((id) => selected.includes(id));
    setSelected(
      allSelected
        ? selected.filter((id) => !ids.includes(id))
        : [...new Set([...selected, ...ids])],
    );
  };

  const subjectOptions = useMemo(() => ["all", ...subjects], [subjects]);
  const topicOptions = useMemo(() => {
    if (!filters.subject || filters.subject === "all") return topics;
    return topics.filter((t) => t.subject === filters.subject);
  }, [topics, filters.subject]);

  const openPreview = (q: Question) => {
    setActiveQuestion(q);
    setPreviewOpen(true);
  };

  const openEdit = (q: Question) => {
    const t = q.translations?.[0];
    setActiveQuestion(q);
    setEditContent(t?.content || "");
    setEditOptions((t?.options as string[]) || []);
    setEditExplanation(t?.explanation || "");
    setEditCorrect(q.correctAnswer ?? 0);
    setEditOpen(true);
  };

  const doBulkTag = async () => {
    if (!bulkTopicId || selected.length === 0) return;
    try {
      await adminQuestionsApi.bulkTag(selected, bulkTopicId);
      toast({ title: "Updated", description: "Topics updated" });
      setBulkOpen(false);
      setSelected([]);
      reset();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e.response?.data?.message || "Bulk tag failed",
        variant: "destructive",
      });
    }
  };

  const doSoftDelete = async (id: string) => {
    try {
      await adminQuestionsApi.softDelete(id);
      toast({ title: "Archived", description: "Question soft-deleted" });
      reset();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e.response?.data?.message || "Delete failed",
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
        description: e.response?.data?.message || "Update failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Global Question Vault
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={selected.length === 0}>
                    <Tag className="h-4 w-4 mr-2" />
                    Bulk Assign Topic
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Assign Topic</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {selected.length} selected
                    </div>
                    <Select value={bulkTopicId} onValueChange={setBulkTopicId}>
                      <SelectGroup>
                        <SelectLabel>Bulk Topic Assignment</SelectLabel>
                        <SelectTrigger aria-label="Select topic for bulk assignment">
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.subject ? `${t.subject} — ${t.name}` : t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectGroup>
                    </Select>
                    <div className="flex gap-2">
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
            </div>
            <Select
              value={filters.subject || "all"}
              onValueChange={(v) =>
                updateFilters({ subject: v === "all" ? "" : v })
              }
            >
              <SelectGroup>
                <SelectLabel>Subject Filter</SelectLabel>
                <SelectTrigger aria-label="Filter by subject">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectGroup>
            </Select>
            <Select
              value={filters.topicId || "all"}
              onValueChange={(v) =>
                updateFilters({ topicId: v === "all" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {topicOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters as any).lang || "en"}
              onValueChange={(v) => updateFilters({ lang: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      onChange={onSelectAllVisible}
                      checked={
                        data.length > 0 &&
                        data.every((q) => selected.includes(q.id))
                      }
                    />
                  </TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-40 text-center">Topic</TableHead>
                  <TableHead className="w-32 text-center">Usage</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && data.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-3/4" />
                          <div className="mt-2 space-x-2">
                            <Skeleton className="h-3 w-24 inline-block" />
                            <Skeleton className="h-3 w-16 inline-block" />
                          </div>
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
                      const t = q.translations?.[0];
                      const hasMedia = !!t?.imageUrl;
                      const usage =
                        (q as any)._count?.sectionLinks ?? q.usageCount ?? 0;
                      const isSelected = selected.includes(q.id);
                      return (
                        <TableRow
                          key={q.id}
                          className={!q.isActive ? "opacity-60" : ""}
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
                            <div className="flex items-start gap-2">
                              <button
                                className="text-left flex-1"
                                onClick={() => openPreview(q)}
                              >
                                <div className="font-medium text-sm line-clamp-2">
                                  {t?.content}
                                </div>
                              </button>
                              {hasMedia && (
                                <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {Array.isArray(t?.options) &&
                                t?.options.slice(0, 2).map((o, i) => (
                                  <span key={i} className="mr-3">
                                    {String.fromCharCode(65 + i)}. {o}
                                  </span>
                                ))}
                            </div>
                            <div className="mt-1">
                              <Badge
                                variant={q.isActive ? "secondary" : "outline"}
                              >
                                {q.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {q.topic ? (
                              <div className="flex flex-col items-center">
                                {q.topic.subject && (
                                  <Badge variant="outline" className="mb-1">
                                    {q.topic.subject}
                                  </Badge>
                                )}
                                <Badge variant="outline">{q.topic.name}</Badge>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Untagged
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              Used in {usage} Tests
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPreview(q)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(q)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Soft Delete Question
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This hides the question from future use
                                    without affecting past attempts.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => doSoftDelete(q.id)}
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                <TableRow>
                  <TableCell colSpan={5}>
                    <div
                      ref={setObserverEl}
                      className="h-8 flex items-center justify-center text-xs text-muted-foreground"
                    >
                      {hasMore
                        ? loading
                          ? "Loading…"
                          : "Scroll to load more"
                        : "No more questions"}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-4 py-2">
              <div className="text-sm text-muted-foreground">
                {selected.length} selected
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {data.length} questions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Question Preview</SheetTitle>
          </SheetHeader>
          {activeQuestion && (
            <div className="p-4 space-y-3">
              <div className="text-sm">
                {activeQuestion.translations?.[0]?.content}
              </div>
              <div className="space-y-1">
                {activeQuestion.translations?.[0]?.options?.map((o, i) => {
                  const isCorrect = i === activeQuestion.correctAnswer;
                  return (
                    <div
                      key={i}
                      className={`text-sm ${isCorrect ? "text-green-600" : ""}`}
                    >
                      {String.fromCharCode(65 + i)}. {o}
                    </div>
                  );
                })}
              </div>
              {activeQuestion.translations?.[0]?.explanation && (
                <div className="text-sm">
                  {activeQuestion.translations?.[0]?.explanation}
                </div>
              )}
              {activeQuestion.translations?.[0]?.imageUrl && (
                <img
                  src={activeQuestion.translations?.[0]?.imageUrl}
                  alt=""
                  className="rounded-md border"
                />
              )}
              <div className="pt-2">
                <Badge variant="outline">
                  Used in {(activeQuestion as any)._count?.sectionLinks ?? 0}{" "}
                  Tests
                </Badge>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit Question</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Question text"
            />
            <div className="space-y-2">
              {editOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...editOptions];
                      next[idx] = e.target.value;
                      setEditOptions(next);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                  <Button
                    variant={editCorrect === idx ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditCorrect(idx)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditOptions((o) => [...o, ""])}
                >
                  Add option
                </Button>
                {editOptions.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setEditOptions((o) =>
                        o.slice(0, Math.max(0, o.length - 1)),
                      )
                    }
                  >
                    Remove last
                  </Button>
                )}
              </div>
            </div>
            <Input
              value={editExplanation}
              onChange={(e) => setEditExplanation(e.target.value)}
              placeholder="Explanation"
            />
          </div>
          <SheetFooter className="p-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
