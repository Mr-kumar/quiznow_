"use client";

/**
 * features/exam/hooks/use-answer-sync.ts
 *
 * Syncs every answer click to the server without blocking the UI.
 *
 * Design:
 *  - Fire-and-forget: calls to syncAnswer() never await — UI stays instant
 *  - Retry queue: a ref (not state) holds failed payloads — no re-renders
 *  - Drain-first: before every sync, drain the queue via Promise.allSettled
 *  - Pre-submit drain: drainAll() is awaited by the page BEFORE calling submit
 *    so no answers are lost at the critical moment
 *
 * Why useRef for the queue?
 *  - If we used useState the queue length would cause re-renders on every
 *    network failure. We only need failedCount for the warning toast —
 *    that state is updated separately after drain attempts.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { attemptsApi } from "@/api/attempts";
import type { SaveAnswerRequest } from "@/api/attempts";
import { useExamStore, selectAttemptId } from "../stores/exam-store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QueuedAnswer extends SaveAnswerRequest {
  /** How many times this specific answer has failed to sync */
  retries: number;
  /** Timestamp of last attempt */
  lastAttemptAt: number;
}

export interface AnswerSyncReturn {
  /**
   * Queue an answer sync. Fire-and-forget — never await this.
   * Provide the current isMarked state so the server stays consistent.
   */
  syncAnswer: (
    questionId: string,
    optionId: string | null,
    isMarked?: boolean,
  ) => void;

  /**
   * Drain all queued failed answers.
   * Await this BEFORE calling the submit API — ensures no answers are lost.
   * Returns true if all drained successfully, false if some still failed.
   */
  drainAll: () => Promise<boolean>;

  /** Number of answers currently stuck in retry queue */
  failedCount: number;

  /** True while a batch drain is in progress */
  isSyncing: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RETRIES = 5;
const MIN_RETRY_GAP_MS = 3000; // Don't retry the same answer within 3 seconds

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAnswerSync(): AnswerSyncReturn {
  const attemptId = useExamStore(selectAttemptId);

  // Retry queue — useRef so mutations never cause re-renders
  const retryQueue = useRef<Map<string, QueuedAnswer>>(new Map());

  // These two DO live in state — they drive the warning UI
  const [failedCount, setFailedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Keep attemptId in a ref for use inside callbacks (avoids stale closure)
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

    // Only retry entries that are past the minimum retry gap
    const eligible = entries.filter(
      ([, item]) => now - item.lastAttemptAt >= MIN_RETRY_GAP_MS,
    );
    if (eligible.length === 0) return;

    // Fire all retries in parallel — allSettled so one failure doesn't cancel others
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
            // Success — remove from queue
            retryQueue.current.delete(questionId);
          })
          .catch(() => {
            // Still failing — update retry count and timestamp
            const current = retryQueue.current.get(questionId);
            if (current) {
              if (current.retries >= MAX_RETRIES) {
                // Give up — remove from queue after MAX_RETRIES
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

    // Update the UI counter
    setFailedCount(retryQueue.current.size);

    // Suppress unused variable warning
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

      // Fire-and-forget — never await
      (async () => {
        // Drain queue first (any previously failed answers)
        await drainQueue();

        try {
          await attemptsApi.saveAnswer(currentAttemptId, payload);
          // Success — make sure this questionId is not stuck in queue
          retryQueue.current.delete(questionId);
          setFailedCount(retryQueue.current.size);
        } catch {
          // Network error — add to retry queue
          // Use questionId as key so a newer answer REPLACES the old one
          retryQueue.current.set(questionId, {
            ...payload,
            retries: 0,
            lastAttemptAt: Date.now(),
          });
          setFailedCount(retryQueue.current.size);
        }
      })();
    },
    [drainQueue],
  );

  // ── Full drain (call before submit) ─────────────────────────────────────
  const drainAll = useCallback(async (): Promise<boolean> => {
    const currentAttemptId = attemptIdRef.current;
    if (!currentAttemptId) return true;
    if (retryQueue.current.size === 0) return true;

    setIsSyncing(true);

    try {
      // Use batch endpoint for submit drain — one request instead of N
      const answers = Array.from(retryQueue.current.values()).map((item) => ({
        questionId: item.questionId,
        optionId: item.optionId,
        isMarked: item.isMarked,
        answeredAt: item.answeredAt,
      }));

      await attemptsApi.saveAnswersBatch(currentAttemptId, answers);
      retryQueue.current.clear();
      setFailedCount(0);
      return true;
    } catch {
      // Batch also failed — try individually as last resort
      await drainQueue();
      const remaining = retryQueue.current.size;
      setFailedCount(remaining);
      return remaining === 0;
    } finally {
      setIsSyncing(false);
    }
  }, [drainQueue]);

  // ── Periodic background drain (every 30 seconds) ─────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (retryQueue.current.size > 0) {
        drainQueue();
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [drainQueue]);

  return { syncAnswer, drainAll, failedCount, isSyncing };
}
