"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  ChevronRight,
  Clock,
  Database,
  Eye,
  EyeOff,
  GripVertical,
  Languages,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BulkQuestionUpload from "@/components/admin/bulk-upload";
import { QuestionBankSelector } from "@/components/admin/question-bank-selector";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "EN" | "HI";

const LANG_LABELS: Record<Lang, string> = {
  EN: "English",
  HI: "हिन्दी",
};

interface LinkedQuestion {
  order: number;
  question: {
    id: string;
    translations: Array<{ lang: string; content: string }>;
    options: Array<{
      order: number;
      isCorrect: boolean;
      translations: Array<{ lang: string; text: string }>;
    }>;
    topic?: {
      id: string;
      name: string;
      subject?: { id: string; name: string };
    };
    _count?: { sectionLinks: number };
  };
  questionId: string;
}

interface Section {
  id: string;
  name: string;
  testId: string;
  order: number;
  durationMins?: number | null;
  questions: LinkedQuestion[];
}

interface TestData {
  id: string;
  title: string;
  durationMins: number;
  totalMarks: number;
  isLive: boolean;
  isActive: boolean;
  sections: Section[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickText(
  translations: Array<{ lang: string; content: string }>,
  lang: Lang = "EN",
): string {
  return (
    translations?.find((t) => t.lang?.toUpperCase() === lang)?.content ??
    translations?.find((t) => t.lang?.toUpperCase() === "EN")?.content ??
    translations?.find((t) => t.lang?.toUpperCase() === "HI")?.content ??
    translations?.[0]?.content ??
    ""
  );
}

/** Returns true if the question has a non-empty translation for `lang`. */
function hasLang(
  translations: Array<{ lang: string; content: string }>,
  lang: Lang,
): boolean {
  return !!translations
    .find((t) => t.lang?.toUpperCase() === lang)
    ?.content?.trim();
}

function LangToggle({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      {(["EN", "HI"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={cn(
            "h-7 px-3 rounded-md text-xs font-semibold transition-all",
            value === l
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
          )}
        >
          {l === "EN" ? "EN" : "हि"}
        </button>
      ))}
    </div>
  );
}

function getQuestionId(lq: LinkedQuestion): string {
  return lq.question?.id ?? lq.questionId;
}

function getAlreadyLinked(section: Section): Set<string> {
  return new Set((section.questions ?? []).map((lq) => getQuestionId(lq)));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
      <span className="text-slate-400">{icon}</span>
      <span className="font-bold text-slate-800 dark:text-slate-200">
        {value}
      </span>
      <span className="text-slate-500">{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestAssemblyPage() {
  const params = useParams();
  const { toast } = useToast();
  const testId = params.id as string;

  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Language toggle for questions
  const [lang, setLang] = useState<Lang>("EN");

  // Publish
  const [togglingPublish, setTogglingPublish] = useState(false);

  // Add section dialog
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionDuration, setNewSectionDuration] = useState<number | "">("");
  const [creatingSection, setCreatingSection] = useState(false);

  // Edit section dialog
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState<number | "">("");
  const [updatingSection, setUpdatingSection] = useState(false);

  // Delete section
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);

  // Question bank selector
  const [bankOpen, setBankOpen] = useState(false);
  const [bankSectionId, setBankSectionId] = useState<string | null>(null);
  const [bankSectionName, setBankSectionName] = useState("");
  const [bankLinkedIds, setBankLinkedIds] = useState<Set<string>>(new Set());

  // Unlink question
  const [unlinkTarget, setUnlinkTarget] = useState<{
    sectionId: string;
    questionId: string;
    title: string;
  } | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  // Bulk upload mode
  const [uploadSectionId, setUploadSectionId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTest = async (preserveTab = true) => {
    try {
      const res = await api.get(`/tests/${testId}`);
      const data: TestData = res.data?.data ?? res.data;
      setTestData(data);
      if (data.sections?.length > 0) {
        setActiveSection((prev) =>
          preserveTab && prev && data.sections.find((s) => s.id === prev)
            ? prev
            : data.sections[0].id,
        );
      }
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
    if (testId) fetchTest(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // ── Publish toggle ─────────────────────────────────────────────────────────
  const handleTogglePublish = async () => {
    if (!testData) return;
    setTogglingPublish(true);
    const next = !testData.isLive;
    try {
      await api.patch(`/tests/${testId}/publish`, { isLive: next });
      setTestData({ ...testData, isLive: next });
      toast({ title: next ? "Test is now Live 🟢" : "Test moved to Draft" });
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setTogglingPublish(false);
    }
  };

  // ── Create section ─────────────────────────────────────────────────────────
  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    setCreatingSection(true);
    try {
      await api.post("/sections", {
        testId,
        name: newSectionName.trim(),
        order: (testData?.sections?.length ?? 0) + 1,
        durationMins:
          newSectionDuration === "" ? undefined : Number(newSectionDuration),
      });
      setAddSectionOpen(false);
      setNewSectionName("");
      setNewSectionDuration("");
      await fetchTest();
      toast({ title: "Section created" });
    } catch (err: any) {
      toast({
        title: "Failed to create section",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setCreatingSection(false);
    }
  };

  // ── Edit section ───────────────────────────────────────────────────────────
  const openEditSection = (s: Section) => {
    setEditSection(s);
    setEditName(s.name);
    setEditDuration(typeof s.durationMins === "number" ? s.durationMins : "");
  };

  const handleUpdateSection = async () => {
    if (!editSection || !editName.trim()) return;
    setUpdatingSection(true);
    try {
      await api.patch(`/sections/${editSection.id}`, {
        name: editName.trim(),
        durationMins: editDuration === "" ? undefined : Number(editDuration),
      });
      toast({ title: "Section updated" });
      setEditSection(null);
      await fetchTest();
    } catch (err: any) {
      toast({
        title: "Failed to update section",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingSection(false);
    }
  };

  // ── Delete section ─────────────────────────────────────────────────────────
  const handleDeleteSection = async () => {
    if (!deleteTarget) return;
    setDeletingSection(true);
    try {
      await api.delete(`/sections/${deleteTarget.id}`);
      toast({ title: `Section "${deleteTarget.name}" deleted` });
      setDeleteTarget(null);
      await fetchTest(false);
    } catch (err: any) {
      toast({
        title: "Failed to delete section",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setDeletingSection(false);
    }
  };

  // ── Open question bank picker ──────────────────────────────────────────────
  const openBankForSection = (section: Section) => {
    setBankSectionId(section.id);
    setBankSectionName(section.name);
    setBankLinkedIds(getAlreadyLinked(section));
    setBankOpen(true);
  };

  // ── Confirm question bank selection ───────────────────────────────────────
  const handleBankConfirm = async (questionIds: string[]) => {
    if (!bankSectionId) return;
    await api.post(`/sections/${bankSectionId}/link-questions`, {
      questionIds,
    });
    await fetchTest();
    toast({
      title: `${questionIds.length} question${questionIds.length !== 1 ? "s" : ""} added to ${bankSectionName}`,
    });
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
    const section = testData?.sections?.find((s) => s.id === sectionId);
    if (!section) return;
    const qs = section.questions ?? [];
    const idx = qs.findIndex(
      (q) => (q.question?.id ?? q.questionId) === questionId,
    );
    if (
      (direction === "up" && idx <= 0) ||
      (direction === "down" && idx >= qs.length - 1)
    )
      return;

    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    const ids = qs.map((q) => q.question?.id ?? q.questionId);
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];

    // Optimistic update
    const snapshot = JSON.parse(JSON.stringify(testData));
    const optimistic = {
      ...testData!,
      sections: testData!.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const updated = [...sec.questions];
        [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
        return { ...sec, questions: updated };
      }),
    };
    setTestData(optimistic);

    try {
      await api.patch(`/sections/${sectionId}/reorder-questions`, {
        questionIds: ids,
      });
    } catch (err: any) {
      setTestData(snapshot);
      toast({ title: "Reorder failed", variant: "destructive" });
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalQs =
    testData?.sections?.reduce((n, s) => n + (s.questions?.length ?? 0), 0) ??
    0;

  const currentSection = testData?.sections?.find(
    (s) => s.id === activeSection,
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
          <p className="text-sm text-slate-500">Loading test…</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div>
          <Database className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-600 dark:text-slate-400">
            Test not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Top header bar ── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Back */}
          <Link
            href="/dashboard/admin/tests"
            className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tests
          </Link>

          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />

          {/* Title */}
          <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate flex-1 min-w-0">
            {testData.title}
          </h1>

          {/* Live badge */}
          {testData.isLive ? (
            <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="shrink-0 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              DRAFT
            </span>
          )}

          {/* Publish toggle */}
          <Button
            size="sm"
            onClick={handleTogglePublish}
            disabled={togglingPublish}
            className={cn(
              "shrink-0 h-8 text-xs gap-1.5",
              testData.isLive
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white",
            )}
          >
            {togglingPublish ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : testData.isLive ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Unpublish
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" /> Publish
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Stats row ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatChip
            icon={<Clock className="h-3.5 w-3.5" />}
            value={testData.durationMins}
            label="mins"
          />
          <StatChip
            icon={<BookOpen className="h-3.5 w-3.5" />}
            value={testData.totalMarks}
            label="marks"
          />
          <StatChip
            icon={<Layers className="h-3.5 w-3.5" />}
            value={testData.sections?.length ?? 0}
            label="sections"
          />
          <StatChip
            icon={<Database className="h-3.5 w-3.5" />}
            value={totalQs}
            label="questions"
          />
        </div>

        {/* ── Language toggle ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Question Language
            </span>
          </div>
          <LangToggle value={lang} onChange={setLang} />
        </div>

        {/* ── Main layout: sidebar sections + content ── */}
        <div className="flex gap-5 items-start">
          {/* Sections sidebar */}
          <div className="w-56 shrink-0 hidden md:block">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden sticky top-20">
              <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Sections
                </span>
                <button
                  onClick={() => setAddSectionOpen(true)}
                  className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  aria-label="Add new section"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-2 space-y-0.5">
                {testData.sections?.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all group",
                      activeSection === section.id
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    )}
                  >
                    <Layers
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        activeSection === section.id
                          ? "text-indigo-500"
                          : "text-slate-300 dark:text-slate-600",
                      )}
                    />
                    <span className="truncate flex-1">{section.name}</span>
                    <span
                      className={cn(
                        "shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                        activeSection === section.id
                          ? "bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                      )}
                    >
                      {section.questions?.length ?? 0}
                    </span>
                  </button>
                ))}

                {testData.sections?.length === 0 && (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400">No sections yet</p>
                    <button
                      onClick={() => setAddSectionOpen(true)}
                      className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Add one
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section content ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {!currentSection ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-20 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                  <Layers className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  No sections yet
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Add a section to start building your exam paper
                </p>
                <Button
                  size="sm"
                  onClick={() => setAddSectionOpen(true)}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Section
                </Button>
              </div>
            ) : (
              <>
                {/* Section header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {currentSection.name}
                      </h2>
                      {currentSection.durationMins && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" />
                          {currentSection.durationMins}m
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentSection.questions?.length ?? 0} question
                      {(currentSection.questions?.length ?? 0) !== 1
                        ? "s"
                        : ""}{" "}
                      in this section
                    </p>
                  </div>

                  {/* Section actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditSection(currentSection)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 transition-colors bg-white dark:bg-slate-900"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(currentSection)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-600 border border-red-100 dark:border-red-900/50 hover:border-red-200 rounded-lg transition-colors bg-white dark:bg-slate-900"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Add questions row */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Vault picker */}
                  <button
                    onClick={() => openBankForSection(currentSection)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/10 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all group text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shrink-0">
                      <Database className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                        Add from Vault
                      </p>
                      <p className="text-xs text-indigo-500/70 dark:text-indigo-500/70">
                        Browse &amp; pick from all existing questions
                      </p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-indigo-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </button>

                  {/* Bulk upload toggle */}
                  <button
                    onClick={() =>
                      setUploadSectionId((prev) =>
                        prev === currentSection.id ? null : currentSection.id,
                      )
                    }
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all group text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        Upload Excel
                      </p>
                      <p className="text-xs text-emerald-500/70 dark:text-emerald-500/70">
                        Bulk import questions via spreadsheet
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "ml-auto h-4 w-4 transition-all shrink-0",
                        uploadSectionId === currentSection.id
                          ? "rotate-90 text-emerald-500"
                          : "text-emerald-300 group-hover:text-emerald-500",
                      )}
                    />
                  </button>
                </div>

                {/* Bulk upload panel (collapsible) */}
                {uploadSectionId === currentSection.id && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 p-4">
                    <BulkQuestionUpload
                      sectionId={currentSection.id}
                      onSuccess={async () => {
                        await fetchTest();
                        setUploadSectionId(null);
                      }}
                    />
                  </div>
                )}

                {/* Questions list */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  {/* List header */}
                  <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Exam Paper
                      </span>
                    </div>
                    <Badge className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 text-[11px] font-semibold border-0">
                      {currentSection.questions?.length ?? 0} Qs
                    </Badge>
                  </div>

                  {/* Question rows */}
                  {!currentSection.questions?.length ? (
                    <div className="py-16 flex flex-col items-center text-slate-400">
                      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <BookOpen className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-sm font-medium">Section is empty</p>
                      <p className="text-xs mt-1">
                        Use the buttons above to add questions
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentSection.questions.map((lq, idx) => {
                        const qId = getQuestionId(lq);
                        const text = pickText(
                          lq.question?.translations ?? [],
                          lang,
                        );
                        const subjectName = lq.question?.topic?.subject?.name;
                        const topicName = lq.question?.topic?.name;
                        const correctOpt = lq.question?.options?.find(
                          (o) => o.isCorrect,
                        );
                        const correctText = correctOpt
                          ? pickText(
                              (correctOpt.translations ?? []).map((t) => ({
                                lang: t.lang,
                                content: t.text,
                              })),
                              lang,
                            )
                          : null;

                        // Check translation availability
                        const hasEN = hasLang(
                          lq.question?.translations ?? [],
                          "EN",
                        );
                        const hasHI = hasLang(
                          lq.question?.translations ?? [],
                          "HI",
                        );
                        const isBilingual = hasEN && hasHI;
                        const isFallback = !hasLang(
                          lq.question?.translations ?? [],
                          lang,
                        );

                        return (
                          <div
                            key={`${qId}-${idx}`}
                            className="group flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            {/* Order + drag handle */}
                            <div className="shrink-0 flex items-center gap-1 mt-px">
                              <GripVertical className="h-4 w-4 text-slate-200 dark:text-slate-700 group-hover:text-slate-300 dark:group-hover:text-slate-600 cursor-grab" />
                              <span className="h-6 w-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
                                {idx + 1}
                              </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Fallback language warning */}
                              {isFallback && (
                                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                                  <Languages className="h-3 w-3" />
                                  No {LANG_LABELS[lang]} translation — showing{" "}
                                  {lang === "EN"
                                    ? LANG_LABELS["HI"]
                                    : LANG_LABELS["EN"]}
                                </p>
                              )}
                              <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                                {text || (
                                  <span className="italic text-red-400 text-xs">
                                    No content
                                  </span>
                                )}
                              </p>

                              {/* Meta row */}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {subjectName && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800 font-semibold">
                                    {subjectName}
                                  </span>
                                )}
                                {topicName && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                    {topicName}
                                  </span>
                                )}

                                {/* Language availability */}
                                {isBilingual ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                                    <Languages className="h-2.5 w-2.5" />
                                    EN + हि
                                  </span>
                                ) : (
                                  <>
                                    {hasEN && !hasHI && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                                        EN only
                                      </span>
                                    )}
                                    {hasHI && !hasEN && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                        हि only
                                      </span>
                                    )}
                                  </>
                                )}

                                {correctText && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 max-w-[200px] truncate">
                                    ✓ {correctText}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="h-7 w-7 flex items-center justify-center rounded text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors disabled:opacity-30"
                                onClick={() =>
                                  handleReorder(currentSection.id, qId, "up")
                                }
                                disabled={idx === 0}
                                aria-label="Move question up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                className="h-7 w-7 flex items-center justify-center rounded text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors disabled:opacity-30"
                                onClick={() =>
                                  handleReorder(currentSection.id, qId, "down")
                                }
                                disabled={
                                  idx ===
                                  (currentSection.questions?.length ?? 0) - 1
                                }
                                aria-label="Move question down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                className="h-7 w-7 flex items-center justify-center rounded text-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                onClick={() =>
                                  setUnlinkTarget({
                                    sectionId: currentSection.id,
                                    questionId: qId,
                                    title: text.slice(0, 60) || "this question",
                                  })
                                }
                                aria-label="Remove question"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Question Bank Selector dialog ── */}
      <QuestionBankSelector
        open={bankOpen}
        onOpenChange={setBankOpen}
        alreadyLinkedIds={bankLinkedIds}
        onConfirm={handleBankConfirm}
        sectionName={bankSectionName}
      />

      {/* ── Add Section dialog ── */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Add Section
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Section Name</Label>
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g. Quantitative Aptitude"
                className="h-9 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreateSection()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Duration{" "}
                <span className="font-normal text-slate-400">
                  (minutes, optional)
                </span>
              </Label>
              <Input
                type="number"
                value={newSectionDuration}
                onChange={(e) =>
                  setNewSectionDuration(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="Leave blank to use full test duration"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddSectionOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateSection}
                disabled={!newSectionName.trim() || creatingSection}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {creatingSection ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Create Section"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Section dialog ── */}
      <Dialog
        open={!!editSection}
        onOpenChange={(open) => !open && setEditSection(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Edit Section
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Section Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleUpdateSection()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Duration{" "}
                <span className="font-normal text-slate-400">
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
                onClick={() => setEditSection(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateSection}
                disabled={!editName.trim() || updatingSection}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {updatingSection ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete section confirmation ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> and all its
              question links. Questions remain in the Global Vault — this only
              removes them from this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteSection}
              disabled={deletingSection}
            >
              {deletingSection ? "Deleting…" : "Delete Section"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Unlink question confirmation ── */}
      <AlertDialog
        open={!!unlinkTarget}
        onOpenChange={(v) => !v && setUnlinkTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove question?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the question from this section only. It stays in the
              Global Vault and can be re-added anytime.
              <br />
              <span className="text-slate-400 italic text-xs mt-1 block truncate">
                &ldquo;{unlinkTarget?.title}…&rdquo;
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
