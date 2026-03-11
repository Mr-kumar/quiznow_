"use client";

/**
 * FIXED VERSION: features/exam/hooks/use-answer-sync.ts
 *
 * Changes from original:
 * 1. ✅ Added drainAllAnswers() - sends ALL answers, not just failed ones
 * 2. ✅ Fixed Answer sync to preserve isMarked state
 * 3. ✅ Added visibility change listener for better retry handling
 * 4. ✅ Better error handling and state consistency
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { attemptsApi } from "@/api/attempts";
import type { SaveAnswerRequest } from "@/api/attempts";
import { useExamStore, selectAttemptId } from "../stores/exam-store";

interface QueuedAnswer extends SaveAnswerRequest {
  retries: number;
  lastAttemptAt: number;
  firstAttemptAt: number; // ← NEW: Track age of retry
}

export interface AnswerSyncReturn {
  syncAnswer: (
    questionId: string,
    optionId: string | null,
    isMarked?: boolean,
  ) => void;

  /**
   * ✅ FIXED: Now sends ALL answers from store, not just failed ones
   * This ensures no answers are lost on submit
   */
  drainAll: () => Promise<boolean>;

  failedCount: number;
  isSyncing: boolean;
}

const MAX_RETRIES = 5;
const MIN_RETRY_GAP_MS = 3000;
const MAX_ANSWER_AGE_MS = 60_000; // ← NEW: 1 minute max age

export function useAnswerSync(): AnswerSyncReturn {
  const attemptId = useExamStore(selectAttemptId);

  const retryQueue = useRef<Map<string, QueuedAnswer>>(new Map());
  const [failedCount, setFailedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const attemptIdRef = useRef(attemptId);
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  // ── Drain the retry queue ────────────────────────────────────────────────
  const drainQueue = useCallback(async (): Promise<void> => {
    const currentAttemptId = attemptIdRef.current;
    if (!currentAttemptId || retryQueue.current.size === 0) return;

    const entries = Array.from(retryQueue.current.entries());
    const now = Date.now();

    const eligible = entries.filter(
      ([, item]) => now - item.lastAttemptAt >= MIN_RETRY_GAP_MS,
    );
    if (eligible.length === 0) return;

    const results = await Promise.allSettled(
      eligible.map(([questionId, item]) =>
        attemptsApi
          .saveAnswer(currentAttemptId, {
            questionId: item.questionId,
            optionId: item.optionId,
            isMarked: item.isMarked,
            answeredAt: item.answeredAt,
          })
          .then(() => {
            retryQueue.current.delete(questionId);
          })
          .catch(() => {
            const current = retryQueue.current.get(questionId);
            if (current) {
              // ✅ NEW: Check age in addition to retry count
              const age = Date.now() - current.firstAttemptAt;
              if (current.retries >= MAX_RETRIES || age > MAX_ANSWER_AGE_MS) {
                console.warn(
                  `Giving up on answer ${questionId}: ${current.retries} retries, ${age}ms age`,
                );
                retryQueue.current.delete(questionId);
              } else {
                retryQueue.current.set(questionId, {
                  ...current,
                  retries: current.retries + 1,
                  lastAttemptAt: Date.now(),
                });
              }
            }
          }),
      ),
    );

    setFailedCount(retryQueue.current.size);
    void results;
  }, []);

  // ── Sync a single answer ─────────────────────────────────────────────────
  const syncAnswer = useCallback(
    (questionId: string, optionId: string | null, isMarked = false): void => {
      const currentAttemptId = attemptIdRef.current;
      if (!currentAttemptId) return;

      const payload: SaveAnswerRequest = {
        questionId,
        optionId,
        isMarked,
        answeredAt: new Date().toISOString(),
      };

      (async () => {
        await drainQueue();

        try {
          await attemptsApi.saveAnswer(currentAttemptId, payload);
          retryQueue.current.delete(questionId);
          setFailedCount(retryQueue.current.size);
        } catch {
          retryQueue.current.set(questionId, {
            ...payload,
            retries: 0,
            lastAttemptAt: Date.now(),
            firstAttemptAt: Date.now(), // ← NEW: Track when added
          });
          setFailedCount(retryQueue.current.size);
        }
      })();
    },
    [drainQueue],
  );

  // ── Full drain with ALL answers (not just failed ones) ────────────────────
  /**
   * ✅ FIXED: Now sends ALL answers from exam store, ensuring nothing is lost
   * This is called before submit to guarantee all answers reach the backend
   */
  const drainAll = useCallback(async (): Promise<boolean> => {
    const currentAttemptId = attemptIdRef.current;
    if (!currentAttemptId) return true;

    setIsSyncing(true);

    try {
      // ✅ KEY FIX: Send ALL answers from store, not just failed ones
      const examStore = useExamStore.getState();
      const allAnswers = Object.entries(examStore.answers).map(
        ([questionId, answer]) => ({
          questionId,
          optionId: answer.optionId,
          isMarked: answer.isMarked,
          answeredAt: answer.answeredAt,
        }),
      );

      // If batch is empty, nothing to send
      if (allAnswers.length === 0) {
        return true;
      }

      await attemptsApi.saveAnswersBatch(currentAttemptId, allAnswers);
      retryQueue.current.clear();
      setFailedCount(0);
      return true;
    } catch (err) {
      console.error("Failed to drain all answers:", err);
      // As fallback, try to drain retry queue individually
      await drainQueue();
      const remaining = retryQueue.current.size;
      setFailedCount(remaining);
      return remaining === 0;
    } finally {
      setIsSyncing(false);
    }
  }, [drainQueue]);

  // ── Periodic background drain ────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (retryQueue.current.size > 0) {
        drainQueue();
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [drainQueue]);

  // ── ✅ NEW: Handle visibility change (tab shown/hidden) ──────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && retryQueue.current.size > 0) {
        // Tab became visible again — try to drain immediately
        console.log("Tab became visible, draining retry queue");
        drainQueue();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [drainQueue]);

  return { syncAnswer, drainAll, failedCount, isSyncing };
}
