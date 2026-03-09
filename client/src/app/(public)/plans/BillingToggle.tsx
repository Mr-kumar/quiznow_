"use client";

/**
 * app/(public)/plans/BillingToggle.tsx
 *
 * Monthly / Yearly billing toggle for the plans page.
 * Updates price display using data attributes (no server round-trip).
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function BillingToggle() {
  const [isYearly, setIsYearly] = useState(false);

  const handleToggle = (yearly: boolean) => {
    setIsYearly(yearly);

    // Update all price displays using data attributes
    document.querySelectorAll("[data-monthly]").forEach((el) => {
      const target = el as HTMLElement;
      target.textContent = yearly
        ? (target.dataset.yearly ?? target.dataset.monthly ?? "")
        : (target.dataset.monthly ?? "");
    });

    document.querySelectorAll("[data-yearly-note]").forEach((el) => {
      (el as HTMLElement).style.display = yearly ? "" : "none";
    });
  };

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => handleToggle(false)}
        className={cn(
          "text-sm font-medium transition-colors",
          !isYearly
            ? "text-slate-900 dark:text-white"
            : "text-slate-400 dark:text-slate-500",
        )}
      >
        Monthly
      </button>

      <button
        type="button"
        onClick={() => handleToggle(!isYearly)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          isYearly ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700",
        )}
        role="switch"
        aria-checked={isYearly}
        aria-label="Toggle yearly billing"
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
            isYearly ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>

      <button
        type="button"
        onClick={() => handleToggle(true)}
        className={cn(
          "flex items-center gap-2 text-sm font-medium transition-colors",
          isYearly
            ? "text-slate-900 dark:text-white"
            : "text-slate-400 dark:text-slate-500",
        )}
      >
        Yearly
        <Badge className="bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-transparent text-[10px] px-1.5 py-0">
          Save 30%
        </Badge>
      </button>
    </div>
  );
}
