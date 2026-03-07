"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  FileText,
  FolderTree,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/features/admin-analytics/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import "@/styles/progress.css";
import {
  GrowthIndicator,
  FormatNumber,
} from "@/components/shared/growth-indicator";

// Helper function to get progress class
function getProgressClass(pct: number): string {
  const rounded = Math.round(pct / 5) * 5; // Round to nearest 5
  return `progress-${Math.min(100, Math.max(0, rounded))}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function GrowthBadge({
  value,
  suffix = "from last month",
}: {
  value?: number;
  suffix?: string;
}) {
  if (value == null || value === 0) {
    return <span className="text-[11px] text-slate-400">No change</span>;
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-[11px] font-semibold",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
      )}
    >
      {up ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {value}% {suffix}
    </span>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  growth,
  growthSuffix,
  icon: Icon,
  iconBg,
  iconColor,
  valueBg,
}: {
  label: string;
  value: string;
  growth?: number;
  growthSuffix?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueBg: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3",
        valueBg,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {label}
        </span>
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            iconBg,
          )}
        >
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </div>
      <GrowthBadge value={growth} suffix={growthSuffix} />
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

// ─── Quick Action ──────────────────────────────────────────────────────────────

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  accent,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all"
    >
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          accent,
        )}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {label}
        </p>
        <p className="text-xs text-slate-400 truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
    </Link>
  );
}

// ─── Mini Stat Row ─────────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5", color)} />
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {label}
        </span>
      </div>
      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
        {fmt(Number(value))}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { metrics, userStats, testStats, attemptStats, isLoading, refresh } =
    useDashboard();

  const completionRate =
    attemptStats && attemptStats.total > 0
      ? Math.round((attemptStats.completed / attemptStats.total) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Admin Overview
            </h1>
            <p className="text-xs text-slate-400 mt-px">
              Platform health at a glance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems online
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
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
      </div>

      {/* ── Key metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))
        ) : (
          <>
            <MetricCard
              label="Total Users"
              value={fmt(metrics?.totalUsers)}
              growth={metrics?.userGrowth}
              icon={Users}
              iconBg="bg-blue-100 dark:bg-blue-950/40"
              iconColor="text-blue-600 dark:text-blue-400"
              valueBg="bg-white dark:bg-slate-900"
            />
            <MetricCard
              label="Active Tests"
              value={fmt(metrics?.activeTests)}
              growth={metrics?.testGrowth}
              icon={FileText}
              iconBg="bg-emerald-100 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
              valueBg="bg-white dark:bg-slate-900"
            />
            <MetricCard
              label="Completed Attempts"
              value={fmt(metrics?.completedAttempts)}
              growth={metrics?.attemptGrowth}
              icon={CheckCircle2}
              iconBg="bg-violet-100 dark:bg-violet-950/40"
              iconColor="text-violet-600 dark:text-violet-400"
              valueBg="bg-white dark:bg-slate-900"
            />
            <MetricCard
              label="Avg Performance"
              value={metrics ? `${metrics.avgPerformance}%` : "—"}
              growth={metrics?.performanceGrowth}
              growthSuffix="improvement"
              icon={TrendingUp}
              iconBg="bg-amber-100 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
              valueBg="bg-white dark:bg-slate-900"
            />
          </>
        )}
      </div>

      {/* ── Three-column detail + actions layout ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Users breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Users
            </span>
            {!isLoading && (
              <span className="ml-auto text-xs font-bold text-slate-500">
                {fmt(userStats?.total)}
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800"
                >
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <MiniStat
                label="Students"
                value={userStats?.students ?? 0}
                icon={BookOpen}
                color="text-blue-500"
              />
              <MiniStat
                label="Instructors"
                value={userStats?.instructors ?? 0}
                icon={Award}
                color="text-violet-500"
              />
              <MiniStat
                label="Admins"
                value={userStats?.admins ?? 0}
                icon={Shield}
                color="text-red-500"
              />
              <MiniStat
                label="New this month"
                value={userStats?.newThisMonth ?? 0}
                icon={Plus}
                color="text-emerald-500"
              />
              <MiniStat
                label="Active this month"
                value={userStats?.activeThisMonth ?? 0}
                icon={Activity}
                color="text-amber-500"
              />
            </>
          )}
        </div>

        {/* Tests breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Tests
            </span>
            {!isLoading && (
              <span className="ml-auto text-xs font-bold text-slate-500">
                {fmt(testStats?.total)}
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800"
                >
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <MiniStat
                label="Active"
                value={testStats?.active ?? 0}
                icon={Zap}
                color="text-emerald-500"
              />
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Live
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {fmt(testStats?.live ?? 0)}
                </span>
              </div>
              <MiniStat
                label="Premium"
                value={testStats?.premium ?? 0}
                icon={Target}
                color="text-amber-500"
              />
              <MiniStat
                label="Created this month"
                value={testStats?.createdThisMonth ?? 0}
                icon={Plus}
                color="text-blue-500"
              />
              <MiniStat
                label="Completed this month"
                value={testStats?.completedThisMonth ?? 0}
                icon={CheckCircle2}
                color="text-violet-500"
              />
            </>
          )}
        </div>

        {/* Attempts breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Attempts
            </span>
            {!isLoading && (
              <span className="ml-auto text-xs font-bold text-slate-500">
                {fmt(attemptStats?.total)}
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800"
                >
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <MiniStat
                label="Completed"
                value={attemptStats?.completed ?? 0}
                icon={CheckCircle2}
                color="text-emerald-500"
              />
              <MiniStat
                label="In Progress"
                value={attemptStats?.started ?? 0}
                icon={Activity}
                color="text-blue-500"
              />
              <MiniStat
                label="Expired"
                value={attemptStats?.expired ?? 0}
                icon={Clock}
                color="text-red-500"
              />
              <MiniStat
                label="Avg Score"
                value={`${attemptStats?.avgScore ?? 0}%`}
                icon={TrendingUp}
                color="text-amber-500"
              />
              <MiniStat
                label="Avg Duration"
                value={`${Math.round((attemptStats?.avgDuration ?? 0) / 60)} min`}
                icon={Clock}
                color="text-violet-500"
              />
            </>
          )}
        </div>
      </div>

      {/* ── Completion rate bar ── */}
      {!isLoading && attemptStats && attemptStats.total > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Attempt Completion Rate
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {completionRate}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-700",
                getProgressClass(completionRate),
              )}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-slate-400">
              {fmt(attemptStats.completed)} completed
            </span>
            <span className="text-[10px] text-slate-400">
              {fmt(attemptStats.total)} total
            </span>
          </div>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <QuickAction
            href="/dashboard/admin/tests/create"
            icon={Plus}
            label="Create Test"
            description="Build a new exam paper"
            accent="bg-indigo-500"
          />
          <QuickAction
            href="/dashboard/admin/tests-hierarchy"
            icon={FolderTree}
            label="Manage Hierarchy"
            description="Organize categories & subjects"
            accent="bg-violet-500"
          />
          <QuickAction
            href="/dashboard/admin/questions"
            icon={Database}
            label="Question Vault"
            description="Browse global question bank"
            accent="bg-blue-500"
          />
          <QuickAction
            href="/dashboard/admin/users"
            icon={Users}
            label="Manage Users"
            description="View & control all accounts"
            accent="bg-emerald-500"
          />
          <QuickAction
            href="/dashboard/admin/analytics"
            icon={BarChart3}
            label="Full Analytics"
            description="Deep performance insights"
            accent="bg-amber-500"
          />
          <QuickAction
            href="/dashboard/admin/audit-logs"
            icon={Shield}
            label="Audit Logs"
            description="Security & activity trail"
            accent="bg-slate-600"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Missing icon import ───────────────────────────────────────────────────────

function Award({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
