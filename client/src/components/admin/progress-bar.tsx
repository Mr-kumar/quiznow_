import React from "react";

interface ProgressBarProps {
  percentage: number;
  color?: "green" | "blue" | "purple" | "orange";
  label?: string;
  value?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  percentage,
  color = "blue",
  label,
  value,
  showLabel = true,
}: ProgressBarProps) {
  const colorClasses = {
    green: "from-green-500 to-green-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </span>
          {value && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {value}
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
        <div
          className={`bg-gradient-to-r ${colorClasses[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
      </div>
    </div>
  );
}
