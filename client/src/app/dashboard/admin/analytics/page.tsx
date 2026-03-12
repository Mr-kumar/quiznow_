"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useDashboard } from "@/features/admin-analytics/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import "@/styles/progress.css";

// Helper function to get progress class
function getProgressClass(pct: number): string {
  const rounded = Math.round(pct / 5) * 5; // Round to nearest 5
  return `progress-${Math.min(100, Math.max(0, rounded))}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null, suffix = ""): string {
  if (n == null) return "—";
  return n.toLocaleString() + suffix;
}

function GrowthIndicator({ value, label }: { value: number; label: string }) {
  if (value > 0) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <ArrowUpRight className="h-3 w-3 text-emerald-500 shrink-0" />
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          +{value}% {label}
        </span>
      </div>
    );
  }
  if (value < 0) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <ArrowDownRight className="h-3 w-3 text-red-500 shrink-0" />
        <span className="text-[11px] font-semibold text-red-500">
          {value}% {label}
        </span>
      </div>
    );
  }
  return (
    <p className="text-[11px] text-slate-400 mt-1">No change from last month</p>
  );
}

// ─── Metric Tile ──────────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  growth,
  growthLabel = "from last month",
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: string;
  growth?: number;
  growthLabel?: string;
  icon: React.ElementType;
  colorClass: string; // e.g. "blue" | "emerald" | "violet" | "amber"
}) {
  const configs: Record<
    string,
    { bg: string; iconBg: string; iconColor: string; text: string }
  > = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-600 dark:text-blue-400",
      text: "text-blue-700 dark:text-blue-300",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    violet: {
      bg: "bg-violet-50 dark:bg-violet-950/20",
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-600 dark:text-violet-400",
      text: "text-violet-700 dark:text-violet-300",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/20",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-600 dark:text-amber-400",
      text: "text-amber-700 dark:text-amber-300",
    },
  };
  const c = configs[colorClass] ?? configs.blue;
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-800 p-4",
        c.bg,
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={cn("text-xs font-semibold", c.text)}>{label}</span>
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            c.iconBg,
          )}
        >
          <Icon className={cn("h-4 w-4", c.iconColor)} />
        </div>
      </div>
      <div className={cn("text-2xl font-bold", c.text)}>{value}</div>
      {growth != null && <GrowthIndicator value={growth} label={growthLabel} />}
    </div>
  );
}

function MetricTileSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

function StatCard({
  icon: Icon,
  iconColor,
  title,
  description,
  highlights,
  stats,
  loading,
  error,
  onRetry,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  highlights: { value: string; label: string; color: string }[];
  stats: StatItem[];
  loading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-5 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onRetry}
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center",
            iconColor,
          )}
        >
          <Icon
            className="h-4.5 w-4.5 text-white"
            style={{ height: "1.125rem", width: "1.125rem" }}
          />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {title}
          </p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>

      {/* Highlight grid */}
      <div className="grid grid-cols-2 gap-2">
        {highlights.map((h) => (
          <div
            key={h.label}
            className={cn("rounded-lg px-3 py-2.5 text-center", h.color)}
          >
            <div className="text-lg font-bold">{h.value}</div>
            <div className="text-[10px] mt-0.5 opacity-70">{h.label}</div>
          </div>
        ))}
      </div>

      {/* Detail rows */}
      <div className="space-y-0">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div className="flex items-center gap-1.5">
                <Icon className={cn("h-3.5 w-3.5", s.color)} />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {s.label}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {s.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function KpiBar({
  label,
  percentage,
  value,
  gradient,
}: {
  label: string;
  percentage: number;
  value: string;
  gradient: string;
}) {
  const pct = Math.min(100, Math.max(0, percentage));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className="text-xs font-bold text-slate-500">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            gradient,
            getProgressClass(pct),
          )}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const {
    metrics,
    userStats,
    testStats,
    attemptStats,
    errors,
    isLoading,
    refresh,
  } = useDashboard();

  const completionRate =
    attemptStats && attemptStats.total > 0
      ? Math.round((attemptStats.completed / attemptStats.total) * 100)
      : 0;

  const engagementRate =
    userStats && userStats.total > 0
      ? Math.round((userStats.activeThisMonth / userStats.total) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-px">
              Platform performance and engagement data
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={refresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {isLoading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* ── Key metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <MetricTileSkeleton key={i} />
          ))
        ) : (
          <>
            <MetricTile
              label="Total Users"
              value={fmt(metrics?.totalUsers)}
              growth={metrics?.userGrowth}
              icon={Users}
              colorClass="blue"
            />
            <MetricTile
              label="Active Tests"
              value={fmt(metrics?.activeTests)}
              growth={metrics?.testGrowth}
              icon={FileText}
              colorClass="emerald"
            />
            <MetricTile
              label="Completed Attempts"
              value={fmt(metrics?.completedAttempts)}
              growth={metrics?.attemptGrowth}
              icon={CheckCircle2}
              colorClass="violet"
            />
            <MetricTile
              label="Avg Performance"
              value={metrics ? `${metrics.avgPerformance}%` : "—"}
              growth={metrics?.performanceGrowth}
              growthLabel="improvement"
              icon={TrendingUp}
              colorClass="amber"
            />
          </>
        )}
      </div>

      {/* ── Detail cards ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Users */}
        <StatCard
          icon={Users}
          iconColor="bg-blue-500"
          title="User Statistics"
          description="Distribution and activity"
          loading={isLoading}
          error={errors.users}
          onRetry={refresh}
          highlights={[
            {
              value: fmt(userStats?.total),
              label: "Total",
              color:
                "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
            },
            {
              value: fmt(userStats?.newThisMonth),
              label: "New this month",
              color:
                "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
            },
          ]}
          stats={[
            {
              label: "Students",
              value: fmt(userStats?.students),
              icon: Users,
              color: "text-blue-500",
            },
            {
              label: "Instructors",
              value: fmt(userStats?.instructors),
              icon: Trophy,
              color: "text-violet-500",
            },
            {
              label: "Admins",
              value: fmt(userStats?.admins),
              icon: Target,
              color: "text-red-500",
            },
            {
              label: "Active this month",
              value: fmt(userStats?.activeThisMonth),
              icon: Activity,
              color: "text-emerald-500",
            },
          ]}
        />

        {/* Tests */}
        <StatCard
          icon={FileText}
          iconColor="bg-emerald-500"
          title="Test Statistics"
          description="Creation and publishing status"
          loading={isLoading}
          error={errors.tests}
          onRetry={refresh}
          highlights={[
            {
              value: fmt(testStats?.total),
              label: "Total",
              color:
                "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
            },
            {
              value: fmt(testStats?.active),
              label: "Active",
              color:
                "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
            },
          ]}
          stats={[
            {
              label: "Live now",
              value: fmt(testStats?.live),
              icon: Activity,
              color: "text-emerald-500",
            },
            {
              label: "Premium",
              value: fmt(testStats?.premium),
              icon: Trophy,
              color: "text-amber-500",
            },
            {
              label: "Created this month",
              value: fmt(testStats?.createdThisMonth),
              icon: Calendar,
              color: "text-blue-500",
            },
            {
              label: "Completed this month",
              value: fmt(testStats?.completedThisMonth),
              icon: CheckCircle2,
              color: "text-violet-500",
            },
          ]}
        />

        {/* Attempts */}
        <StatCard
          icon={Target}
          iconColor="bg-violet-500"
          title="Attempt Statistics"
          description="Engagement and scoring"
          loading={isLoading}
          error={errors.attempts}
          onRetry={refresh}
          highlights={[
            {
              value: fmt(attemptStats?.total),
              label: "Total",
              color:
                "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300",
            },
            {
              value: fmt(attemptStats?.completed),
              label: "Completed",
              color:
                "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
            },
          ]}
          stats={[
            {
              label: "In progress",
              value: fmt(attemptStats?.started),
              icon: Activity,
              color: "text-blue-500",
            },
            {
              label: "Expired",
              value: fmt(attemptStats?.expired),
              icon: Clock,
              color: "text-red-500",
            },
            {
              label: "Average score",
              value: fmt(attemptStats?.avgScore, "%"),
              icon: Trophy,
              color: "text-amber-500",
            },
            {
              label: "Avg duration",
              value: `${Math.round((attemptStats?.avgDuration ?? 0) / 60)} min`,
              icon: Clock,
              color: "text-violet-500",
            },
          ]}
        />
      </div>

      {/* ── KPI progress bars ── */}
      {!isLoading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Key Performance Indicators
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            <KpiBar
              label="Attempt Completion Rate"
              percentage={completionRate}
              value={`${completionRate}%`}
              gradient="bg-gradient-to-r from-emerald-400 to-teal-500"
            />
            <KpiBar
              label="Monthly User Engagement"
              percentage={engagementRate}
              value={`${engagementRate}%`}
              gradient="bg-gradient-to-r from-blue-400 to-indigo-500"
            />
            <KpiBar
              label="Average Score"
              percentage={attemptStats?.avgScore ?? 0}
              value={`${attemptStats?.avgScore ?? 0}%`}
              gradient="bg-gradient-to-r from-violet-400 to-purple-500"
            />
            <KpiBar
              label="Overall Performance"
              percentage={metrics?.avgPerformance ?? 0}
              value={`${metrics?.avgPerformance ?? 0}%`}
              gradient="bg-gradient-to-r from-amber-400 to-orange-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
