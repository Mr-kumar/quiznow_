/**
 * app/(public)/plans/page.tsx
 *
 * Pricing Plans Page — shows subscription options.
 *
 * Layout:
 *  [Hero — "Simple, transparent pricing"]
 *  [Billing toggle — Monthly / Yearly]
 *  [Plans grid — Free, Pro, Ultimate]
 *  [Feature comparison table — full checklist]
 *  [FAQ section]
 *  [Final CTA]
 *
 * Server Component — fetches plan data from API.
 * Falls back to static fallback plans if API is unavailable.
 */

import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckIcon,
  XIcon,
  ZapIcon,
  CrownIcon,
  StarIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  HeadphonesIcon,
  BookOpenIcon,
  BarChart3Icon,
  DownloadIcon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BillingToggle } from "@/app/(public)/plans/BillingToggle";

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Pricing Plans | QuizNow — Unlock All Exam Tests",
  description:
    "Choose the plan that fits your preparation. Start free, upgrade anytime.",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bgColor: string;
  borderColor: string;
  isPopular?: boolean;
  features: string[];
  notIncluded?: string[];
  ctaLabel: string;
  ctaClass: string;
}

// ── Static plan config ────────────────────────────────────────────────────────

const PLANS: Omit<Plan, "id">[] = [
  {
    name: "Free",
    tagline: "For aspirants just getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: BookOpenIcon,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-200 dark:border-slate-700",
    features: [
      "500+ free mock tests",
      "NTA-style exam interface",
      "Bilingual (EN + HI) questions",
      "Instant results & score",
      "Basic section breakdown",
      "5 leaderboard views/month",
    ],
    notIncluded: [
      "Full solutions with explanations",
      "Topic heatmap analytics",
      "Unlimited leaderboard access",
      "PDF download of solutions",
      "Priority support",
    ],
    ctaLabel: "Get Started Free",
    ctaClass:
      "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white",
  },
  {
    name: "Pro",
    tagline: "For serious exam aspirants",
    monthlyPrice: 299,
    yearlyPrice: 2499,
    icon: ZapIcon,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    borderColor: "border-blue-300 dark:border-blue-700",
    isPopular: true,
    features: [
      "Everything in Free",
      "All 1000+ premium tests",
      "Full solutions with explanations",
      "Topic heatmap & weak area analysis",
      "Unlimited leaderboard access",
      "Attempt history (all time)",
      "PDF download of solutions",
      "Email support (24h response)",
    ],
    ctaLabel: "Start Pro Plan",
    ctaClass:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25",
  },
  {
    name: "Ultimate",
    tagline: "For toppers who want everything",
    monthlyPrice: 499,
    yearlyPrice: 3999,
    icon: CrownIcon,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    borderColor: "border-amber-300 dark:border-amber-700",
    features: [
      "Everything in Pro",
      "All current & future test series",
      "Live test series (latest year papers)",
      "Video explanations for hard questions",
      "Performance comparison with toppers",
      "1-on-1 doubt sessions (2/month)",
      "WhatsApp support group",
      "Priority support (2h response)",
      "Early access to new test series",
    ],
    ctaLabel: "Go Ultimate",
    ctaClass:
      "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25",
  },
];

// ── Feature comparison ────────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  {
    feature: "Free mock tests",
    icon: BookOpenIcon,
    free: "500+",
    pro: "1000+",
    ultimate: "All",
  },
  {
    feature: "Premium test series",
    icon: ZapIcon,
    free: false,
    pro: true,
    ultimate: true,
  },
  {
    feature: "Full solutions + explanations",
    icon: BookOpenIcon,
    free: false,
    pro: true,
    ultimate: true,
  },
  {
    feature: "Bilingual (EN/HI)",
    icon: BookOpenIcon,
    free: true,
    pro: true,
    ultimate: true,
  },
  {
    feature: "Topic heatmap analytics",
    icon: BarChart3Icon,
    free: false,
    pro: true,
    ultimate: true,
  },
  {
    feature: "Leaderboard access",
    icon: UsersIcon,
    free: "5/month",
    pro: "Unlimited",
    ultimate: "Unlimited",
  },
  {
    feature: "PDF download",
    icon: DownloadIcon,
    free: false,
    pro: true,
    ultimate: true,
  },
  {
    feature: "Video explanations",
    icon: StarIcon,
    free: false,
    pro: false,
    ultimate: true,
  },
  {
    feature: "Doubt sessions",
    icon: HeadphonesIcon,
    free: false,
    pro: false,
    ultimate: "2/month",
  },
  {
    feature: "Priority support",
    icon: ShieldCheckIcon,
    free: false,
    pro: "Email 24h",
    ultimate: "WhatsApp 2h",
  },
];

function CheckOrX({ value }: { value: boolean | string }) {
  if (value === false)
    return (
      <XIcon className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" />
    );
  if (value === true)
    return <CheckIcon className="h-4 w-4 text-green-500 mx-auto" />;
  return (
    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
      {value}
    </span>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time. Unused days are prorated when upgrading.",
  },
  {
    q: "What payment methods do you accept?",
    a: "UPI, Net Banking, all major Credit/Debit cards, and Razorpay Pay Later. Instant activation on payment.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes — full refund within 7 days of purchase if you haven't attempted more than 3 premium tests.",
  },
  {
    q: "Do plans renew automatically?",
    a: "Yes, monthly and yearly plans auto-renew. You can disable auto-renewal anytime from your profile.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 py-14 text-center space-y-4 px-4">
        <Badge
          variant="outline"
          className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
        >
          Pricing
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          Simple, transparent pricing
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-lg mx-auto">
          Start free. Upgrade when you're ready to go all-in. Cancel anytime —
          no questions asked.
        </p>

        {/* Billing toggle — client component */}
        <div className="flex justify-center pt-2">
          <BillingToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* ── Plans grid ────────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-white dark:bg-slate-900 p-6 flex flex-col ${plan.borderColor} ${plan.isPopular ? "shadow-xl ring-1 ring-blue-500/20" : ""}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white border-transparent px-3 text-xs">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan header */}
                <div className="space-y-3 mb-5">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${plan.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${plan.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {plan.tagline}
                    </p>
                  </div>
                  {/* Price — updated by BillingToggle via data attribute */}
                  <div className="flex items-end gap-1.5">
                    {plan.monthlyPrice === 0 ? (
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        Free
                      </span>
                    ) : (
                      <>
                        <span
                          className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums"
                          data-monthly={`₹${plan.monthlyPrice}`}
                          data-yearly={`₹${Math.round(plan.yearlyPrice / 12)}`}
                        >
                          ₹{plan.monthlyPrice}
                        </span>
                        <span className="text-sm text-slate-400 dark:text-slate-500 mb-1">
                          /month
                        </span>
                      </>
                    )}
                  </div>
                  {plan.yearlyPrice > 0 && (
                    <p
                      className="text-xs text-green-600 dark:text-green-400 font-medium"
                      data-yearly-note={`₹${plan.yearlyPrice}/year — save ₹${plan.monthlyPrice * 12 - plan.yearlyPrice}`}
                    >
                      Save ₹{plan.monthlyPrice * 12 - plan.yearlyPrice} with
                      yearly plan
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Link href="/login" className="mb-5">
                  <Button className={`w-full gap-1.5 ${plan.ctaClass}`}>
                    {plan.ctaLabel}
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Button>
                </Link>

                <Separator className="mb-4" />

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <CheckIcon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded?.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-slate-400 dark:text-slate-600"
                    >
                      <XIcon className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── Comparison table ──────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 text-center">
            Full feature comparison
          </h2>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-2/5">
                      Feature
                    </th>
                    {["Free", "Pro", "Ultimate"].map((p) => (
                      <th
                        key={p}
                        className="px-5 py-3.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                      >
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {COMPARISON_ROWS.map(
                    ({ feature, icon: Icon, free, pro, ultimate }) => (
                      <tr
                        key={feature}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-5 py-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {feature}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <CheckOrX value={free} />
                        </td>
                        <td className="px-5 py-3 text-center bg-blue-50/50 dark:bg-blue-950/10">
                          <CheckOrX value={pro} />
                        </td>
                        <td className="px-5 py-3 text-center">
                          <CheckOrX value={ultimate} />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── FAQs ─────────────────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  {q}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <div className="text-center py-8 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-6">
          <h3 className="text-xl font-bold text-white mb-2">
            Still not sure? Start free today.
          </h3>
          <p className="text-blue-100 text-sm mb-5">
            500+ free tests available. No credit card needed.
          </p>
          <Link href="/login">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 gap-2 font-semibold">
              <ZapIcon className="h-4 w-4" />
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
