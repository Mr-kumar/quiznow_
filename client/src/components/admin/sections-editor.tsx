"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus, Edit } from "lucide-react";

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
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOrder, setNewOrder] = useState<number>(1);
  const [newDuration, setNewDuration] = useState<number | "">("");

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState<number>(1);
  const [editDuration, setEditDuration] = useState<number | "">("");

  const loadSections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sections");
      const all = res.data.data || res.data;
      const filtered = (all as Section[]).filter((s) => s.testId === testId);
      const sorted = filtered.sort((a, b) => a.order - b.order);
      setSections(sorted);
      const maxOrder = sorted.reduce(
        (max, s) => Math.max(max, s.order || 0),
        0,
      );
      setNewOrder(maxOrder + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          "Failed to load sections for this test.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) {
      loadSections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a section name.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.post("/sections", {
        name: newName.trim(),
        testId,
        order: newOrder || 1,
        durationMins:
          newDuration === ""
            ? undefined
            : Number.isNaN(Number(newDuration))
              ? undefined
              : Number(newDuration),
      });
      toast({
        title: "Section Created",
        description: `Section "${newName}" added to this test.`,
      });
      setIsCreateOpen(false);
      setNewName("");
      setNewDuration("");
      await loadSections();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to create section.",
        variant: "destructive",
      });
    }
  };

  const openEdit = (section: Section) => {
    setEditingSection(section);
    setEditName(section.name);
    setEditOrder(section.order);
    setEditDuration(
      typeof section.durationMins === "number" ? section.durationMins : "",
    );
  };

  const handleUpdate = async () => {
    if (!editingSection) return;
    if (!editName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a section name.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.patch(`/sections/${editingSection.id}`, {
        name: editName.trim(),
        order: editOrder || 1,
        durationMins:
          editDuration === ""
            ? undefined
            : Number.isNaN(Number(editDuration))
              ? undefined
              : Number(editDuration),
      });
      toast({
        title: "Section Updated",
        description: `Section "${editName}" saved.`,
      });
      setEditingSection(null);
      await loadSections();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to update section.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (section: Section) => {
    if (!confirm(`Delete section "${section.name}"?`)) return;
    try {
      await api.delete(`/sections/${section.id}`);
      toast({
        title: "Section Deleted",
        description: `Section "${section.name}" removed.`,
      });
      await loadSections();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to delete section.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-0 shadow-xl mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">
            Sections for {testTitle || "Selected Test"}
          </CardTitle>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Section Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Quantitative Aptitude"
                />
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={newOrder}
                  onChange={(e) =>
                    setNewOrder(parseInt(e.target.value || "1", 10))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (mins, optional)</Label>
                <Input
                  type="number"
                  value={newDuration}
                  onChange={(e) =>
                    setNewDuration(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  placeholder="Leave blank to use full test duration"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading sections…</div>
        ) : sections.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No sections yet. For a full-test pattern (like RRB JE), you can keep
            a single default section.
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between border rounded-lg px-3 py-2"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {section.order}. {section.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {section.durationMins
                      ? `${section.durationMins} min`
                      : "Uses full test duration"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(section)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(section)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!editingSection}
        onOpenChange={(open) => {
          if (!open) setEditingSection(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={editOrder}
                onChange={(e) =>
                  setEditOrder(parseInt(e.target.value || "1", 10))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (mins, optional)</Label>
              <Input
                type="number"
                value={editDuration}
                onChange={(e) =>
                  setEditDuration(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSection(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
