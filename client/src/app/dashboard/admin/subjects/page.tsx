"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { adminSubjectsApi, type Subject } from "@/api/subjects";
import { adminTopicsApi, type Topic } from "@/api/topics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { useToast } from "@/components/ui/use-toast";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Tag,
  RefreshCw,
  ChevronRight,
  X,
  Hash,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubjectWithTopics extends Subject {
  topics: Topic[];
}

type SortKey = "name" | "topics" | "created";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupTopicsBySubject(topics: Topic[]): Record<string, Topic[]> {
  return topics.reduce<Record<string, Topic[]>>((acc, t) => {
    const sid = t.subjectId ?? "__none";
    (acc[sid] ??= []).push(t);
    return acc;
  }, {});
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyPane({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Icon className="h-5 w-5 text-zinc-400" />
      </div>
      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {title}
      </p>
      <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">{body}</p>
      {action}
    </div>
  );
}

// ─── Subject name dialog (create / rename) ────────────────────────────────────

function SubjectDialog({
  open,
  onOpenChange,
  title,
  defaultValue = "",
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  defaultValue?: string;
  onSubmit: (name: string) => Promise<void>;
  submitting: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  const commit = async () => {
    if (!value.trim()) return;
    await onSubmit(value.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Mathematics, Physics, Chemistry"
            className="h-9 text-sm"
            onKeyDown={(e) => e.key === "Enter" && commit()}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={commit}
              disabled={!value.trim() || submitting}
            >
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Left panel: subject list ─────────────────────────────────────────────────

function SubjectList({
  subjects,
  selectedId,
  loading,
  search,
  onSearch,
  sortKey,
  onSort,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  subjects: SubjectWithTopics[];
  selectedId: string | null;
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  sortKey: SortKey;
  onSort: (k: SortKey) => void;
  onSelect: (s: SubjectWithTopics) => void;
  onCreate: () => void;
  onRename: (s: SubjectWithTopics) => void;
  onDelete: (s: SubjectWithTopics) => void;
}) {
  const nextSort: Record<SortKey, SortKey> = {
    name: "topics",
    topics: "created",
    created: "name",
  };
  const sortLabel: Record<SortKey, string> = {
    name: "A–Z",
    topics: "Most topics",
    created: "Newest",
  };

  const filtered = useMemo(
    () =>
      subjects
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
          if (sortKey === "name") return a.name.localeCompare(b.name);
          if (sortKey === "topics") return b.topics.length - a.topics.length;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }),
    [subjects, search, sortKey],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 space-y-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search subjects…"
              className="pl-8 h-8 text-xs"
            />
            {search && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2.5 gap-1 shrink-0"
            onClick={() => onSort(nextSort[sortKey])}
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortLabel[sortKey]}
          </Button>
        </div>
        <Button
          size="sm"
          className="w-full h-8 text-xs gap-1.5"
          onClick={onCreate}
        >
          <Plus className="h-3.5 w-3.5" />
          New Subject
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
              >
                <Skeleton className="h-6 w-6 rounded-md shrink-0" />
                <Skeleton
                  className={cn("h-4 rounded", i % 2 === 0 ? "w-32" : "w-24")}
                />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyPane
            icon={BookOpen}
            title={search ? "No matches" : "No subjects yet"}
            body={
              search
                ? `Nothing matches "${search}"`
                : "Create your first subject to organise questions"
            }
          />
        ) : (
          <ul className="p-2 space-y-0.5">
            {filtered.map((subject) => {
              const isSelected = subject.id === selectedId;
              return (
                <li key={subject.id}>
                  <div
                    onClick={() => onSelect(subject)}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100",
                      "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      isSelected &&
                        "bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-100",
                    )}
                  >
                    {/* Subject icon */}
                    <div
                      className={cn(
                        "h-6 w-6 rounded-md flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-white/20 dark:bg-zinc-900/20"
                          : "bg-zinc-100 dark:bg-zinc-800",
                      )}
                    >
                      <BookOpen
                        className={cn(
                          "h-3.5 w-3.5",
                          isSelected
                            ? "text-white dark:text-zinc-900"
                            : "text-zinc-500",
                        )}
                      />
                    </div>

                    <span
                      className={cn(
                        "flex-1 text-sm font-medium truncate",
                        isSelected
                          ? "text-white dark:text-zinc-900"
                          : "text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {subject.name}
                    </span>

                    {/* Topic count */}
                    <span
                      className={cn(
                        "text-[10px] font-semibold tabular-nums shrink-0",
                        isSelected
                          ? "text-white/70 dark:text-zinc-900/60"
                          : "text-zinc-400",
                      )}
                    >
                      {subject.topics.length}
                    </span>

                    {/* Status dot */}
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        subject.isActive ? "bg-emerald-500" : "bg-zinc-300",
                      )}
                    />

                    {/* Row actions — visible on hover */}
                    {!isSelected && (
                      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRename(subject);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          aria-label={`Rename subject ${subject.name}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(subject);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-red-500"
                          aria-label={`Delete subject ${subject.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Right panel: topic workspace for a selected subject ──────────────────────

function TopicWorkspace({
  subject,
  onRenameSubject,
  onDeleteSubject,
  onTopicAdded,
  onTopicDeleted,
}: {
  subject: SubjectWithTopics;
  onRenameSubject: () => void;
  onDeleteSubject: () => void;
  onTopicAdded: (topic: Topic) => void;
  onTopicDeleted: (topicId: string) => void;
}) {
  const { toast } = useToast();
  const [newTopicName, setNewTopicName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [topicSearch, setTopicSearch] = useState("");

  const filteredTopics = useMemo(
    () =>
      subject.topics.filter((t) =>
        t.name.toLowerCase().includes(topicSearch.toLowerCase()),
      ),
    [subject.topics, topicSearch],
  );

  const handleAddTopic = useCallback(async () => {
    const name = newTopicName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const res = await adminTopicsApi.create({ name, subjectId: subject.id });
      const created: Topic = res.data;
      onTopicAdded(created);
      setNewTopicName("");
      toast({ title: `Topic "${name}" added` });
    } catch (err: any) {
      toast({
        title: "Failed to add topic",
        description: err?.response?.data?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  }, [newTopicName, subject.id, onTopicAdded, toast]);

  const handleDeleteTopic = useCallback(
    async (topic: Topic) => {
      setDeletingId(topic.id);
      try {
        await adminTopicsApi.delete(topic.id);
        onTopicDeleted(topic.id);
        toast({ title: `Topic "${topic.name}" removed` });
      } catch (err: any) {
        toast({
          title: "Failed to delete topic",
          description: err?.response?.data?.message ?? "Please try again.",
          variant: "destructive",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [onTopicDeleted, toast],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Subject header */}
      <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {subject.name}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5 px-1.5 shrink-0 font-medium",
                  subject.isActive
                    ? "border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
                    : "border-zinc-300 text-zinc-500",
                )}
              >
                {subject.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {subject.topics.length} topic
              {subject.topics.length !== 1 ? "s" : ""}
              {" · "}
              Created{" "}
              {new Date(subject.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              onClick={onRenameSubject}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-red-500"
              onClick={onDeleteSubject}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Add topic input */}
        <div className="flex gap-2 mt-4">
          <Input
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="Add a topic… (Enter to save)"
            className="flex-1 h-9 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
          />
          <Button
            size="sm"
            className="h-9 px-4 gap-1.5 text-xs shrink-0"
            onClick={handleAddTopic}
            disabled={!newTopicName.trim() || adding}
          >
            <Plus className="h-3.5 w-3.5" />
            {adding ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>

      {/* Topic search (only shown when there are many topics) */}
      {subject.topics.length > 8 && (
        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <Input
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              placeholder="Filter topics…"
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      )}

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {subject.topics.length === 0 ? (
          <EmptyPane
            icon={Tag}
            title="No topics yet"
            body="Use the input above to add your first topic under this subject."
          />
        ) : filteredTopics.length === 0 ? (
          <EmptyPane
            icon={Search}
            title="No matches"
            body={`No topics match "${topicSearch}"`}
          />
        ) : (
          <div className="space-y-1">
            {filteredTopics.map((topic, idx) => (
              <div
                key={topic.id}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                  deletingId === topic.id && "opacity-50 pointer-events-none",
                )}
              >
                {/* Index */}
                <span className="shrink-0 text-[10px] font-bold text-zinc-300 dark:text-zinc-600 tabular-nums w-5 text-right">
                  {idx + 1}
                </span>

                {/* Tag icon */}
                <div className="h-6 w-6 rounded-md bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                  <Hash className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                </div>

                <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 truncate">
                  {topic.name}
                </span>

                {/* Question count if present */}
                {(topic as any)._count?.questions !== undefined && (
                  <span className="text-[10px] text-zinc-400 tabular-nums shrink-0">
                    {(topic as any)._count.questions} q
                  </span>
                )}

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteTopic(topic)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-zinc-400 hover:text-red-500 shrink-0"
                  aria-label={`Delete topic ${topic.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ subjects }: { subjects: SubjectWithTopics[] }) {
  const totalTopics = subjects.reduce((n, s) => n + s.topics.length, 0);
  const activeCount = subjects.filter((s) => s.isActive).length;
  const avgTopics =
    subjects.length > 0 ? (totalTopics / subjects.length).toFixed(1) : "0";

  const stats = [
    {
      label: "Subjects",
      value: subjects.length,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      label: "Topics",
      value: totalTopics,
      icon: Hash,
      color: "text-violet-500",
    },
    {
      label: "Active",
      value: activeCount,
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      label: "Avg topics",
      value: avgTopics,
      icon: Layers,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 px-1">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
        >
          <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
          <span className="text-xs text-zinc-500">{label}</span>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubjectsPage() {
  const { toast } = useToast();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SubjectWithTopics | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<SubjectWithTopics | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Single data load: fetch subjects + all topics in parallel ──────────────
  const loadAll = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const [subjectsRes, topicsRes] = await Promise.all([
          adminSubjectsApi.getAll(),
          adminTopicsApi.getAll(1, 1000),
        ]);

        const rawSubjects: Subject[] = Array.isArray(subjectsRes.data)
          ? subjectsRes.data
          : [];
        // Topics can come back as plain array OR as { data: Topic[] }
        const rawTopics: Topic[] = Array.isArray(topicsRes.data)
          ? topicsRes.data
          : ((topicsRes.data as any)?.data ?? []);

        const grouped = groupTopicsBySubject(rawTopics);

        const merged: SubjectWithTopics[] = rawSubjects.map((s) => ({
          ...s,
          topics: grouped[s.id] ?? [],
        }));

        setSubjects(merged);

        // If something was selected but no longer exists, clear selection
        setSelectedId((prev) =>
          prev && merged.some((s) => s.id === prev) ? prev : null,
        );
      } catch (err: any) {
        toast({
          title: "Failed to load",
          description: err?.response?.data?.message ?? "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedId) ?? null,
    [subjects, selectedId],
  );

  // ── Subject CRUD ───────────────────────────────────────────────────────────

  const handleCreateSubject = useCallback(
    async (name: string) => {
      setSubmitting(true);
      try {
        const res = await adminSubjectsApi.create({ name });
        const created: Subject = Array.isArray(res.data)
          ? res.data[0]
          : res.data;
        const newEntry: SubjectWithTopics = { ...created, topics: [] };
        setSubjects((prev) => [...prev, newEntry]);
        setSelectedId(newEntry.id);
        setCreateOpen(false);
        toast({ title: `Subject "${name}" created` });
      } catch (err: any) {
        toast({
          title: "Failed to create",
          description: err?.response?.data?.message ?? "Please try again.",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [toast],
  );

  const handleRenameSubject = useCallback(
    async (name: string) => {
      if (!renameTarget) return;
      setSubmitting(true);
      try {
        await adminSubjectsApi.update(renameTarget.id, { name });
        setSubjects((prev) =>
          prev.map((s) => (s.id === renameTarget.id ? { ...s, name } : s)),
        );
        setRenameTarget(null);
        toast({ title: `Renamed to "${name}"` });
      } catch (err: any) {
        toast({
          title: "Failed to rename",
          description: err?.response?.data?.message ?? "Please try again.",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [renameTarget, toast],
  );

  const handleDeleteSubject = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminSubjectsApi.delete(deleteTarget.id);
      setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
      toast({ title: `"${deleteTarget.name}" deleted` });
    } catch (err: any) {
      toast({
        title: "Failed to delete",
        description: err?.response?.data?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, selectedId, toast]);

  // ── Topic mutations (optimistic, no re-fetch needed) ──────────────────────

  const handleTopicAdded = useCallback((subjectId: string, topic: Topic) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, topics: [...s.topics, topic] } : s,
      ),
    );
  }, []);

  const handleTopicDeleted = useCallback(
    (subjectId: string, topicId: string) => {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
            : s,
        ),
      );
    },
    [],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-6rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <span>Admin</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-600 dark:text-zinc-300 font-medium">
              Subjects & Topics
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Curriculum
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Subjects group topics · Topics tag questions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => loadAll(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {!loading && <StatsBar subjects={subjects} />}

      {/* Two-panel layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-0 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm min-h-0">
        {/* Left: subject list */}
        <div className="border-r border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col min-h-0">
          <SubjectList
            subjects={subjects}
            selectedId={selectedId}
            loading={loading}
            search={search}
            onSearch={setSearch}
            sortKey={sortKey}
            onSort={setSortKey}
            onSelect={(s) => setSelectedId(s.id)}
            onCreate={() => setCreateOpen(true)}
            onRename={setRenameTarget}
            onDelete={setDeleteTarget}
          />
        </div>

        {/* Right: topic workspace */}
        <div className="overflow-hidden flex flex-col min-h-0">
          {selectedSubject ? (
            <TopicWorkspace
              key={selectedSubject.id}
              subject={selectedSubject}
              onRenameSubject={() => setRenameTarget(selectedSubject)}
              onDeleteSubject={() => setDeleteTarget(selectedSubject)}
              onTopicAdded={(t) => handleTopicAdded(selectedSubject.id, t)}
              onTopicDeleted={(id) =>
                handleTopicDeleted(selectedSubject.id, id)
              }
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyPane
                icon={BookOpen}
                title={
                  loading
                    ? "Loading…"
                    : subjects.length === 0
                      ? "No subjects yet"
                      : "Select a subject"
                }
                body={
                  loading
                    ? "Fetching your curriculum data"
                    : subjects.length === 0
                      ? "Create a subject from the left panel to begin"
                      : "Click any subject on the left to manage its topics here"
                }
                action={
                  !loading && subjects.length === 0 ? (
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5 mt-1"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create First Subject
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Create subject dialog */}
      <SubjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Subject"
        onSubmit={handleCreateSubject}
        submitting={submitting}
      />

      {/* Rename subject dialog */}
      <SubjectDialog
        open={!!renameTarget}
        onOpenChange={(v) => !v && setRenameTarget(null)}
        title={`Rename "${renameTarget?.name}"`}
        defaultValue={renameTarget?.name ?? ""}
        onSubmit={handleRenameSubject}
        submitting={submitting}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteTarget?.name}"</strong> has{" "}
              {deleteTarget?.topics.length ?? 0} topics. Deleting it will remove
              the subject and prevent questions from being tagged under it. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteSubject}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
