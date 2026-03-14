"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Trash2,
  Plus,
  Pencil,
  Clock,
  GripVertical,
  Layers2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  name: string;
  testId: string;
  order: number;
  durationMins?: number | null;
}

interface SectionsEditorProps {
  testId: string;
  testTitle?: string;
}

export function SectionsEditor({ testId, testTitle }: SectionsEditorProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState<number | "">("");
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState<number | "">("");
  const [updating, setUpdating] = useState(false);

  // Delete dialog
  const [deleteSection, setDeleteSection] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadSections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sections");
      const all = res.data.data || res.data;
      const filtered = (all as Section[]).filter((s) => s.testId === testId);
      setSections(filtered.sort((a, b) => a.order - b.order));
    } catch (error: any) {
      toast.error("Failed to load sections", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post("/sections", {
        name: newName.trim(),
        testId,
        order: sections.length + 1,
        durationMins: newDuration === "" ? undefined : Number(newDuration),
      });
      toast(`Section "${newName}" created`);
      setIsCreateOpen(false);
      setNewName("");
      setNewDuration("");
      await loadSections();
    } catch (error: any) {
      toast.error("Failed to create section", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (section: Section) => {
    setEditingSection(section);
    setEditName(section.name);
    setEditDuration(
      typeof section.durationMins === "number" ? section.durationMins : "",
    );
  };

  const handleUpdate = async () => {
    if (!editingSection || !editName.trim()) return;
    setUpdating(true);
    try {
      await api.patch(`/sections/${editingSection.id}`, {
        name: editName.trim(),
        durationMins: editDuration === "" ? undefined : Number(editDuration),
      });
      toast(`Section "${editName}" updated`);
      setEditingSection(null);
      await loadSections();
    } catch (error: any) {
      toast.error("Failed to update section", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSection) return;
    setDeleting(true);
    try {
      await api.delete(`/sections/${deleteSection.id}`);
      toast(`Section "${deleteSection.name}" removed`);
      setDeleteSection(null);
      await loadSections();
    } catch (error: any) {
      toast.error("Failed to delete section", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="py-4 px-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Layers2 className="h-4 w-4 shrink-0 text-zinc-400" />
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  Sections
                </CardTitle>
                {testTitle && (
                  <p className="text-xs text-zinc-400 truncate">{testTitle}</p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="shrink-0 h-7 text-xs px-3"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-zinc-400 mb-3">
                No sections yet. For full-test exams (like RRB JE) one section
                is enough.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="h-7 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add First Section
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2.5 rounded-lg border",
                    "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700",
                    "hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors",
                  )}
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />

                  <span className="shrink-0 h-5 w-5 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {section.name}
                    </p>
                  </div>

                  {section.durationMins ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] h-5 px-1.5 gap-1 font-medium"
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {section.durationMins}m
                    </Badge>
                  ) : (
                    <span className="shrink-0 text-[10px] text-zinc-400">
                      full time
                    </span>
                  )}

                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      onClick={() => openEdit(section)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                      onClick={() => setDeleteSection(section)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Add Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Section Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Quantitative Aptitude"
                className="h-9 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Duration{" "}
                <span className="font-normal text-zinc-400">
                  (minutes, optional)
                </span>
              </Label>
              <Input
                type="number"
                value={newDuration}
                onChange={(e) =>
                  setNewDuration(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="Leave blank for full test duration"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? "Creating…" : "Create Section"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingSection}
        onOpenChange={(open) => !open && setEditingSection(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Section Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Duration{" "}
                <span className="font-normal text-zinc-400">
                  (minutes, optional)
                </span>
              </Label>
              <Input
                type="number"
                value={editDuration}
                onChange={(e) =>
                  setEditDuration(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="h-9 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSection(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={!editName.trim() || updating}
              >
                {updating ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteSection}
        onOpenChange={(open) => !open && setDeleteSection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>"{deleteSection?.name}"</strong> and all questions inside
              it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
