"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  EyeOff,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Languages,
  BookOpen,
  Layers,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Hash,
  SlidersHorizontal,
} from "lucide-react";
import { useCursorQuestions } from "@/features/admin-questions/hooks/use-questions";
import {
  useDeleteQuestion,
  useSoftDeleteQuestion,
  useBulkTagQuestions,
  useUpdateQuestion,
} from "@/features/admin-questions/hooks/use-question-mutations";
import { adminTopicsApi, type Question, type Topic } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "EN" | "HI";

const OPTION_LETTERS = ["A", "B", "C", "D"];

// ─── Edit form schema ─────────────────────────────────────────────────────────

const editSchema = z.object({
  content: z.string().min(1, "Question text is required"),
  explanation: z.string().optional(),
  topicId: z.string().min(1, "Topic is required"),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2),
  correctAnswer: z.number().min(0).max(3),
  lang: z.string(),
});

type EditFormValues = z.infer<typeof editSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function pickOptionText(
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

function hasTranslation(q: Question, lang: Lang): boolean {
  return !!q.translations
    ?.find((t) => t.lang?.toUpperCase() === lang)
    ?.content?.trim();
}

// ─── Language Toggle ──────────────────────────────────────────────────────────

function LangToggle({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-0.5">
      {(["EN", "HI"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={cn(
            "h-7 px-3 rounded-md text-xs font-semibold transition-all",
            value === l
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
          )}
        >
          {l === "EN" ? "EN" : "हि"}
        </button>
      ))}
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
          <div className="flex gap-1.5">
            <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
            <div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
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
  const isFallback = !hasTranslation(question, lang);
  const hasEN = hasTranslation(question, "EN");
  const hasHI = hasTranslation(question, "HI");
  const isBilingual = hasEN && hasHI;
  const correctOpt = question.options?.find((o) => o.isCorrect);
  const correctText = correctOpt
    ? pickOptionText(correctOpt.translations, lang)
    : null;

  return (
    <div
      className={cn(
        "group border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors",
        selected
          ? "bg-indigo-50/60 dark:bg-indigo-950/20"
          : "hover:bg-slate-50/70 dark:hover:bg-slate-800/30",
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
              : "border-slate-300 dark:border-slate-600 hover:border-indigo-400",
          )}
        >
          {selected && (
            <svg
              className="h-2.5 w-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 12 12"
            >
              <path
                d="M10 3L5 8.5 2 5.5"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isFallback && (
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
              <Languages className="h-3 w-3" />
              No {lang === "EN" ? "English" : "Hindi"} — showing fallback
            </p>
          )}

          <p
            className={cn(
              "text-sm leading-snug",
              expanded ? "" : "line-clamp-2",
              "text-slate-800 dark:text-slate-200",
            )}
          >
            {text || (
              <span className="italic text-red-400 text-xs">No content</span>
            )}
          </p>

          {/* Tags */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {question.topic?.subject?.name && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                {question.topic.subject.name}
              </span>
            )}
            {question.topic?.name && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                <Layers className="h-2.5 w-2.5" />
                {question.topic.name}
              </span>
            )}
            {isBilingual ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                <Languages className="h-2.5 w-2.5" />
                EN + हि
              </span>
            ) : (
              <>
                {hasEN && !hasHI && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-600 border border-sky-200">
                    EN only
                  </span>
                )}
                {hasHI && !hasEN && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                    हि only
                  </span>
                )}
              </>
            )}
            {!question.isActive && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                Inactive
              </span>
            )}
            {correctText && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 max-w-[180px] truncate">
                ✓ {correctText}
              </span>
            )}
          </div>

          {/* Expanded options */}
          {expanded && question.options && question.options.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {question.options.map((opt, i) => (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-start gap-2 px-2.5 py-2 rounded-lg text-xs",
                    opt.isCorrect
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center mt-px",
                      opt.isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    {OPTION_LETTERS[i]}
                  </span>
                  <span>{pickOptionText(opt.translations, lang) || "—"}</span>
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          {expanded &&
            (() => {
              const exp = question.translations?.find(
                (t) => t.lang?.toUpperCase() === lang,
              )?.explanation;
              return exp ? (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">Explanation: </span>
                  {exp}
                </div>
              ) : null;
            })()}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onPreview}
            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            title="Preview"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onEdit}
            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onSoftDelete}
            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
            title={question.isActive ? "Deactivate" : "Already inactive"}
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete permanently"
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
  const [previewLang, setPreviewLang] = useState<Lang>(lang);

  useEffect(() => setPreviewLang(lang), [lang]);

  if (!question) return null;

  const text = pickText(question.translations, previewLang);
  const explanation = question.translations?.find(
    (t) => t.lang?.toUpperCase() === previewLang,
  )?.explanation;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-bold">
              Question Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              <LangToggle value={previewLang} onChange={setPreviewLang} />
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="h-7 text-xs"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            {question.topic?.subject?.name && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">
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

          {/* Question text */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {text || (
                <span className="italic text-slate-400">
                  No {previewLang} translation
                </span>
              )}
            </p>
          </div>

          {/* Options */}
          {question.options && question.options.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Options
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt, i) => {
                  const optText = pickOptionText(opt.translations, previewLang);
                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        "flex items-start gap-2.5 p-3 rounded-xl border text-sm",
                        opt.isCorrect
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
                      )}
                    >
                      <span
                        className={cn(
                          "h-5 w-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 mt-px",
                          opt.isCorrect
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
                        )}
                      >
                        {OPTION_LETTERS[i]}
                      </span>
                      <span className="leading-snug">
                        {optText || (
                          <span className="italic text-slate-400">No text</span>
                        )}
                      </span>
                      {opt.isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explanation */}
          {explanation && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
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
  topics,
  open,
  onClose,
}: {
  question: Question | null;
  topics: Topic[];
  open: boolean;
  onClose: () => void;
}) {
  const updateMutation = useUpdateQuestion();
  const { toast } = useToast();

  const form = useForm<EditFormValues>({
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

  // Populate form when question changes
  useEffect(() => {
    if (!question || !open) return;
    const enTrans = question.translations?.find(
      (t) => t.lang?.toUpperCase() === "EN",
    );
    const opts = question.options?.map((o) => {
      const t = o.translations?.find((tr) => tr.lang?.toUpperCase() === "EN");
      return t?.text ?? "";
    }) ?? ["", "", "", ""];
    // Pad to 4 options
    while (opts.length < 4) opts.push("");
    const correctIdx = question.options?.findIndex((o) => o.isCorrect) ?? 0;

    form.reset({
      content: enTrans?.content ?? "",
      explanation: enTrans?.explanation ?? "",
      topicId: question.topic?.id ?? question.topicId ?? "",
      options: opts,
      correctAnswer: correctIdx,
      lang: "EN",
    });
  }, [question, open, form]);

  const onSubmit = async (values: EditFormValues) => {
    if (!question) return;
    try {
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
    } catch {
      // error handled by mutation onError
    }
  };

  const options = form.watch("options");
  const correctAnswer = form.watch("correctAnswer");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            Edit Question
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pt-1"
          >
            {/* Topic */}
            <FormField
              control={form.control}
              name="topicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Topic
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Question Text (EN)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Enter question text in English"
                      className="text-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Options */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Options — click letter to mark correct
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => form.setValue("correctAnswer", i)}
                      className={cn(
                        "shrink-0 h-7 w-7 rounded-md text-xs font-bold flex items-center justify-center transition-all border",
                        correctAnswer === i
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-emerald-300",
                      )}
                    >
                      {OPTION_LETTERS[i]}
                    </button>
                    <Input
                      value={options[i] ?? ""}
                      onChange={(e) => {
                        const next = [...options];
                        next[i] = e.target.value;
                        form.setValue("options", next);
                      }}
                      placeholder={`Option ${OPTION_LETTERS[i]}`}
                      className="h-9 text-sm flex-1"
                    />
                  </div>
                ))}
              </div>
              {form.formState.errors.correctAnswer && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.correctAnswer.message}
                </p>
              )}
            </div>

            {/* Explanation */}
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Explanation{" "}
                    <span className="font-normal normal-case text-slate-400">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Explain why this answer is correct"
                      className="text-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
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

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [lang, setLang] = useState<Lang>("EN");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Dialogs
  const [previewQ, setPreviewQ] = useState<Question | null>(null);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [softDeleteTarget, setSoftDeleteTarget] = useState<Question | null>(
    null,
  );
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkTopicId, setBulkTopicId] = useState("");

  // Topics
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── Mutations ──────────────────────────────────────────────────────────────
  const deleteMutation = useDeleteQuestion();
  const softDeleteMutation = useSoftDeleteQuestion();
  const bulkTagMutation = useBulkTagQuestions();

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
    topicId: topicFilter !== "all" ? topicFilter : undefined,
    lang: lang.toLowerCase(),
  });

  const allQuestions: Question[] = cursorData?.data ?? [];
  const questions =
    statusFilter === "all"
      ? allQuestions
      : allQuestions.filter((q) =>
          statusFilter === "active" ? q.isActive : !q.isActive,
        );
  const hasMore = cursorData?.pagination?.hasMore ?? false;

  // ── Load topics ────────────────────────────────────────────────────────────
  useEffect(() => {
    setTopicsLoading(true);
    adminTopicsApi
      .getAll(1, 1000)
      .then((res) => {
        // ✅ FIX: Unwrap correctly — response may be { data: { data: [] } } or { data: [] }
        const arr =
          (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
        setTopics(Array.isArray(arr) ? arr : []);
      })
      .catch(() =>
        toast({ title: "Failed to load topics", variant: "destructive" }),
      )
      .finally(() => setTopicsLoading(false));
  }, [toast]);

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCursor(undefined);
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  // ── Reset cursor when filters change ──────────────────────────────────────
  useEffect(() => {
    setCursor(undefined);
  }, [topicFilter, lang]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const ids = questions.map((q) => q.id);
    const allSel = ids.every((id) => selected.has(id));
    if (allSel) {
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...ids]));
    }
  }, [questions, selected]);

  const clearSelection = () => setSelected(new Set());

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
    clearSelection();
    refetch();
  };

  const loadMore = () => {
    if (hasMore && !isLoading && allQuestions.length > 0) {
      setCursor(allQuestions[allQuestions.length - 1].id);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTopicFilter("all");
    setStatusFilter("all");
    setCursor(undefined);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const allVisibleSelected =
    questions.length > 0 && questions.every((q) => selected.has(q.id));
  const activeCount = allQuestions.filter((q) => q.isActive).length;
  const hasFilters = search || topicFilter !== "all" || statusFilter !== "all";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Page header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Question Bank
                </h1>
                <p className="text-xs text-slate-500">
                  Manage and organise your questions
                </p>
              </div>
            </div>

            {/* Stats chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {allQuestions.length}
                </span>
                <span className="text-slate-500">loaded</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {activeCount}
                </span>
                <span className="text-emerald-600/70">active</span>
              </div>
              {selected.size > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">
                    {selected.size}
                  </span>
                  <span className="text-indigo-600">selected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* ── Filters row ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="pl-8 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Topic filter */}
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="h-9 w-[180px] text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-slate-400" />
                <SelectValue placeholder="All Topics" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
          >
            <SelectTrigger className="h-9 w-[130px] text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3 w-3 text-slate-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>

          {/* Language toggle */}
          <LangToggle value={lang} onChange={setLang} />

          {/* Reset */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-slate-500"
              onClick={resetFilters}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-slate-400"
            onClick={() => refetch()}
            title="Refresh questions"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* ── Bulk action bar ── */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                {selected.size} question{selected.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <button
                onClick={clearSelection}
                className="text-indigo-400 hover:text-indigo-600"
                aria-label="Clear selection"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                onClick={() => setBulkTagOpen(true)}
              >
                <Tag className="h-3 w-3 mr-1" />
                Reassign Topic
              </Button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error instanceof Error
              ? error.message
              : "Failed to load questions"}
            <button
              onClick={() => refetch()}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Questions table ── */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className={cn(
                  "h-4 w-4 rounded border-2 flex items-center justify-center transition-all",
                  allVisibleSelected
                    ? "border-indigo-500 bg-indigo-500"
                    : "border-slate-300 dark:border-slate-600 hover:border-indigo-400",
                )}
                title="Select / deselect all visible"
              >
                {allVisibleSelected && (
                  <svg
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    viewBox="0 0 12 12"
                  >
                    <path
                      d="M10 3L5 8.5 2 5.5"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Question
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Topic</span>
              <span>Status</span>
              <span className="w-28 text-right">Actions</span>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && questions.length === 0 && (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No questions found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {hasFilters
                  ? "Try adjusting your filters"
                  : "Upload questions via Excel or create them manually"}
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs"
                  onClick={resetFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* Question rows */}
          {!isLoading && questions.length > 0 && (
            <div>
              {questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  lang={lang}
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

          {/* Load more / end of list */}
          {!isLoading && questions.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {questions.length} questions shown
                {hasMore ? " — more available" : " — all loaded"}
              </span>
              {hasMore && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={loadMore}
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

      {/* ── Preview Dialog ── */}
      <PreviewDialog
        question={previewQ}
        lang={lang}
        open={!!previewQ}
        onClose={() => setPreviewQ(null)}
        onEdit={() => {
          setEditQ(previewQ);
          setPreviewQ(null);
        }}
      />

      {/* ── Edit Dialog ── */}
      <EditDialog
        question={editQ}
        topics={topics}
        open={!!editQ}
        onClose={() => setEditQ(null)}
      />

      {/* ── Soft Delete Confirmation ── */}
      <AlertDialog
        open={!!softDeleteTarget}
        onOpenChange={(v) => !v && setSoftDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate question?</AlertDialogTitle>
            <AlertDialogDescription>
              This hides the question from students and removes it from any
              active test sessions. The question and all its history are
              preserved — you can reactivate it at any time.
              <span className="block mt-2 text-slate-400 italic text-xs truncate">
                &ldquo;
                {pickText(softDeleteTarget?.translations, lang).slice(0, 80)}
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

      {/* ── Hard Delete Confirmation ── */}
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
              This action{" "}
              <strong className="text-red-600">cannot be undone</strong>. The
              question, all its translations, options, and attempt history will
              be wiped from the database.
              <span className="block mt-2 text-slate-400 italic text-xs truncate">
                &ldquo;
                {pickText(deleteTarget?.translations, lang).slice(0, 80)}
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

      {/* ── Bulk Tag Dialog ── */}
      <Dialog open={bulkTagOpen} onOpenChange={setBulkTagOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Reassign Topic
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-sm text-slate-500">
              Move{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {selected.size} question{selected.size !== 1 ? "s" : ""}
              </strong>{" "}
              to a new topic.
            </p>
            <Select value={bulkTopicId} onValueChange={setBulkTopicId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select target topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
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
