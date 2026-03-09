"use client";

/**
 * app/(student)/test/[testId]/StartExamButton.tsx
 *
 * Client component for the Start Test button on the instructions page.
 * Separated from the RSC instructions page because:
 *  1. It calls attemptsApi.start() — a POST mutation
 *  2. It writes to exam-store (Zustand — client-only)
 *  3. It uses useRouter for navigation
 *
 * Flow:
 *  POST /tests/:id/start → { attemptId, durationMins }
 *  → exam-store.startExam(attemptId, testId, durationMins)
 *  → router.push(/test/:id/attempt)
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PlayIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attemptsApi } from "@/api/attempts";
import { useExamStore } from "@/features/exam/stores/exam-store";
import { requestExamFullscreen } from "@/features/exam/hooks/use-antichat";

// ── Props ─────────────────────────────────────────────────────────────────────

interface StartExamButtonProps {
  testId: string;
  testTitle: string;
  durationMins: number;
  isDisabled?: boolean;
  disabledReason?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StartExamButton({
  testId,
  testTitle: _testTitle,
  durationMins: _durationMins,
  isDisabled = false,
  disabledReason,
}: StartExamButtonProps) {
  const router = useRouter();
  const startExam = useExamStore((s) => s.startExam);

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      // 1. Create attempt on server
      const res = await attemptsApi.start(testId);
      const data = (res.data as { data?: typeof res.data }).data ?? res.data;

      const { attemptId } = data as { attemptId: string };

      // 2. Initialise exam state in Zustand store
      //    Use server-returned duration (most accurate)
      const duration =
        (data as { durationMins?: number }).durationMins ?? _durationMins;
      startExam(attemptId, testId, duration);

      // 3. Request fullscreen (best-effort — user may deny)
      await requestExamFullscreen();

      // 4. Navigate to exam room
      router.push(`/test/${testId}/attempt`);
    } catch (err: unknown) {
      const message =
        err !== null && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to start test. Please try again.")
          : "Failed to start test. Please try again.";
      setError(message);
      setIsStarting(false);
    }
  }, [testId, _durationMins, startExam, router]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        size="lg"
        onClick={handleStart}
        disabled={isDisabled || isStarting}
        className="w-full h-13 gap-2.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        {isStarting ? (
          <>
            <Loader2Icon className="h-5 w-5 animate-spin" />
            Starting Test...
          </>
        ) : (
          <>
            <PlayIcon className="h-5 w-5" />
            {isDisabled && disabledReason ? disabledReason : "Start Test Now"}
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          <AlertCircleIcon className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
