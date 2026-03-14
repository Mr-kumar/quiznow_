"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  Loader2Icon,
  AlertCircleIcon,
  SearchIcon,
  FilterIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { questionsApi } from "@/api/questions";
import { questionKeys } from "@/api/query-keys";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

export default function TopicQuestionsPage() {
  const { subjectId, topicId } = useParams();
  const [search, setSearch] = useState("");
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: questionKeys.cursor({ topicId, search }),
    queryFn: async ({ pageParam }) => {
      const res = await questionsApi.getCursorPaginated({
        topicId: topicId as string,
        cursor: pageParam,
        limit: 20,
        search,
      });
      return (res.data as any) ?? res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => lastPage.pagination.nextCursor,
    enabled: !!topicId,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-1">
        <Link
          href={`/practice/${subjectId}`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Topics
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Practice Questions
        </h1>
        <p className="text-slate-500">
          Review and practice questions from this topic
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search questions..."
            className="pl-10 h-11 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl gap-2">
          <FilterIcon className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="space-y-6">
        {data?.pages.map((page: any, pageIdx: number) => (
          <div key={pageIdx} className="space-y-6">
            {page.data.map((q: any, qIdx: number) => (
              <Card
                key={q.id}
                className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
              >
                <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-black text-blue-600">
                        Q
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Question {pageIdx * 20 + qIdx + 1}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {q.difficulty || "Medium"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div
                    className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-medium mb-6 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html:
                        q.translations?.find((t: any) => t.lang === "EN")
                          ?.content || "No content",
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options?.map((opt: any, idx: number) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-blue-200 dark:hover:border-blue-900 transition-all cursor-pointer"
                      >
                        <div className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {opt.translations?.find((t: any) => t.lang === "EN")
                            ?.text || "No text"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-blue-600 gap-2"
                  >
                    <HelpCircleIcon className="h-4 w-4" />
                    View Explanation
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-lg"
                  >
                    Save Question
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ))}

        <div ref={ref} className="py-10 flex justify-center">
          {isFetchingNextPage ? (
            <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
          ) : hasNextPage ? (
            <Button
              onClick={() => fetchNextPage()}
              variant="outline"
              className="rounded-xl"
            >
              Load More Questions
            </Button>
          ) : (
            <p className="text-sm text-slate-400 font-medium italic">
              End of topic questions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
