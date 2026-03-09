"use client";

/**
 * features/exam/hooks/use-antichat.ts
 *
 * Hooks into browser events to detect suspicious behaviour during the exam.
 * All detection is passive — never blocks the student, just logs and flags.
 *
 * Events monitored:
 *  - Tab switch     (visibilitychange → hidden)
 *  - Window blur    (student alt-tabbed or switched app)
 *  - Fullscreen exit (student pressed Esc or closed fullscreen)
 *  - Copy attempt   (Ctrl+C on question text)
 *  - Right click    (contextmenu on question area)
 *
 * All events call exam-store.flagSuspicious() which:
 *  1. Increments local suspicious counter
 *  2. Fires PATCH /attempts/:id/suspicious to server (fire-and-forget)
 *
 * IMPORTANT: All event listeners are cleaned up on unmount.
 * Stacking up duplicate listeners on hot-reload would cause duplicate flags.
 *
 * Usage: Call once at the top of attempt/page.tsx — no returned UI.
 */

import { useEffect, useRef } from "react";
import { useExamStore, selectStatus } from "../stores/exam-store";

type SuspiciousEventType =
  | "TAB_SWITCH"
  | "FULLSCREEN_EXIT"
  | "COPY_ATTEMPT"
  | "WINDOW_BLUR";

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAnticheat(): void {
  const flagSuspicious = useExamStore((s) => s.flagSuspicious);
  const examStatus = useExamStore(selectStatus);

  // Keep stable ref — avoids stale closure inside event listeners
  const flagRef = useRef(flagSuspicious);
  const statusRef = useRef(examStatus);
  useEffect(() => {
    flagRef.current = flagSuspicious;
  }, [flagSuspicious]);
  useEffect(() => {
    statusRef.current = examStatus;
  }, [examStatus]);

  // Guard: only flag during an active exam
  const shouldFlag = (): boolean => statusRef.current === "STARTED";

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleVisibilityChange = (): void => {
    if (!shouldFlag()) return;
    if (document.visibilityState === "hidden") {
      flagRef.current("TAB_SWITCH");
    }
  };

  const handleWindowBlur = (): void => {
    if (!shouldFlag()) return;
    // blur fires when the browser window loses focus (alt-tab, OS switch)
    // visibilitychange handles tab switches; blur catches app switches
    if (document.visibilityState === "visible") {
      // Only flag if tab is still visible — means user switched to another app
      flagRef.current("WINDOW_BLUR");
    }
  };

  const handleFullscreenChange = (): void => {
    if (!shouldFlag()) return;
    // fullscreenElement is null when the student exits fullscreen
    if (!document.fullscreenElement) {
      flagRef.current("FULLSCREEN_EXIT");
    }
  };

  const handleCopy = (e: ClipboardEvent): void => {
    if (!shouldFlag()) return;
    // Block clipboard copy of question content
    e.preventDefault();
    flagRef.current("COPY_ATTEMPT");
  };

  const handleContextMenu = (e: MouseEvent): void => {
    if (!shouldFlag()) return;
    // Block right-click menu — prevents "Search Google for..." on question text
    e.preventDefault();
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (!shouldFlag()) return;
    // Block PrintScreen
    if (e.key === "PrintScreen") {
      e.preventDefault();
      flagRef.current("COPY_ATTEMPT");
    }
    // Block Ctrl+P (print) — could capture question content
    if ((e.ctrlKey || e.metaKey) && e.key === "p") {
      e.preventDefault();
    }
  };

  // ── Setup & cleanup ────────────────────────────────────────────────────────

  useEffect(() => {
    // Only attach listeners when the exam is STARTED
    // Re-runs if status changes (e.g. exam submitted — removes listeners)
    if (examStatus !== "STARTED") return;

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStatus]); // Re-attach if exam status changes
}

// ── Fullscreen request helper (call on exam start) ────────────────────────────

/**
 * Request fullscreen for the exam room.
 * Call this from the instructions page when student clicks "Start Test".
 * Browsers require fullscreen to be triggered by a user gesture.
 */
export async function requestExamFullscreen(): Promise<boolean> {
  if (!document.documentElement.requestFullscreen) return false;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    // User denied fullscreen — that's okay, we flag exits not entry refusal
    return false;
  }
}

/**
 * Exit fullscreen cleanly on exam submit.
 * Call this from the submit handler after exam-store.submitExam().
 */
export async function exitExamFullscreen(): Promise<void> {
  if (document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch {
      // Ignore — fullscreen may already be exited
    }
  }
}
