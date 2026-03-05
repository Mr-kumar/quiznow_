"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Tag,
  Folder,
  FolderOpen,
  Grid,
  List,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { adminSubjectsApi, type Subject } from "@/lib/admin-subjects-api";
import {
  adminTopicsApi,
  type Topic,
  type CreateTopicRequest,
} from "@/lib/admin-api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const topicFormSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

interface SubjectWithTopics extends Subject {
  topics: Topic[];
  isExpanded?: boolean;
}

type ViewMode = "grid" | "list";
type SortOption = "name" | "topics" | "created";

export default function SubjectsPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicForms, setTopicForms] = useState<Record<string, TopicFormValues>>(
    {},
  );

  // Load subjects with topics
  const loadSubjects = async () => {
    setLoading(true);
    try {
      const response = await adminSubjectsApi.getAll();
      const subjectsData = response.data;

      // Load topics for each subject
      const subjectsWithTopics: SubjectWithTopics[] = await Promise.all(
        subjectsData.map(async (subject) => {
          try {
            const topicsResponse = await adminTopicsApi.getAll(1, 1000);
            // Safely access the topics data - handle different response structures
            const allTopics =
              topicsResponse.data?.data || topicsResponse.data || [];
            const subjectTopics = Array.isArray(allTopics)
              ? allTopics.filter((topic: any) => topic.subjectId === subject.id)
              : [];
            return { ...subject, topics: subjectTopics, isExpanded: false };
          } catch (error) {
            console.error(
              `Failed to load topics for subject ${subject.id}:`,
              error,
            );
            return { ...subject, topics: [], isExpanded: false };
          }
        }),
      );

      setSubjects(subjectsWithTopics);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to load subjects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  // Create topic under subject
  const handleCreateTopic = async (subjectId: string, topicName: string) => {
    if (!topicName.trim()) return;

    setIsSubmitting(true);
    try {
      const topicData: CreateTopicRequest = {
        name: topicName.trim(),
        subjectId: subjectId,
      };

      const response = await adminTopicsApi.create(topicData);

      // Update subjects state with new topic
      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === subjectId
            ? { ...subject, topics: [...subject.topics, response.data.data] }
            : subject,
        ),
      );

      // Clear the topic form for this subject
      setTopicForms((prev) => ({ ...prev, [subjectId]: { name: "" } }));

      toast({
        title: "Success",
        description: `Topic "${topicName}" created successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to create topic",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete topic
  const handleDeleteTopic = async (topicId: string, subjectId: string) => {
    try {
      await adminTopicsApi.delete(topicId);

      // Update subjects state by removing the topic
      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === subjectId
            ? {
                ...subject,
                topics: subject.topics.filter((t) => t.id !== topicId),
              }
            : subject,
        ),
      );

      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete topic",
        variant: "destructive",
      });
    }
  };

  // Toggle subject expansion
  const toggleSubjectExpansion = (subjectId: string) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? { ...subject, isExpanded: !subject.isExpanded }
          : subject,
      ),
    );
  };

  // Update topic form
  const updateTopicForm = (subjectId: string, name: string) => {
    setTopicForms((prev) => ({ ...prev, [subjectId]: { name } }));
  };

  // Filter and sort subjects
  const filteredAndSortedSubjects = subjects
    .filter((subject) =>
      subject.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "topics":
          return b.topics.length - a.topics.length;
        case "created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  // Get statistics
  const totalSubjects = subjects.length;
  const totalTopics = subjects.reduce(
    (sum, subject) => sum + subject.topics.length,
    0,
  );
  const activeSubjects = subjects.filter((s) => s.isActive).length;
  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await adminSubjectsApi.create({ name: formData.name });
      setSubjects([
        ...subjects,
        { ...response.data, topics: [], isExpanded: false },
      ]);
      setFormData({ name: "" });
      setCreateOpen(false);
      toast({
        title: "Success",
        description: `Subject "${formData.name}" created successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to create subject",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update subject
  const handleUpdate = async () => {
    if (!activeSubject || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await adminSubjectsApi.update(activeSubject.id, {
        name: formData.name,
      });
      setSubjects(
        subjects.map((s) =>
          s.id === activeSubject.id
            ? { ...response.data, topics: s.topics, isExpanded: s.isExpanded }
            : s,
        ),
      );
      setFormData({ name: "" });
      setEditOpen(false);
      setActiveSubject(null);
      toast({
        title: "Success",
        description: `Subject updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to update subject",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete subject
  const handleDelete = async (id: string) => {
    try {
      await adminSubjectsApi.delete(id);
      setSubjects(subjects.filter((s) => s.id !== id));
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete subject",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEdit = (subject: Subject) => {
    setActiveSubject(subject);
    setFormData({ name: subject.name });
    setEditOpen(true);
  };

  // Filtered subjects
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Subject & Topic Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your curriculum structure with subjects and topics
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject Name</label>
                <Input
                  placeholder="e.g., Mathematics, Physics, Chemistry"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Subject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-bold">{totalSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Topics</p>
                <p className="text-2xl font-bold">{totalTopics}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Subjects</p>
                <p className="text-2xl font-bold">{activeSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg Topics/Subject
                </p>
                <p className="text-2xl font-bold">
                  {totalSubjects > 0
                    ? Math.round(totalTopics / totalSubjects)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="subjects" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="topics">All Topics</TabsTrigger>
          </TabsList>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Sort by Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("topics")}>
                  Sort by Topics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("created")}>
                  Sort by Created
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={loadSubjects}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          {loading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedSubjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No subjects found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {search
                    ? "Try adjusting your search terms"
                    : "Create your first subject to get started"}
                </p>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subject
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleExpand={toggleSubjectExpansion}
                  onCreateTopic={handleCreateTopic}
                  onDeleteTopic={handleDeleteTopic}
                  onUpdateTopicForm={updateTopicForm}
                  topicForm={topicForms[subject.id] || { name: "" }}
                  isSubmitting={isSubmitting}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedSubjects.map((subject) => (
                <SubjectListItem
                  key={subject.id}
                  subject={subject}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleExpand={toggleSubjectExpansion}
                  onCreateTopic={handleCreateTopic}
                  onDeleteTopic={handleDeleteTopic}
                  onUpdateTopicForm={updateTopicForm}
                  topicForm={topicForms[subject.id] || { name: "" }}
                  isSubmitting={isSubmitting}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Topics Tab */}
        <TabsContent value="topics">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {subjects
                  .flatMap((subject) =>
                    (subject.topics || [])
                      .filter((topic) => topic && topic.name) // Filter out undefined topics
                      .map((topic) => ({
                        ...topic,
                        subjectName: subject.name,
                        subjectId: subject.id,
                      })),
                  )
                  .map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{topic.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {topic.subjectName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{topic.subjectName}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteTopic(topic.id, topic.subjectId)
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {totalTopics === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No topics found. Create subjects and add topics to them.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject Name</label>
              <Input
                placeholder="e.g., Mathematics, Physics, Chemistry"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Subject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Subject Card Component for Grid View
function SubjectCard({
  subject,
  onEdit,
  onDelete,
  onToggleExpand,
  onCreateTopic,
  onDeleteTopic,
  onUpdateTopicForm,
  topicForm,
  isSubmitting,
}: {
  subject: SubjectWithTopics;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onCreateTopic: (subjectId: string, name: string) => void;
  onDeleteTopic: (topicId: string, subjectId: string) => void;
  onUpdateTopicForm: (subjectId: string, name: string) => void;
  topicForm: { name: string };
  isSubmitting: boolean;
}) {
  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{subject.name}</h3>
              <p className="text-sm text-muted-foreground">
                {
                  (subject.topics || []).filter((topic) => topic && topic.name)
                    .length
                }{" "}
                topics
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEdit(subject)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleExpand(subject.id)}>
                {subject.isExpanded ? (
                  <FolderOpen className="h-4 w-4 mr-2" />
                ) : (
                  <Folder className="h-4 w-4 mr-2" />
                )}
                {subject.isExpanded ? "Collapse" : "Expand"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(subject.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Badge
          variant={subject.isActive ? "default" : "secondary"}
          className="mb-3"
        >
          {subject.isActive ? "Active" : "Inactive"}
        </Badge>

        <Collapsible
          open={subject.isExpanded}
          onOpenChange={() => onToggleExpand(subject.id)}
        >
          <CollapsibleContent className="space-y-3">
            <Separator />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new topic..."
                  value={topicForm.name}
                  onChange={(e) =>
                    onUpdateTopicForm(subject.id, e.target.value)
                  }
                  className="flex-1 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      onCreateTopic(subject.id, topicForm.name);
                    }
                  }}
                />
                <Button
                  onClick={() => onCreateTopic(subject.id, topicForm.name)}
                  disabled={isSubmitting || !topicForm.name.trim()}
                  size="sm"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {(subject.topics || []).filter((topic) => topic && topic.name)
                .length === 0 ? (
                <div className="text-center py-2 text-muted-foreground text-xs">
                  No topics yet
                </div>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {(subject.topics || [])
                    .filter((topic) => topic && topic.name)
                    .map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          {topic.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTopic(topic.id, subject.id)}
                          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// Subject List Item Component for List View
function SubjectListItem({
  subject,
  onEdit,
  onDelete,
  onToggleExpand,
  onCreateTopic,
  onDeleteTopic,
  onUpdateTopicForm,
  topicForm,
  isSubmitting,
}: {
  subject: SubjectWithTopics;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onCreateTopic: (subjectId: string, name: string) => void;
  onDeleteTopic: (topicId: string, subjectId: string) => void;
  onUpdateTopicForm: (subjectId: string, name: string) => void;
  topicForm: { name: string };
  isSubmitting: boolean;
}) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(subject.id)}
              className="p-1"
            >
              {subject.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{subject.name}</h3>
              <p className="text-sm text-muted-foreground">
                {
                  (subject.topics || []).filter((topic) => topic && topic.name)
                    .length
                }{" "}
                topics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={subject.isActive ? "default" : "secondary"}>
              {subject.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => onEdit(subject)}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{subject.name}"? This will
                    also delete all topics and questions under this subject.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(subject.id)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {subject.isExpanded && (
          <div className="ml-8 space-y-3 border-l-2 border-l-gray-200 pl-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add new topic..."
                value={topicForm.name}
                onChange={(e) => onUpdateTopicForm(subject.id, e.target.value)}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    onCreateTopic(subject.id, topicForm.name);
                  }
                }}
              />
              <Button
                onClick={() => onCreateTopic(subject.id, topicForm.name)}
                disabled={isSubmitting || !topicForm.name.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {(subject.topics || []).filter((topic) => topic && topic.name)
              .length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No topics yet. Add your first topic above.
              </div>
            ) : (
              <div className="space-y-2">
                {(subject.topics || [])
                  .filter((topic) => topic && topic.name)
                  .map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {topic.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTopic(topic.id, subject.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
