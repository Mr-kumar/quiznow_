"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h1>

        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {error.message || "An unexpected error occurred"}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Home
          </button>

          <button
            onClick={reset}
            className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
