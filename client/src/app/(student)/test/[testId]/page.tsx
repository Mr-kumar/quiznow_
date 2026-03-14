//  Test Instructions + start button
/**
 * app/(student)/test/[testId]/page.tsx
 *
 * Test Instructions Page — SSR Server Component.
 *
 * Shows everything the student needs to know BEFORE starting:
 *  - Test title, duration, total marks, pass marks
 *  - Marking scheme table (positive / negative marks per section)
 *  - Section breakdown (questions per section, marks per question)
 *  - General exam rules
 *  - Language selection
 *  - CountdownBanner if test is scheduled in future
 *  - SubscriptionGate if test is premium
 *  - Start Test button — POSTs /tests/:id/start → redirects to attempt page
 *
 * This is NOT the exam room. Nothing interactive happens here except
 * clicking "Start Test". All heavy exam logic lives in attempt/page.tsx.
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  ClockIcon,
  BookOpenIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  TrophyIcon,
  MinusCircleIcon,
  XCircleIcon,
  InfoIcon,
  ListIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StartExamButton } from "@/app/(student)/test/[testId]/StartExamButton";
import { CountdownBanner } from "@/components/shared/CountdownBanner";
import { SubscriptionGate } from "@/components/shared/SubscriptionGate";
import type { ExamTest, ExamSection } from "@/types/exam";
import { LanguageToggle } from "@/features/exam/components/LanguageToggle";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ testId: string }>;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getTestData(testId: string): Promise<{
  test: ExamTest;
  sections: ExamSection[];
} | null> {
  try {
    // Read auth token from cookie (set by auth-store on login)
    const cookieStore = await cookies();
    const token = cookieStore.get("qn_token")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const [testRes, sectionsRes] = await Promise.all([
      fetch(`${apiUrl}/student/tests/${testId}`, {
        headers,
        next: { revalidate: 60 }, // cache for 60s — test config rarely changes
      }),
      fetch(`${apiUrl}/student/tests/${testId}/sections`, {
        headers,
        next: { revalidate: 60 },
      }),
    ]);

    if (!testRes.ok) {
      return null;
    }

    const testJson = await testRes.json();
    const sectionsJson = sectionsRes.ok ? await sectionsRes.json() : [];

    // Student API returns { success: true, data: test } structure
    const test: ExamTest = testJson?.data ?? testJson;
    const sections: ExamSection[] = (sectionsJson?.data ?? sectionsJson) || [];

    return {
      test,
      sections: sections.sort((a, b) => a.order - b.order),
    };
  } catch (error) {
    console.error("Error in getTestData:", error);
    return null;
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { testId } = await params;
  const data = await getTestData(testId);

  if (!data) {
    return { title: "Test Not Found | QuizNow" };
  }

  return {
    title: `${data.test.title} — Instructions | QuizNow`,
    description: `${data.test.durationMins} minutes · ${data.sections.reduce(
      (n, s) => n + s.questions.length,
      0
    )} questions · ${data.test.totalMarks} marks`,
    robots: { index: false }, // instructions page is not for public indexing
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} minutes`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoCard({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span
        className={`text-xl font-bold ${
          valueColor ?? "text-slate-900 dark:text-slate-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function RuleItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
      <CheckCircle2Icon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
      {text}
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TestInstructionsPage({ params }: PageProps) {
  const { testId } = await params;
  const data = await getTestData(testId);

  if (!data) notFound();

  const { test, sections } = data;

  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0);
  const isUpcoming = test.startAt ? new Date(test.startAt) > new Date() : false;
  const isExpired = test.endAt ? new Date(test.endAt) < new Date() : false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {/* Breadcrumb */}
              <p className="text-xs text-slate-400 dark:text-slate-500">
                <Link
                  href="/dashboard"
                  className="hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <span className="mx-1.5">›</span>
                <span>{test.series?.title ?? "Test Series"}</span>
              </p>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {test.title}
              </h1>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {test.isLive && (
                <Badge className="gap-1 bg-green-500 text-white border-transparent text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </Badge>
              )}
              {test.isPremium && (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-300 dark:border-amber-700 text-xs"
                >
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* ── Countdown banner (upcoming tests) ───────────────────────────── */}
        {isUpcoming && test.startAt && (
          <CountdownBanner
            targetTime={new Date(test.startAt)}
            testTitle={test.title}
          />
        )}

        {/* ── Expired notice ──────────────────────────────────────────────── */}
        {isExpired && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3">
            <AlertTriangleIcon className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
              This test has ended and is no longer accepting submissions.
            </p>
          </div>
        )}

        {/* ── Quick stats grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoCard
            icon={ClockIcon}
            label="Duration"
            value={formatDuration(test.durationMins)}
          />
          <InfoCard
            icon={BookOpenIcon}
            label="Questions"
            value={String(totalQuestions)}
          />
          <InfoCard
            icon={TrophyIcon}
            label="Total Marks"
            value={String(test.totalMarks)}
          />
          <InfoCard
            icon={CheckCircle2Icon}
            label="Pass Marks"
            value={String(test.passMarks)}
            valueColor="text-green-600 dark:text-green-400"
          />
        </div>

        {/* ── Marking scheme ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <InfoIcon className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Marking Scheme
            </h2>
          </div>
          <div className="flex divide-x divide-slate-100 dark:divide-slate-800">
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Correct
                </span>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                +{test.positiveMark ?? 4}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-1">
              <div className="flex items-center gap-1.5">
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Wrong
                </span>
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                -{test.negativeMark}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-1">
              <div className="flex items-center gap-1.5">
                <MinusCircleIcon className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Skipped
                </span>
              </div>
              <span className="text-2xl font-bold text-slate-400 dark:text-slate-500">
                0
              </span>
            </div>
          </div>
        </div>

        {/* ── Section breakdown ────────────────────────────────────────────── */}
        {sections.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <ListIcon className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Section Breakdown
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {section.name}
                  </span>
                  <div className="flex items-center gap-4">
                    {section.durationMins && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        <ClockIcon className="h-3 w-3 inline mr-1" />
                        {section.durationMins}m
                      </span>
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {section.questions.length} Qs
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {(test.positiveMark ?? 4) * section.questions.length}{" "}
                      marks
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── General instructions ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            General Instructions
          </h2>
          <ul className="space-y-2.5">
            <RuleItem
              text={`This test contains ${totalQuestions} questions to be answered in ${formatDuration(
                test.durationMins
              )}.`}
            />
            <RuleItem
              text={`Each correct answer carries ${
                test.positiveMark ?? 4
              } marks. Each wrong answer deducts ${test.negativeMark} marks.`}
            />
            <RuleItem text="You can navigate freely between sections and questions at any time." />
            <RuleItem text="Use 'Mark for Review' to flag questions you want to revisit before submitting." />
            <RuleItem text="The timer runs continuously. The exam auto-submits when time runs out." />
            <RuleItem text="Do not refresh or close the browser tab during the exam — your answers are saved automatically." />
            <RuleItem text="Switching tabs or leaving fullscreen will be flagged as suspicious activity." />
            <RuleItem
              text={`You need ${test.passMarks} marks to pass this test.`}
            />
          </ul>
        </div>

        <Separator />

        {/* ── Language Selection ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-4 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Select Exam Language
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[400px]">
              Choose your preferred language for the questions. You can also
              switch languages dynamically anytime during the test.
            </p>
          </div>
          <LanguageToggle />
        </div>

        <Separator />

        {/* ── Start button (or gates) ──────────────────────────────────────── */}
        <SubscriptionGate
          isPremium={test.isPremium}
          variant="replace"
          ctaText="Subscribe to Unlock"
        >
          <Suspense
            fallback={
              <div className="h-12 w-full rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
            }
          >
            <StartExamButton
              testId={test.id}
              testTitle={test.title}
              durationMins={test.durationMins}
              isPremium={test.isPremium}
              isDisabled={isUpcoming || isExpired}
              disabledReason={
                isExpired
                  ? "Test Has Ended"
                  : isUpcoming
                  ? "Test Starts Soon"
                  : undefined
              }
            />
          </Suspense>
        </SubscriptionGate>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pb-4">
          By starting, you agree that your answers will be recorded and
          evaluated automatically.
        </p>
      </div>
    </div>
  );
}
