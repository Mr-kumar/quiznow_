"use client";

/**
 * components/shared/SubscriptionGate.tsx
 *
 * Wraps premium content with a lock overlay when the student isn't subscribed.
 * Used on:
 *  - Test series list page — locks premium series cards
 *  - Individual test cards — shows Subscribe CTA
 *  - Test instructions page — blocks Start button
 *
 * Behaviour:
 *  - isPremium=false OR isSubscribed=true → renders children normally
 *  - isPremium=true AND isSubscribed=false → renders blurred children + lock overlay
 *
 * The blur keeps the content visible enough to be enticing but unreadable.
 */

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LockIcon, SparklesIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";

// ── Props ─────────────────────────────────────────────────────────────────────

interface SubscriptionGateProps {
  /** True if this content requires a paid subscription */
  isPremium: boolean;
  /** True if the current user has an active subscription. If undefined, it will be fetched on the client. */
  isSubscribed?: boolean;
  children: React.ReactNode;
  /**
   * "overlay" (default) — blurs children and shows lock over them
   * "replace" — hides children entirely, shows subscribe card
   * "inline"  — shows a small lock badge inline (for table rows etc.)
   */
  variant?: "overlay" | "replace" | "inline";
  /** Custom subscribe CTA text */
  ctaText?: string;
  /** Custom plans page link */
  plansHref?: string;
  className?: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PremiumBadge() {
  return (
    <Badge className="gap-1 bg-amber-500 text-white border-transparent text-[10px] px-1.5">
      <SparklesIcon className="h-2.5 w-2.5" />
      Premium
    </Badge>
  );
}

function LockOverlayContent({
  ctaText,
  plansHref,
}: {
  ctaText: string;
  plansHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 p-6">
      {/* Lock icon */}
      <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center">
        <LockIcon className="h-5 w-5 text-amber-500" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Premium Content
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[180px]">
          Subscribe to unlock this test and 500+ more
        </p>
      </div>

      <Link href={plansHref}>
        <Button
          size="sm"
          className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs"
        >
          <SparklesIcon className="h-3.5 w-3.5" />
          {ctaText}
        </Button>
      </Link>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SubscriptionGate({
  isPremium,
  isSubscribed: isSubscribedProp,
  children,
  variant = "overlay",
  ctaText = "View Plans",
  plansHref = "/plans",
  className,
}: SubscriptionGateProps) {
  // ✅ NEW: Client-side subscription fetch if not provided as prop
  const { isSubscribed: isSubscribedHook, isLoading } = useSubscription();
  const isSubscribed = isSubscribedProp ?? isSubscribedHook;

  // 1. Not gated — render children normally
  if (!isPremium || isSubscribed) {
    return <>{children}</>;
  }

  // 2. Loading state — show a subtle spinner or placeholder
  if (isLoading && isSubscribedProp === undefined) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-12 gap-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 animate-pulse",
          className
        )}
      >
        <Loader2Icon className="h-6 w-6 text-slate-400 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          Checking subscription...
        </p>
      </div>
    );
  }

  // ── Inline variant — just a badge, minimal footprint ───────────────────
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="opacity-40 pointer-events-none select-none flex-1">
          {children}
        </div>
        <PremiumBadge />
      </div>
    );
  }

  // ── Replace variant — hide children, show subscribe card ───────────────
  if (variant === "replace") {
    return (
      <div
        className={cn(
          "rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30",
          className
        )}
      >
        <LockOverlayContent ctaText={ctaText} plansHref={plansHref} />
      </div>
    );
  }

  // ── Overlay variant (default) — blur + lock on top of children ─────────
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Children — blurred and non-interactive */}
      <div
        className="blur-sm pointer-events-none select-none"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Premium badge in corner */}
      <div className="absolute top-3 right-3 z-10">
        <PremiumBadge />
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-slate-900/70 backdrop-blur-[2px] rounded-xl">
        <LockOverlayContent ctaText={ctaText} plansHref={plansHref} />
      </div>
    </div>
  );
}
