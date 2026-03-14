"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ClockIcon,
  TargetIcon,
  PlayCircleIcon,
  LockIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { publicApi } from "@/api/public";
import { publicKeys } from "@/api/query-keys";

export function LatestTestsSection() {
  const { data: latestTests, isLoading } = useQuery({
    queryKey: publicKeys.latestTests(6),
    queryFn: async () => {
      const res = await publicApi.getLatestTests(6);
      return (res.data as any) ?? res;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="mb-24">
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-1">
          <Badge
            variant="outline"
            className="rounded-full border-blue-200 text-blue-600 font-bold px-4 py-1"
          >
            NEW RELEASES
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
            Recently Added Tests
          </h2>
        </div>
        <Link href="/exams">
          <Button variant="ghost" className="font-bold text-blue-600">
            View All <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="overflow-hidden border-slate-100 dark:border-slate-800"
              >
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))
          : latestTests?.length
          ? latestTests.map((test: any) => (
              <Link key={test.id} href={`/test/${test.id}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:-translate-y-1">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-blue-100 text-[10px] uppercase font-black">
                        {test.series?.exam?.name || "Mock Test"}
                      </Badge>
                      {test.isPremium && (
                        <LockIcon className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                      {test.title}
                    </CardTitle>
                    <CardDescription className="text-xs truncate">
                      {test.series?.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {test.durationMins} mins
                      </div>
                      <div className="flex items-center gap-1">
                        <TargetIcon className="h-3 w-3" />
                        {test.totalMarks} marks
                      </div>
                    </div>
                  </CardContent>
                  <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:bg-blue-50 transition-colors">
                    Start Now
                    <PlayCircleIcon className="h-4 w-4" />
                  </div>
                </Card>
              </Link>
            ))
          : (
            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-medium">
                New tests are being prepared. Check back soon!
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
