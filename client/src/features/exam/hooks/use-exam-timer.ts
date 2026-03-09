/**
 * features/exam/hooks/use-exam-timer.ts
 *
 * Manages the exam countdown timer.
 *
 * CRITICAL PERFORMANCE DECISION:
 * We store the absolute endTimestamp in exam-store, NOT a countdown number.
 * On each tick, we calculate remaining = endTimestamp - Date.now().
 * This means only the display string lives in local state — the rest of
 * the exam UI (QuestionPanel, QuestionPalette, 100+ buttons) does NOT
 * re-render every second.
 *
 * If we stored countdown in Zustand state:
 *   tick → set({ countdown: n-1 }) → every subscriber re-renders → 60 fps jank
 *
 * With this pattern:
 *   tick → setDisplay("01:23:45") → only TimerDisplay re-renders → smooth
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useExamStore, selectTimestamp } from "../stores/exam-store";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TimerState {
  /** Formatted string: "HH:MM:SS" or "MM:SS" if < 1 hour */
  display: string;
  /** True when < 5 minutes remaining — UI turns orange/amber */
  isWarning: boolean;
  /** True when < 1 minute remaining — UI turns red + pulse */
  isCritical: boolean;
  /** Remaining milliseconds (raw — for programmatic use) */
  remainingMs: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  if (ms <= 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  // When < 1 hour, show MM:SS — less cluttered on mobile
  return `${pad(minutes)}:${pad(seconds)}`;
}

const WARNING_MS = 5 * 60 * 1000; // 5 minutes
const CRITICAL_MS = 1 * 60 * 1000; // 1 minute

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useExamTimer(): TimerState {
  const endTimestamp = useExamStore(selectTimestamp);
  const submitExam = useExamStore((s) => s.submitExam);
  const examStatus = useExamStore((s) => s.status);

  // Local display state — the ONLY thing that causes re-renders on each tick
  const [display, setDisplay] = useState<string>("--:--:--");
  const [remainingMs, setRemainingMs] = useState<number>(0);

  // Guard: only auto-submit once, even if interval fires multiple times at ~0
  const hasSubmitted = useRef(false);

  // Stable submit function ref — avoids stale closure in interval
  const submitRef = useRef(submitExam);
  useEffect(() => {
    submitRef.current = submitExam;
  }, [submitExam]);

  const tick = useCallback(() => {
    if (!endTimestamp) return;

    const remaining = endTimestamp - Date.now();

    if (remaining <= 0) {
      setDisplay("00:00:00");
      setRemainingMs(0);

      // Auto-submit once
      if (!hasSubmitted.current && examStatus === "STARTED") {
        hasSubmitted.current = true;
        submitRef.current();
      }
      return;
    }

    setDisplay(formatTime(remaining));
    setRemainingMs(remaining);
  }, [endTimestamp, examStatus]);

  useEffect(() => {
    // Don't start timer if exam isn't active
    if (!endTimestamp || examStatus !== "STARTED") return;

    // Run immediately on mount to avoid 1-second blank flash
    tick();

    const interval = setInterval(tick, 1000);

    // Cleanup — CRITICAL: without this, old intervals stack up on re-renders
    return () => clearInterval(interval);
  }, [endTimestamp, examStatus, tick]);

  return {
    display,
    remainingMs,
    isWarning: remainingMs > 0 && remainingMs <= WARNING_MS,
    isCritical: remainingMs > 0 && remainingMs <= CRITICAL_MS,
  };
}
