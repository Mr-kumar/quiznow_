//*** THE EXAM ROOM *** (CSR only)
"use client";

/**
 * app/(student)/test/[testId]/attempt/page.tsx
 *
 * THE EXAM ROOM — 100% Client-Side Rendering.
 *
 * This is the most complex page in the application. It wires together:
 *   - exam-store     (navigation + answers + timer state)
 *   - use-exam-loader (test config + sections + questions)
 *   - use-answer-sync (fire-and-forget answer persistence)
 *   - useAnticheat   (passive event monitoring)
 *   - ExamHeader     (title + section tabs + timer + language + submit)
 *   - QuestionPanel  (question content + options + action bar)
 *   - QuestionPalette (numbered grid — desktop right column, mobile sheet)
 *   - SubmitConfirmDialog (final submit confirmation)
 *
 * Layout:
 *   Desktop: [ExamHeader full-width]
 *            [QuestionPanel 75%] [QuestionPalette 25%]
 *
 *   Mobile:  [ExamHeader (compact)]
 *            [Section tabs row]
 *            [QuestionPanel full-width]
 *            [Palette bottom sheet]
 *
 * NEVER add SSR, generateMetadata, or any server-side data here.
 * This page must remain fully client-side.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  AlertCircleIcon,
  LayoutGridIcon,
  WifiOffIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

// Exam components
import { ExamHeader } from "@/features/exam/components/ExamHeader";
import { QuestionPanel } from "@/features/exam/components/QuestionPanel";
import { QuestionPalette } from "@/features/exam/components/QuestionPalette";
import { SubmitConfirmDialog } from "@/features/exam/components/SubmitConfirmDialog";

// Exam hooks and store
import {
  useExamStore,
  selectStatus,
  selectAttemptId,
  selectNavigation,
} from "@/features/exam/stores/exam-store";
import { shallow } from "zustand/shallow";
import {
  useExamLoader,
  getQuestion,
} from "@/features/exam/hooks/use-exam-loader";
import { useAnswerSync } from "@/features/exam/hooks/use-answer-sync";
import {
  useAnticheat,
  exitExamFullscreen,
} from "@/features/exam/hooks/use-antichat";

// Shared stores
import { useUIStore } from "@/stores/ui-store";

// API
import { attemptsApi } from "@/api/attempts";

// ── Metadata (noindex — exam content must never be cached) ────────────────────
// Note: metadata export doesn't work in "use client" pages.
// Add noindex via next.config.js headers or via Head component if needed.

// ── Loading skeleton ─────────────────────────────────────────────────────────

function ExamLoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header skeleton */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 px-4">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-4 w-32 hidden sm:block" />
        <div className="flex gap-2 ml-4 flex-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-8 w-20 rounded-md ml-auto" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      {/* Body skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
        <div className="flex-1 flex flex-col p-5 gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <div className="space-y-3 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
        {/* Palette skeleton — desktop only */}
        <div className="hidden md:flex w-[240px] border-l border-slate-200 dark:border-slate-700 p-3 flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Error screen ──────────────────────────────────────────────────────────────

function ExamErrorScreen({
  title,
  message,
  onRetry,
  showDashboard = true,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  showDashboard?: boolean;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
          <AlertCircleIcon className="h-7 w-7 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-1.5"
            >
              <RefreshCwIcon className="h-4 w-4" /> Try Again
            </Button>
          )}
          {showDashboard && (
            <Button
              type="button"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Failed sync warning banner ────────────────────────────────────────────────

function SyncWarningBanner({ failedCount }: { failedCount: number }) {
  if (failedCount === 0) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-500 text-white text-xs font-medium py-1.5 px-4"
    >
      <WifiOffIcon className="h-3.5 w-3.5 shrink-0" />
      {failedCount} answer{failedCount > 1 ? "s" : ""} not saved — check your
      connection
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

export default function AttemptPage() {
  const router = useRouter();
  const params = useParams<{ testId: string }>();
  const testId = params.testId;

  // ── Store state ──────────────────────────────────────────────────────────
  const examStatus = useExamStore(selectStatus);
  const attemptId = useExamStore(selectAttemptId);
  const navigation = useExamStore(selectNavigation);
  const examStore = useExamStore(); // Get the full store for methods

  // Use store methods directly
  const restoreFromSession = examStore.restoreFromSession;
  const storeNavigate = examStore.navigate;
  const storeSetAnswer = examStore.setAnswer;
  const submitExam = examStore.submitExam;

  // ── UI state ─────────────────────────────────────────────────────────────
  const uiStore = useUIStore(); // Get the full store for methods

  // Use store methods directly
  const isPaletteOpen = uiStore.isPaletteOpen;
  const closePalette = uiStore.closePalette;
  const showOverlay = uiStore.showLoadingOverlay;
  const hideOverlay = uiStore.hideLoadingOverlay;

  // ── Local UI state ────────────────────────────────────────────────────────
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);

  // ── Prevent double-submit ─────────────────────────────────────────────────
  const hasSubmittedRef = useRef(false);

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { test, sections, isLoading, isError, error } = useExamLoader(testId);
  const { syncAnswer, drainAll, failedCount } = useAnswerSync();

  // Mount anticheat listeners (passive — no return value)
  useAnticheat();

  // ── Initialise on mount ───────────────────────────────────────────────────
  // Three cases:
  //  1. examStatus === STARTED (normal flow — just came from instructions)
  //  2. sessionStorage has snapshot (page was refreshed mid-exam)
  //  3. Neither — student navigated here directly, redirect to instructions
  useEffect(() => {
    if (examStatus === "STARTED") {
      setIsInitialised(true);
      return;
    }

    const restored = restoreFromSession();
    if (restored) {
      setIsInitialised(true);
      return;
    }

    // No active exam — redirect back to instructions
    router.replace(`/test/${testId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // ── Navigate to a question ────────────────────────────────────────────────
  const navigateTo = useCallback(
    (sectionIdx: number, questionIdx: number) => {
      const section = sections[sectionIdx];
      const question = section?.questions[questionIdx];
      if (!question) return;
      storeNavigate(sectionIdx, questionIdx, question.id);
      closePalette(); // Close palette on mobile after navigation
    },
    [sections, storeNavigate, closePalette],
  );

  // ── Navigate to next question (Save & Next behaviour) ────────────────────
  const navigateNext = useCallback(() => {
    const { currentSectionIdx, currentQuestionIdx } = navigation;
    const currentSection = sections[currentSectionIdx];
    if (!currentSection) return;

    const isLastInSection =
      currentQuestionIdx >= currentSection.questions.length - 1;
    const isLastSection = currentSectionIdx >= sections.length - 1;

    if (!isLastInSection) {
      // Move to next question in same section
      navigateTo(currentSectionIdx, currentQuestionIdx + 1);
    } else if (!isLastSection) {
      // Move to first question of next section
      navigateTo(currentSectionIdx + 1, 0);
    }
    // If last question of last section — stay (student should submit)
  }, [navigation, sections, navigateTo]);

  // ── Handle option select ──────────────────────────────────────────────────
  const handleAnswerSelect = useCallback(
    (questionId: string, optionId: string | null, isMarked = false) => {
      storeSetAnswer(questionId, optionId);
      syncAnswer(questionId, optionId, isMarked);
    },
    [storeSetAnswer, syncAnswer],
  );

  // ── Handle submit ─────────────────────────────────────────────────────────
  const handleSubmitConfirm = useCallback(async () => {
    if (hasSubmittedRef.current || !attemptId) return;
    hasSubmittedRef.current = true;

    setIsSubmitting(true);
    setSubmitError(null);
    showOverlay("Submitting your exam...");

    try {
      // 1. Drain any failed answer syncs before submitting
      await drainAll();

      // 2. Call submit API
      const res = await attemptsApi.submit(attemptId);
      const result = (res.data as { data?: typeof res.data }).data ?? res.data;

      // 3. Mark exam as submitted in store (clears sessionStorage)
      submitExam();

      // 4. Exit fullscreen
      await exitExamFullscreen();

      // 5. Navigate to result page
      const resultAttemptId =
        (result as { attemptId?: string }).attemptId ?? attemptId;
      router.push(`/test/${testId}/result?attemptId=${resultAttemptId}`);
    } catch (err: unknown) {
      hasSubmittedRef.current = false; // Allow retry
      const message =
        err !== null && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Submit failed. Please try again.")
          : "Submit failed. Please try again.";
      setSubmitError(message);
      setIsSubmitting(false);
      hideOverlay();
    }
  }, [
    attemptId,
    drainAll,
    submitExam,
    router,
    testId,
    showOverlay,
    hideOverlay,
  ]);

  // ── Palette navigation handler ────────────────────────────────────────────
  const handlePaletteNavigate = useCallback(
    (sectionIdx: number, questionIdx: number, _questionId: string) => {
      navigateTo(sectionIdx, questionIdx);
    },
    [navigateTo],
  );

  // ── Section change handler (from ExamHeader tabs) ─────────────────────────
  const handleSectionChange = useCallback(
    (sectionIdx: number, questionIdx: number) => {
      navigateTo(sectionIdx, questionIdx);
    },
    [navigateTo],
  );

  // ── Render: Not initialised yet ───────────────────────────────────────────
  if (!isInitialised) return null;

  // ── Render: Loading questions ─────────────────────────────────────────────
  if (isLoading) return <ExamLoadingSkeleton />;

  // ── Render: Load error ────────────────────────────────────────────────────
  if (isError) {
    return (
      <ExamErrorScreen
        title="Failed to Load Questions"
        message={
          error ?? "There was a problem loading the test. Please try again."
        }
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ── Render: No sections/questions ─────────────────────────────────────────
  if (!test || sections.length === 0) {
    return (
      <ExamErrorScreen
        title="No Questions Found"
        message="This test has no questions configured. Please contact support."
        showDashboard
      />
    );
  }

  // ── Derive current question ───────────────────────────────────────────────
  const { currentSectionIdx, currentQuestionIdx } = navigation;

  console.log("[DEBUG] Navigation:", { currentSectionIdx, currentQuestionIdx });
  console.log("[DEBUG] Sections:", sections);
  console.log("[DEBUG] Sections length:", sections.length);

  const currentQuestion = getQuestion(
    sections,
    currentSectionIdx,
    currentQuestionIdx,
  );

  console.log("[DEBUG] Current question:", currentQuestion);

  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0);
  const isReadOnly = examStatus === "SUBMITTED" || examStatus === "EXPIRED";

  if (!currentQuestion) {
    return (
      <ExamErrorScreen
        title="Navigation Error"
        message="Could not find the current question. Please try refreshing."
        onRetry={() => navigateTo(0, 0)}
        showDashboard={false}
      />
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Sync warning banner — sits above everything */}
      <SyncWarningBanner failedCount={failedCount} />

      {/* Submit error banner */}
      {submitError && (
        <div
          role="alert"
          className="flex items-center justify-center gap-2 bg-red-500 text-white text-xs font-medium py-2 px-4"
        >
          <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" />
          {submitError} —{" "}
          <button
            type="button"
            onClick={() => {
              hasSubmittedRef.current = false;
              setSubmitError(null);
              setIsSubmitDialogOpen(true);
            }}
            className="underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Full-screen exam layout */}
      <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
        {/* ── Sticky exam header ─────────────────────────────────────────── */}
        <ExamHeader
          testTitle={test.title}
          sections={sections}
          currentSectionIdx={currentSectionIdx}
          onSectionChange={handleSectionChange}
          onSubmitClick={() => setIsSubmitDialogOpen(true)}
        />

        {/* ── Main body ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Question panel (left / main) ────────────────────────────── */}
          <main
            role="main"
            id={`section-panel-${currentSectionIdx}`}
            className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <QuestionPanel
              question={currentQuestion}
              sections={sections}
              currentSectionIdx={currentSectionIdx}
              currentQuestionIdx={currentQuestionIdx}
              onNext={navigateNext}
              isReadOnly={isReadOnly}
            />
          </main>

          {/* ── Palette (right — desktop only) ──────────────────────────── */}
          <aside
            aria-label="Question palette"
            className="hidden md:flex flex-col w-[240px] shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <QuestionPalette
              sections={sections}
              currentSectionIdx={currentSectionIdx}
              currentQuestionIdx={currentQuestionIdx}
              onNavigate={handlePaletteNavigate}
            />
          </aside>
        </div>
      </div>

      {/* ── Mobile palette — bottom sheet ─────────────────────────────────── */}
      <Sheet
        open={isPaletteOpen}
        onOpenChange={(open) => {
          if (!open) closePalette();
        }}
      >
        <SheetContent
          side="bottom"
          className="z-100 h-[70vh] p-0 flex flex-col"
          showCloseButton
        >
          <QuestionPalette
            sections={sections}
            currentSectionIdx={currentSectionIdx}
            currentQuestionIdx={currentQuestionIdx}
            onNavigate={handlePaletteNavigate}
          />
        </SheetContent>
      </Sheet>

      {/* ── Submit confirmation dialog ─────────────────────────────────────── */}
      <SubmitConfirmDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        onConfirm={handleSubmitConfirm}
        isSubmitting={isSubmitting}
        totalQuestions={totalQuestions}
      />

      {/* ── Loading overlay (during submit) ────────────────────────────────── */}
      {isSubmitting && (
        <div
          className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm"
          role="status"
          aria-label="Submitting exam"
        >
          <Loader2Icon className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Submitting your exam...
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Please do not close this tab
          </p>
        </div>
      )}
    </>
  );
}
