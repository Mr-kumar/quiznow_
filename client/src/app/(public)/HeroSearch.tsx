"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/exams?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/exams");
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="relative flex items-center bg-background/50 backdrop-blur-sm rounded-2xl border border-border p-2"
    >
      <SearchIcon className="h-5 w-5 text-muted-foreground ml-3 shrink-0" />
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What are you preparing for? (e.g. UPSC, SSC CGL...)"
        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base h-12 px-4 shadow-none placeholder:text-muted-foreground text-foreground w-full"
      />
      <Button
        type="submit"
        className="shimmer-btn h-12 px-7 rounded-xl font-bold text-primary-foreground text-sm shrink-0 shadow-lg hover:shadow-xl border-0"
      >
        Start Prep
      </Button>
    </form>
  );
}
