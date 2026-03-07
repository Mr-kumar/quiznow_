import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrowthIndicatorProps {
  value: number;
  label: string;
}

export function GrowthIndicator({ value, label }: GrowthIndicatorProps) {
  if (value > 0) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <ArrowUpRight className="h-3 w-3 text-emerald-500 shrink-0" />
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          +{value}% {label}
        </span>
      </div>
    );
  }
  if (value < 0) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <ArrowDownRight className="h-3 w-3 text-red-500 shrink-0" />
        <span className="text-[11px] font-semibold text-red-500">
          {value}% {label}
        </span>
      </div>
    );
  }
  return null;
}

interface FormatNumberProps {
  value: number | undefined | null;
  suffix?: string;
}

export function FormatNumber({ value, suffix = "" }: FormatNumberProps) {
  if (value == null) return "—";
  return value.toLocaleString() + suffix;
}
