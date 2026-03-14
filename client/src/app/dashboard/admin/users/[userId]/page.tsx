"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useDeepProfile } from "@/features/admin-users/hooks/use-users";
import { useUpdateUserStatus } from "@/features/admin-users/hooks/use-user-mutations";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Ban,
  Target,
  Activity,
  Clock,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DataTable } from "@/components/admin/admin-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { UserStatus } from "@/api/users";

export default function DeepUserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;

  const { data: profileData, isLoading } = useDeepProfile(userId);
  const updateStatusMutation = useUpdateUserStatus();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Fallback if data is missing or errored
  if (!profileData || !profileData.user) {
    return (
      <div className="text-center py-24 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">User Not Found</h2>
        <p className="text-muted-foreground">
          The user you are looking for does not exist or has been deleted.
        </p>
        <Button onClick={() => router.push("/dashboard/admin/users")}>
          Return to Users
        </Button>
      </div>
    );
  }

  const { user, stats, recentAttempts } = profileData;

  const roleColors = {
    ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    INSTRUCTOR:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    STUDENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };
  const roleIcon =
    user.role === "ADMIN"
      ? Shield
      : user.role === "INSTRUCTOR"
        ? UserIcon
        : UserIcon;

  const statusConfig = {
    ACTIVE: {
      color:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      icon: CheckCircle,
    },
    SUSPENDED: {
      color:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      icon: AlertCircle,
    },
    BANNED: {
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: Ban,
    },
  };
  const config = statusConfig[user.status as UserStatus] || statusConfig.ACTIVE;
  const StatusIcon = config.icon;

  const attemptColumns: ColumnDef<any>[] = [
    {
      accessorKey: "test",
      header: "Test Name",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.test?.title || "Unknown Test"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "SUBMITTED" ? "default" : "secondary"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: ({ row }) => (
        <span className="font-bold">{row.original.score}</span>
      ),
    },
    {
      accessorKey: "accuracy",
      header: "Accuracy",
      cell: ({ row }) => (
        <span>{row.original.accuracy ? `${row.original.accuracy}%` : "-"}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date Attempted",
      cell: ({ row }) => (
        <span>{format(new Date(row.original.createdAt), "MMM d, yyyy")}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/admin/users")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <Card className="col-span-1 shadow-xs border-zinc-200 dark:border-zinc-800">
          <CardHeader className="text-center pb-2">
            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-background shadow-xs">
              <AvatarImage src={user.image} />
              <AvatarFallback className="text-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-white">
                {user.name?.charAt(0).toUpperCase() ||
                  user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">
              {user.name || "Unnamed User"}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-1.5 mt-1">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 mt-4">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-medium text-muted-foreground">
                  System Role
                </span>
                <Badge
                  className={roleColors[user.role as keyof typeof roleColors]}
                >
                  {user.role}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-medium text-muted-foreground">
                  Account Status
                </span>
                <Badge className={config.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {user.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-medium text-muted-foreground">
                  Joined Date
                </span>
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Access Controls
              </h4>

              {user.status !== "ACTIVE" && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: user.id,
                      status: "ACTIVE",
                    })
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Restore Access
                </Button>
              )}

              {user.status !== "SUSPENDED" && (
                <Button
                  variant="outline"
                  className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: user.id,
                      status: "SUSPENDED",
                    })
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  <AlertCircle className="h-4 w-4 mr-2" /> Suspend Account
                </Button>
              )}

              {user.status !== "BANNED" && (
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: user.id,
                      status: "BANNED",
                    })
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  <Ban className="h-4 w-4 mr-2" /> Ban Permanently
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Stats & Data */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-xs bg-linear-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-950 border-indigo-100 dark:border-indigo-900/30">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Tests Taken
                  </span>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.totalAttempts}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs bg-linear-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-zinc-950 border-emerald-100 dark:border-emerald-900/30">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Avg Score
                  </span>
                  <Target className="h-4 w-4" />
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {Math.round(stats.avgScore)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs bg-linear-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-950 border-amber-100 dark:border-amber-900/30">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Avg Accuracy
                  </span>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {Math.round(stats.avgAccuracy)}%
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs bg-linear-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-zinc-950 border-violet-100 dark:border-violet-900/30">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-violet-600 dark:text-violet-400">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Avg Time
                  </span>
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {Math.round(stats.avgTimeTaken / 60)}{" "}
                  <span className="text-base font-medium text-muted-foreground">
                    min
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-xs border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Recent Test History
              </CardTitle>
              <CardDescription>
                The final submissions and grades from the last 10 attempts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={attemptColumns}
                data={recentAttempts}
                searchKey="tests"
                title="Recent Attempts"
                description=""
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
