//*** THE EXAM ROOM *** (CSR only)
"use client";

/**
 * FIXED VERSION: app/(student)/test/[testId]/attempt/page.tsx
 *
 * Key fixes applied:
 * 1. ✅ Fixed API response extraction (line 319 → now correct)
 * 2. ✅ Fixed handleAnswerSelect to preserve isMarked state
 * 3. ✅ Pass onSyncAnswer callback to QuestionPanel
 * 4. ✅ Better error handling in submit
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
  const currentSectionIdx = useExamStore((state) => state.currentSectionIdx);
  const currentQuestionIdx = useExamStore((state) => state.currentQuestionIdx);
  const navigation = { currentSectionIdx, currentQuestionIdx };
  const examStore = useExamStore(); // Get the full store for methods

  // Use store methods directly
  const restoreFromSession = examStore.restoreFromSession;
  const storeNavigate = examStore.navigate;
  const storeSetAnswer = examStore.setAnswer;
  const submitExam = examStore.submitExam;
  const startExam = examStore.startExam;

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

  // ── Navigate to a question ────────────────────────────────────────────────
  const navigateTo = useCallback(
    (sectionIdx: number, questionIdx: number) => {
      const section = sections[sectionIdx];
      const question = section?.questions[questionIdx];
      if (!question) {
        console.warn(
          `Invalid navigation: section ${sectionIdx}, question ${questionIdx}`,
        );
        return;
      }

      // ✅ NEW: Calculate and pass layout for validation
      const questionsPerSection = sections.map((s) => s.questions.length);
      const success = storeNavigate(
        sectionIdx,
        questionIdx,
        question.id,
        sections.length, // ✅ Pass total sections
        questionsPerSection, // ✅ Pass per-section counts
      );

      if (!success) {
        console.error(
          `Navigation rejected by store: section ${sectionIdx}, question ${questionIdx}`,
        );
        return;
      }

      closePalette(); // Close palette on mobile after navigation
    },
    [sections, storeNavigate, closePalette],
  );

  // ── Initialise on mount ───────────────────────────────────────────────────
  // Three cases:
  //  1. examStatus === STARTED (normal flow — just came from instructions)
  //  2. sessionStorage has snapshot (page was refreshed mid-exam)
  //  3. Neither — start new exam attempt
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

    // No active exam — start a new attempt
    const startNewAttempt = async () => {
      if (!test || isLoading) return;

      try {
        const response: any = await attemptsApi.start(testId);
        
        // Server wraps response in { success, data: attempt }
        // attempt has { id, status, ... }
        const outerData = response?.data || response;
        const attemptData = outerData?.data || outerData;
        const newAttemptId = attemptData?.id ?? attemptData?.attemptId;
        
        if (!newAttemptId) {
          console.error("Failed to extract attempt ID from response:", response);
          router.replace(`/test/${testId}`);
          return;
        }

        // Start exam in store with the attemptId
        examStore.startExam(String(newAttemptId), testId, test.durationMins);

        // Navigate to first question
        navigateTo(0, 0);

        setIsInitialised(true);
      } catch (error) {
        console.error("🔍 Failed to start exam attempt:", error);
        // Redirect back to instructions on failure
        router.replace(`/test/${testId}`);
      }
    };

    startNewAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    test,
    testId,
    isLoading,
    examStatus,
    restoreFromSession,
    examStore,
    navigateTo,
    router,
  ]);

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
  // ✅ FIXED: Now properly preserves isMarked state
  const handleAnswerSelect = useCallback(
    (questionId: string, optionId: string | null) => {
      // ✅ NEW: Get current mark status from store before syncing
      const currentAnswer = useExamStore.getState().answers[questionId];
      const isMarked = currentAnswer?.isMarked ?? false;

      // Update store
      storeSetAnswer(questionId, optionId);

      // ✅ SYNC: Properly sync with current mark status
      syncAnswer(questionId, optionId, isMarked);
    },
    [storeSetAnswer, syncAnswer],
  );

  const handleSubmitConfirm = useCallback(async () => {
    console.log("[SUBMIT] handleSubmitConfirm called", {
      hasSubmittedRef: hasSubmittedRef.current,
      attemptId,
    });

    if (hasSubmittedRef.current || !attemptId) {
      console.log("[SUBMIT] Early return — guard failed", {
        hasSubmittedRef: hasSubmittedRef.current,
        attemptId,
      });
      return;
    }
    hasSubmittedRef.current = true;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Drain any failed answer syncs before submitting
      console.log("[SUBMIT] Step 1: drainAll starting...");
      const allAnswersDrained = await drainAll();
      console.log(
        "[SUBMIT] Step 1: drainAll completed, result:",
        allAnswersDrained,
      );

      if (!allAnswersDrained) {
        console.warn("Some answers failed to sync, proceeding with submit");
      }

      // 2. Call submit API
      console.log("[SUBMIT] Step 2: calling attemptsApi.submit...");
      const res = await attemptsApi.submit(attemptId);
      console.log("[SUBMIT] Step 2: submit API response:", res.data);

      // Direct response extraction — backend returns AttemptResult directly
      const result = res.data;

      // Validate we got a proper response
      if (!result || typeof result !== "object") {
        throw new Error("Invalid response from server");
      }

      // 3. Close dialog and show full-screen loading overlay
      setIsSubmitDialogOpen(false);
      showOverlay("Submitting your exam...");

      // 4. Mark exam as submitted in store (clears sessionStorage)
      submitExam();

      // 5. Exit fullscreen
      await exitExamFullscreen();

      // 6. Navigate to result page with attemptId
      const resultAttemptId =
        (result as { attemptId?: string }).attemptId ?? attemptId;

      router.push(`/test/${testId}/result?attemptId=${resultAttemptId}`);
    } catch (err: unknown) {
      hasSubmittedRef.current = false; // Allow retry

      let message = "Submit failed. Please try again.";

      if (err && typeof err === "object") {
        if ("response" in err) {
          const response = (err as { response?: unknown }).response;
          if (response && typeof response === "object" && "data" in response) {
            const data = (response as { data?: unknown }).data;
            if (data && typeof data === "object" && "message" in data) {
              message = (data as { message?: string }).message ?? message;
            }
          }
        } else if ("message" in err) {
          message = (err as { message?: string }).message ?? message;
        }
      }

      // Keep dialog open and show error inline
      setSubmitError(message);
      setIsSubmitting(false);
      hideOverlay();

      console.error("Submit error:", err);
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
  // ── Derive current question ───────────────────────────────────────────────

  const currentQuestion = getQuestion(
    sections,
    currentSectionIdx,
    currentQuestionIdx,
  );

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
          onSubmitClick={() => {
            setIsSubmitDialogOpen(true);
          }}
        />

        {/* ── Main body ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Question panel (left / main) ────────────────────────────── */}
          <main
            role="main"
            id={`section-panel-${currentSectionIdx}`}
            className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden"
          >
            {/* Pass onSyncAnswer and onSubmit callbacks to QuestionPanel */}
            <QuestionPanel
              question={currentQuestion}
              sections={sections}
              currentSectionIdx={currentSectionIdx}
              currentQuestionIdx={currentQuestionIdx}
              onNext={navigateNext}
              onSubmit={() => setIsSubmitDialogOpen(true)}
              isReadOnly={isReadOnly}
              onSyncAnswer={syncAnswer}
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
        onOpenChange={(open) => {
          setIsSubmitDialogOpen(open);
          if (!open) setSubmitError(null); // Clear error when user closes dialog
        }}
        onConfirm={handleSubmitConfirm}
        isSubmitting={isSubmitting}
        submitError={submitError}
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
