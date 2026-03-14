"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRightIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  SearchIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { publicSubjectsApi } from "@/api/subjects";
import { subjectKeys } from "@/api/query-keys";
import { useState } from "react";

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const [search, setSearch] = useState("");

  const {
    data: subject,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: subjectKeys.detail(subjectId as string),
    queryFn: async () => {
      const res = await publicSubjectsApi.getById(subjectId as string);
      return (res.data as any) ?? res;
    },
    enabled: !!subjectId,
  });

  const filteredTopics = subject?.topics?.filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Failed to load topics</h2>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/practice"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Subjects
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {subject?.name}
          </h1>
          <p className="text-slate-500">
            Select a topic to start practicing questions
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search topics..."
          className="pl-10 h-11 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredTopics?.map((topic: any) => (
          <Link
            key={topic.id}
            href={`/practice/${subjectId}/${topic.id}`}
            className="group"
          >
            <Card className="hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <BookOpenIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {topic._count?.questions || 0} Questions available
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>
        ))}

        {filteredTopics?.length === 0 && (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 font-medium">No topics found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
