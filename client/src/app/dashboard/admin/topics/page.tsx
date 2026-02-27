"use client";

import { useState, useCallback } from "react";
import {
  adminTopicsApi,
  type Topic,
  type CreateTopicRequest,
  type UpdateTopicRequest,
} from "@/lib/admin-api";
import { useListData, useCrudOperations } from "@/hooks/use-admin-crud";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BookOpen, Plus, Edit, Trash2, Tag, Search } from "lucide-react";
import { DataTable } from "@/components/admin/admin-data-table";
import { ColumnDef } from "@tanstack/react-table";

const topicFormSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  subject: z.string().optional(),
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

export default function AdminTopicsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  const {
    data: topics,
    loading,
    total,
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
    refetch,
  } = useListData<Topic>(async (options) => {
    const response = await adminTopicsApi.getAll(
      options.page,
      options.limit,
      options.search,
    );
    return response.data;
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

  const createForm = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: { name: "", subject: "" },
  });

  const editForm = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
  });

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
        subject: topic.subject || "",
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

  const columns: ColumnDef<Topic>[] = [
    {
      accessorKey: "name",
      header: "Topic Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.getValue("subject") ? (
            <>
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{row.getValue("subject")}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue("createdAt") as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditTopic(row.original)}
            disabled={isCrudLoading}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={() => {
              setTopicToDelete(row.original);
              setDeleteDialogOpen(true);
            }}
            disabled={isCrudLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Topics Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Organize questions by topics and subjects
            </p>
          </div>
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
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Physics, Mathematics"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isCrudLoading}
                    className="w-full"
                  >
                    {isCrudLoading ? "Creating..." : "Create Topic"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search topics..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Loading topics...</div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No topics found
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={topics} />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / limit)} ({total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1 || loading}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / limit) || loading}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
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
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Physics, Mathematics"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCrudLoading} className="w-full">
                {isCrudLoading ? "Updating..." : "Update Topic"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{topicToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              disabled={isCrudLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isCrudLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
