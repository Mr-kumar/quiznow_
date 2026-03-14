/**
 * app/(public)/page.tsx
 *
 * Modern Landing Page — clean, professional design with vibrant gradients
 * Light theme with purple/blue gradients and modern card layouts
 */

import Link from "next/link";
import {
  BarChart3Icon,
  ShieldCheckIcon,
  ClockIcon,
  TrophyIcon,
  StarIcon,
  PlayCircleIcon,
  SparkleIcon,
  GlobeIcon,
  ArrowRightIcon,
  TargetIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CategoryLanding } from "@/app/(public)/exams/page";
import { LatestTestsSection } from "./LatestTestsSection";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

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
    <Card className="group hover:border-primary/20 transition-all duration-300 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon
              key={i}
              className="h-4 w-4 text-yellow-500 fill-current"
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">
          "{quote}"
        </p>
        <Separator className="mb-4" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-black shrink-0">
            {name[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">
              {exam} ·{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {rank}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center space-y-5">
          <div
            className={`h-16 w-16 rounded-2xl bg-linear-to-br ${accent} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-500 shadow-lg`}
          >
            <Icon className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Custom Styles ───────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes pulse-slow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .hero-gradient {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .bg-grid-pattern {
          background-image: radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0);
          background-size: 40px 40px;
        }
        .dark .bg-grid-pattern {
          background-image: radial-gradient(circle at 1px 1px, #1e293b 1px, transparent 0);
        }
      `}</style>

      {/* ── ENHANCED HERO SECTION ────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 bg-grid-pattern">
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-blue-50/50 to-transparent dark:from-blue-950/20 -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-700">
              <SparkleIcon className="h-3.5 w-3.5 mr-2 text-blue-600" />
              India's Most Trusted Test Platform
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-700">
              Your Exam Journey <br />
              <span className="hero-gradient">Starts Here.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000">
              Experience the future of exam preparation with NTA-style mock
              tests, deep performance analytics, and personalized learning
              paths.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <Link href="/login">
                <Button className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-2xl shadow-blue-600/20 group">
                  Start Learning Free
                  <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/exams">
                <Button
                  variant="outline"
                  className="h-14 px-10 rounded-2xl border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                >
                  Browse 1500+ Tests
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative max-w-5xl mx-auto mt-16 animate-in fade-in zoom-in duration-1000">
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 -z-10" />
            <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-4 shadow-2xl">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-8 md:p-12">
                <CategoryLanding />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST & STATS ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            <div className="space-y-2">
              <p className="text-4xl md:text-6xl font-black text-blue-600">
                2M+
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Students
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl md:text-6xl font-black text-indigo-600">
                50K+
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Tests
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl md:text-6xl font-black text-purple-600">
                98%
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Success Rate
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl md:text-6xl font-black text-amber-500">
                4.9/5
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Rating
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Latest Tests Section */}
          <LatestTestsSection />

          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-6 rounded-full border-blue-200 text-blue-600 font-bold px-4 py-1"
            >
              PLATFORM FEATURES
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              Built for your <span className="hero-gradient">Success.</span>
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              We've combined expert content with cutting-edge technology to give
              you the most authentic practice experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: TargetIcon,
                title: "NTA-Style Interface",
                description:
                  "Practice on the exact same interface you'll use on exam day. Zero surprises, maximum confidence.",
                accent: "from-blue-600 to-indigo-600",
              },
              {
                icon: BarChart3Icon,
                title: "Precision Analytics",
                description:
                  "Get granular insights into your speed, accuracy, and topic-wise performance to focus on what matters.",
                accent: "from-indigo-600 to-purple-600",
              },
              {
                icon: GlobeIcon,
                title: "Truly Bilingual",
                description:
                  "Every test is available in both Hindi and English. Switch languages anytime with a single tap.",
                accent: "from-purple-600 to-pink-600",
              },
              {
                icon: ClockIcon,
                title: "PYQ Collections",
                description:
                  "Exhaustive collection of previous year papers with step-by-step solutions and video explanations.",
                accent: "from-pink-600 to-rose-600",
              },
              {
                icon: TrophyIcon,
                title: "Live Leaderboards",
                description:
                  "Know your standing among lakhs of students instantly. Real-time ranking after every test submission.",
                accent: "from-rose-600 to-orange-600",
              },
              {
                icon: ShieldCheckIcon,
                title: "Expert Curated",
                description:
                  "Questions designed by top educators and previous year toppers to match the latest exam trends.",
                accent: "from-orange-600 to-amber-600",
              },
            ].map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 blur-3xl rounded-full translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.9]">
                Three steps to <br />
                <span className="text-blue-500">Excellence.</span>
              </h2>
              <div className="space-y-10">
                {[
                  {
                    step: "01",
                    title: "Select your Exam",
                    desc: "Choose from 1500+ mock tests across various government and entrance exams.",
                  },
                  {
                    step: "02",
                    title: "Practice & Refine",
                    desc: "Take NTA-style tests, analyze your performance, and improve your weak areas.",
                  },
                  {
                    step: "03",
                    title: "Get Exam Ready",
                    desc: "Track your progress on live leaderboards and build the confidence to succeed.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-6 group">
                    <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black text-blue-500 border border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      {item.step}
                    </div>
                    <div className="space-y-2 flex-1 pt-1">
                      <h3 className="text-2xl font-bold">{item.title}</h3>
                      <p className="text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-blue-600/30 rounded-[3rem] blur-2xl group-hover:bg-blue-600/40 transition-all" />
              <div className="relative bg-slate-800 rounded-[3rem] border border-white/10 p-8 shadow-2xl">
                <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative group/video cursor-pointer">
                  <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl group-hover/video:scale-110 transition-transform">
                    <PlayCircleIcon className="h-10 w-10 text-white" />
                  </div>
                  <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-bold text-sm text-slate-400">
                    Watch Platform Tour
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400">
              Join the ranks of successful aspirants who cracked their dream
              exams with QuizNow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "QuizNow's mock tests are a mirror image of the actual exam. The analytics helped me identify my speed issues in Quant, and I improved from 60 to 95 percentile in just 2 months.",
                name: "Anjali Deshmukh",
                exam: "UPSC CSE Aspirant",
                rank: "Rank 42 (Mock)",
                avatar: "AD",
              },
              {
                quote:
                  "The bilingual feature is a lifesaver. Being a Hindi medium student, I found the translations to be very accurate. The PYQ collection is simply the best in the market.",
                name: "Rohit Kumar",
                exam: "SSC CGL Topper",
                rank: "Selected 2023",
                avatar: "RK",
              },
              {
                quote:
                  "I used to struggle with time management in Banking exams. The section-wise timer and deep analytics in QuizNow helped me shave off 10 minutes from my overall time.",
                name: "Ishita Gupta",
                exam: "IBPS PO Aspirant",
                rank: "99.8 Percentile",
                avatar: "IG",
              },
            ].map((t) => (
              <Testimonial key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-linear-to-br from-blue-600 to-indigo-700 relative overflow-hidden mx-4 sm:mx-8 md:mx-16 rounded-[4rem] mb-24">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter">
            Ready to top <br /> your next exam?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Don't leave your success to chance. Start practicing with the most
            authentic mock tests available today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/login">
              <Button className="h-16 px-12 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-black text-xl shadow-2xl">
                Get Started Now
              </Button>
            </Link>
            <Link href="/plans">
              <Button
                variant="outline"
                className="h-16 px-12 rounded-2xl border-white/30 text-white hover:bg-white/10 font-bold text-xl backdrop-blur-md"
              >
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-blue-200 text-sm font-medium">
            No credit card required · Free tests included
          </p>
        </div>
      </section>
    </div>
  );
}
