"use client";

/**
 * features/exam/components/SubmitConfirmDialog.tsx
 *
 * Confirmation modal before final submit.
 * Shows unanswered/marked counts so students can make an informed decision.
 * Never auto-closes — requires explicit action from the student.
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useExamStore } from "../stores/exam-store";
import { cn } from "@/lib/utils";

// ── Props ─────────────────────────────────────────────────────────────────────

interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when student confirms submit — page handles API call */
  onConfirm: () => void;
  /** Show spinner on confirm button during API call */
  isSubmitting?: boolean;
  totalQuestions: number;
}

// ── Stat row ──────────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <span className={cn("text-sm font-bold tabular-nums", color)}>
        {value}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
  totalQuestions,
}: SubmitConfirmDialogProps) {
  const answers = useExamStore((s) => s.answers);
  const visitedQuestions = useExamStore((s) => s.visitedQuestions);

  // Compute counts live from store
  const answered = Object.values(answers).filter(
    (a) => a.optionId !== null,
  ).length;
  const markedAnswered = Object.values(answers).filter(
    (a) => a.isMarked && a.optionId !== null,
  ).length;
  const markedOnly = Object.values(answers).filter(
    (a) => a.isMarked && a.optionId === null,
  ).length;
  const notAnswered = visitedQuestions.size - answered;
  const notVisited = totalQuestions - visitedQuestions.size;
  const unattempted = notAnswered + notVisited;

  const hasUnattempted = unattempted > 0;

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {hasUnattempted ? (
              <AlertTriangleIcon className="h-5 w-5 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2Icon className="h-5 w-5 text-green-500 shrink-0" />
            )}
            Submit Exam?
          </DialogTitle>
        </DialogHeader>

        {/* Warning banner */}
        {hasUnattempted && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              You have {unattempted} unanswered question
              {unattempted !== 1 ? "s" : ""}. This cannot be undone.
            </p>
          </div>
        )}

        {/* Stats table */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-1">
          <StatRow
            label="Answered"
            value={answered}
            color="text-green-600 dark:text-green-400"
          />
          <StatRow
            label="Not Answered (visited)"
            value={Math.max(notAnswered, 0)}
            color="text-red-500 dark:text-red-400"
          />
          <StatRow
            label="Not Visited"
            value={notVisited}
            color="text-slate-400"
          />
          <StatRow
            label="Marked for Review"
            value={markedAnswered + markedOnly}
            color="text-purple-600 dark:text-purple-400"
          />
          <StatRow
            label="Total Questions"
            value={totalQuestions}
            color="text-slate-700 dark:text-slate-300"
          />
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Answers marked for review will be evaluated normally.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            Continue Exam
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={cn(
              "flex-1 sm:flex-none gap-2",
              hasUnattempted
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white",
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Final"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
