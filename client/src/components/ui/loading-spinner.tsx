"use client";

/**
 * components/ui/loading-spinner.tsx
 *
 * Shared loading spinner component to eliminate duplicates across
 * public, student, and dashboard routes.
 */

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
