"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  EyeOff,
  Tag,
  X,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  Languages,
  BookOpen,
  Hash,
  Filter,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  MoreHorizontal,
  MessageSquare,
  SlidersHorizontal,
  Sparkles,
  CheckCheck,
  Circle,
  Pencil,
  FolderOpen,
  ArrowUpDown,
  ListFilter,
  Layers,
  Check,
} from "lucide-react";
import { useCursorQuestions } from "@/features/admin-questions/hooks/use-questions";
import {
  useDeleteQuestion,
  useSoftDeleteQuestion,
  useBulkTagQuestions,
  useUpdateQuestion,
} from "@/features/admin-questions/hooks/use-question-mutations";
import {
  adminSubjectsApi,
  adminTopicsApi as subjectsTopicsApi,
} from "@/api/subjects";
import type { Question, Topic } from "@/api/questions";
import type { Subject } from "@/api/subjects";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "EN" | "HI";

interface SubjectWithTopics extends Subject {
  topics: Topic[];
}

interface Filters {
  subjectId: string | null;
  subjectName: string | null;
  topicId: string | null;
  topicName: string | null;
  status: "all" | "active" | "inactive";
  lang: Lang;
  bilingualOnly: boolean | null;
  hasExplanation: boolean | null;
}

const DEFAULT_FILTERS: Filters = {
  subjectId: null,
  subjectName: null,
  topicId: null,
  topicName: null,
  status: "all",
  lang: "EN",
  bilingualOnly: null,
  hasExplanation: null,
};

const OPTION_LABELS = ["A", "B", "C", "D"];

// ─── Edit Schema ──────────────────────────────────────────────────────────────

const editSchema = z.object({
  content: z.string().min(1, "Question text is required"),
  explanation: z.string().optional(),
  topicId: z.string().min(1, "Topic is required"),
  options: z.array(z.string()).min(2),
  correctAnswer: z.number().min(0).max(3),
  lang: z.string(),
});
type EditValues = z.infer<typeof editSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toArray<T>(res: any): T[] {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function pickText(
  translations: Array<{ lang: string; content: string }> | undefined,
  lang: Lang,
): string {
  if (!translations?.length) return "";
  return (
    translations.find((t) => t.lang?.toUpperCase() === lang)?.content ??
    translations.find((t) => t.lang?.toUpperCase() === "EN")?.content ??
    translations[0]?.content ??
    ""
  );
}

function pickOptText(
  translations: Array<{ lang: string; text: string }> | undefined,
  lang: Lang,
): string {
  if (!translations?.length) return "";
  return (
    translations.find((t) => t.lang?.toUpperCase() === lang)?.text ??
    translations.find((t) => t.lang?.toUpperCase() === "EN")?.text ??
    translations[0]?.text ??
    ""
  );
}

function hasLang(q: Question, lang: Lang): boolean {
  return !!q.translations
    ?.find((t) => t.lang?.toUpperCase() === lang)
    ?.content?.trim();
}

function isBilingual(q: Question) {
  return hasLang(q, "EN") && hasLang(q, "HI");
}
function hasExp(q: Question) {
  return !!q.translations?.some((t) => t.explanation?.trim());
}

function groupBySubject(topics: Topic[]): Record<string, Topic[]> {
  const out: Record<string, Topic[]> = {};
  topics.forEach((t) => {
    const sid = (t as any).subjectId ?? "__";
    (out[sid] ??= []).push(t);
  });
  return out;
}

// ─── Small UI Primitives ─────────────────────────────────────────────────────

function LangPill({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
      {(["EN", "HI"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={cn(
            "h-6 px-2.5 rounded-md text-[11px] font-semibold transition-all",
            value === l
              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
          )}
        >
          {l === "EN" ? "EN" : "हि"}
        </button>
      ))}
    </div>
  );
}

function Pill({
  label,
  color,
  onRemove,
}: {
  label: string;
  color: string;
  onRemove: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border",
        color,
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:opacity-60 ml-0.5"
        title="Remove filter"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-4/5" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-3/5" />
          <div className="flex gap-1.5 mt-1">
            {[72, 60, 48].map((w, i) => (
              <div
                key={i}
                className={`h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full`}
                style={{ width: `${w}px` }}
                title="Skeleton loading indicator"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar: subject + topic management ──────────────────────────────────────

function SubjectSidebar({
  subjects,
  allTopics,
  loading,
  filters,
  onFilterChange,
  onSubjectCreated,
  onSubjectRenamed,
  onSubjectDeleted,
  onTopicAdded,
  onTopicDeleted,
}: {
  subjects: SubjectWithTopics[];
  allTopics: Topic[];
  loading: boolean;
  filters: Filters;
  onFilterChange: (p: Partial<Filters>) => void;
  onSubjectCreated: (s: SubjectWithTopics) => void;
  onSubjectRenamed: (id: string, name: string) => void;
  onSubjectDeleted: (id: string) => void;
  onTopicAdded: (subjectId: string, t: Topic) => void;
  onTopicDeleted: (subjectId: string, topicId: string) => void;
}) {
  const { toast } = useToast();
  const [sSearch, setSSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newTopicFor, setNewTopicFor] = useState<string | null>(null); // subjectId
  const [newTopicName, setNewTopicName] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  // Subject create/rename/delete state
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SubjectWithTopics | null>(
    null,
  );
  const [deleteSubjectTarget, setDeleteSubjectTarget] =
    useState<SubjectWithTopics | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [submittingSubject, setSubmittingSubject] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(false);

  const newTopicRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (newTopicFor) setTimeout(() => newTopicRef.current?.focus(), 60);
  }, [newTopicFor]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    if (!sSearch.trim()) return subjects;
    const q = sSearch.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.topics.some((t) => t.name.toLowerCase().includes(q)),
    );
  }, [subjects, sSearch]);

  // ── Subject CRUD ───────────────────────────────────────────────────────────
  const handleCreateSubject = async () => {
    const name = subjectName.trim();
    if (!name) return;
    setSubmittingSubject(true);
    try {
      const res = await adminSubjectsApi.create({ name });
      const created: Subject = res.data;
      onSubjectCreated({ ...created, topics: [] });
      setCreateSubjectOpen(false);
      setSubjectName("");
      toast({ title: `Subject "${name}" created` });
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingSubject(false);
    }
  };

  const handleRenameSubject = async () => {
    if (!renameTarget) return;
    const name = subjectName.trim();
    if (!name) return;
    setSubmittingSubject(true);
    try {
      await adminSubjectsApi.update(renameTarget.id, { name });
      onSubjectRenamed(renameTarget.id, name);
      setRenameTarget(null);
      setSubjectName("");
      toast({ title: `Renamed to "${name}"` });
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingSubject(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubjectTarget) return;
    setDeletingSubject(true);
    try {
      await adminSubjectsApi.delete(deleteSubjectTarget.id);
      onSubjectDeleted(deleteSubjectTarget.id);
      if (filters.subjectId === deleteSubjectTarget.id)
        onFilterChange({
          subjectId: null,
          subjectName: null,
          topicId: null,
          topicName: null,
        });
      setDeleteSubjectTarget(null);
      toast({ title: `"${deleteSubjectTarget.name}" deleted` });
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setDeletingSubject(false);
    }
  };

  // ── Topic CRUD ─────────────────────────────────────────────────────────────
  const handleAddTopic = async (subjectId: string) => {
    const name = newTopicName.trim();
    if (!name) return;
    setAddingTopic(true);
    try {
      const res = await subjectsTopicsApi.create({ name, subjectId });
      const created: Topic = res.data;
      onTopicAdded(subjectId, created);
      setNewTopicName("");
      setNewTopicFor(null);
      toast({ title: `Topic "${name}" added` });
    } catch (e: any) {
      toast({
        title: "Failed to add topic",
        description: e?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setAddingTopic(false);
    }
  };

  const handleDeleteTopic = async (subjectId: string, topic: Topic) => {
    setDeletingTopicId(topic.id);
    try {
      await subjectsTopicsApi.delete(topic.id);
      onTopicDeleted(subjectId, topic.id);
      if (filters.topicId === topic.id)
        onFilterChange({ topicId: null, topicName: null });
      toast({ title: `"${topic.name}" removed` });
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setDeletingTopicId(null);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Sidebar header */}
        <div className="px-3 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Curriculum
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => {
                setSubjectName("");
                setCreateSubjectOpen(true);
              }}
              title="New subject"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3 w-3 text-zinc-400 pointer-events-none" />
            <Input
              value={sSearch}
              onChange={(e) => setSSearch(e.target.value)}
              placeholder="Search…"
              className="pl-7 h-7 text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            />
            {sSearch && (
              <button
                onClick={() => setSSearch("")}
                className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* All questions */}
        <div className="px-2 pt-2">
          <button
            onClick={() =>
              onFilterChange({
                subjectId: null,
                subjectName: null,
                topicId: null,
                topicName: null,
              })
            }
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left group",
              !filters.subjectId && !filters.topicId
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            )}
          >
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="flex-1">All Questions</span>
          </button>
        </div>

        <div className="px-4.5 pt-3 pb-1">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">
            Subjects
          </p>
        </div>

        {/* Subject tree */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="space-y-1 pt-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-zinc-400">
                {sSearch ? `No results for "${sSearch}"` : "No subjects yet"}
              </p>
              {!sSearch && (
                <button
                  onClick={() => {
                    setSubjectName("");
                    setCreateSubjectOpen(true);
                  }}
                  className="mt-2 text-xs text-indigo-600 hover:underline"
                >
                  Create first subject
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((subject) => {
                const isSubjectSel =
                  filters.subjectId === subject.id && !filters.topicId;
                const isOpen = expanded[subject.id] ?? false;

                return (
                  <div key={subject.id}>
                    {/* Subject row */}
                    <div
                      className={cn(
                        "flex items-center gap-0.5 rounded-lg transition-all group/subj",
                        isSubjectSel
                          ? "bg-zinc-900 dark:bg-zinc-100"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      )}
                    >
                      <button
                        onClick={() => toggle(subject.id)}
                        className="shrink-0 h-7 w-5 flex items-center justify-center"
                      >
                        {isOpen ? (
                          <ChevronDown
                            className={cn(
                              "h-3 w-3",
                              isSubjectSel
                                ? "text-white/70 dark:text-zinc-900/60"
                                : "text-zinc-400",
                            )}
                          />
                        ) : (
                          <ChevronRight
                            className={cn(
                              "h-3 w-3",
                              isSubjectSel
                                ? "text-white/70 dark:text-zinc-900/60"
                                : "text-zinc-400",
                            )}
                          />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          onFilterChange({
                            subjectId: isSubjectSel ? null : subject.id,
                            subjectName: isSubjectSel ? null : subject.name,
                            topicId: null,
                            topicName: null,
                          })
                        }
                        className="flex-1 flex items-center gap-2 py-1.5 text-left min-w-0"
                      >
                        <BookOpen
                          className={cn(
                            "h-3 w-3 shrink-0",
                            isSubjectSel
                              ? "text-white/80 dark:text-zinc-900/70"
                              : "text-violet-500",
                          )}
                        />
                        <span
                          className={cn(
                            "flex-1 text-xs font-semibold truncate",
                            isSubjectSel
                              ? "text-white dark:text-zinc-900"
                              : "text-zinc-700 dark:text-zinc-300",
                          )}
                        >
                          {subject.name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold tabular-nums shrink-0",
                            isSubjectSel
                              ? "text-white/60 dark:text-zinc-900/50"
                              : "text-zinc-400",
                          )}
                        >
                          {subject.topics.length}
                        </span>
                      </button>

                      {/* Subject actions — revealed on hover */}
                      <div
                        className={cn(
                          "flex items-center shrink-0 pr-1 transition-opacity",
                          isSubjectSel
                            ? "opacity-100"
                            : "opacity-0 group-hover/subj:opacity-100",
                        )}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewTopicFor(
                              newTopicFor === subject.id ? null : subject.id,
                            );
                            setNewTopicName("");
                          }}
                          className={cn(
                            "h-5 w-5 flex items-center justify-center rounded",
                            isSubjectSel
                              ? "text-white/70 hover:text-white hover:bg-white/10"
                              : "text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40",
                          )}
                          title="Add topic"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "h-5 w-5 flex items-center justify-center rounded",
                                isSubjectSel
                                  ? "text-white/70 hover:text-white hover:bg-white/10"
                                  : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700",
                              )}
                              onClick={(e) => e.stopPropagation()}
                              title="More options"
                            >
                              <MoreHorizontal className="h-2.5 w-2.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              className="text-xs gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubjectName(subject.name);
                                setRenameTarget(subject);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs gap-2 text-red-600 focus:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteSubjectTarget(subject);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* New topic input */}
                    {newTopicFor === subject.id && (
                      <div className="ml-5 mb-1 mt-0.5 flex items-center gap-1.5">
                        <Input
                          {...(newTopicRef ? { ref: newTopicRef } : {})}
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                          placeholder="Topic name…"
                          className="h-7 text-xs flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTopic(subject.id);
                            if (e.key === "Escape") {
                              setNewTopicFor(null);
                              setNewTopicName("");
                            }
                          }}
                          title="Enter new topic name"
                        />
                        <button
                          onClick={() => handleAddTopic(subject.id)}
                          disabled={addingTopic || !newTopicName.trim()}
                          className="h-7 w-7 flex items-center justify-center rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 shrink-0"
                        >
                          {addingTopic ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setNewTopicFor(null);
                            setNewTopicName("");
                          }}
                          className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                          title="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Topics */}
                    {isOpen && (
                      <div className="ml-5 space-y-0.5 mb-1">
                        {subject.topics.length === 0 ? (
                          <button
                            onClick={() => {
                              setNewTopicFor(subject.id);
                              setNewTopicName("");
                            }}
                            className="w-full text-left px-2 py-1.5 text-[11px] text-zinc-400 hover:text-indigo-600 rounded"
                          >
                            + Add first topic
                          </button>
                        ) : (
                          subject.topics.map((topic) => {
                            const isTopicSel = filters.topicId === topic.id;
                            return (
                              <div
                                key={topic.id}
                                className={cn(
                                  "flex items-center gap-1 rounded-md transition-all group/topic",
                                  deletingTopicId === topic.id &&
                                    "opacity-40 pointer-events-none",
                                  isTopicSel
                                    ? "bg-indigo-600"
                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                )}
                              >
                                <button
                                  onClick={() =>
                                    onFilterChange({
                                      subjectId: subject.id,
                                      subjectName: subject.name,
                                      topicId: isTopicSel ? null : topic.id,
                                      topicName: isTopicSel ? null : topic.name,
                                    })
                                  }
                                  className="flex-1 flex items-center gap-1.5 px-2 py-1.5 text-left min-w-0"
                                >
                                  <Hash
                                    className={cn(
                                      "h-2.5 w-2.5 shrink-0",
                                      isTopicSel
                                        ? "text-indigo-200"
                                        : "text-zinc-300 dark:text-zinc-600",
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "text-[11px] truncate",
                                      isTopicSel
                                        ? "text-white font-semibold"
                                        : "text-zinc-600 dark:text-zinc-400",
                                    )}
                                  >
                                    {topic.name}
                                  </span>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteTopic(subject.id, topic)
                                  }
                                  className={cn(
                                    "shrink-0 h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover/topic:opacity-100 transition-opacity mr-1",
                                    isTopicSel
                                      ? "text-indigo-200 hover:text-white hover:bg-indigo-500"
                                      : "text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
                                  )}
                                  title="Delete topic"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
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
        </div>
      </div>

      {/* ── Subject dialogs ── */}
      <Dialog
        open={createSubjectOpen || !!renameTarget}
        onOpenChange={(v) => {
          if (!v) {
            setCreateSubjectOpen(false);
            setRenameTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {renameTarget ? `Rename "${renameTarget.name}"` : "New Subject"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Input
              autoFocus
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Mathematics, Physics…"
              className="h-9 text-sm"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                (renameTarget ? handleRenameSubject() : handleCreateSubject())
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreateSubjectOpen(false);
                  setRenameTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!subjectName.trim() || submittingSubject}
                onClick={
                  renameTarget ? handleRenameSubject : handleCreateSubject
                }
                className="bg-indigo-600 hover:bg-indigo-700 min-w-16"
              >
                {submittingSubject ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteSubjectTarget}
        onOpenChange={(v) => !v && setDeleteSubjectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&ldquo;{deleteSubjectTarget?.name}&rdquo;</strong> has{" "}
              {deleteSubjectTarget?.topics.length ?? 0} topics. Deleting it
              removes the subject and all topic links. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteSubject}
              disabled={deletingSubject}
            >
              {deletingSubject ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Question Row ─────────────────────────────────────────────────────────────

function QuestionRow({
  question,
  lang,
  selected,
  onToggle,
  onPreview,
  onEdit,
  onSoftDelete,
  onDelete,
}: {
  question: Question;
  lang: Lang;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onSoftDelete: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const text = pickText(question.translations, lang);
  const isFallback = !hasLang(question, lang);
  const hasEN = hasLang(question, "EN");
  const hasHI = hasLang(question, "HI");
  const bi = hasEN && hasHI;
  const hasExplanation = hasExp(question);
  const correctOpt = question.options?.find((o) => o.isCorrect);
  const correctText = correctOpt
    ? pickOptText(correctOpt.translations, lang)
    : null;

  return (
    <div
      className={cn(
        "group border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 transition-colors",
        selected
          ? "bg-indigo-50/60 dark:bg-indigo-950/10"
          : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20",
      )}
    >
      <div className="flex items-start gap-3 px-5 py-3.5">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            "mt-0.5 shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-all",
            selected
              ? "border-indigo-500 bg-indigo-500"
              : "border-zinc-300 dark:border-zinc-600 hover:border-indigo-400",
          )}
        >
          {selected && (
            <svg
              className="h-2.5 w-2.5 text-white"
              fill="none"
              viewBox="0 0 10 10"
            >
              <path
                d="M2 5l2.5 2.5 3.5-4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isFallback && (
            <p className="text-[10px] font-semibold text-amber-600 mb-1 flex items-center gap-1">
              <Languages className="h-3 w-3" />
              Showing {lang === "EN" ? "Hindi" : "English"} fallback
            </p>
          )}

          <p
            className={cn(
              "text-sm text-zinc-800 dark:text-zinc-100 leading-snug",
              !expanded && "line-clamp-2",
            )}
          >
            {text || (
              <span className="italic text-red-400 text-xs">No content</span>
            )}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {question.topic?.subject?.name && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                {question.topic.subject.name}
              </span>
            )}
            {question.topic?.name && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                <Hash className="h-2 w-2" />
                {question.topic.name}
              </span>
            )}
            {bi ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                <Languages className="h-2.5 w-2.5" />
                EN + हि
              </span>
            ) : hasEN && !hasHI ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-600 border border-sky-200">
                EN only
              </span>
            ) : hasHI && !hasEN ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                हि only
              </span>
            ) : null}
            {hasExplanation && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                <MessageSquare className="h-2.5 w-2.5" />
                Explained
              </span>
            )}
            {!question.isActive && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                Inactive
              </span>
            )}
            {correctText && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 max-w-[160px] truncate">
                <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                {correctText}
              </span>
            )}
          </div>

          {/* Expanded options */}
          {expanded && question.options?.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {question.options.map((opt, i) => (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-start gap-2 px-2.5 py-2 rounded-lg text-xs",
                    opt.isCorrect
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center mt-px",
                      opt.isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-300 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300",
                    )}
                  >
                    {OPTION_LABELS[i]}
                  </span>
                  <span className="leading-snug">
                    {pickOptText(opt.translations, lang) || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Expanded explanation */}
          {expanded &&
            (() => {
              const exp = question.translations?.find(
                (t) => t.lang?.toUpperCase() === lang,
              )?.explanation;
              return exp ? (
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-bold">Explanation: </span>
                  {exp}
                </div>
              ) : null;
            })()}
        </div>

        {/* Action strip */}
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setExpanded((p) => !p)}
            title={expanded ? "Collapse" : "Expand"}
            className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onPreview}
            title="Preview"
            className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onSoftDelete}
            title={question.isActive ? "Deactivate" : "Inactive"}
            className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Dialog ───────────────────────────────────────────────────────────

function PreviewDialog({
  question,
  lang,
  open,
  onClose,
  onEdit,
}: {
  question: Question | null;
  lang: Lang;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [pLang, setPLang] = useState<Lang>(lang);
  useEffect(() => setPLang(lang), [lang]);
  if (!question) return null;
  const text = pickText(question.translations, pLang);
  const explanation = question.translations?.find(
    (t) => t.lang?.toUpperCase() === pLang,
  )?.explanation;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-sm font-bold">
              Question Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              <LangPill value={pLang} onChange={setPLang} />
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="h-7 text-xs gap-1.5"
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {question.topic?.subject?.name && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200">
                {question.topic.subject.name}
              </span>
            )}
            {question.topic?.name && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                {question.topic.name}
              </span>
            )}
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                question.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700",
              )}
            >
              {question.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {text || (
                <span className="italic text-zinc-400">
                  No {pLang} translation
                </span>
              )}
            </p>
          </div>
          {question.options?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Options
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt, i) => (
                  <div
                    key={opt.id}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-xl border text-sm",
                      opt.isCorrect
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700",
                    )}
                  >
                    <span
                      className={cn(
                        "h-5 w-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 mt-px",
                        opt.isCorrect
                          ? "bg-emerald-500 text-white"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300",
                      )}
                    >
                      {OPTION_LABELS[i]}
                    </span>
                    <span
                      className={cn(
                        "flex-1 leading-snug text-sm",
                        opt.isCorrect
                          ? "text-emerald-800 dark:text-emerald-300 font-medium"
                          : "text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {pickOptText(opt.translations, pLang) || (
                        <span className="italic text-zinc-400">No text</span>
                      )}
                    </span>
                    {opt.isCorrect && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {explanation && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-widest">
                Explanation
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                {explanation}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditDialog({
  question,
  allTopics,
  open,
  onClose,
}: {
  question: Question | null;
  allTopics: Topic[];
  open: boolean;
  onClose: () => void;
}) {
  const updateMutation = useUpdateQuestion();
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      content: "",
      explanation: "",
      topicId: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      lang: "EN",
    },
  });

  useEffect(() => {
    if (!question || !open) return;
    const enT = question.translations?.find(
      (t) => t.lang?.toUpperCase() === "EN",
    );
    const opts = (question.options ?? []).map(
      (o) =>
        o.translations?.find((tr) => tr.lang?.toUpperCase() === "EN")?.text ??
        "",
    );
    while (opts.length < 4) opts.push("");
    form.reset({
      content: enT?.content ?? "",
      explanation: enT?.explanation ?? "",
      topicId: question.topic?.id ?? (question as any).topicId ?? "",
      options: opts,
      correctAnswer: Math.max(
        0,
        question.options?.findIndex((o) => o.isCorrect) ?? 0,
      ),
      lang: "EN",
    });
  }, [question, open, form]);

  const opts = form.watch("options");
  const correct = form.watch("correctAnswer");

  const onSubmit = async (values: EditValues) => {
    if (!question) return;
    await updateMutation.mutateAsync({
      id: question.id,
      data: {
        content: values.content,
        explanation: values.explanation,
        topicId: values.topicId,
        options: values.options.filter((o) => o.trim()),
        correctAnswer: values.correctAnswer,
        lang: values.lang,
      } as any,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">
            Edit Question (EN)
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pt-1"
          >
            <FormField
              control={form.control}
              name="topicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Topic
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-64">
                      {allTopics.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-sm">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Question Text
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Enter question text"
                      className="text-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Options — click letter to mark correct
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => form.setValue("correctAnswer", i)}
                      className={cn(
                        "shrink-0 h-7 w-7 rounded-md text-xs font-bold transition-all border-2",
                        correct === i
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-emerald-300",
                      )}
                    >
                      {OPTION_LABELS[i]}
                    </button>
                    <Input
                      value={opts[i] ?? ""}
                      onChange={(e) => {
                        const n = [...opts];
                        n[i] = e.target.value;
                        form.setValue("options", n);
                      }}
                      placeholder={`Option ${OPTION_LABELS[i]}`}
                      className="h-9 text-sm flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Explanation{" "}
                    <span className="font-normal normal-case text-zinc-400">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Why is this answer correct?"
                      className="text-sm resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 min-w-24"
              >
                {updateMutation.isPending ? (
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
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuestionsPage() {
  const { toast } = useToast();

  // ── Taxonomy state ─────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Dialogs ────────────────────────────────────────────────────────────────
  const [previewQ, setPreviewQ] = useState<Question | null>(null);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [softDeleteTarget, setSoftDeleteTarget] = useState<Question | null>(
    null,
  );
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkTopicId, setBulkTopicId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Mutations ──────────────────────────────────────────────────────────────
  const deleteMutation = useDeleteQuestion();
  const softDeleteMutation = useSoftDeleteQuestion();
  const bulkTagMutation = useBulkTagQuestions();

  // ── Load taxonomy ──────────────────────────────────────────────────────────
  const loadTaxonomy = useCallback(async () => {
    setTaxonomyLoading(true);
    try {
      const [subRes, topRes] = await Promise.allSettled([
        adminSubjectsApi.getAll(),
        subjectsTopicsApi.getAll(),
      ]);
      const rawSubjects =
        subRes.status === "fulfilled" ? toArray<Subject>(subRes.value) : [];
      const rawTopics =
        topRes.status === "fulfilled" ? toArray<Topic>(topRes.value) : [];
      setAllTopics(rawTopics);
      const grouped = groupBySubject(rawTopics);
      setSubjects(
        rawSubjects.map((s) => ({ ...s, topics: grouped[s.id] ?? [] })),
      );
    } catch {
      toast({ title: "Failed to load taxonomy", variant: "destructive" });
    } finally {
      setTaxonomyLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCursor(undefined);
    }, 320);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  useEffect(() => {
    setCursor(undefined);
  }, [filters.topicId, filters.subjectName, filters.lang]);

  // ── Fetch questions ────────────────────────────────────────────────────────
  const {
    data: cursorData,
    isLoading,
    error,
    refetch,
  } = useCursorQuestions({
    cursor,
    limit: 50,
    search: debouncedSearch || undefined,
    topicId: filters.topicId ?? undefined,
    subject:
      !filters.topicId && filters.subjectName ? filters.subjectName : undefined,
    lang: filters.lang.toLowerCase(),
  });

  const rawQuestions: Question[] = cursorData?.data ?? [];
  const questions = useMemo(
    () =>
      rawQuestions.filter((q) => {
        if (filters.status === "active" && !q.isActive) return false;
        if (filters.status === "inactive" && q.isActive) return false;
        if (filters.bilingualOnly === true && !isBilingual(q)) return false;
        if (filters.bilingualOnly === false && isBilingual(q)) return false;
        if (filters.hasExplanation === true && !hasExp(q)) return false;
        if (filters.hasExplanation === false && hasExp(q)) return false;
        return true;
      }),
    [
      rawQuestions,
      filters.status,
      filters.bilingualOnly,
      filters.hasExplanation,
    ],
  );

  const hasMore = cursorData?.pagination?.hasMore ?? false;

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const patchFilters = useCallback((p: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...p }));
    setCursor(undefined);
  }, []);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
    setDebouncedSearch("");
    setCursor(undefined);
  };

  // Active filter pills
  const pills = useMemo(() => {
    const out: {
      key: string;
      label: string;
      color: string;
      onRemove: () => void;
    }[] = [];
    if (filters.subjectName && !filters.topicId)
      out.push({
        key: "subj",
        label: `Subject: ${filters.subjectName}`,
        color:
          "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700",
        onRemove: () => patchFilters({ subjectId: null, subjectName: null }),
      });
    if (filters.topicName)
      out.push({
        key: "topic",
        label: `Topic: ${filters.topicName}`,
        color:
          "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
        onRemove: () => patchFilters({ topicId: null, topicName: null }),
      });
    if (filters.status !== "all")
      out.push({
        key: "status",
        label: filters.status === "active" ? "Active only" : "Inactive only",
        color:
          filters.status === "active"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200",
        onRemove: () => patchFilters({ status: "all" }),
      });
    if (filters.bilingualOnly === true)
      out.push({
        key: "bi-y",
        label: "Bilingual",
        color: "bg-teal-50 text-teal-700 border-teal-200",
        onRemove: () => patchFilters({ bilingualOnly: null }),
      });
    if (filters.bilingualOnly === false)
      out.push({
        key: "bi-n",
        label: "Single lang",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        onRemove: () => patchFilters({ bilingualOnly: null }),
      });
    if (filters.hasExplanation === true)
      out.push({
        key: "exp-y",
        label: "Has explanation",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        onRemove: () => patchFilters({ hasExplanation: null }),
      });
    if (filters.hasExplanation === false)
      out.push({
        key: "exp-n",
        label: "No explanation",
        color: "bg-red-50 text-red-700 border-red-200",
        onRemove: () => patchFilters({ hasExplanation: null }),
      });
    return out;
  }, [filters, patchFilters]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const selectAll = useCallback(() => {
    const ids = questions.map((q) => q.id);
    const allSel = ids.length > 0 && ids.every((id) => selected.has(id));
    setSelected(
      allSel
        ? new Set([...selected].filter((id) => !ids.includes(id)))
        : new Set([...selected, ...ids]),
    );
  }, [questions, selected]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    refetch();
  };

  const handleSoftDelete = async () => {
    if (!softDeleteTarget) return;
    await softDeleteMutation.mutateAsync(softDeleteTarget.id);
    setSoftDeleteTarget(null);
    refetch();
  };

  const handleBulkTag = async () => {
    if (!bulkTopicId || selected.size === 0) return;
    await bulkTagMutation.mutateAsync({
      questionIds: [...selected],
      topicId: bulkTopicId,
    });
    setBulkTagOpen(false);
    setBulkTopicId("");
    setSelected(new Set());
    refetch();
  };

  // ── Taxonomy mutations (sidebar callbacks) ─────────────────────────────────
  const handleSubjectCreated = useCallback((s: SubjectWithTopics) => {
    setSubjects((prev) => [...prev, s]);
  }, []);

  const handleSubjectRenamed = useCallback((id: string, name: string) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }, []);

  const handleSubjectDeleted = useCallback((id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleTopicAdded = useCallback((subjectId: string, topic: Topic) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, topics: [...s.topics, topic] } : s,
      ),
    );
    setAllTopics((prev) => [...prev, topic]);
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
      setAllTopics((prev) => prev.filter((t) => t.id !== topicId));
    },
    [],
  );

  // ── Derived ────────────────────────────────────────────────────────────────
  const allVisibleSelected =
    questions.length > 0 && questions.every((q) => selected.has(q.id));
  const hasAnyFilter = pills.length > 0 || !!search;
  const activeCount = rawQuestions.filter((q) => q.isActive).length;
  const biCount = rawQuestions.filter(isBilingual).length;

  // More-filters active check
  const moreFiltersActive =
    filters.bilingualOnly !== null || filters.hasExplanation !== null;

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* ── Top bar ── */}
      <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 h-14 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <BookOpen className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Question Vault
            </h1>
            {!isLoading && (
              <p className="text-[10px] text-zinc-400">
                {rawQuestions.length} loaded · {activeCount} active · {biCount}{" "}
                bilingual
              </p>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Selection bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
            <CheckCheck className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-semibold text-indigo-700 dark:text-indigo-400">
              {selected.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-indigo-600 hover:text-indigo-700 text-xs gap-1"
              onClick={() => setBulkTagOpen(true)}
            >
              <Tag className="h-3 w-3" />
              Reassign
            </Button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-indigo-400 hover:text-indigo-600 ml-0.5"
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-700"
          onClick={() => refetch()}
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Two-panel layout ── */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left sidebar: Subject/Topic manager ── */}
        <div className="hidden lg:flex flex-col w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <SubjectSidebar
            subjects={subjects}
            allTopics={allTopics}
            loading={taxonomyLoading}
            filters={filters}
            onFilterChange={patchFilters}
            onSubjectCreated={handleSubjectCreated}
            onSubjectRenamed={handleSubjectRenamed}
            onSubjectDeleted={handleSubjectDeleted}
            onTopicAdded={handleTopicAdded}
            onTopicDeleted={handleTopicDeleted}
          />
        </div>

        {/* ── Right: question list ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Filter toolbar */}
          <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  className="pl-8 h-8 text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status */}
              <Select
                value={filters.status}
                onValueChange={(v) => patchFilters({ status: v as any })}
              >
                <SelectTrigger className="h-8 w-[120px] text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="inactive">Inactive only</SelectItem>
                </SelectContent>
              </Select>

              {/* More filters popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs gap-1.5 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
                      moreFiltersActive &&
                        "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
                    )}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    More
                    {moreFiltersActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-52 p-3 space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Language coverage
                    </p>
                    {[
                      {
                        key: true,
                        label: "Bilingual (EN + HI)",
                        icon: Languages,
                      },
                      { key: false, label: "Single language", icon: Circle },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={String(key)}
                        onClick={() =>
                          patchFilters({
                            bilingualOnly:
                              filters.bilingualOnly === key ? null : key,
                          })
                        }
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                          filters.bilingualOnly === key
                            ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {label}
                        {filters.bilingualOnly === key && (
                          <Check className="h-3 w-3 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Explanation
                    </p>
                    {[
                      {
                        key: true,
                        label: "Has explanation",
                        icon: MessageSquare,
                      },
                      { key: false, label: "Missing explanation", icon: X },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={String(key)}
                        onClick={() =>
                          patchFilters({
                            hasExplanation:
                              filters.hasExplanation === key ? null : key,
                          })
                        }
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                          filters.hasExplanation === key
                            ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {label}
                        {filters.hasExplanation === key && (
                          <Check className="h-3 w-3 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                  {moreFiltersActive && (
                    <>
                      <Separator />
                      <button
                        onClick={() =>
                          patchFilters({
                            bilingualOnly: null,
                            hasExplanation: null,
                          })
                        }
                        className="w-full text-xs text-zinc-500 hover:text-red-600 text-center"
                      >
                        Clear extra filters
                      </button>
                    </>
                  )}
                </PopoverContent>
              </Popover>

              {/* Language toggle */}
              <LangPill
                value={filters.lang}
                onChange={(l) => patchFilters({ lang: l })}
              />

              {/* Reset all */}
              {hasAnyFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-zinc-500 gap-1 hover:text-red-600"
                  onClick={resetFilters}
                >
                  <X className="h-3 w-3" />
                  Reset
                </Button>
              )}
            </div>

            {/* Active filter pills */}
            {pills.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="h-3 w-3 text-zinc-400 shrink-0" />
                {pills.map((p) => (
                  <Pill
                    key={p.key}
                    label={p.label}
                    color={p.color}
                    onRemove={p.onRemove}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Table header row */}
          <div className="shrink-0 px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                title="Select / deselect all"
                className={cn(
                  "h-4 w-4 rounded border-2 flex items-center justify-center transition-all",
                  allVisibleSelected
                    ? "border-indigo-500 bg-indigo-500"
                    : "border-zinc-300 dark:border-zinc-600 hover:border-indigo-400",
                )}
              >
                {allVisibleSelected && (
                  <svg
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M2 5l2.5 2.5 3.5-4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Question
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              {questions.length} shown{hasMore && " · more available"}
            </span>
          </div>

          {/* Question list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading &&
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}

            {error && !isLoading && (
              <div className="flex items-center gap-3 m-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error instanceof Error
                  ? error.message
                  : "Failed to load questions"}
                <button
                  onClick={() => refetch()}
                  className="ml-auto text-xs underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !error && questions.length === 0 && (
              <div className="flex flex-col items-center py-24 text-center">
                <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                </div>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  No questions found
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {hasAnyFilter
                    ? "Try adjusting your filters"
                    : "Upload questions via Excel or the bulk upload tool"}
                </p>
                {hasAnyFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-xs"
                    onClick={resetFilters}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}

            {!isLoading && questions.length > 0 && (
              <div className="bg-white dark:bg-zinc-900">
                {questions.map((q) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    lang={filters.lang}
                    selected={selected.has(q.id)}
                    onToggle={() => toggleSelect(q.id)}
                    onPreview={() => setPreviewQ(q)}
                    onEdit={() => setEditQ(q)}
                    onSoftDelete={() => setSoftDeleteTarget(q)}
                    onDelete={() => setDeleteTarget(q)}
                  />
                ))}
              </div>
            )}

            {/* Load more footer */}
            {!isLoading && questions.length > 0 && (
              <div className="px-5 py-4 flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-400">
                  {questions.length} question{questions.length !== 1 ? "s" : ""}
                  {hasMore ? " — more available" : " — all loaded"}
                </span>
                {hasMore && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (rawQuestions.length > 0)
                        setCursor(rawQuestions[rawQuestions.length - 1].id);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Load More"
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════ DIALOGS ════════ */}

      <PreviewDialog
        question={previewQ}
        lang={filters.lang}
        open={!!previewQ}
        onClose={() => setPreviewQ(null)}
        onEdit={() => {
          setEditQ(previewQ);
          setPreviewQ(null);
        }}
      />

      <EditDialog
        question={editQ}
        allTopics={allTopics}
        open={!!editQ}
        onClose={() => setEditQ(null)}
      />

      {/* Soft delete */}
      <AlertDialog
        open={!!softDeleteTarget}
        onOpenChange={(v) => !v && setSoftDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate question?</AlertDialogTitle>
            <AlertDialogDescription>
              Hides from students and removes from active sessions. History
              preserved — reversible any time.
              <span className="block mt-2 italic text-xs text-zinc-400 truncate">
                &ldquo;
                {pickText(softDeleteTarget?.translations, filters.lang).slice(
                  0,
                  90,
                )}
                …&rdquo;
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleSoftDelete}
              disabled={softDeleteMutation.isPending}
            >
              {softDeleteMutation.isPending ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Delete permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This <strong className="text-red-600">cannot be undone</strong>.
              All translations, options, and attempt history will be wiped.
              <span className="block mt-2 italic text-xs text-zinc-400 truncate">
                &ldquo;
                {pickText(deleteTarget?.translations, filters.lang).slice(
                  0,
                  90,
                )}
                …&rdquo;
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk tag */}
      <Dialog open={bulkTagOpen} onOpenChange={setBulkTagOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Reassign Topic
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-sm text-zinc-500">
              Move{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {selected.size} question{selected.size !== 1 ? "s" : ""}
              </strong>{" "}
              to:
            </p>
            <Select value={bulkTopicId} onValueChange={setBulkTopicId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select target topic" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {allTopics.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-sm">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkTagOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!bulkTopicId || bulkTagMutation.isPending}
                onClick={handleBulkTag}
                className="bg-indigo-600 hover:bg-indigo-700 min-w-24"
              >
                {bulkTagMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Reassign"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
