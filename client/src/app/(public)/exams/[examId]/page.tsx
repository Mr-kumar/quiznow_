/**
 * app/(public)/exams/[examId]/page.tsx
 *
 * Exam Detail Page — shows all test series for a specific exam.
 * Dark-first · Amber accent · Sora + DM Sans typography
 * URL: /exams/[examId]
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BookOpenIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LockIcon,
  PlayCircleIcon,
  LayersIcon,
  CalendarIcon,
  TrophyIcon,
  UsersIcon,
  ChevronRightIcon,
  SparklesIcon,
  BarChart3Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Exam, TestSeries } from "@/api/test-types";

// ── Data fetching ─────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function getExam(examId: string): Promise<Exam | null> {
  try {
    const res = await fetch(`${API}/exams/${examId}`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error();
    const json = await res.json();
    return (json?.data ?? json) as Exam;
  } catch {
    return null;
  }
}

async function getSeriesForExam(examId: string): Promise<TestSeries[]> {
  try {
    const res = await fetch(`${API}/public/test-series?examId=${examId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error();
    const json = await res.json();
    return ((json?.data ?? json) as TestSeries[]) ?? [];
  } catch {
    return [];
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ examId: string }>;
}): Promise<Metadata> {
  const { examId } = await params;
  const exam = await getExam(examId);
  if (!exam) return { title: "Exam Not Found | QuizNow" };
  return {
    title: `${exam.name} Mock Tests & Practice Papers | QuizNow`,
    description: `Prepare for ${exam.name} with India's best mock tests. NTA-style, bilingual, instant results.`,
    openGraph: {
      title: `${exam.name} Mock Tests | QuizNow`,
      description: `Practice with ${exam.name} mock tests. Instant results and detailed analytics.`,
    },
  };
}

// ── Series card ───────────────────────────────────────────────────────────────

function SeriesCard({ series, index }: { series: TestSeries; index: number }) {
  // Cycle through subtle accent colors for visual variety
  const accents = [
    "from-amber-500 to-orange-600",
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-green-600",
    "from-rose-500 to-pink-600",
    "from-orange-500 to-red-600",
  ];
  const accent = accents[index % accents.length];

  return (
    <div className="group relative rounded-2xl border border-white/6 bg-white/2 overflow-hidden hover:border-amber-500/20 hover:bg-white/4 transition-all duration-300 flex flex-col">
      {/* Top color bar */}
      <div
        className={`h-1 w-full bg-linear-to-r ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Thumbnail */}
      <div className="h-24 relative overflow-hidden bg-white/2 flex items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div
            className={`absolute top-0 right-0 h-20 w-20 rounded-full bg-linear-to-br ${accent} blur-xl`}
          />
        </div>
        <div
          className={`relative h-12 w-12 rounded-xl bg-linear-to-br ${accent} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <LayersIcon className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="text-sm font-bold text-white leading-snug mb-1">
            {series.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <CalendarIcon className="h-3 w-3" />
            <span>{new Date(series.createdAt).getFullYear()}</span>
            <span className="text-white/10">·</span>
            <LayersIcon className="h-3 w-3" />
            <span>{series.testCount ?? "—"} tests</span>
          </div>
        </div>

        <Link href={`/series/${series.id}`} className="mt-auto">
          <Button
            size="sm"
            className="w-full h-9 text-xs font-bold gap-1.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-amber-500 hover:text-[#080c18] hover:border-amber-500 transition-all duration-200"
          >
            <PlayCircleIcon className="h-3 w-3" />
            View Tests
            <ArrowRightIcon className="h-3 w-3 ml-auto" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Stat pill ──────────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-white/4 border border-white/6 rounded-xl px-4 py-3">
      <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-amber-400" />
      </div>
      <div>
        <p className="text-base font-black text-white tabular-nums">{value}</p>
        <p className="text-[10px] text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const [exam, seriesList] = await Promise.all([
    getExam(examId),
    getSeriesForExam(examId),
  ]);
  if (!exam) notFound();

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${exam.name} Mock Tests`,
    description: `Practice for ${exam.name} with NTA-style mock tests`,
    provider: {
      "@type": "Organization",
      name: "QuizNow",
      url: "https://quiznow.in",
    },
  };

  return (
    <>
      <JsonLd data={courseSchema} />
      <div className="min-h-screen bg-[#080c18] text-white font-dm">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
          .font-sora { font-family: 'Sora', sans-serif; }
          .font-dm { font-family: 'DM Sans', sans-serif; }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          @keyframes pulse-slow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
          @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
          .float-1 { animation: float 6s ease-in-out infinite; }
          .float-2 { animation: float 8s ease-in-out infinite 1s; }
          .float-3 { animation: float 7s ease-in-out infinite 2s; }
          .glow-text {
            background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .grid-bg {
            background-image: 
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 40px 40px;
          }
        `}</style>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#080c18]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-48 bg-amber-600/8 rounded-full blur-[80px]" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-600 mb-6">
              <Link href="/" className="hover:text-amber-400 transition-colors">
                Home
              </Link>
              <ChevronRightIcon className="h-3 w-3" />
              <Link
                href="/exams"
                className="hover:text-amber-400 transition-colors"
              >
                Exams
              </Link>
              <ChevronRightIcon className="h-3 w-3" />
              <span className="text-slate-400">{exam.name}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="space-y-4 flex-1">
                {/* Icon + Title */}
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-900/30 shrink-0">
                    <BookOpenIcon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    {exam.category && (
                      <span className="inline-block text-[10px] font-bold text-amber-400/80 uppercase tracking-widest mb-1">
                        {exam.category.name}
                      </span>
                    )}
                    <h1 className="font-sora text-2xl sm:text-3xl font-black text-white leading-tight">
                      {exam.name}
                    </h1>
                  </div>
                </div>

                {/* Stat pills */}
                <div className="flex flex-wrap gap-3">
                  <StatPill
                    icon={LayersIcon}
                    value={`${seriesList.length}`}
                    label="Test Series"
                  />
                  <StatPill
                    icon={BarChart3Icon}
                    value="NTA-Style"
                    label="Interface"
                  />
                  <StatPill icon={UsersIcon} value="2M+" label="Aspirants" />
                </div>
              </div>

              <Link href="/exams" className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-9 rounded-xl border-white/10 text-slate-400 hover:text-white hover:border-amber-500/30 hover:bg-white/5"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  All Exams
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {seriesList.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center py-24 text-center">
              <div className="relative h-20 w-20 mb-6">
                <div className="h-20 w-20 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center">
                  <BookOpenIcon className="h-9 w-9 text-slate-600" />
                </div>
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <span className="text-[10px]">🔜</span>
                </div>
              </div>
              <h2 className="font-sora text-xl font-black text-white mb-3">
                No test series yet
              </h2>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
                We're adding {exam.name} series soon. Check back shortly or
                browse other exams.
              </p>
              <Link href="/exams">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-white/10 text-slate-400 hover:text-white hover:border-amber-500/30"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  Browse Other Exams
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-500">
                  <span className="text-white font-bold">
                    {seriesList.length}
                  </span>{" "}
                  series available
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <TrophyIcon className="h-3.5 w-3.5 text-amber-500/50" />
                  Most popular first
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {seriesList.map((s, i) => (
                  <SeriesCard key={s.id} series={s} index={i} />
                ))}
              </div>
            </>
          )}

          {/* ── Premium CTA ───────────────────────────────────────────────── */}
          <div className="mt-12 relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-amber-950/50 to-orange-950/30" />
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[60px]" />

            <div className="relative z-10 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
                  <LockIcon className="h-3 w-3" />
                  Premium Access
                </div>
                <h3 className="font-sora text-xl font-black text-white mb-2">
                  Unlock all premium {exam.name} series
                </h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Unlimited access to {exam.name} and 30+ exam categories. PDF
                  solutions, video explanations included.
                </p>
              </div>
              <Link href="/plans" className="shrink-0">
                <Button className="bg-linear-to-r from-amber-500 to-orange-500 text-[#080c18] font-black gap-2 h-12 px-8 rounded-xl hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/30 border-0 whitespace-nowrap">
                  View Plans
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
