"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenIcon,
  SearchIcon,
  TargetIcon,
  ZapIcon,
  BrainIcon,
  ClockIcon,
  FilterIcon,
  ArrowRightIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EXAM_CATEGORIES as CATEGORIES } from "@/constants/exams";
import { publicSubjectsApi } from "@/api/subjects";
import { publicKeys } from "@/api/query-keys";
import { Skeleton } from "@/components/ui/skeleton";

// ── Icons mapping based on subject name keywords ────────────────────────────
function getSubjectIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("quant") || n.includes("math") || n.includes("aptitude"))
    return "🔢";
  if (n.includes("reasoning") || n.includes("logic")) return "🧠";
  if (n.includes("english") || n.includes("verbal") || n.includes("lang"))
    return "📖";
  if (
    n.includes("general") ||
    n.includes("awareness") ||
    n.includes("gk") ||
    n.includes("current")
  )
    return "🌍";
  if (n.includes("data") || n.includes("interpretation") || n.includes("graph"))
    return "📊";
  if (n.includes("computer") || n.includes("tech") || n.includes("it"))
    return "💻";
  if (n.includes("science")) return "🧪";
  if (n.includes("history") || n.includes("civics")) return "🏛️";
  return "�";
}

const COLORS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-green-500 to-emerald-600",
  "from-orange-500 to-amber-600",
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-purple-600",
];

function PracticeSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-20" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PracticeLandingPage() {
  const [search, setSearch] = useState("");

  const {
    data: subjects,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: publicKeys.subjects(),
    queryFn: async () => {
      const res = await publicSubjectsApi.getAll();
      return (res.data as any) ?? res;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const filteredSubjects = subjects?.filter(
    (s: any) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.topics &&
        s.topics.some((t: any) =>
          t.name.toLowerCase().includes(search.toLowerCase())
        ))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 bg-linear-to-br from-blue-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-white/20 hover:bg-white/30 text-white border-white/30 px-3 py-1">
            <ZapIcon className="h-3 w-3 mr-1.5 fill-current" />
            Adaptive Learning
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Master Every Topic with{" "}
            <span className="text-blue-200">Focused Practice</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Choose a subject and dive deep into specific topics with our curated
            practice sets. Improve your speed and accuracy where it matters
            most.
          </p>

          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:bg-white/30 transition-all" />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 border border-white/10 flex items-center">
              <SearchIcon className="h-5 w-5 text-slate-400 ml-4" />
              <Input
                type="text"
                placeholder="Search for subjects or topics (e.g. Percentage, Syllogism)..."
                className="border-0 focus-visible:ring-0 text-lg h-12 bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-12">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Practice by Subject
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Select a subject to explore topic-wise practice sets
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <FilterIcon className="h-4 w-4" />
            <span>Filter results</span>
          </div>
        </div>

        {isLoading ? (
          <PracticeSkeleton />
        ) : isError ? (
          <div className="py-20 text-center">
            <div className="h-16 w-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircleIcon className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Failed to load subjects</h3>
            <p className="text-muted-foreground mb-6">
              Please check your connection and try again.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSubjects?.map((subject: any, idx: number) => {
              const icon = getSubjectIcon(subject.name);
              const color = COLORS[idx % COLORS.length];
              return (
                <Link key={subject.id} href={`/practice/${subject.id}`}>
                  <Card className="group h-full hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border-slate-200 dark:border-slate-800 overflow-hidden">
                    <CardHeader
                      className={`bg-linear-to-br ${color} p-8 text-white relative`}
                    >
                      <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:scale-125 transition-transform duration-500">
                        {icon}
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mb-4">
                        {icon}
                      </div>
                      <CardTitle className="text-2xl font-bold">
                        {subject.name}
                      </CardTitle>
                      <CardDescription className="text-blue-100 font-medium">
                        {subject._count?.topics || 0} Topics ·{" "}
                        {subject._count?.questions || 0} Questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Popular Topics
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {subject.topics?.slice(0, 5).map((topic: any) => (
                            <span
                              key={topic.id}
                              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-medium"
                            >
                              {topic.name}
                            </span>
                          ))}
                          {!subject.topics?.length && (
                            <span className="text-xs text-slate-400 italic">
                              Topics coming soon...
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Explore All Topics
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Features Strip ───────────────────────────────────────────────── */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: TargetIcon,
              title: "Topic Mastery",
              desc: "Track your progress on each individual topic and identify weak areas.",
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              icon: BrainIcon,
              title: "Adaptive Practice",
              desc: "Questions that adjust to your difficulty level to help you grow faster.",
              color: "text-purple-500",
              bg: "bg-purple-50 dark:bg-purple-900/20",
            },
            {
              icon: ClockIcon,
              title: "Timed Sessions",
              desc: "Simulate exam pressure even while practicing specific topics.",
              color: "text-orange-500",
              bg: "bg-orange-50 dark:bg-orange-900/20",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div
                className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center shrink-0`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category Path ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Browse by Exam Path
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Prefer practicing for a specific exam? Choose your category.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/exams?category=${cat.id}`}>
                <div
                  className={`group p-6 rounded-2xl border bg-white dark:bg-slate-900 hover:shadow-xl transition-all duration-300 text-center relative overflow-hidden`}
                >
                  <div
                    className={`absolute top-0 left-0 w-1 h-full bg-linear-to-b ${cat.color}`}
                  />
                  <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">
                    {cat.emoji}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {cat.shortLabel}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {cat.count} tests
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
