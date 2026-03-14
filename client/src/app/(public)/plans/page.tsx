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
import { PlansCTA } from "@/app/(public)/plans/PlansCTA";

export const metadata: Metadata = {
  title: "Pricing Plans | QuizNow — Unlock All Exam Tests",
  description:
    "Choose the plan that fits your preparation. Start free, upgrade anytime.",
};

const STYLE_PROFILES = [
  {
    icon: BookOpenIcon,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-200 dark:border-slate-700",
    ctaClass:
      "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white",
  },
  {
    icon: ZapIcon,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    borderColor: "border-blue-300 dark:border-blue-700",
    ctaClass:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25",
  },
  {
    icon: CrownIcon,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    borderColor: "border-amber-300 dark:border-amber-700",
    ctaClass:
      "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25",
  },
];

const DEFAULT_FEATURES = [
  "Unlimited premium tests",
  "Detailed performance analytics",
  "Personalised weak area insights",
  "Priority support",
];

function formatDuration(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return years === 1 ? "1 Year" : `${years} Years`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 Month" : `${months} Months`;
  }
  return `${days} Days`;
}

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

async function getPlans() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch (error) {
    return [];
  }
}

export default async function PlansPage() {
  const plansData = await getPlans();
  const plans = plansData.length > 0 ? plansData : []; // API returns empty array if no plans

  const allFeatures = new Set<string>();
  plans.forEach((p: any) => {
    (p.features?.length > 0 ? p.features : DEFAULT_FEATURES).forEach(
      (f: string) => allFeatures.add(f),
    );
  });
  const comparisonFeatures = Array.from(allFeatures);

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      {/* Hero */}
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
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 justify-center gap-6 items-start">
          {plans.map((plan: any, index: number) => {
            const style =
              STYLE_PROFILES[Math.min(index, STYLE_PROFILES.length - 1)];
            const Icon = style.icon;
            const features =
              plan.features?.length > 0 ? plan.features : DEFAULT_FEATURES;
            const showPopular = plan.isPopular || plan.durationDays > 30;
            const badgeText =
              plan.badge || (showPopular ? "Most Popular" : null);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 bg-white dark:bg-slate-900 p-6 flex flex-col h-full ${style.borderColor} ${showPopular ? "shadow-xl ring-1 ring-blue-500/20 scale-[1.02]" : ""}`}
              >
                {badgeText && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-transparent px-3 text-xs gap-1">
                      <StarIcon className="h-3 w-3 fill-current" />
                      {badgeText}
                    </Badge>
                  </div>
                )}

                <div className="space-y-3 mb-5">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${style.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${style.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {plan.description || "Unlock premium test series access"}
                    </p>
                  </div>
                  <div className="flex items-end gap-1.5 pt-2">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      ₹{plan.price}
                    </span>
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-1.5">
                      / {formatDuration(plan.durationDays)}
                    </span>
                  </div>
                </div>

                <PlansCTA
                  planId={plan.id}
                  planName={plan.name}
                  price={plan.price}
                  ctaClass={style.ctaClass}
                />

                <Separator className="mb-4" />

                <ul className="space-y-3 flex-1">
                  {features.map((f: string) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-snug"
                    >
                      <CheckIcon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {plans.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <CrownIcon className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                No plans available
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Check back later for new premium subscriptions!
              </p>
            </div>
          )}
        </div>

        {/* Feature Comparison */}
        {plans.length > 1 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 text-center">
              Compare Features
            </h2>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[200px]">
                        Feature
                      </th>
                      {plans.map((p: any) => (
                        <th
                          key={p.id}
                          className="px-5 py-3.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium tracking-wide text-xs uppercase">
                        Price
                      </td>
                      {plans.map((p: any) => (
                        <td
                          key={p.id}
                          className="px-5 py-3 text-center font-bold"
                        >
                          ₹{p.price}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium tracking-wide text-xs uppercase">
                        Duration
                      </td>
                      {plans.map((p: any) => (
                        <td key={p.id} className="px-5 py-3 text-center">
                          {formatDuration(p.durationDays)}
                        </td>
                      ))}
                    </tr>
                    {comparisonFeatures.map((feature: string) => (
                      <tr
                        key={feature}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                          {feature}
                        </td>
                        {plans.map((p: any) => {
                          const pFeatures =
                            p.features?.length > 0
                              ? p.features
                              : DEFAULT_FEATURES;
                          return (
                            <td key={p.id} className="px-5 py-3 text-center">
                              <CheckOrX value={pFeatures.includes(feature)} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FAQs */}
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

        {/* Final CTA */}
        <div className="text-center py-8 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-6">
          <h3 className="text-xl font-bold text-white mb-2">
            Still not sure? Start free today.
          </h3>
          <p className="text-blue-100 text-sm mb-5">
            100+ free tests available. No credit card needed.
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
