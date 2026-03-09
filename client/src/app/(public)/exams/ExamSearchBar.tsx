"use client";

/**
 * app/(public)/exams/ExamSearchBar.tsx
 *
 * Client component for search input on the exams page.
 * Debounces input and pushes URL search params.
 */

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SearchIcon, XIcon, Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ExamSearchBarProps {
  defaultValue?: string;
  defaultCategory?: string;
}

export function ExamSearchBar({
  defaultValue = "",
  defaultCategory,
}: ExamSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  // Debounce: push to URL 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (defaultCategory) params.set("category", defaultCategory);
      if (value.trim()) params.set("q", value.trim());

      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative max-w-xl mx-auto">
      <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search exams, series..."
        className="pl-10 pr-10 h-11 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-xl"
      />
      {isPending && (
        <Loader2Icon className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
      )}
      {!isPending && value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => setValue("")}
        >
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
