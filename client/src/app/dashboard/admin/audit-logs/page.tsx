"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminAuditLogsApi, type AuditLog } from "@/lib/admin-api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  Fingerprint,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Must stay in sync with backend AuditAction enum ─────────────────────────
// server/src/modules/admin/audit-logs/dto/audit-log-query.dto.ts
const AUDIT_ACTIONS = [
  "QUESTION_CREATED",
  "QUESTION_UPDATED",
  "QUESTION_SOFT_DELETED",
  "QUESTION_BULK_TAGGED",
  "TEST_PUBLISHED",
  "TEST_UNPUBLISHED",
  "TEST_CREATED",
  "TEST_DELETED",
  "SECTION_CREATED",
  "SECTION_DELETED",
  "SECTION_QUESTIONS_LINKED",
  "SECTION_QUESTION_UNLINKED",
  "USER_ROLE_CHANGED",
  "USER_BANNED",
  "BULK_UPLOAD",
  "AUDIT_LOGS_PRUNED",
] as const;

type AuditActionType = (typeof AUDIT_ACTIONS)[number] | string;

// ─── Action badge config ──────────────────────────────────────────────────────
function getActionStyle(action: string): string {
  if (action.endsWith("_DELETED") || action.endsWith("_BANNED"))
    return "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
  if (
    action.endsWith("_CREATED") ||
    action.endsWith("_LINKED") ||
    action === "BULK_UPLOAD"
  )
    return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  if (action.endsWith("_PUBLISHED") || action.endsWith("_TAGGED"))
    return "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
  if (action.endsWith("_UPDATED") || action.endsWith("_CHANGED"))
    return "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
  if (action.endsWith("_UNPUBLISHED") || action.endsWith("_UNLINKED"))
    return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
}

// Format action string for display: QUESTION_SOFT_DELETED → Question Soft Deleted
function formatAction(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-slate-400 mt-px truncate">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Loading skeleton rows ────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-5 w-28 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 font-mono" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const { toast } = useToast();

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  // Dialogs
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await adminAuditLogsApi.getAll(
          page,
          PAGE_SIZE,
          search.trim() || undefined,
          actionFilter === "all" ? undefined : actionFilter,
        );
        // Handle both { data, total } and { data: { data, meta } } shapes
        const payload = res.data as any;
        const rows: AuditLog[] = payload.data?.data ?? payload.data ?? [];
        const count: number =
          payload.data?.meta?.total ?? payload.total ?? rows.length;

        setLogs(rows);
        setTotal(count);
      } catch (err: any) {
        toast({
          title: "Failed to load audit logs",
          description: err?.response?.data?.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, actionFilter, toast],
  );

  // Re-fetch when page or action filter changes immediately
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter]);

  // Re-fetch with debounce when search changes, reset to page 1
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const handleCleanup = async () => {
    setCleaning(true);
    try {
      await adminAuditLogsApi.cleanup(90);
      toast({
        title: "Cleanup complete",
        description: "Logs older than 90 days removed",
      });
      setCleanupOpen(false);
      setPage(1);
      fetchLogs({ silent: true });
    } catch (err: any) {
      toast({
        title: "Cleanup failed",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setCleaning(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = search || actionFilter !== "all";
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Audit Logs
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-10">
            Immutable record of every admin action across the platform
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-slate-500"
            onClick={() => fetchLogs({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-red-500 hover:text-red-700 border-red-200 dark:border-red-800 hover:border-red-300"
            onClick={() => setCleanupOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clean old logs
          </Button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Total Events"
          value={total.toLocaleString()}
        />
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="This Page"
          value={`${from}–${to}`}
          sub={`of ${total.toLocaleString()}`}
        />
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Page"
          value={`${page} / ${totalPages}`}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Showing"
          value={`${PAGE_SIZE} / page`}
        />
      </div>

      {/* ── Filters bar ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, target type, actor ID…"
              className="pl-8 h-8 text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Select
              value={actionFilter}
              onValueChange={(v) => {
                setActionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-52 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {AUDIT_ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {formatAction(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setActionFilter("all");
                  setPage(1);
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-52">
                Action
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-32">
                Target Type
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-36">
                Target ID
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-36">
                Actor ID
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-24">
                Role
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Timestamp
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-16 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="h-10 w-10 text-slate-200 dark:text-slate-700" />
                    <p className="text-sm font-medium">No audit logs found</p>
                    {hasActiveFilters && (
                      <p className="text-xs">Try clearing the filters</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Action */}
                  <TableCell className="py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                        getActionStyle(log.action),
                      )}
                    >
                      {formatAction(log.action)}
                    </span>
                  </TableCell>

                  {/* Target Type */}
                  <TableCell className="py-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {log.targetType ?? (
                        <span className="text-slate-300 dark:text-slate-600">
                          —
                        </span>
                      )}
                    </span>
                  </TableCell>

                  {/* Target ID */}
                  <TableCell className="py-3">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-500">
                      {log.targetId ? (
                        <span title={log.targetId}>
                          {log.targetId.slice(0, 10)}…
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">
                          —
                        </span>
                      )}
                    </span>
                  </TableCell>

                  {/* Actor ID */}
                  <TableCell className="py-3">
                    {log.actorId ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-500">
                        <User className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
                        <span title={log.actorId}>
                          {log.actorId.slice(0, 8)}…
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-600">
                        —
                      </span>
                    )}
                  </TableCell>

                  {/* Role */}
                  <TableCell className="py-3">
                    {log.actorRole ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <Fingerprint className="h-2.5 w-2.5" />
                        {log.actorRole}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-600">
                        —
                      </span>
                    )}
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3 w-3 shrink-0" />
                      <time dateTime={log.createdAt}>
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* ── Pagination footer ── */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {from}–{to}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {total.toLocaleString()}
              </span>{" "}
              events
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              {/* Page number pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Sliding window of 5 pages centered on current
                  let p = page - 2 + i;
                  if (p < 1) p = i + 1;
                  if (p > totalPages) p = totalPages - (4 - i);
                  p = Math.max(1, Math.min(p, totalPages));
                  return (
                    <button
                      key={`page-${p}-${i}`}
                      onClick={() => setPage(p)}
                      className={cn(
                        "h-7 min-w-[28px] px-1.5 rounded text-xs font-medium transition-colors",
                        p === page
                          ? "bg-indigo-600 text-white"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Cleanup confirmation ── */}
      <AlertDialog open={cleanupOpen} onOpenChange={setCleanupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              Delete old audit logs?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all audit logs older than{" "}
              <strong>90 days</strong>. This action cannot be undone. Recent
              logs are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleaning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCleanup}
              disabled={cleaning}
            >
              {cleaning ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Cleaning…
                </span>
              ) : (
                "Delete old logs"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
