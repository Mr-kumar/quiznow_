/**
 * app/(public)/page.tsx
 *
 * Public Landing Page — premium dark-first design.
 * Deep navy base · Amber/orange accent · Sora + DM Sans typography
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
  SparkleIcon,
  FlameIcon,
  GlobeIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AnimatedFeatures } from "./AnimatedFeatures";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

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
    <Link href={href}>
      <Card className="group hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-pointer border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <span className="text-2xl shrink-0">{emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {name}
            </p>
            <p className="text-xs text-muted-foreground">{count} tests</p>
          </div>
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary ml-auto shrink-0 transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}

function StatBlock({
  number,
  label,
  accent,
}: {
  number: string;
  label: string;
  accent?: string;
}) {
  return (
    <div className="text-center group">
      <p className="text-4xl sm:text-5xl font-black bg-gradient-to-b from-primary to-primary/70 text-transparent bg-clip-text tabular-nums tracking-tight">
        {number}
      </p>
      <p className="text-sm text-muted-foreground mt-2 font-medium">{label}</p>
    </div>
  );
}

function Testimonial({
  quote,
  name,
  exam,
  rank,
  avatar,
}: {
  quote: string;
  name: string;
  exam: string;
  rank: string;
  avatar: string;
}) {
  return (
    <Card className="group hover:border-primary/20 transition-all duration-300 border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} className="h-4 w-4 text-primary fill-current" />
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">
          "{quote}"
        </p>
        <Separator className="mb-4" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-black shrink-0">
            {name[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">
              {exam} ·{" "}
              <span className="text-primary font-semibold">{rank}</span>
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
  icon: any;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Card className="group hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader>
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10`}
        >
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Custom Styles ───────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-sora { font-family: 'Sora', sans-serif; }
        .font-dm { font-family: 'DM Sans', sans-serif; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-slow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: float 8s ease-in-out infinite 1s; }
        .float-3 { animation: float 7s ease-in-out infinite 2s; }
        .glow-text {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 40%, hsl(var(--primary) / 0.9) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .shimmer-btn {
          background: linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 40%, hsl(var(--primary)) 60%, hsl(var(--primary) / 0.8) 100%);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        .grid-bg {
          background-image: 
            linear-gradient(hsl(var(--border) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-20 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

        {/* Glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/3 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 left-10 w-64 h-64 bg-primary/2 rounded-full blur-[80px] pointer-events-none" />

        {/* Floating exam badges */}
        <div className="absolute left-8 top-40 float-1 hidden xl:block">
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <span className="text-lg">🏛️</span>
              <div>
                <p className="text-xs font-bold text-foreground">UPSC CSE</p>
                <p className="text-[10px] text-primary">250+ Tests</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="absolute right-12 top-52 float-2 hidden xl:block">
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <span className="text-lg">🏦</span>
              <div>
                <p className="text-xs font-bold text-foreground">IBPS PO</p>
                <p className="text-[10px] text-primary">120+ Tests</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="absolute left-16 bottom-40 float-3 hidden xl:block">
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <span className="text-lg">📋</span>
              <div>
                <p className="text-xs font-bold text-foreground">SSC CGL</p>
                <p className="text-[10px] text-primary">180+ Tests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-8 px-4 py-2 text-xs font-semibold"
          >
            <AwardIcon className="h-3.5 w-3.5 mr-2 text-primary" />
            India's #1 Exam Preparation Platform
            <span className="h-1.5 w-1.5 rounded-full bg-primary ml-2 animate-pulse" />
          </Badge>

          {/* Headline */}
          <h1 className="font-sora text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Crack Your Exam
            <br />
            <span className="glow-text">With Precision.</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            Join{" "}
            <span className="text-foreground font-bold">
              2 Million+ aspirants
            </span>{" "}
            practicing on NTA-style mock tests. Detailed analytics, bilingual
            questions, video solutions.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative group">
              {/* Glow border */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

              <div className="relative flex items-center bg-background/50 backdrop-blur-sm rounded-2xl border border-border p-2">
                <SearchIcon className="h-5 w-5 text-muted-foreground ml-3 shrink-0" />
                <Input
                  type="text"
                  placeholder="What are you preparing for? (e.g. UPSC, SSC CGL...)"
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base h-12 px-4 shadow-none placeholder:text-muted-foreground text-foreground w-full"
                />
                <Link href="/exams">
                  <Button className="shimmer-btn h-12 px-7 rounded-xl font-bold text-primary-foreground text-sm shrink-0 shadow-lg hover:shadow-xl border-0">
                    Start Prep
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <TrendingUpIcon className="h-4 w-4 text-green-500" />
              <span>Trending:</span>
              {["SSC CGL", "RRB NTPC", "IBPS PO", "UPSC CSE"].map((e, i) => (
                <span key={e}>
                  <Link
                    href={`/exams?q=${e}`}
                    className="text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    {e}
                  </Link>
                  {i < 3 && (
                    <span className="text-muted-foreground/50 ml-1">·</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { icon: ShieldCheckIcon, text: "Free to start" },
              { icon: BookOpenIcon, text: "500+ free tests" },
              { icon: ZapIcon, text: "Instant results" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <Separator className="absolute inset-x-0 top-0" />
        <Separator className="absolute inset-x-0 bottom-0" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            <StatBlock number="2M+" label="Registered Students" />
            <StatBlock number="50K+" label="Tests Available" />
            <StatBlock number="98%" label="Selection Rate" />
            <StatBlock number="4.9★" label="App Rating" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-24 relative">
        <Separator className="absolute inset-x-0 top-0" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
              variant="secondary"
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
            >
              Why QuizNow?
            </Badge>
            <h2 className="font-sora text-4xl md:text-5xl font-black">
              Everything you need to{" "}
              <span className="glow-text">rank higher</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: TargetIcon,
                title: "NTA-Style Mock Tests",
                description:
                  "Pixel-perfect replicas of the actual exam interface. Practice exactly how you'll perform.",
                accent: "bg-amber-500",
              },
              {
                icon: BarChart3Icon,
                title: "Deep Analytics",
                description:
                  "Understand your weak areas with topic-wise accuracy, time analysis, and percentile tracking.",
                accent: "bg-orange-500",
              },
              {
                icon: BrainIcon,
                title: "AI-Powered Insights",
                description:
                  "Get personalized study plans based on your performance patterns and exam date.",
                accent: "bg-rose-500",
              },
              {
                icon: GlobeIcon,
                title: "Bilingual Content",
                description:
                  "Switch between Hindi and English seamlessly. Every question available in both languages.",
                accent: "bg-violet-500",
              },
              {
                icon: ClockIcon,
                title: "Previous Year Papers",
                description:
                  "10+ years of solved papers with detailed explanations and video walkthroughs.",
                accent: "bg-cyan-500",
              },
              {
                icon: TrophyIcon,
                title: "Live Leaderboards",
                description:
                  "Compete with lakhs of aspirants. Know your all-India rank after every test.",
                accent: "bg-green-500",
              },
            ].map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAM CATEGORIES ───────────────────────────────────────────────── */}
      <section className="py-24 relative">
        <Separator className="absolute inset-x-0 top-0" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge
              variant="secondary"
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
            >
              All Categories
            </Badge>
            <h2 className="font-sora text-4xl md:text-5xl font-black">
              Explore by exam
            </h2>
            <p className="text-muted-foreground mt-3">
              1000+ tests across 30+ exam categories
            </p>
          </div>

          <Tabs defaultValue="popular" className="w-full max-w-5xl mx-auto">
            <TabsList className="flex w-full h-auto rounded-xl bg-background/50 backdrop-blur-sm border border-border p-1.5 mb-8 overflow-x-auto gap-1">
              {[
                { value: "popular", label: "🔥 Popular" },
                { value: "upsc", label: "🏛️ UPSC & PSC" },
                { value: "ssc", label: "📋 SSC" },
                { value: "banking", label: "🏦 Banking" },
                { value: "engineering", label: "⚗️ Engineering" },
              ].map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-lg py-2.5 px-4 text-sm font-semibold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg whitespace-nowrap transition-all"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {[
              {
                value: "popular",
                items: [
                  {
                    name: "SSC CGL",
                    count: "180+",
                    emoji: "📋",
                    href: "/exams?category=ssc",
                  },
                  {
                    name: "UPSC CSE",
                    count: "250+",
                    emoji: "🏛️",
                    href: "/exams?category=upsc",
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
                ],
              },
              {
                value: "upsc",
                items: [
                  {
                    name: "UPSC CSE",
                    count: "250+",
                    emoji: "🏛️",
                    href: "/exams?category=upsc",
                  },
                  {
                    name: "UPPSC",
                    count: "90+",
                    emoji: "📜",
                    href: "/exams?category=upsc",
                  },
                  {
                    name: "BPSC",
                    count: "110+",
                    emoji: "📚",
                    href: "/exams?category=upsc",
                  },
                  {
                    name: "MPPSC",
                    count: "75+",
                    emoji: "🗺️",
                    href: "/exams?category=upsc",
                  },
                ],
              },
              {
                value: "ssc",
                items: [
                  {
                    name: "SSC CGL",
                    count: "180+",
                    emoji: "📋",
                    href: "/exams?category=ssc",
                  },
                  {
                    name: "SSC CHSL",
                    count: "150+",
                    emoji: "📝",
                    href: "/exams?category=ssc",
                  },
                  {
                    name: "SSC MTS",
                    count: "120+",
                    emoji: "📄",
                    href: "/exams?category=ssc",
                  },
                  {
                    name: "SSC GD",
                    count: "200+",
                    emoji: "🛡️",
                    href: "/exams?category=ssc",
                  },
                ],
              },
              {
                value: "banking",
                items: [
                  {
                    name: "IBPS PO",
                    count: "120+",
                    emoji: "🏦",
                    href: "/exams?category=banking",
                  },
                  {
                    name: "SBI PO",
                    count: "95+",
                    emoji: "💰",
                    href: "/exams?category=banking",
                  },
                  {
                    name: "IBPS Clerk",
                    count: "150+",
                    emoji: "🧾",
                    href: "/exams?category=banking",
                  },
                  {
                    name: "RBI Grade B",
                    count: "80+",
                    emoji: "🏦",
                    href: "/exams?category=banking",
                  },
                ],
              },
              {
                value: "engineering",
                items: [
                  {
                    name: "JEE Main",
                    count: "130+",
                    emoji: "⚗️",
                    href: "/exams?category=jee",
                  },
                  {
                    name: "JEE Advanced",
                    count: "80+",
                    emoji: "🔬",
                    href: "/exams?category=jee",
                  },
                  {
                    name: "GATE CS/IT",
                    count: "90+",
                    emoji: "💻",
                    href: "/exams?category=gate",
                  },
                  {
                    name: "GATE Mechanical",
                    count: "85+",
                    emoji: "⚙️",
                    href: "/exams?category=gate",
                  },
                ],
              },
            ].map(({ value, items }) => (
              <TabsContent key={value} value={value} className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {items.map((item) => (
                    <ExamCategoryCard key={item.name} {...item} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="text-center mt-10">
            <Link href="/exams">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 h-12 px-8 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
              >
                View All 30+ Categories
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 relative">
        <Separator className="absolute inset-x-0 top-0" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
              variant="secondary"
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
            >
              Get Started
            </Badge>
            <h2 className="font-sora text-4xl font-black">
              Up and running in 3 steps
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <Separator className="absolute top-6 left-1/2 -translate-x-1/2 w-full hidden sm:block" />

            <div className="grid sm:grid-cols-3 gap-10 relative z-10">
              {[
                {
                  step: "01",
                  title: "Create your account",
                  desc: "Sign up free in 30 seconds. No credit card needed to access hundreds of free tests.",
                  icon: UsersIcon,
                },
                {
                  step: "02",
                  title: "Pick your exam",
                  desc: "Browse tests by exam type. Start from syllabus-wise topics or full mock tests.",
                  icon: BookOpenIcon,
                },
                {
                  step: "03",
                  title: "Track and improve",
                  desc: "Get instant results with explanations. See your weak areas and improve with every attempt.",
                  icon: BarChart3Icon,
                },
              ].map(({ step, title, desc, icon: Icon }) => (
                <div key={step} className="text-center space-y-4">
                  <div className="relative mx-auto h-14 w-14">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background text-primary text-[10px] font-black flex items-center justify-center border border-primary/30">
                      {step.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary/60 tracking-widest uppercase mb-2">
                      Step {step}
                    </p>
                    <h3 className="font-bold text-foreground text-base mb-2">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-24 relative">
        <Separator className="absolute inset-x-0 top-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge
              variant="secondary"
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
            >
              Success Stories
            </Badge>
            <h2 className="font-sora text-4xl font-black">
              Loved by toppers 🏆
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Testimonial
              quote="QuizNow's bilingual tests and NTA-style UI gave me the confidence I needed. Cleared UPSC CSE with AIR 34!"
              name="Priya Sharma"
              exam="UPSC CSE 2024"
              rank="AIR 34"
              avatar="P"
            />
            <Testimonial
              quote="The weak-area analytics are incredible. I knew exactly where to focus my last-month revision. Got 97.8 percentile in CAT."
              name="Rahul Verma"
              exam="CAT 2024"
              rank="97.8 percentile"
              avatar="R"
            />
            <Testimonial
              quote="Attempted 200+ SSC CGL mocks on QuizNow. The leaderboard kept me competitive. Selected in the final merit list!"
              name="Anjali Singh"
              exam="SSC CGL 2024"
              rank="Selected ✓"
              avatar="A"
            />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <Separator className="absolute inset-x-0 top-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="absolute inset-0 grid-bg opacity-30" />

        {/* Large glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge
            variant="secondary"
            className="mb-8 px-4 py-2 text-xs font-semibold"
          >
            <FlameIcon className="h-3.5 w-3.5 mr-2 text-primary" />
            Your rank is within reach
          </Badge>

          <h2 className="font-sora text-4xl sm:text-5xl font-black mb-4 leading-tight">
            Start your prep journey{" "}
            <span className="glow-text">today, for free.</span>
          </h2>

          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join 2 million aspirants who trust QuizNow for their exam
            preparation.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <Button className="shimmer-btn w-full sm:w-auto text-primary-foreground font-black gap-2 h-13 px-8 rounded-xl text-base shadow-xl border-0">
                <PlayCircleIcon className="h-5 w-5" />
                Start Free Today
              </Button>
            </Link>
            <Link href="/exams">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground gap-2 h-13 px-8 rounded-xl transition-all"
              >
                <BookOpenIcon className="h-5 w-5" />
                Browse Tests
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
            {["Free to start", "500+ free tests", "No credit card"].map((t) => (
              <div
                key={t}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
