/**
 * app/(public)/page.tsx
 *
 * Modern Landing Page — clean, professional design with vibrant gradients
 * Light theme with purple/blue gradients and modern card layouts
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
  RocketIcon,
  LightbulbIcon,
  CodeIcon,
  GraduationCapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeroSearch } from "./HeroSearch";
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
      <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0 bg-linear-to-br from-white to-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-purple-100 to-blue-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-lg mb-1">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {count} tests available
              </p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-muted-foreground group-hover:text-purple-600 transition-colors" />
          </div>
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
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-linear-to-br from-purple-500 to-blue-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
        <span className="text-2xl font-bold tabular-nums">{number}</span>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
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
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-linear-to-br from-white to-gray-50">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            className={`h-16 w-16 rounded-2xl bg-linear-to-br ${accent} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
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
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Custom Styles ───────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes pulse-slow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .hero-gradient {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 50%, hsl(var(--accent)) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center bg-background">
        {/* Subtle background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5"></div>
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/3 blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <Badge className="mb-6 px-4 py-2 bg-primary text-primary-foreground">
            <AwardIcon className="h-4 w-4 mr-2" />
            India's #1 Exam Preparation Platform
            <SparkleIcon className="h-4 w-4 ml-2 animate-pulse" />
          </Badge>

          {/* Headline */}
          <h1 className="font-inter text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6">
            Your Journey to
            <br />
            <span className="hero-gradient">Exam Success</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
            Join{" "}
            <span className="font-semibold text-foreground">2 Million+</span>{" "}
            aspirants who've already cracked their exams. Practice with{" "}
            <span className="font-semibold text-primary">NTA-style tests</span>,
            get detailed analytics, and rank higher.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="shadow-lg">
              <CardContent className="p-2">
                <HeroSearch />
              </CardContent>
            </Card>
          </div>

          {/* Trending */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <TrendingUpIcon className="h-4 w-4 text-green-600" />
            <span>Trending now:</span>
            {["UPSC CSE", "JEE Main", "NEET PG", "IBPS PO"].map((e, i) => (
              <span key={e}>
                <Link
                  href={`/exams?q=${e}`}
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {e}
                </Link>
                {i < 3 && <span className="text-muted-foreground mx-2">·</span>}
              </span>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
            {[
              "NTA Pattern Tests",
              "Detailed Solutions",
              "All-India Rank",
              "Previous Year Papers",
            ].map((text) => (
              <div key={text} className="flex items-center gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="relative py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Trusted by Millions
            </h2>
            <p className="text-lg text-muted-foreground">
              Join the community of successful aspirants
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatBlock number="2M+" label="Registered Students" />
            <StatBlock number="50K+" label="Tests Available" />
            <StatBlock number="98%" label="Selection Rate" />
            <StatBlock number="4.9★" label="App Rating" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
              variant="secondary"
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
            >
              Why QuizNow?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything you need to
              <span className="hero-gradient ml-2">rank higher</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive preparation tools designed by experts to help you
              succeed
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TargetIcon,
                title: "NTA-Style Mock Tests",
                description:
                  "Pixel-perfect replicas of the actual exam interface. Practice exactly how you'll perform.",
                accent: "from-purple-500 to-blue-500",
              },
              {
                icon: BarChart3Icon,
                title: "Deep Analytics",
                description:
                  "Understand your weak areas with topic-wise accuracy, time analysis, and percentile tracking.",
                accent: "from-blue-500 to-cyan-500",
              },
              {
                icon: BrainIcon,
                title: "AI-Powered Insights",
                description:
                  "Get personalized study plans based on your performance patterns and exam date.",
                accent: "from-cyan-500 to-green-500",
              },
              {
                icon: GlobeIcon,
                title: "Bilingual Content",
                description:
                  "Switch between Hindi and English seamlessly. Every question available in both languages.",
                accent: "from-green-500 to-emerald-500",
              },
              {
                icon: ClockIcon,
                title: "Previous Year Papers",
                description:
                  "10+ years of solved papers with detailed explanations and video walkthroughs.",
                accent: "from-emerald-500 to-yellow-500",
              },
              {
                icon: TrophyIcon,
                title: "Live Leaderboards",
                description:
                  "Compete with lakhs of aspirants. Know your all-India rank after every test.",
                accent: "from-yellow-500 to-red-500",
              },
            ].map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAM CATEGORIES ───────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
              variant="secondary"
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
            >
              Popular Exams
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your
              <span className="hero-gradient ml-2">Exam Category</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive test series for all major competitive exams
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "UPSC CSE",
                count: "250+",
                emoji: "🏛️",
                href: "/exams?category=upsc",
              },
              {
                name: "JEE Main",
                count: "180+",
                emoji: "�",
                href: "/exams?category=jee",
              },
              {
                name: "NEET PG",
                count: "120+",
                emoji: "⚕️",
                href: "/exams?category=neet",
              },
              {
                name: "IBPS PO",
                count: "95+",
                emoji: "🏦",
                href: "/exams?category=ibps",
              },
              {
                name: "SSC CGL",
                count: "85+",
                emoji: "📋",
                href: "/exams?category=ssc",
              },
              {
                name: "CAT MBA",
                count: "65+",
                emoji: "📊",
                href: "/exams?category=cat",
              },
            ].map((exam) => (
              <ExamCategoryCard key={exam.name} {...exam} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="gap-2">
              View All Exams
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
              variant="secondary"
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
            >
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Start Your Journey in
              <span className="hero-gradient ml-2">3 Simple Steps</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From practice to perfection, we've got you covered every step of
              the way
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose Your Exam",
                desc: "Select from 50+ exam categories with comprehensive test series",
                icon: TargetIcon,
              },
              {
                step: "02",
                title: "Practice & Analyze",
                desc: "Take mock tests, get detailed analytics, and identify weak areas",
                icon: BarChart3Icon,
              },
              {
                step: "03",
                title: "Improve & Rank Higher",
                desc: "Follow personalized study plans and track your progress",
                icon: TrophyIcon,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <Card
                key={step}
                className="text-center border-0 bg-linear-to-br from-white to-gray-50"
              >
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-white text-xl font-bold mx-auto">
                      {step}
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {title}
                      </h3>
                      <p className="text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
              variant="secondary"
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
            >
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              What Our
              <span className="hero-gradient ml-2">Students Say</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real stories from aspirants who achieved their dream ranks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "QuizNow helped me crack UPSC CSE in my first attempt. The mock tests were exactly like the real exam!",
                name: "Rahul Sharma",
                exam: "UPSC CSE",
                rank: "AIR 127",
                avatar: "RS",
              },
              {
                quote:
                  "The detailed analytics showed my weak areas. After following the study plan, I improved my score by 45%.",
                name: "Priya Patel",
                exam: "JEE Main",
                rank: "99.2 Percentile",
                avatar: "PP",
              },
              {
                quote:
                  "Previous year papers with video solutions were game-changers. I cleared NEET PG with ease.",
                name: "Amit Kumar",
                exam: "NEET PG",
                rank: "AIR 89",
                avatar: "AK",
              },
            ].map((testimonial) => (
              <Card
                key={testimonial.name}
                className="border-0 bg-linear-to-br from-white to-gray-50"
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {testimonial.avatar}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.exam} • {testimonial.rank}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="border-0 bg-linear-to-br from-primary/5 to-primary/10">
            <CardContent className="p-12">
              <div className="space-y-6">
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold uppercase tracking-widest"
                >
                  Ready to Start?
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                  Begin Your Journey to
                  <span className="hero-gradient ml-2">Exam Success</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Join 2 Million+ aspirants and start practicing with the best
                  exam preparation platform
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button size="lg" className="gap-2 px-8">
                    <PlayCircleIcon className="h-5 w-5" />
                    Start Practicing
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 px-8">
                    <BookOpenIcon className="h-5 w-5" />
                    Browse Tests
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 pt-6 text-sm text-muted-foreground">
                  {[
                    "✓ Free Registration",
                    "✓ 50+ Free Tests",
                    "✓ No Credit Card Required",
                  ].map((text) => (
                    <span key={text}>{text}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
