"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Plus,
  Layers,
  Upload,
  Database,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Trash2,
  GripVertical,
  ChevronRight,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";
import BulkQuestionUpload from "@/components/admin/bulk-upload";
import { QuestionBankSelector } from "@/components/admin/question-bank-selector";
import { cn } from "@/lib/utils";

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
        {value}
      </span>
      {label}
    </span>
  );
}

export default function TestAssemblyPage() {
  const params = useParams();
  const { toast } = useToast();
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{
    sectionId: string;
    questionId: string;
    title: string;
  } | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const fetchTest = async () => {
    try {
      const res = await api.get(`/tests/${params.id}`);
      const data = res.data.data ?? res.data;
      setTestData(data);
      if (data.sections?.length > 0 && !activeTab)
        setActiveTab(data.sections[0].id);
    } catch (err: any) {
      toast({
        title: "Failed to load test",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchTest();
  }, [params.id]);

  // ── Publish ────────────────────────────────────────────────────────────────
  const handleTogglePublish = async () => {
    setIsTogglingPublish(true);
    try {
      const newStatus = !testData.isLive;
      await api.patch(`/tests/${params.id}/publish`, { isLive: newStatus });
      setTestData({ ...testData, isLive: newStatus });
      toast({
        title: newStatus ? "Test Published! 🟢" : "Test moved to Draft",
      });
    } catch (err: any) {
      toast({
        title: "Failed to toggle publish",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setIsTogglingPublish(false);
    }
  };

  // ── Create section ─────────────────────────────────────────────────────────
  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    setIsCreatingSection(true);
    try {
      await api.post("/sections", {
        testId: params.id,
        name: newSectionName.trim(),
        order: (testData?.sections?.length ?? 0) + 1,
      });
      setNewSectionName("");
      await fetchTest();
      toast({ title: "Section created" });
    } catch (err: any) {
      toast({
        title: "Failed to create section",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingSection(false);
    }
  };

  // ── Unlink question ────────────────────────────────────────────────────────
  const handleUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinking(true);
    try {
      await api.delete(
        `/sections/${unlinkTarget.sectionId}/questions/${unlinkTarget.questionId}`,
      );
      toast({ title: "Question removed from section" });
      setUnlinkTarget(null);
      await fetchTest();
    } catch (err: any) {
      toast({
        title: "Failed to remove question",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setUnlinking(false);
    }
  };

  // ── Reorder ────────────────────────────────────────────────────────────────
  const handleReorder = async (
    sectionId: string,
    questionId: string,
    direction: "up" | "down",
  ) => {
    const section = testData.sections?.find((s: any) => s.id === sectionId);
    if (!section) return;
    const qs = section.questions ?? [];
    const idx = qs.findIndex(
      (q: any) => q.questionId === questionId || q.question?.id === questionId,
    );
    if (
      (direction === "up" && idx <= 0) ||
      (direction === "down" && idx >= qs.length - 1)
    )
      return;

    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    const ids = qs.map((q: any) => q.questionId ?? q.question?.id);
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];

    // Optimistic update
    const saved = JSON.parse(JSON.stringify(testData));
    const updatedSections = testData.sections.map((sec: any) => {
      if (sec.id !== sectionId) return sec;
      const updatedQs = [...sec.questions];
      [updatedQs[idx], updatedQs[newIdx]] = [updatedQs[newIdx], updatedQs[idx]];
      return { ...sec, questions: updatedQs };
    });
    setTestData({ ...testData, sections: updatedSections });

    try {
      await api.patch(`/sections/${sectionId}/reorder-questions`, {
        questionIds: ids,
      });
      toast({ title: `Moved ${direction}` });
    } catch (err: any) {
      setTestData(saved);
      toast({
        title: "Reorder failed",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  // ── Link from vault ────────────────────────────────────────────────────────
  const handleLinkQuestions = async (
    sectionId: string,
    sectionName: string,
    questionIds: string[],
  ) => {
    try {
      await api.post(`/sections/${sectionId}/link-questions`, { questionIds });
      await fetchTest();
      toast({
        title: `${questionIds.length} questions added to ${sectionName}`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to link questions",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-3 text-indigo-500" />
          <p className="text-sm text-zinc-500">Loading test…</p>
        </div>
      </div>
    );

  if (!testData)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Database className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            Test Not Found
          </h3>
        </div>
      </div>
    );

  const totalQs =
    testData.sections?.reduce(
      (n: number, s: any) => n + (s.questions?.length ?? 0),
      0,
    ) ?? 0;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <span>Admin</span>
        <ChevronRight className="h-3 w-3" />
        <span>Tests</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-xs">
          {testData.title}
        </span>
      </div>

      {/* Header card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {testData.title}
              </h1>
              {testData.isLive ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  DRAFT
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatPill value={testData.durationMins} label="mins" />
              <StatPill value={testData.totalMarks} label="marks" />
              <StatPill
                value={testData.sections?.length ?? 0}
                label="sections"
              />
              <StatPill value={totalQs} label="questions" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {/* Publish toggle */}
            <Button
              onClick={handleTogglePublish}
              disabled={isTogglingPublish}
              size="sm"
              className={cn(
                "gap-1.5 min-w-24",
                testData.isLive
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200",
              )}
            >
              {isTogglingPublish ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : testData.isLive ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Live
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Draft
                </>
              )}
            </Button>
            {/* Add section */}
            <div className="flex gap-1.5">
              <Input
                placeholder="New section…"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateSection()}
                className="h-8 text-xs w-40"
              />
              <Button
                size="sm"
                className="h-8 bg-indigo-600 hover:bg-indigo-700 px-2.5"
                onClick={handleCreateSection}
                disabled={isCreatingSection || !newSectionName.trim()}
              >
                {isCreatingSection ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {!testData.sections?.length ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center">
          <Layers className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
            No sections yet
          </h3>
          <p className="text-xs text-zinc-400">
            Use the input above to add sections. For a single-section exam, try
            "Complete Paper".
          </p>
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          {/* Tab list */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5">
            <TabsList className="w-full h-auto p-0 bg-transparent flex flex-wrap gap-1">
              {testData.sections.map((section: any) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="px-3 py-1.5 text-xs data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/40 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-400 data-[state=active]:border-indigo-200 border border-transparent rounded-md whitespace-nowrap transition-all gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5" />
                  {section.name}
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full">
                    {section.questions?.length ?? 0}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {testData.sections.map((section: any) => (
            <TabsContent
              key={section.id}
              value={section.id}
              className="space-y-4 mt-0"
            >
              {/* Upload + Vault row */}
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Upload */}
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 overflow-hidden">
                  <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          Upload Excel
                        </p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">
                          Add questions via spreadsheet to {section.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <BulkQuestionUpload
                      sectionId={section.id}
                      onSuccess={fetchTest}
                    />
                  </div>
                </div>

                {/* Vault */}
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-900 overflow-hidden">
                  <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                          Add from Vault
                        </p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-500/70">
                          Link existing questions to {section.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <QuestionBankSelector
                      maxQuestions={50}
                      onQuestionsSelected={(ids) =>
                        handleLinkQuestions(section.id, section.name, ids)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Questions table */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      Exam Paper: {section.name}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Removing a question does not delete it from the Vault
                    </p>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 text-xs">
                    {section.questions?.length ?? 0} questions
                  </Badge>
                </div>

                {section.questions?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
                        <TableHead className="w-14 text-center text-xs">
                          #
                        </TableHead>
                        <TableHead className="text-xs">Question</TableHead>
                        <TableHead className="w-28 text-center text-xs">
                          Subject
                        </TableHead>
                        <TableHead className="w-24 text-right text-xs pr-5">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.questions.map((linkedQ: any, index: number) => {
                        const masterQ = linkedQ.question;
                        // Fix: backend stores lang as uppercase "EN"
                        const translation =
                          masterQ?.translations?.find(
                            (t: any) => t.lang?.toLowerCase() === "en",
                          ) ?? masterQ?.translations?.[0];
                        // Fix: subject is an object with a name property
                        const subjectName =
                          masterQ?.topic?.subject?.name ??
                          masterQ?.topic?.subject ??
                          "—";
                        const questionId = masterQ?.id ?? linkedQ.questionId;

                        return (
                          <TableRow
                            key={`q-${index}`}
                            className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <TableCell className="text-center text-xs text-zinc-400 font-mono">
                              <div className="flex items-center justify-center gap-1">
                                <GripVertical className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-400 cursor-grab" />
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-snug">
                                {translation?.content ?? (
                                  <span className="text-red-400 italic text-xs">
                                    No content
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                                ID: {questionId?.slice(0, 8)}
                              </p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-zinc-50 dark:bg-zinc-800"
                              >
                                {subjectName}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-zinc-400 hover:text-indigo-600"
                                  onClick={() =>
                                    handleReorder(section.id, questionId, "up")
                                  }
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-zinc-400 hover:text-indigo-600"
                                  onClick={() =>
                                    handleReorder(
                                      section.id,
                                      questionId,
                                      "down",
                                    )
                                  }
                                  disabled={
                                    index ===
                                    (section.questions?.length ?? 0) - 1
                                  }
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() =>
                                    setUnlinkTarget({
                                      sectionId: section.id,
                                      questionId,
                                      title:
                                        translation?.content?.slice(0, 60) ??
                                        "this question",
                                    })
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-14 flex flex-col items-center text-zinc-400">
                    <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                      <Database className="h-6 w-6 text-zinc-300" />
                    </div>
                    <p className="text-sm font-medium">Section is empty</p>
                    <p className="text-xs mt-1">
                      Upload an Excel file or add from the Vault above
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Unlink confirmation */}
      <AlertDialog
        open={!!unlinkTarget}
        onOpenChange={(v) => !v && setUnlinkTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the question from this section. It will remain in
              the Global Vault and can be re-added.
              <br />
              <span className="text-zinc-600 dark:text-zinc-400 italic text-xs mt-1 block truncate">
                "{unlinkTarget?.title}…"
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleUnlink}
              disabled={unlinking}
            >
              {unlinking ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
