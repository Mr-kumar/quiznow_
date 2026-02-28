"use client";

import { useState, useEffect } from "react";
import {
  adminAnalyticsApi,
  type DashboardMetrics,
  type UserStats,
  type TestStats,
  type AttemptStats,
} from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/admin/progress-bar";
import {
  Users,
  FileText,
  CheckCircle2,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  Trophy,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [dashboardMetrics, setDashboardMetrics] =
    useState<DashboardMetrics | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [testStats, setTestStats] = useState<TestStats | null>(null);
  const [attemptStats, setAttemptStats] = useState<AttemptStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Mock data for now - replace with actual API calls when backend is ready
      const mockDashboardMetrics: DashboardMetrics = {
        totalUsers: 1234,
        activeTests: 12,
        completedAttempts: 573,
        avgPerformance: 68,
        userGrowth: 20,
        testGrowth: 15,
        attemptGrowth: 25,
        performanceGrowth: 4,
      };

      const mockUserStats: UserStats = {
        total: 1234,
        students: 1100,
        instructors: 120,
        admins: 14,
        newThisMonth: 45,
        activeThisMonth: 890,
      };

      const mockTestStats: TestStats = {
        total: 25,
        active: 12,
        live: 8,
        premium: 5,
        createdThisMonth: 3,
        completedThisMonth: 156,
      };

      const mockAttemptStats: AttemptStats = {
        total: 892,
        completed: 573,
        started: 300,
        expired: 19,
        avgScore: 68,
        avgDuration: 2700, // 45 minutes in seconds
      };

      // Try actual API calls first, fallback to mock data
      try {
        const [
          metricsResponse,
          usersResponse,
          testsResponse,
          attemptsResponse,
        ] = await Promise.all([
          adminAnalyticsApi.getDashboardMetrics(),
          adminAnalyticsApi.getUserStats(),
          adminAnalyticsApi.getTestStats(),
          adminAnalyticsApi.getAttemptStats(),
        ]);

        setDashboardMetrics(metricsResponse.data.data);
        setUserStats(usersResponse.data.data);
        setTestStats(testsResponse.data.data);
        setAttemptStats(attemptsResponse.data.data);
      } catch (apiError) {
        console.log("API endpoints not ready, using mock data:", apiError);
        // Use mock data when API endpoints don't exist yet
        setDashboardMetrics(mockDashboardMetrics);
        setUserStats(mockUserStats);
        setTestStats(mockTestStats);
        setAttemptStats(mockAttemptStats);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Growth indicator component
  const GrowthIndicator = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;

    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        ) : isNeutral ? (
          <div className="h-4 w-4" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        )}
        <span
          className={`text-sm font-medium ${
            isPositive
              ? "text-green-600"
              : isNeutral
                ? "text-zinc-600"
                : "text-red-600"
          }`}
        >
          {Math.abs(value)}% {label}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500"></div>
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Comprehensive insights into platform performance and user activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardMetrics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Users
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {dashboardMetrics.totalUsers.toLocaleString()}
              </div>
              <GrowthIndicator
                value={dashboardMetrics.userGrowth}
                label="from last month"
              />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Active Tests
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {dashboardMetrics.activeTests}
              </div>
              <GrowthIndicator
                value={dashboardMetrics.testGrowth}
                label="from last month"
              />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Completed Attempts
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {dashboardMetrics.completedAttempts.toLocaleString()}
              </div>
              <GrowthIndicator
                value={dashboardMetrics.attemptGrowth}
                label="from last month"
              />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Avg Performance
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {dashboardMetrics.avgPerformance}%
              </div>
              <GrowthIndicator
                value={dashboardMetrics.performanceGrowth}
                label="improvement"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Statistics */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Statistics */}
        {userStats && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>User Statistics</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  User distribution and activity
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {userStats.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Total Users
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {userStats.newThisMonth}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    New This Month
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Students
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {userStats.students}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Instructors
                  </span>
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    {userStats.instructors}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Admins
                  </span>
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    {userStats.admins}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Active This Month
                  </span>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {userStats.activeThisMonth}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Statistics */}
        {testStats && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Test Statistics</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Test creation and performance
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {testStats.total}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Total Tests
                  </div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {testStats.active}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Active Tests
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Live Tests
                  </span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                    {testStats.live}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Premium Tests
                  </span>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {testStats.premium}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Created This Month
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-blue-500" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {testStats.createdThisMonth}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Completed This Month
                  </span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {testStats.completedThisMonth}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attempt Statistics */}
        {attemptStats && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Attempt Statistics</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Test attempts and performance
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {attemptStats.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    Total Attempts
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {attemptStats.completed}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Completed
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Started
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {attemptStats.started}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Expired
                  </span>
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    {attemptStats.expired}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Average Score
                  </span>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {attemptStats.avgScore}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Avg Duration
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {Math.round(attemptStats.avgDuration / 60)} min
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Overview */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Overview
          </CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Key performance indicators and trends
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Success Rate */}
            <div>
              <ProgressBar
                percentage={
                  attemptStats
                    ? Math.round(
                        (attemptStats.completed / attemptStats.total) * 100,
                      )
                    : 0
                }
                color="green"
                label="Success Rate"
                value={`${attemptStats ? Math.round((attemptStats.completed / attemptStats.total) * 100) : 0}%`}
              />
            </div>

            {/* Completion Rate */}
            <div>
              <ProgressBar
                percentage={
                  testStats && attemptStats
                    ? Math.round(
                        (testStats.completedThisMonth /
                          Math.max(attemptStats.total, 1)) *
                          100,
                      )
                    : 0
                }
                color="blue"
                label="Test Completion Rate"
                value={`${testStats && attemptStats ? Math.round((testStats.completedThisMonth / Math.max(attemptStats.total, 1)) * 100) : 0}%`}
              />
            </div>

            {/* User Engagement */}
            <div>
              <ProgressBar
                percentage={
                  userStats
                    ? Math.round(
                        (userStats.activeThisMonth / userStats.total) * 100,
                      )
                    : 0
                }
                color="purple"
                label="User Engagement"
                value={`${userStats ? Math.round((userStats.activeThisMonth / userStats.total) * 100) : 0}%`}
              />
            </div>

            {/* Performance Score */}
            <div>
              <ProgressBar
                percentage={dashboardMetrics?.avgPerformance || 0}
                color="orange"
                label="Performance Score"
                value={`${dashboardMetrics?.avgPerformance || 0}%`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
