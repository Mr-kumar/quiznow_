"use client";

/**
 * features/results/components/TopicAnalysis.tsx
 *
 * Topic-level performance analysis component. Two display modes:
 *
 *  mode="bar"    — Horizontal bar chart of accuracy per topic.
 *                  Used on the Result page: "Top 5 Weak Areas".
 *                  Shows subject badge, topic name, accuracy bar + %.
 *
 *  mode="heatmap" — GitHub-style square grid coloured by accuracy.
 *                   Used on the Profile page: full topic heatmap.
 *                   Green = strong, Amber = moderate, Red = weak, Slate = no data.
 *
 * Colour thresholds (NTA standard):
 *   ≥ 70%  → green  (strong)
 *   40–69% → amber  (needs work)
 *   1–39%  → red    (weak)
 *   null   → slate  (no data / never attempted)
 *
 * Props:
 *   topics   — UserTopicStat[] from leaderboardApi.getMyTopicStats()
 *   mode     — "bar" | "heatmap"
 *   limit    — when mode="bar", show only top N weakest topics (default 5)
 *   title    — optional section heading
 */

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingDownIcon,
  TrendingUpIcon,
  MinusIcon,
  HelpCircleIcon,
} from "lucide-react";
import type { UserTopicStat } from "@/api/leaderboard";

// ── Colour helpers ────────────────────────────────────────────────────────────

function getAccuracyLevel(
  accuracy: number | null,
): "strong" | "moderate" | "weak" | "none" {
  if (accuracy === null) return "none";
  if (accuracy >= 70) return "strong";
  if (accuracy >= 40) return "moderate";
  return "weak";
}

const LEVEL_BAR_BG: Record<string, string> = {
  strong: "bg-green-500",
  moderate: "bg-amber-400",
  weak: "bg-red-500",
  none: "bg-slate-300 dark:bg-slate-600",
};

const LEVEL_TEXT: Record<string, string> = {
  strong: "text-green-600 dark:text-green-400",
  moderate: "text-amber-600 dark:text-amber-400",
  weak: "text-red-600 dark:text-red-400",
  none: "text-slate-400 dark:text-slate-500",
};

const LEVEL_HEATMAP: Record<string, string> = {
  strong: "bg-green-500 dark:bg-green-600",
  moderate: "bg-amber-400 dark:bg-amber-500",
  weak: "bg-red-500 dark:bg-red-600",
  none: "bg-slate-200 dark:bg-slate-700",
};

const LEVEL_ICON: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  strong: TrendingUpIcon,
  moderate: MinusIcon,
  weak: TrendingDownIcon,
  none: HelpCircleIcon,
};

// ── Bar mode ─────────────────────────────────────────────────────────────────

function TopicBar({ topic }: { topic: UserTopicStat }) {
  const accuracy = topic.accuracy;
  const level = getAccuracyLevel(accuracy);
  const Icon = LEVEL_ICON[level];
  const pct = accuracy !== null ? Math.round(accuracy) : 0;

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className="text-[10px] shrink-0 px-1.5 py-0 h-4"
          >
            {topic.subjectName}
          </Badge>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
            {topic.topicName}
          </span>
        </div>
        <div
          className={cn("flex items-center gap-1 shrink-0", LEVEL_TEXT[level])}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="text-sm font-bold tabular-nums">
            {accuracy !== null ? `${pct}%` : "—"}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            LEVEL_BAR_BG[level],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Sub-label: attempts */}
      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {topic.attempts} attempt{topic.attempts !== 1 ? "s" : ""} ·{" "}
        {topic.correct} correct · {topic.wrong} wrong
      </p>
    </div>
  );
}

// ── Heatmap mode ──────────────────────────────────────────────────────────────

function TopicHeatmapCell({ topic }: { topic: UserTopicStat }) {
  const level = getAccuracyLevel(topic.accuracy);
  const pct = topic.accuracy !== null ? Math.round(topic.accuracy) : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "h-7 w-7 rounded-md cursor-default transition-transform hover:scale-110",
              LEVEL_HEATMAP[level],
            )}
            aria-label={`${topic.topicName}: ${pct !== null ? pct + "%" : "no data"}`}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[160px]">
          <p className="font-semibold">{topic.topicName}</p>
          <p className="text-muted-foreground">{topic.subjectName}</p>
          <p className="mt-0.5">
            {pct !== null ? `${pct}% accuracy` : "No attempts yet"}
          </p>
          {topic.attempts > 0 && (
            <p className="text-muted-foreground">
              {topic.correct}/{topic.attempts} correct
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TopicHeatmapGroup({
  subjectName,
  topics,
}: {
  subjectName: string;
  topics: UserTopicStat[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {subjectName}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((t) => (
          <TopicHeatmapCell key={t.topicId} topic={t} />
        ))}
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {(
        [
          { label: "Strong (≥70%)", cls: "bg-green-500" },
          { label: "Moderate (40%+)", cls: "bg-amber-400" },
          { label: "Weak (<40%)", cls: "bg-red-500" },
          { label: "No data", cls: "bg-slate-200 dark:bg-slate-700" },
        ] as const
      ).map(({ label, cls }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={cn("h-3 w-3 rounded-sm shrink-0", cls)} />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface TopicAnalysisProps {
  topics: UserTopicStat[];
  mode?: "bar" | "heatmap";
  /** In bar mode: show only N weakest topics. Default 5. */
  limit?: number;
  title?: string;
  className?: string;
  /** Show empty state if no topics */
  showEmpty?: boolean;
}

export function TopicAnalysis({
  topics,
  mode = "bar",
  limit = 5,
  title,
  className,
  showEmpty = true,
}: TopicAnalysisProps) {
  // ── Bar mode: sort by accuracy ascending (weakest first), take limit ───────
  const barTopics = useMemo(() => {
    if (mode !== "bar") return [];
    return [...topics]
      .filter((t) => t.attempts > 0) // Only show topics with attempts
      .sort((a, b) => {
        // nulls (no data) go last
        if (a.accuracy === null && b.accuracy === null) return 0;
        if (a.accuracy === null) return 1;
        if (b.accuracy === null) return -1;
        return a.accuracy - b.accuracy; // weakest first
      })
      .slice(0, limit);
  }, [topics, mode, limit]);

  // ── Heatmap mode: group by subject ────────────────────────────────────────
  const heatmapGroups = useMemo(() => {
    if (mode !== "heatmap") return new Map<string, UserTopicStat[]>();
    const map = new Map<string, UserTopicStat[]>();
    topics.forEach((t) => {
      if (!map.has(t.subjectName)) map.set(t.subjectName, []);
      map.get(t.subjectName)!.push(t);
    });
    // Sort topics within each subject by accuracy desc
    map.forEach((arr) =>
      arr.sort((a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1)),
    );
    return map;
  }, [topics, mode]);

  // ── Empty state ────────────────────────────────────────────────────────────
  const isEmpty =
    mode === "bar" ? barTopics.length === 0 : heatmapGroups.size === 0;

  if (isEmpty && showEmpty) {
    return (
      <div
        className={cn(
          "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6",
          className,
        )}
      >
        {title && (
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            {title}
          </h3>
        )}
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
          Attempt some tests to see your topic performance here.
        </p>
      </div>
    );
  }

  // ── Bar mode render ────────────────────────────────────────────────────────
  if (mode === "bar") {
    return (
      <div
        className={cn(
          "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {title}
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Weakest {barTopics.length} topic
              {barTopics.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
        <div className="space-y-4">
          {barTopics.map((topic) => (
            <TopicBar key={topic.topicId} topic={topic} />
          ))}
        </div>
      </div>
    );
  }

  // ── Heatmap mode render ────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5",
        className,
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {title}
        </h3>
      )}
      <div className="space-y-5">
        {Array.from(heatmapGroups.entries()).map(
          ([subjectName, subjectTopics], index) => (
            <TopicHeatmapGroup
              key={`${subjectName}-${index}`}
              subjectName={subjectName}
              topics={subjectTopics}
            />
          ),
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Legend />
      </div>
    </div>
  );
}
