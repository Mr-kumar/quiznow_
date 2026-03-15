"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  TrophyIcon,
  TargetIcon,
  ActivityIcon,
  CalendarIcon,
  AwardIcon,
  ZapIcon,
  HistoryIcon,
  StarIcon,
  MedalIcon,
  Loader2Icon,
  AlertCircleIcon,
  ArrowLeftIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { publicUsersApi } from "@/api/users";
import { publicKeys } from "@/api/query-keys";

export default function PublicProfilePage() {
  const { userId } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: publicKeys.userProfile(userId as string),
    queryFn: async () => {
      const res = await publicUsersApi.getProfile(userId as string);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2Icon className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold">Fetching profile data...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="h-20 w-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center">
          <AlertCircleIcon className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          User profile not found
        </h2>
        <Link href="/rankings">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Rankings
          </Button>
        </Link>
      </div>
    );
  }

  const { user, stats, recentActivity } = data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* ── Header / Cover ────────────────────────────────────────────────── */}
      <div className="h-48 md:h-64 bg-linear-to-r from-blue-600 to-indigo-700 relative">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="max-w-5xl mx-auto px-4 h-full flex items-end">
          <div className="translate-y-1/2 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white dark:border-slate-900 shadow-2xl">
              <AvatarImage
                src={
                  user.image ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                }
              />
              <AvatarFallback className="text-4xl">
                {user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {user.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-2 text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold border-0">
                  Student Aspirant
                </Badge>
              </div>
            </div>
            <div className="mb-2">
               <Link href="/rankings">
                  <Button variant="outline" className="rounded-xl border-slate-200 bg-white dark:bg-slate-900 shadow-sm font-bold">
                    View Global Leaderboard
                  </Button>
               </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 mt-24 md:mt-28 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Stats Column */}
        <div className="space-y-6">
          <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:border dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-blue-600" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
                  {stats.totalTests}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Tests Done
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50">
                <p className="text-2xl font-black text-green-700 dark:text-green-400">
                  {stats.avgAccuracy}%
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Avg. Accuracy
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:border dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-amber-500" />
                Top Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.topPerformances.length > 0 ? (
                stats.topPerformances.map((perf: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                      <MedalIcon className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {perf.testTitle}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Score: {perf.score.toFixed(1)}% • Accuracy: {perf.accuracy}%
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-slate-400 text-sm italic">
                  No top performances recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:border dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <HistoryIcon className="h-6 w-6 text-indigo-600" />
                Recent Practice History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity: any) => (
                    <div key={activity.id} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <ZapIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {activity.testTitle}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {format(new Date(activity.date), "do MMM, yyyy • h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                           <Badge variant="outline" className="rounded-lg font-black text-xs px-2 py-0.5 border-blue-100 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                             {activity.score.toFixed(1)}%
                           </Badge>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Final Score</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <HistoryIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No recent activity found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
