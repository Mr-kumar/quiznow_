"use client";

import { useState, useCallback, useEffect } from "react";
import {
  adminTopicsApi,
  type Topic,
  type CreateTopicRequest,
  type UpdateTopicRequest,
} from "@/lib/admin-api";
import { adminSubjectsApi, type Subject } from "@/lib/admin-subjects-api";
import { useListData, useCrudOperations } from "@/hooks/use-admin-crud";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Tag,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Validation schema ───────────────────────────────────────────────────────

const topicFormSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  subjectId: z.string().min(1, "Subject is required"),
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

// ─── Page component ──────────────────────────────────────────────────────────

export default function AdminTopicsPage() {
  const { toast } = useToast();

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  // Subjects for dropdown
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────

  const {
    data: topics,
    loading,
    total,
    page,
    limit,
    search,
    setPage,
    setSearch,
    refetch,
  } = useListData<Topic>(async (options) => {
    const response = await adminTopicsApi.getAll(
      options.page,
      options.limit,
      options.search,
    );
    // adminTopicsApi.getAll returns PaginatedResponse<Topic>
    // Shape: { data: Topic[], total, page, limit }
    const d = response.data as any;
    return {
      data: d.data ?? d,
      total: d.total ?? 0,
      page: d.page ?? options.page ?? 1,
      limit: d.limit ?? options.limit ?? 10,
    };
  });

  const {
    isLoading: isCrudLoading,
    create,
    update,
    remove,
  } = useCrudOperations(
    (data) => adminTopicsApi.create(data),
    (id, data) => adminTopicsApi.update(id, data),
    (id) => adminTopicsApi.delete(id),
    () => refetch(),
  );

  // Load subjects for the dropdowns.
  // adminSubjectsApi.getAll() is typed as api.get<Subject[]>("/subjects") —
  // but the backend may return a paginated wrapper. We handle both shapes.
  useEffect(() => {
    const loadSubjects = async () => {
      setSubjectsLoading(true);
      try {
        const response = await adminSubjectsApi.getAll();
        const raw = response.data as any;
        // Handle both: raw array and paginated wrapper { data: Subject[] }
        const list: Subject[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
        setSubjects(list);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load subjects",
          variant: "destructive",
        });
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [toast]);

  // ── Forms ────────────────────────────────────────────────────────────────

  const createForm = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: { name: "", subjectId: "" },
  });

  const editForm = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: { name: "", subjectId: "" },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateTopic = async (data: TopicFormValues) => {
    const success = await create(data as CreateTopicRequest);
    if (success) {
      setIsCreateDialogOpen(false);
      createForm.reset();
    }
  };

  const handleEditTopic = useCallback(
    (topic: Topic) => {
      setSelectedTopic(topic);
      editForm.reset({
        name: topic.name,
        subjectId: topic.subjectId ?? "",
      });
      setIsEditDialogOpen(true);
    },
    [editForm],
  );

  const handleUpdateTopic = async (data: TopicFormValues) => {
    if (!selectedTopic) return;
    const success = await update(selectedTopic.id, data as UpdateTopicRequest);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedTopic(null);
      editForm.reset();
    }
  };

  const handleDeleteTopic = useCallback(async () => {
    if (!topicToDelete) return;
    const success = await remove(topicToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setTopicToDelete(null);
    }
  }, [topicToDelete, remove]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // BUG FIX 2: Topic has no `status` field — use deletedAt for active state.
  // The Topic interface from admin-api.ts doesn't expose deletedAt, so we
  // treat the topic as active unless we know otherwise. The backend filters
  // soft-deleted rows by default, so all returned topics are active.
  const isTopicActive = (topic: Topic) => !(topic as any).deletedAt;

  // ── Subject dropdown content (shared between create and edit) ─────────────

  const SubjectOptions = () => (
    <>
      {subjectsLoading ? (
        <SelectItem value="__loading__" disabled>
          Loading subjects…
        </SelectItem>
      ) : subjects.length === 0 ? (
        <SelectItem value="__empty__" disabled>
          No subjects found — create one first
        </SelectItem>
      ) : (
        subjects.map((subject) => (
          <SelectItem key={subject.id} value={subject.id}>
            {subject.name}
          </SelectItem>
        ))
      )}
    </>
  );

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Topics Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Organise questions by topics and subjects
            </p>
          </div>

          {/* Create dialog */}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
              </DialogHeader>
              {/* BUG FIX 4: Form components were used but never imported */}
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreateTopic)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Algebra, Photosynthesis"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SubjectOptions />
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isCrudLoading || subjectsLoading}
                    className="w-full"
                  >
                    {isCrudLoading ? "Creating…" : "Create Topic"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {total} topic{total !== 1 ? "s" : ""} total
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            // Skeleton rows while loading
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : !topics || topics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No topics found</p>
              {search && (
                <p className="text-sm mt-1">
                  Try clearing the search or create a new topic
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics.map((topic: Topic) => (
                      <TableRow key={topic.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="font-medium">{topic.name}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {/* BUG FIX: topic.subject is an object — use .name */}
                          {topic.subject ? (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {topic.subject.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {/*
                           * BUG FIX 2: Topic has NO `status` field in Prisma schema.
                           * The backend only returns non-deleted topics by default,
                           * so everything returned here is effectively active.
                           * We fall back to checking deletedAt if the API ever
                           * includes it, otherwise show Active.
                           */}
                          {isTopicActive(topic) ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-300 bg-green-50"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-red-500 border-red-300 bg-red-50"
                            >
                              Inactive
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTopic(topic)}
                              disabled={isCrudLoading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setTopicToDelete(topic);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={isCrudLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── BUG FIX 1: Pagination — was cut off outside JSX tree ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Edit dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdateTopic)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Algebra, Photosynthesis"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SubjectOptions />
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCrudLoading || subjectsLoading}
                  className="flex-1"
                >
                  {isCrudLoading ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ────────────────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>"{topicToDelete?.name}"</strong>?{"\n\n"}
              {/*
               * BUG FIX 6: Warn the user that deleting a topic with assigned
               * questions will fail with a foreign key error from the backend.
               * The Topic → Question relation uses onDelete: Restrict.
               */}
              If this topic has questions assigned to it, the delete will fail.
              Reassign or delete those questions first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              disabled={isCrudLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isCrudLoading ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
