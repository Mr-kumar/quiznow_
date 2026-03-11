"use client";

/**
 * app/(student)/profile/page.tsx
 *
 * Student Profile — overview of account, performance, and subscription.
 *
 * Sections:
 *  1. Profile card — avatar, name, email, join date + edit name (RHF)
 *  2. Performance stats — total attempts, avg score, avg accuracy, best rank
 *  3. Topic heatmap — TopicAnalysis in heatmap mode (all topics by subject)
 *  4. Subscription status — plan, expiry, covered exams
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  UserIcon,
  MailIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  TargetIcon,
  TrophyIcon,
  BookOpenIcon,
  CrownIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  Loader2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TopicAnalysis } from "@/features/results/components/TopicAnalysis";
import { attemptsApi } from "@/api/attempts";
import { leaderboardApi } from "@/api/leaderboard";
import { attemptKeys, studentKeys } from "@/api/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { unwrap } from "@/lib/unwrap";
import api from "@/lib/api";
import { studentUsersApi } from "@/api/student-users";
import { cn } from "@/lib/utils";
import type { AttemptSummary } from "@/api/attempts";
import type { UserTopicStat } from "@/api/leaderboard";

// ── Edit name form ────────────────────────────────────────────────────────────

interface EditNameFormValues {
  name: string;
}

function EditNameForm({
  currentName,
  onClose,
}: {
  currentName: string;
  onClose: () => void;
}) {
  const { login, user, token } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditNameFormValues>({ defaultValues: { name: currentName } });

  const mutation = useMutation({
    mutationFn: async (values: EditNameFormValues) => {
      const res = await api.patch("/users/me", { name: values.name });
      return unwrap<{ name: string }>(res);
    },
    onSuccess: (data) => {
      // Update auth-store so navbar reflects change instantly
      if (user && token) {
        login({ ...user, name: data.name }, token);
      }
      queryClient.invalidateQueries({ queryKey: studentKeys.profile() });
      toast.success("Name updated successfully");
      onClose();
    },
    onError: () => {
      toast.error("Failed to update name. Please try again.");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="flex items-end gap-2 mt-3"
    >
      <div className="flex-1 space-y-1">
        <Label htmlFor="name" className="text-xs">
          Display Name
        </Label>
        <Input
          id="name"
          {...register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: { value: 50, message: "Maximum 50 characters" },
          })}
          className="h-8 text-sm"
          autoFocus
        />
        {errors.name && (
          <p className="text-[11px] text-red-500">{errors.name.message}</p>
        )}
      </div>
      <Button
        type="submit"
        size="sm"
        className="h-8 gap-1 bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isSubmitting || mutation.isPending}
      >
        {isSubmitting || mutation.isPending ? (
          <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckIcon className="h-3.5 w-3.5" />
        )}
        Save
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={onClose}
      >
        <XIcon className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function ProfileStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center",
          color,
        )}
      >
        <Icon
          className="h-4.5 w-4.5"
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
      </div>
      <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
        {value}
      </span>
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [isEditingName, setIsEditingName] = useState(false);

  // All attempts for stats
  const attemptsQuery = useQuery({
    queryKey: attemptKeys.history({ page: 1, limit: 100 }),
    queryFn: () => attemptsApi.getMyHistory(1, 100).then((res) => res.data),
    staleTime: 1000 * 60 * 5,
  });

  // Topic stats for heatmap
  const topicsQuery = useQuery({
    queryKey: studentKeys.topicStats(),
    queryFn: () =>
      leaderboardApi.getMyTopicStats().then(unwrap<UserTopicStat[]>),
    staleTime: 1000 * 60 * 10,
  });

  // Subscription data
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await studentUsersApi.getMySubscription();
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (attemptsQuery.isLoading || topicsQuery.isLoading)
    return <ProfileSkeleton />;

  if (attemptsQuery.isError || topicsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <AlertCircleIcon className="h-7 w-7 text-red-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Failed to load profile.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            attemptsQuery.refetch();
            topicsQuery.refetch();
          }}
          className="gap-1.5"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  const attempts = attemptsQuery.data?.data ?? [];
  const topics = topicsQuery.data ?? [];
  const submitted = attempts.filter((a) => a.status === "SUBMITTED");

  // Compute stats
  const totalAttempts = attemptsQuery.data?.total ?? 0;
  const avgAccuracy =
    submitted.length > 0
      ? Math.round(
          submitted.reduce((s, a) => s + (a.accuracy ?? 0), 0) /
            submitted.length,
        )
      : null;
  const avgScore =
    submitted.length > 0
      ? Math.round(
          submitted.reduce((s, a) => s + a.score, 0) / submitted.length,
        )
      : null;

  const initials = user
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar size="lg" className="h-16 w-16 text-xl shrink-0">
            <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name}
              </h2>
              {!isEditingName && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => setIsEditingName(true)}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              <MailIcon className="h-3.5 w-3.5 shrink-0" />
              {user?.email}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              <CalendarIcon className="h-3 w-3 shrink-0" />
              Member since {format(new Date(), "MMMM yyyy")}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[11px] gap-1">
                <ShieldCheckIcon className="h-3 w-3" />
                {user?.role}
              </Badge>
            </div>

            {/* Edit name inline form */}
            {isEditingName && user && (
              <EditNameForm
                currentName={user.name}
                onClose={() => setIsEditingName(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Stats grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ProfileStat
          icon={BookOpenIcon}
          label="Total Tests"
          value={String(totalAttempts)}
          color="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <ProfileStat
          icon={TargetIcon}
          label="Avg Accuracy"
          value={avgAccuracy !== null ? `${avgAccuracy}%` : "—"}
          color="bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400"
        />
        <ProfileStat
          icon={TrophyIcon}
          label="Avg Score"
          value={avgScore !== null ? String(avgScore) : "—"}
          color="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
        <ProfileStat
          icon={CrownIcon}
          label="Tests Passed"
          value={String(submitted.length)}
          color="bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
        />
      </div>

      {/* ── Topic heatmap ──────────────────────────────────────────────────── */}
      <TopicAnalysis
        topics={topics}
        mode="heatmap"
        title="Topic Performance Heatmap"
        showEmpty
      />

      {/* ── Subscription status ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <CrownIcon className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Subscription
          </h3>
        </div>
        {/* TODO: replace with real subscription data from /users/me/subscription */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {subscription?.data?.plan || "Free"} Plan
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {subscription?.data?.plan === "FREE"
                  ? "Access to free mock tests only"
                  : `Access to ${subscription?.data?.plan} features`}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-300 dark:border-amber-700 shrink-0"
            >
              {subscription?.data?.plan || "Free"}
            </Badge>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unlock premium tests and detailed analytics
            </p>
            <Button
              size="sm"
              className="shrink-0 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1.5 h-8"
            >
              <CrownIcon className="h-3.5 w-3.5" />
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
