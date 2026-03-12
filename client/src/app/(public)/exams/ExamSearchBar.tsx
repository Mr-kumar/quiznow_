"use client";

/**
 * app/(public)/exams/ExamSearchBar.tsx
 *
 * Client component for search input on the exams page.
 * Dark-first design with amber accent. Debounces and pushes URL search params.
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
  const [isFocused, setIsFocused] = useState(false);

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
    <div className="relative max-w-xl mx-auto group">
      {/* Ambient glow when focused */}
      <div
        className={`absolute -inset-px rounded-xl bg-gradient-to-r from-amber-500/40 via-orange-500/20 to-amber-500/40 blur-sm transition-opacity duration-300 ${
          isFocused ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative flex items-center rounded-xl border transition-all duration-300 ${
          isFocused
            ? "border-amber-500/40 bg-white/[0.07]"
            : "border-white/[0.08] bg-white/[0.04]"
        }`}
      >
        {isPending ? (
          <Loader2Icon className="h-4.5 w-4.5 text-amber-400 ml-4 shrink-0 animate-spin" />
        ) : (
          <SearchIcon
            className={`h-4.5 w-4.5 ml-4 shrink-0 transition-colors ${
              isFocused ? "text-amber-400" : "text-slate-500"
            }`}
            style={{ height: "1.125rem", width: "1.125rem" }}
          />
        )}

        <Input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search exams, series..."
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm h-11 px-3 shadow-none placeholder:text-slate-600 text-white w-full"
        />

        {value && !isPending && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 mr-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => setValue("")}
          >
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}