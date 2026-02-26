"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Star,
  Zap,
  Award,
  BarChart3,
} from "lucide-react";

interface Test {
  id: string;
  title: string;
  durationMins: number;
  totalMarks: number;
  questionsCount?: number;
}

export default function DashboardPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data } = await api.get("/tests");
        setTests(data);
      } catch (error) {
        console.error("Failed to fetch tests", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome Back!
              </h1>
              <p className="text-blue-100">Ready to ace your exams today?</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">
                {tests.length} Tests Available
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Level Up Your Skills</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Instant Results</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Tests
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {tests.length}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Available now
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Completed
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              12
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Average Score
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              85%
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Rank
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              #3
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Top 5%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tests List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Available Tests
          </h2>
          <Button variant="outline" className="group">
            View All
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-zinc-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500"></div>
              <span>Loading your exams...</span>
            </div>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12 bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/50 dark:to-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
            <AlertCircle className="mx-auto h-16 w-16 text-zinc-400 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              No tests found
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Get started by creating a test in the backend.
            </p>
            <Button className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Create First Test
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test, index) => (
              <Card
                key={test.id}
                className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-zinc-900 overflow-hidden hover:-translate-y-1"
              >
                <div className="h-2 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {test.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-linear-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 border-0"
                        >
                          Mock Test
                        </Badge>
                        {index === 0 && (
                          <Badge className="bg-linear-to-r from-yellow-400 to-orange-500 text-white border-0">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {test.durationMins} Minutes
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Duration
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {test.totalMarks} Marks
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Total Score
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {Math.floor(Math.random() * 100) + 50} Students
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Already taken
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4">
                  <Button
                    className="w-full group bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 transform hover:scale-105 transition-all duration-200"
                    asChild
                  >
                    <Link href={`/dashboard/test/${test.id}`}>
                      <Zap className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                      Start Test
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-indigo-700 dark:text-indigo-300">
              Study Schedule
            </CardTitle>
            <CardDescription className="text-indigo-600 dark:text-indigo-400">
              Plan your study sessions and track progress
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <CardTitle className="text-pink-700 dark:text-pink-300">
              Practice Mode
            </CardTitle>
            <CardDescription className="text-pink-600 dark:text-pink-400">
              Practice specific topics and improve weak areas
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <CardTitle className="text-teal-700 dark:text-teal-300">
              Leaderboard
            </CardTitle>
            <CardDescription className="text-teal-600 dark:text-teal-400">
              Compete with others and climb the rankings
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
