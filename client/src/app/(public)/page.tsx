/**
 * app/(public)/page.tsx
 *
 * Public Landing Page — the marketing homepage.
 *
 * Sections:
 *  1. Hero       — headline, sub-copy, CTA buttons, hero visual
 *  2. Social proof — student count, test count, accuracy improvement
 *  3. Features   — 6 key product features (grid cards)
 *  4. Exam categories — grid of exam types (UPSC, SSC, Banking, etc.)
 *  5. How it works — 3-step process
 *  6. Testimonials  — 3 student quotes
 *  7. CTA banner — final conversion push
 *
 * Server Component — fully static, no auth, no data fetching.
 * Great for SEO — every section is server-rendered HTML.
 */

import Link from "next/link";
import {
  ZapIcon,
  BookOpenIcon,
  BarChart3Icon,
  ShieldCheckIcon,
  ClockIcon,
  TrophyIcon,
  UsersIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  TargetIcon,
  StarIcon,
  BrainIcon,
  PlayCircleIcon,
  SearchIcon,
  TrendingUpIcon,
  AwardIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedFeatures } from "./AnimatedFeatures";

// ── Exam category card ────────────────────────────────────────────────────────

function ExamCategoryCard({
  name,
  count,
  emoji,
  href,
}: {
  name: string;
  count: string;
  emoji: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200"
    >
      <span className="text-2xl shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {name}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {count} tests
        </p>
      </div>
      <ArrowRightIcon className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 ml-auto shrink-0 transition-colors" />
    </Link>
  );
}

// ── Stat block ────────────────────────────────────────────────────────────────

function StatBlock({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
        {number}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

// ── Testimonial ───────────────────────────────────────────────────────────────

function Testimonial({
  quote,
  name,
  exam,
  rank,
}: {
  quote: string;
  name: string;
  exam: string;
  rank: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon key={i} className="h-4 w-4 text-amber-400 fill-current" />
        ))}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
        "{quote}"
      </p>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {name}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {exam} · {rank}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PublicLandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ── Premium Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32 overflow-hidden bg-white dark:bg-slate-950">
        {/* Modern grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="gap-1.5 bg-blue-50/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50 px-4 py-1.5 rounded-full backdrop-blur-sm shadow-sm">
              <AwardIcon className="h-4 w-4 text-amber-500" />
              <span className="font-medium">
                India's #1 Exam Preparation Platform
              </span>
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Ace Your Target Exam With{" "}
              <span className="relative whitespace-nowrap">
                <span className="absolute -inset-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 transform -rotate-1"></span>
                <span className="relative bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  Precision
                </span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Join 2 Million+ aspirants practicing on NTA-style mock tests. Get
              detailed analytics, bilingual questions, and video solutions.
            </p>

            {/* Premium Search Bar (Testbook Style) */}
            <div className="max-w-2xl mx-auto mt-10 relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 pl-4">
                <SearchIcon className="h-6 w-6 text-slate-400 ml-2" />
                <Input
                  type="text"
                  placeholder="What are you preparing for? (e.g. UPSC, SSC CGL...)"
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base md:text-lg h-14 w-full px-4 shadow-none font-medium"
                />
                <Link href="/exams">
                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md"
                  >
                    Start Prep
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 font-medium flex items-center justify-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
                Trending: SSC CGL, RRB NTPC, IBPS PO
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof stats ───────────────────────────────────────────────── */}
      <section className="bg-slate-900 dark:bg-slate-950 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 divide-x-0 lg:divide-x divide-slate-800">
            <StatBlock number="2M+" label="Registered Students" />
            <StatBlock number="50K+" label="Tests Available" />
            <StatBlock number="98%" label="Selection Rate" />
            <StatBlock number="4.9★" label="App Rating" />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <AnimatedFeatures />

      {/* ── Exam categories (Tabbed Interface) ─────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Explore Exams by Category
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              1000+ tests across 30+ exam categories. Find yours.
            </p>
          </div>

          <Tabs defaultValue="popular" className="w-full max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto rounded-xl bg-slate-100 dark:bg-slate-900 p-1.5 mb-8">
              <TabsTrigger
                value="popular"
                className="rounded-lg py-2.5 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Popular
              </TabsTrigger>
              <TabsTrigger
                value="upsc"
                className="rounded-lg py-2.5 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                UPSC & State PSC
              </TabsTrigger>
              <TabsTrigger
                value="ssc"
                className="rounded-lg py-2.5 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                SSC
              </TabsTrigger>
              <TabsTrigger
                value="banking"
                className="rounded-lg py-2.5 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Banking
              </TabsTrigger>
              <TabsTrigger
                value="engineering"
                className="rounded-lg py-2.5 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Engineering
              </TabsTrigger>
            </TabsList>

            <TabsContent value="popular" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ExamCategoryCard
                  name="SSC CGL"
                  count="180+"
                  emoji="📋"
                  href="/exams?category=ssc"
                />
                <ExamCategoryCard
                  name="UPSC CSE"
                  count="250+"
                  emoji="🏛️"
                  href="/exams?category=upsc"
                />
                <ExamCategoryCard
                  name="IBPS PO"
                  count="120+"
                  emoji="🏦"
                  href="/exams?category=banking"
                />
                <ExamCategoryCard
                  name="RRB NTPC"
                  count="200+"
                  emoji="🚂"
                  href="/exams?category=railways"
                />
              </div>
            </TabsContent>

            <TabsContent value="upsc" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ExamCategoryCard
                  name="UPSC CSE"
                  count="250+"
                  emoji="🏛️"
                  href="/exams?category=upsc"
                />
                <ExamCategoryCard
                  name="UPPSC"
                  count="90+"
                  emoji="📜"
                  href="/exams?category=upsc"
                />
                <ExamCategoryCard
                  name="BPSC"
                  count="110+"
                  emoji="📚"
                  href="/exams?category=upsc"
                />
                <ExamCategoryCard
                  name="MPPSC"
                  count="75+"
                  emoji="🗺️"
                  href="/exams?category=upsc"
                />
              </div>
            </TabsContent>

            <TabsContent value="ssc" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ExamCategoryCard
                  name="SSC CGL"
                  count="180+"
                  emoji="📋"
                  href="/exams?category=ssc"
                />
                <ExamCategoryCard
                  name="SSC CHSL"
                  count="150+"
                  emoji="📝"
                  href="/exams?category=ssc"
                />
                <ExamCategoryCard
                  name="SSC MTS"
                  count="120+"
                  emoji="📄"
                  href="/exams?category=ssc"
                />
                <ExamCategoryCard
                  name="SSC GD"
                  count="200+"
                  emoji="🛡️"
                  href="/exams?category=ssc"
                />
              </div>
            </TabsContent>

            <TabsContent value="banking" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ExamCategoryCard
                  name="IBPS PO"
                  count="120+"
                  emoji="🏦"
                  href="/exams?category=banking"
                />
                <ExamCategoryCard
                  name="SBI PO"
                  count="95+"
                  emoji="💰"
                  href="/exams?category=banking"
                />
                <ExamCategoryCard
                  name="IBPS Clerk"
                  count="150+"
                  emoji="🧾"
                  href="/exams?category=banking"
                />
                <ExamCategoryCard
                  name="RBI Grade B"
                  count="80+"
                  emoji="🏦"
                  href="/exams?category=banking"
                />
              </div>
            </TabsContent>

            <TabsContent value="engineering" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ExamCategoryCard
                  name="JEE Main"
                  count="130+"
                  emoji="⚗️"
                  href="/exams?category=jee"
                />
                <ExamCategoryCard
                  name="JEE Advanced"
                  count="80+"
                  emoji="🔬"
                  href="/exams?category=jee"
                />
                <ExamCategoryCard
                  name="GATE CS/IT"
                  count="90+"
                  emoji="💻"
                  href="/exams?category=gate"
                />
                <ExamCategoryCard
                  name="GATE Mechanical"
                  count="85+"
                  emoji="⚙️"
                  href="/exams?category=gate"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-12">
            <Link href="/exams">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 h-12 px-8 rounded-full border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                View All Categories
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Start in 3 simple steps
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create your account",
                desc: "Sign up free in 30 seconds. No credit card needed to access hundreds of free tests.",
                icon: UsersIcon,
              },
              {
                step: "2",
                title: "Pick your exam",
                desc: "Browse tests by exam type. Start from syllabus-wise topics or full mock tests.",
                icon: BookOpenIcon,
              },
              {
                step: "3",
                title: "Track and improve",
                desc: "Get instant results with explanations. See your weak areas and improve with every attempt.",
                icon: BarChart3Icon,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center space-y-3">
                <div className="relative mx-auto h-14 w-14">
                  <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Loved by toppers
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            <Testimonial
              quote="QuizNow's bilingual tests and NTA-style UI gave me the confidence I needed. Cleared UPSC CSE with AIR 34!"
              name="Priya Sharma"
              exam="UPSC CSE 2024"
              rank="AIR 34"
            />
            <Testimonial
              quote="The weak-area analytics are incredible. I knew exactly where to focus my last-month revision. Got 97.8 percentile in CAT."
              name="Rahul Verma"
              exam="CAT 2024"
              rank="97.8 percentile"
            />
            <Testimonial
              quote="Attempted 200+ SSC CGL mocks on QuizNow. The leaderboard kept me competitive. Selected in final merit list!"
              name="Anjali Singh"
              exam="SSC CGL 2024"
              rank="Selected"
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-linear-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Your rank is waiting. Let's claim it.
          </h2>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            Join 2 million aspirants who trust QuizNow for their exam
            preparation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 gap-2 h-12 px-8 font-semibold"
              >
                <PlayCircleIcon className="h-5 w-5" />
                Start Free Today
              </Button>
            </Link>
            <Link href="/exams">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 gap-2 h-12 px-8"
              >
                <BookOpenIcon
                  className="h-4.5 w-4.5"
                  style={{ height: "1.125rem", width: "1.125rem" }}
                />
                Browse Tests
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 pt-2">
            {["Free to start", "500+ free tests", "No credit card"].map((t) => (
              <div
                key={t}
                className="flex items-center gap-1.5 text-sm text-blue-100"
              >
                <CheckCircle2Icon className="h-4 w-4 text-green-300" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
