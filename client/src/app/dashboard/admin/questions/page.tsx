"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  SelectItem,
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
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Globe,
  Hash,
  TrendingUp,
  X,
  Tag,
  AlertCircle,
} from "lucide-react";
import { useCursorQuestions } from "@/features/admin-questions/hooks/use-questions";
import { adminTopicsApi, type Question, type Topic } from "@/lib/admin-api";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/admin-data-table";

const questionFormSchema = z.object({
  content: z.string().min(1, "Question content is required"),
  explanation: z.string().optional(),
  topicId: z.string().min(1, "Topic is required"),
  options: z.array(z.string()).min(2, "At least 2 options required"),
  correctIndex: z.number().min(0).max(3),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function QuestionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState("");
  const [lang, setLang] = useState("en");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTopicId, setBulkTopicId] = useState("");

  // Fetch questions with cursor pagination
  const {
    data: cursorData,
    isLoading,
    error,
  } = useCursorQuestions({
    cursor,
    limit: 50,
    search: search || undefined,
    topicId: topicId || undefined,
    lang,
  });

  const data = cursorData?.data || [];
  const hasMore = cursorData?.pagination?.hasMore || false;
  const loading = isLoading;

  // Load topics for filtering
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const response = await adminTopicsApi.getAll(1, 1000);
        setTopics(response.data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load topics",
          variant: "destructive",
        });
      }
    };
    loadTopics();
  }, [toast]);

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMore && !loading && data.length > 0) {
      const lastItem = data[data.length - 1];
      setCursor(lastItem.id);
    }
  }, [hasMore, loading, data]);

  // Selection handlers
  const onToggleSelect = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const onSelectAllVisible = useCallback(() => {
    const ids = data.map((q: Question) => q.id);
    const allSelected =
      ids.length > 0 && ids.every((id: string) => selected.includes(id));
    setSelected(
      allSelected
        ? selected.filter((id) => !ids.includes(id))
        : [...new Set([...selected, ...ids])],
    );
  }, [data, selected]);

  // Preview and edit handlers
  const openPreview = useCallback((q: Question) => {
    setActiveQuestion(q);
    setPreviewOpen(true);
  }, []);

  const openEdit = useCallback((q: Question) => {
    setActiveQuestion(q);
    setEditOpen(true);
  }, []);

  // Filter handlers
  const updateFilters = useCallback(
    (
      newFilters: Partial<{ search: string; topicId: string; lang: string }>,
    ) => {
      if (newFilters.search !== undefined) setSearch(newFilters.search);
      if (newFilters.topicId !== undefined) setTopicId(newFilters.topicId);
      if (newFilters.lang !== undefined) setLang(newFilters.lang);
      setCursor(undefined); // Reset cursor when filters change
    },
    [],
  );

  const reset = useCallback(() => {
    setCursor(undefined);
    setSearch("");
    setTopicId("");
    setLang("en");
  }, []);

  // Table columns
  const columns: ColumnDef<Question>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
          aria-label="Select all questions"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
          aria-label={`Select question ${row.original.id}`}
        />
      ),
    },
    {
      accessorKey: "content",
      header: "Question",
      cell: ({ row }) => {
        const question = row.original;
        const translation =
          question.translations?.find((t) => t.lang === lang.toUpperCase()) ||
          question.translations?.[0];
        return (
          <div className="max-w-md">
            <p className="font-medium text-sm">
              {translation?.content || "No translation"}
            </p>
            {question.options && (
              <p className="text-xs text-gray-500 mt-1">
                {question.options.length} options
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "topic",
      header: "Topic",
      cell: ({ row }) => {
        const topic = row.original.topic;
        return <Badge variant="outline">{topic?.name || "No topic"}</Badge>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openPreview(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const allVisibleSelected =
    data.length > 0 && data.every((q: Question) => selected.includes(q.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Questions Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage question bank and content
          </p>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[200px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{data.length}</p>
                <p className="text-xs text-muted-foreground">Loaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[200px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {data.filter((q: Question) => q.isActive).length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[200px]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{lang.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">Language</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select
          value={topicId}
          onValueChange={(value) => updateFilters({ topicId: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={lang}
          onValueChange={(value) => updateFilters({ lang: value })}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">EN</SelectItem>
            <SelectItem value="hi">HI</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>

      {/* Selection actions */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm">{selected.length} selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkOpen(true)}
            >
              <Tag className="h-4 w-4 mr-1" />
              Reassign Topic
            </Button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Loading questions...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions found
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={data} />
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button onClick={loadMore} disabled={loading}>
                    {loading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
          </DialogHeader>
          {activeQuestion && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Question ({lang.toUpperCase()})</h4>
                <p>
                  {
                    activeQuestion.translations?.find(
                      (t) => t.lang === lang.toUpperCase(),
                    )?.content
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium">Options</h4>
                <div className="space-y-2">
                  {activeQuestion.options?.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span
                        className={
                          option.isCorrect ? "text-green-600" : "text-gray-600"
                        }
                      >
                        {index + 1}.
                      </span>
                      <span>
                        {
                          option.translations?.find(
                            (t) => t.lang === lang.toUpperCase(),
                          )?.text
                        }
                      </span>
                      {option.isCorrect && (
                        <span className="text-green-600 text-sm">
                          (Correct)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {activeQuestion.translations?.find(
                (t) => t.lang === lang.toUpperCase(),
              )?.explanation && (
                <div>
                  <h4 className="font-medium">Explanation</h4>
                  <p>
                    {
                      activeQuestion.translations?.find(
                        (t) => t.lang === lang.toUpperCase(),
                      )?.explanation
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Topic Assignment Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Assign {selected.length} selected questions to:
              </p>
            </div>
            <Select value={bulkTopicId} onValueChange={setBulkTopicId}>
              <SelectTrigger>
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement bulk topic assignment
                  toast({
                    title: "Feature coming soon",
                    description:
                      "Bulk topic assignment will be implemented soon",
                  });
                  setBulkOpen(false);
                }}
              >
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
