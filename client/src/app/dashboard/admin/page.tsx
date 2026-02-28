"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  FileText,
  CheckCircle2,
  TrendingUp,
  Shield,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Zap,
  Clock,
  Award,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 p-12 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-16 w-16 rounded-full bg-white/20" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-56 bg-white/20" />
              <Skeleton className="h-4 w-80 bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-3" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const {
    metrics,
    userStats,
    testStats,
    attemptStats,
    isLoading,
    error,
    refresh,
  } = useAdminDashboard();

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-red-600 to-red-700 p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              Error Loading Dashboard
            </h1>
            <p className="text-red-100 mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 🎯 Enhanced Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 via-blue-700 to-purple-700 p-12 text-white shadow-2xl border border-blue-500/20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Admin Control Center
                </h1>
                <p className="text-blue-100 mt-2 text-lg">
                  Complete platform overview and management
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Activity className="w-3 h-3 mr-1" />
                System Active
              </Badge>
              <Badge className="bg-green-400/30 text-green-100 border-green-400/50 backdrop-blur-sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                All Systems Online
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <p className="text-sm text-blue-100">Platform Health</p>
              <p className="text-xl font-bold">99.9%</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <p className="text-sm text-blue-100">Response Time</p>
              <p className="text-xl font-bold">45ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Key Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Total Users
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {metrics?.totalUsers.toLocaleString() || 0}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2">
              {metrics?.userGrowth && metrics.userGrowth > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  metrics?.userGrowth && metrics.userGrowth > 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {metrics?.userGrowth
                  ? `${metrics.userGrowth > 0 ? "+" : ""}${metrics.userGrowth}%`
                  : "0%"}
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        {/* Active Tests */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
              Active Tests
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {metrics?.activeTests || 0}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
              {metrics?.testGrowth && metrics.testGrowth > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  metrics?.testGrowth && metrics.testGrowth > 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {metrics?.testGrowth
                  ? `${metrics.testGrowth > 0 ? "+" : ""}${metrics.testGrowth}%`
                  : "0%"}
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        {/* Completed Attempts */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Completed Attempts
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {metrics?.completedAttempts.toLocaleString() || 0}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-2">
              {metrics?.attemptGrowth && metrics.attemptGrowth > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  metrics?.attemptGrowth && metrics.attemptGrowth > 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {metrics?.attemptGrowth
                  ? `${metrics.attemptGrowth > 0 ? "+" : ""}${metrics.attemptGrowth}%`
                  : "0%"}
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        {/* Avg. Performance */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">
              Avg. Performance
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
              {metrics?.avgPerformance || 0}%
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-2">
              {metrics?.performanceGrowth && metrics.performanceGrowth > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  metrics?.performanceGrowth && metrics.performanceGrowth > 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {metrics?.performanceGrowth
                  ? `${metrics.performanceGrowth > 0 ? "+" : ""}${metrics.performanceGrowth}%`
                  : "0%"}
              </span>{" "}
              improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🚀 Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/dashboard/admin/tests/create">
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-blue-700 dark:text-blue-300">
                Create Test
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-400">
                Design new assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                Start Creating
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/users">
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-purple-700 dark:text-purple-300">
                Manage Users
              </CardTitle>
              <CardDescription className="text-purple-600 dark:text-purple-400">
                Control accounts & roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
                View Users
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/analytics">
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-green-700 dark:text-green-300">
                Analytics
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-400">
                Deep insights & metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 📊 Detailed Stats */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-100 dark:bg-zinc-900">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="attempts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Attempts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Total
                    </p>
                    <p className="text-2xl font-bold">
                      {userStats?.total || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Students
                    </p>
                    <p className="text-2xl font-bold">
                      {userStats?.students || 0}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Instructors
                    </p>
                    <p className="text-2xl font-bold">
                      {userStats?.instructors || 0}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Active This Month
                    </p>
                    <p className="text-2xl font-bold">
                      {userStats?.activeThisMonth || 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Total
                    </p>
                    <p className="text-2xl font-bold">
                      {testStats?.total || 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Active
                    </p>
                    <p className="text-2xl font-bold">
                      {testStats?.active || 0}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Live
                    </p>
                    <p className="text-2xl font-bold">{testStats?.live || 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Completed This Month
                    </p>
                    <p className="text-2xl font-bold">
                      {testStats?.completedThisMonth || 0}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attempts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Total
                    </p>
                    <p className="text-2xl font-bold">
                      {attemptStats?.total || 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Completed
                    </p>
                    <p className="text-2xl font-bold">
                      {attemptStats?.completed || 0}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Avg Score
                    </p>
                    <p className="text-2xl font-bold">
                      {attemptStats?.avgScore || 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Avg Duration
                    </p>
                    <p className="text-2xl font-bold">
                      {Math.round((attemptStats?.avgDuration || 0) / 60)} min
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
