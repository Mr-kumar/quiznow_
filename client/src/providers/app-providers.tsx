"use client";

import { QueryProvider } from "./query-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      {/*
       * Toaster MUST live inside the provider tree, not in layout.tsx directly,
       * because it needs access to the React context tree.
       * All calls to toast.success() / toast.error() from feature mutation hooks
       * and pages will render here.
       */}
      <Toaster richColors position="top-right" closeButton />
    </QueryProvider>
  );
}
