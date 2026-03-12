"use client";

/**
 * components/shared/CountdownBanner.tsx
 *
 * Displays a live countdown clock for tests that haven't started yet.
 * Shown on the test instructions page when test.startAt is in the future.
 *
 * Behaviour:
 *  - Counts down to targetTime using the same endTimestamp pattern as use-exam-timer
 *  - When countdown reaches zero: calls onOpen() callback
 *  - onOpen() unlocks the Start Test button on the instructions page
 *
 * The timer uses the same performance pattern as use-exam-timer:
 *  - Absolute target timestamp — not a countdown in state
 *  - Only the display string lives in useState
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ClockIcon, CalendarIcon } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CountdownBannerProps {
  /** The time the test goes live */
  targetTime: Date;
  /** Called when countdown reaches zero — parent can show Start button */
  onOpen?: () => void;
  /** Optional: test title to show in the banner */
  testTitle?: string;
  className?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface TimeComponents {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeComponents(remainingMs: number): TimeComponents {
  if (remainingMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(remainingMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTargetDate(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

// ── Digit block ───────────────────────────────────────────────────────────────

function DigitBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="min-w-[56px] h-14 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <span className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
          {pad(value)}
        </span>
      </div>
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CountdownBanner({
  targetTime,
  onOpen,
  testTitle,
  className,
}: CountdownBannerProps) {
  const targetMs = targetTime.getTime();
  const hasOpened = useRef(false);

  const [components, setComponents] = useState<TimeComponents>(() =>
    getTimeComponents(targetMs - Date.now()),
  );
  const [isLive, setIsLive] = useState(targetMs <= Date.now());

  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  const tick = useCallback(() => {
    const remaining = targetMs - Date.now();

    if (remaining <= 0) {
      setComponents({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setIsLive(true);
      if (!hasOpened.current) {
        hasOpened.current = true;
        onOpenRef.current?.();
      }
      return;
    }

    setComponents(getTimeComponents(remaining));
  }, [targetMs]);

  useEffect(() => {
    if (isLive) return; // Already live — no timer needed
    tick(); // Run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick, isLive]);

  // ── Test is now live ────────────────────────────────────────────────────
  if (isLive) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40 px-5 py-4",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
            Test is now LIVE
          </p>
          {testTitle && (
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
              {testTitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = components;
  const showDays = days > 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-500 to-indigo-600 text-white dark:from-blue-950/40 dark:to-indigo-950/40",
        "px-5 py-5",
        className,
      )}
      role="timer"
      aria-label={`Test starts in ${days > 0 ? `${days} days ` : ""}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ClockIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
          Test starts in
        </p>
      </div>

      {/* Digit blocks */}
      <div className="flex items-end justify-center gap-3">
        {showDays && <DigitBlock value={days} label="Days" />}
        <DigitBlock value={hours} label="Hours" />
        <DigitBlock value={minutes} label="Minutes" />
        <DigitBlock value={seconds} label="Seconds" />
      </div>

      {/* Start datetime */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        <CalendarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatTargetDate(targetTime)}
        </p>
      </div>
    </div>
  );
}
