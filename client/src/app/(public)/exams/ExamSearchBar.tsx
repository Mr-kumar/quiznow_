"use client";

/**
 * app/(public)/exams/ExamSearchBar.tsx
 *
 * Client component for search input on the exams page.
 * Modern clean design with shadcn components. Debounces and pushes URL search params.
 */

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SearchIcon, XIcon, Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="relative max-w-xl mx-auto">
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative flex items-center">
            {/* Search Icon */}
            <div className="absolute left-3 z-10">
              {isPending ? (
                <Loader2Icon className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <SearchIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Input */}
            <Input
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search exams, series..."
              className="pl-10 pr-10 h-12 border-0 focus-visible:ring-0 bg-transparent text-base placeholder:text-muted-foreground"
            />

            {/* Clear Button */}
            {value && !isPending && (
              <div className="absolute right-2 z-10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => setValue("")}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search suggestions hint */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 z-20">
          <Card className="border shadow-lg">
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground mb-2">
                  Popular searches:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "UPSC CSE",
                    "JEE Main",
                    "NEET PG",
                    "IBPS PO",
                    "SSC CGL",
                  ].map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      onClick={() => setValue(term)}
                      className="text-xs"
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
