/**
 * app/(public)/page.tsx — Redesigned Landing Page
 */

import Link from "next/link";
import {
  BarChart3Icon,
  ShieldCheckIcon,
  ClockIcon,
  TrophyIcon,
  StarIcon,
  PlayCircleIcon,
  SparklesIcon,
  GlobeIcon,
  ArrowRightIcon,
  TargetIcon,
  ZapIcon,
  CheckCircle2Icon,
  UsersIcon,
  BookOpenIcon,
  ChevronRightIcon,
  FlameIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryLanding } from "@/app/(public)/exams/page";
import { LatestTestsSection } from "./LatestTestsSection";
import { publicApi } from "@/api/public";
import { leaderboardApi } from "@/api/leaderboard";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getPublicSummary() {
  try {
    const res = await publicApi.getPublicSummary();
    return (res.data as any)?.data ?? res.data;
  } catch {
    return null;
  }
}

async function getTopToppers(limit = 3) {
  try {
    const res = await leaderboardApi.getGlobalToppers(1, limit);
    const data = (res.data as any)?.toppers ?? res.data;
    return Array.isArray(data) ? data.slice(0, limit) : [];
  } catch {
    return [];
  }
}

function formatCount(n?: number) {
  if (typeof n !== "number") return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1000) return `${Math.round(n / 1000)}K+`;
  return `${n}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TopperCard({ topper, index }: { topper: any; index: number }) {
  const name: string = topper.name || topper.user?.name || "Student";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const RING_COLORS = [
    "ring-amber-400 bg-amber-50 dark:bg-amber-900/20",
    "ring-slate-300 bg-slate-50 dark:bg-slate-800/50",
    "ring-orange-400 bg-orange-50 dark:bg-orange-900/20",
  ];
  const RANK_COLORS = [
    "bg-amber-400 text-amber-900",
    "bg-slate-300 text-slate-700",
    "bg-orange-400 text-orange-900",
  ];

  return (
    <div
      className={`relative rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 ${RING_COLORS[index]} ring-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      {/* Rank badge */}
      <span
        className={`absolute -top-3 left-6 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${RANK_COLORS[index]}`}
      >
        #{index + 1} Rank
      </span>

      <div className="flex items-start gap-4 mt-2">
        {/* Avatar */}
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 dark:text-white truncate">
            {name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {topper.exam || "Mock Test Series"}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/40 grid grid-cols-2 gap-3">
        <div>
          <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {topper.score ?? "—"}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Score
          </p>
        </div>
        <div>
          <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {topper.accuracy != null ? `${topper.accuracy}%` : "—"}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Accuracy
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Subtle top gradient bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
      />

      <div
        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-5 group">
      <div className="flex flex-col items-center gap-1">
        <div className="h-12 w-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-500 font-black text-lg group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 shrink-0">
          {number}
        </div>
        {number !== "03" && (
          <div className="w-px flex-1 bg-blue-600/10 my-1 min-h-[2rem]" />
        )}
      </div>
      <div className="pb-8">
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PublicLandingPage() {
  const [summary, toppers] = await Promise.all([
    getPublicSummary(),
    getTopToppers(3),
  ]);

  const stats = [
    {
      value: formatCount(summary?.totalUsers),
      label: "Students",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      value: formatCount(summary?.totalTests),
      label: "Tests",
      color: "text-indigo-600 dark:text-indigo-400",
    },
    {
      value: formatCount(summary?.submittedAttempts),
      label: "Attempts",
      color: "text-violet-600 dark:text-violet-400",
    },
    {
      value: formatCount(summary?.liveTests),
      label: "Live Tests",
      color: "text-amber-500 dark:text-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HERO                                                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16">
        {/* Background mesh */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-50 via-indigo-50/50 to-transparent dark:from-blue-950/30 dark:via-indigo-950/10 dark:to-transparent rounded-b-full blur-3xl" />
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-widest">
            <FlameIcon className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
            India's Most Trusted Test Platform
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[0.88]">
            Crack Your Exam. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              The Smart Way.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            NTA-style mock tests, deep performance analytics, and bilingual
            questions — everything you need to top UPSC, SSC, Banking, Railways
            and more.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link href="/login">
              <Button className="h-13 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl shadow-blue-600/25 group transition-all">
                Start Free Today
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/exams">
              <Button
                variant="outline"
                className="h-13 px-8 rounded-xl border-slate-200 dark:border-slate-700 font-semibold text-base hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <BookOpenIcon className="h-4 w-4 mr-2 text-slate-400" />
                Browse Tests
              </Button>
            </Link>
          </div>

          {/* Trust chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-16">
            {[
              "No credit card required",
              "Free tests always included",
              "English & Hindi",
              "Instant results",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 font-medium"
              >
                <CheckCircle2Icon className="h-3.5 w-3.5 text-green-500" />
                {t}
              </span>
            ))}
          </div>

          {/* Exam category browser */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-px bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-violet-600/20 rounded-3xl blur-lg" />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-950 px-8 py-10">
                <CategoryLanding />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LIVE STATS BAR                                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-14 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-slate-200 dark:md:divide-slate-700">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center px-4">
                <p
                  className={`text-3xl md:text-4xl font-black tabular-nums ${stat.color}`}
                >
                  {stat.value}
                </p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LATEST TESTS                                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LatestTestsSection />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FEATURES                                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-slate-50/70 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-2xl mb-14">
            <Badge
              variant="outline"
              className="mb-4 text-blue-600 border-blue-200 dark:border-blue-800 font-bold"
            >
              Platform Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.05]">
              Built for serious{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                aspirants.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: TargetIcon,
                title: "NTA-Style Interface",
                description:
                  "Practice on the exact same UI you'll use on exam day. Zero surprises, full confidence.",
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                icon: BarChart3Icon,
                title: "Precision Analytics",
                description:
                  "Granular insights on speed, accuracy, and topic-wise performance. Know exactly where to improve.",
                gradient: "from-indigo-500 to-violet-600",
              },
              {
                icon: GlobeIcon,
                title: "Truly Bilingual",
                description:
                  "Every test available in Hindi and English. Switch languages live — even mid-question.",
                gradient: "from-violet-500 to-purple-600",
              },
              {
                icon: ClockIcon,
                title: "PYQ Collections",
                description:
                  "10+ years of previous year papers with expert solutions and topic tagging.",
                gradient: "from-rose-500 to-pink-600",
              },
              {
                icon: TrophyIcon,
                title: "Live Leaderboards",
                description:
                  "Know your rank among lakhs of students instantly after every test submission.",
                gradient: "from-amber-500 to-orange-600",
              },
              {
                icon: ShieldCheckIcon,
                title: "Expert Curated",
                description:
                  "Questions crafted by top educators matching the latest NTA, UPSC, and SSC patterns.",
                gradient: "from-green-500 to-emerald-600",
              },
            ].map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HOW IT WORKS + VIDEO                                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Steps */}
            <div>
              <Badge className="mb-6 bg-blue-600/10 text-blue-400 border-blue-600/20 font-bold">
                <ZapIcon className="h-3.5 w-3.5 mr-1.5 fill-current" />
                How It Works
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-12 tracking-tight leading-[1.05]">
                Three steps to{" "}
                <span className="text-blue-400">excellence.</span>
              </h2>
              <div>
                <StepItem
                  number="01"
                  title="Select your Exam"
                  description="Choose from 1500+ mock tests across UPSC, SSC, Banking, Railways, JEE, NEET and more."
                />
                <StepItem
                  number="02"
                  title="Practice & Analyse"
                  description="Take NTA-style tests, review solutions, and get deep analytics on your weak topics."
                />
                <StepItem
                  number="03"
                  title="Climb the Ranks"
                  description="Track your All-India rank on live leaderboards and build the confidence to crack any exam."
                />
              </div>
            </div>

            {/* Video placeholder */}
            <div className="relative">
              <div className="absolute -inset-6 bg-blue-600/20 rounded-[3rem] blur-2xl" />
              <div className="relative bg-slate-800 rounded-3xl border border-slate-700 p-3 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex flex-col items-center justify-center gap-4 group cursor-pointer">
                  {/* Glowing play button */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <PlayCircleIcon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">
                      Watch Platform Tour
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      2 min walkthrough
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TOP PERFORMERS                                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <Badge
                variant="outline"
                className="mb-4 text-amber-600 border-amber-200 dark:border-amber-800 font-bold"
              >
                <TrophyIcon className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                Hall of Fame
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Top Performers
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Students leading the platform right now.
              </p>
            </div>
            <Link
              href="/rankings"
              className="flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              View Full Rankings
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {toppers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {toppers.map((t: any, i: number) => (
                <TopperCard
                  key={`${t.userId}-${t.rank}`}
                  topper={t}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FINAL CTA                                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-8 px-4 sm:px-8 md:px-16 pb-20">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-12 md:p-20 text-center">
          {/* Pure CSS texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Glow blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <Badge className="mb-6 bg-white/20 hover:bg-white/30 text-white border-white/20 font-bold">
              <SparklesIcon className="h-3.5 w-3.5 mr-1.5" />
              Start for free, upgrade anytime
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.05]">
              Your next exam rank <br className="hidden sm:block" />
              starts today.
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of aspirants already using QuizNow to prepare
              smarter and score higher.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button className="h-14 px-10 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-black text-base shadow-xl transition-all hover:scale-105">
                  Get Started Free
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/plans">
                <Button
                  variant="outline"
                  className="h-14 px-10 rounded-xl border-white/30 text-white hover:bg-white/10 font-bold text-base backdrop-blur-sm"
                >
                  View Plans
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-blue-200 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2Icon className="h-4 w-4" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2Icon className="h-4 w-4" />
                100+ free tests
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2Icon className="h-4 w-4" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
