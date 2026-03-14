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
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
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
  SparkleIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

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
  trend,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  color: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="text-center hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              color,
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {value}
            </p>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
          </div>
          {/* W-5 FIX: Removed hardcoded trend percentages */}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Topic Analysis */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
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

  // BUG-6 FIX: Fetch user profile for actual createdAt
  const profileQuery = useQuery({
    queryKey: studentKeys.profile(),
    queryFn: async () => {
      const res = await api.get("/users/me");
      return unwrap<UserProfile>(res);
    },
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
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircleIcon className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">Unable to load profile</CardTitle>
            <CardDescription>
              We couldn't fetch your profile data. Please try again.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              attemptsQuery.refetch();
              topicsQuery.refetch();
            }}
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" /> Retry
          </Button>
        </Card>
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* ── Profile Card ──────────────────────────────────────────────────── */}
      <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-20 w-20 text-xl">
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                <CheckIcon className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      {user?.name}
                    </h2>
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheckIcon className="h-3 w-3" />
                      {user?.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MailIcon className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    Member since{" "}
                    {profileQuery.data?.createdAt
                      ? format(new Date(profileQuery.data.createdAt), "MMMM yyyy")
                      : "..."}
                  </div>
                </div>
                {!isEditingName && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                    className="gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Edit name form */}
              {isEditingName && user && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <EditNameForm
                      currentName={user.name}
                      onClose={() => setIsEditingName(false)}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Performance Stats ────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">
            Performance Overview
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ProfileStat
            icon={BookOpenIcon}
            label="Total Tests"
            value={String(totalAttempts)}
            color="bg-blue-500"
            trend={totalAttempts > 0 ? "up" : "neutral"}
          />
          <ProfileStat
            icon={TargetIcon}
            label="Avg Accuracy"
            value={avgAccuracy !== null ? `${avgAccuracy}%` : "—"}
            color="bg-green-500"
            trend={
              avgAccuracy && avgAccuracy > 70
                ? "up"
                : avgAccuracy && avgAccuracy < 50
                  ? "down"
                  : "neutral"
            }
          />
          <ProfileStat
            icon={TrophyIcon}
            label="Avg Score"
            value={avgScore !== null ? String(avgScore) : "—"}
            color="bg-amber-500"
            trend={
              avgScore && avgScore > 70
                ? "up"
                : avgScore && avgScore < 50
                  ? "down"
                  : "neutral"
            }
          />
          <ProfileStat
            icon={CrownIcon}
            label="Tests Passed"
            value={String(submitted.length)}
            color="bg-purple-500"
            trend={submitted.length > 0 ? "up" : "neutral"}
          />
        </div>
      </div>

      {/* ── Topic Performance Heatmap ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TargetIcon className="h-5 w-5" />
            Topic Performance Heatmap
          </CardTitle>
          <CardDescription>
            Visual representation of your performance across different topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicAnalysis topics={topics} mode="heatmap" title="" showEmpty />
        </CardContent>
      </Card>

      {/* ── Subscription Status ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CrownIcon className="h-5 w-5 text-amber-500" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(() => {
            const planObj = subscription?.data?.plan;
            const planName = (typeof planObj === "object" && planObj !== null ? (planObj as any).name : planObj) || "Free";
            const status = subscription?.data?.status || "Active";
            const expiresAt = subscription?.data?.currentPeriodEnd;
            const isPremium = planName !== "Free" && planName !== "FREE";
            
            return (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {planName} Plan
                      </h3>
                      <Badge
                        variant={status === "ACTIVE" ? "default" : "secondary"}
                      >
                        {status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {!isPremium
                        ? "Access to free mock tests only"
                        : expiresAt
                          ? (() => {
                              const daysLeft = differenceInDays(new Date(expiresAt), new Date());
                              return daysLeft > 0
                                ? `${daysLeft} days remaining · Expires ${format(new Date(expiresAt), "MMM d, yyyy")}`
                                : "Subscription expired";
                            })()
                          : `Access to ${planName} features`}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-950/20 flex items-center justify-center">
                    <CrownIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {!isPremium ? "Upgrade to Premium" : "Manage Subscription"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {!isPremium
                        ? "Unlock premium tests and detailed analytics"
                        : "View your subscription details and benefits"}
                    </p>
                  </div>
                  <Link href="/upgrade">
                    <Button className="gap-2">
                      {!isPremium ? (
                        <>
                          <CrownIcon className="h-4 w-4" />
                          Upgrade
                        </>
                      ) : (
                        <>
                          <ShieldCheckIcon className="h-4 w-4" />
                          Manage
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </>
            );
          })()}
        </CardContent>

      </Card>
    </div>
  );
}
