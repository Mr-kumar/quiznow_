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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Feature card ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200">
      <div
        className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

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
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        {/* BG gradient */}
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20" />
        <div className="absolute top-0 -right-48 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge className="gap-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 px-3 py-1">
              <ZapIcon className="h-3.5 w-3.5" />
              India's #1 Exam Preparation Platform
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Crack Your{" "}
              <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Dream Exam
              </span>{" "}
              with Confidence
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Practice with real exam-pattern tests, get instant results with
              detailed explanations, and track your progress. NTA-style
              interface — exactly like the real exam.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12 px-8 text-base font-semibold shadow-lg shadow-blue-500/25"
                >
                  <PlayCircleIcon className="h-5 w-5" />
                  Start Practicing Free
                </Button>
              </Link>
              <Link href="/exams">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 h-12 px-8 text-base border-slate-300 dark:border-slate-700"
                >
                  <BookOpenIcon
                    className="h-4.5 w-4.5"
                    style={{ height: "1.125rem", width: "1.125rem" }}
                  />
                  Browse Exams
                </Button>
              </Link>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500">
              Free to start · No credit card required · 500+ free tests
              available
            </p>
          </div>
        </div>
      </section>

      {/* ── Social proof stats ───────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatBlock number="2M+" label="Registered Students" />
            <StatBlock number="50K+" label="Tests Available" />
            <StatBlock number="98%" label="Selection Rate" />
            <StatBlock number="4.9★" label="App Rating" />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <Badge
              variant="outline"
              className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
            >
              Why QuizNow
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Everything you need to succeed
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-base">
              Built by exam toppers and educators. Designed for serious
              aspirants.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={TargetIcon}
              title="NTA-Style Interface"
              description="Exact replica of the real exam UI — question palette, section tabs, timer, mark for review. Zero surprises on exam day."
              color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
            />
            <FeatureCard
              icon={BrainIcon}
              title="Bilingual Questions"
              description="Toggle between English and Hindi at any point during the exam. Questions available in both languages for all major exams."
              color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
            />
            <FeatureCard
              icon={BarChart3Icon}
              title="Deep Analytics"
              description="Know your weak topics before the real exam. Section-wise breakdown, accuracy trends, topic heatmaps — all in one place."
              color="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
            />
            <FeatureCard
              icon={BookOpenIcon}
              title="Detailed Solutions"
              description="Every question has a step-by-step explanation with LaTeX math rendering. Learn why the answer is correct, not just what it is."
              color="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            />
            <FeatureCard
              icon={TrophyIcon}
              title="Live Leaderboards"
              description="See where you rank among thousands of aspirants. Competitive environment keeps you motivated to improve every attempt."
              color="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
            />
            <FeatureCard
              icon={ShieldCheckIcon}
              title="Anti-Cheat Monitoring"
              description="Fullscreen enforcement, tab-switch detection, copy-paste prevention. Practice under real exam conditions every time."
              color="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
            />
          </div>
        </div>
      </section>

      {/* ── Exam categories ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Prepare for any competitive exam
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              1000+ tests across 30+ exam categories
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              {
                name: "UPSC CSE",
                count: "250+",
                emoji: "🏛️",
                href: "/exams?category=upsc",
              },
              {
                name: "SSC CGL",
                count: "180+",
                emoji: "📋",
                href: "/exams?category=ssc",
              },
              {
                name: "IBPS PO",
                count: "120+",
                emoji: "🏦",
                href: "/exams?category=banking",
              },
              {
                name: "RRB NTPC",
                count: "200+",
                emoji: "🚂",
                href: "/exams?category=railways",
              },
              {
                name: "GATE",
                count: "90+",
                emoji: "⚙️",
                href: "/exams?category=gate",
              },
              {
                name: "NEET UG",
                count: "150+",
                emoji: "🩺",
                href: "/exams?category=neet",
              },
              {
                name: "JEE Main",
                count: "130+",
                emoji: "⚗️",
                href: "/exams?category=jee",
              },
              {
                name: "CAT",
                count: "80+",
                emoji: "📊",
                href: "/exams?category=cat",
              },
            ].map((cat) => (
              <ExamCategoryCard key={cat.name} {...cat} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/exams">
              <Button variant="outline" className="gap-2">
                View All Exam Categories
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
