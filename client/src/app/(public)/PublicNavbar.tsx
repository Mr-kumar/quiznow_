"use client";

/**
 * app/(public)/PublicNavbar.tsx
 *
 * Client component for the public navbar.
 * Handles scroll-based shadow + mobile hamburger menu.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ZapIcon,
  MenuIcon,
  XIcon,
  BookOpenIcon,
  CrownIcon,
  LogInIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/exams", label: "Browse Exams", icon: BookOpenIcon },
  { href: "/plans", label: "Pricing", icon: CrownIcon },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-shadow",
        scrolled && "shadow-sm border-b border-slate-200 dark:border-slate-800",
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <ZapIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              QuizNow
            </span>
          </Link>

          {/* Desktop Links & Search */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-1 relative group">
              {/* Exams Dropdown (Testbook style) */}
              <div
                className={cn(
                  "px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1 cursor-pointer",
                  pathname.startsWith("/exams")
                    ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/40"
                    : "text-slate-600 hover:text-blue-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-800",
                )}
              >
                Exams
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1 h-3 w-3 opacity-70 group-hover:rotate-180 transition-transform duration-200"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>

              {/* Mega Menu Dropdown */}
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
                <div className="w-[400px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {[
                      { value: "upsc", label: "UPSC", emoji: "🏛️" },
                      { value: "ssc", label: "SSC", emoji: "📋" },
                      { value: "banking", label: "Banking", emoji: "🏦" },
                      { value: "railways", label: "Railways", emoji: "🚂" },
                      { value: "gate", label: "GATE", emoji: "💻" },
                      { value: "neet", label: "NEET", emoji: "🧬" },
                      { value: "jee", label: "JEE", emoji: "⚗️" },
                      { value: "state", label: "State PSC", emoji: "🗺️" },
                    ].map((cat) => (
                      <Link
                        key={cat.value}
                        href={`/exams?category=${cat.value}`}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {cat.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href="/exams"
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1"
                    >
                      <BookOpenIcon className="h-4 w-4" />
                      Browse all exams
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                href="/plans"
                className={cn(
                  "px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5",
                  pathname.startsWith("/plans")
                    ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
                    : "text-slate-600 hover:text-amber-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-amber-400 dark:hover:bg-slate-800",
                )}
              >
                <CrownIcon className="h-3.5 w-3.5" />
                Pricing
              </Link>
              <Link
                href="/#features"
                className="px-3 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-all duration-300"
              >
                Features
              </Link>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className={cn(
                    pathname.startsWith("/login")
                      ? "bg-blue-600 text-white"
                      : "bg-linear-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 text-slate-700 dark:text-slate-300",
                    "dark:hover:text-white font-medium px-4",
                  )}
                >
                  Log in
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full px-6 shadow-sm hover:shadow-md transition-all duration-300">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="p-2 -mr-2 rounded-md text-slate-600 focus:outline-hidden hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-4 shadow-xl">
          <div className="flex flex-col space-y-2">
            <Link
              href="/exams"
              className="px-4 py-3 rounded-xl text-base font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 dark:text-slate-200 dark:bg-slate-900 flex items-center gap-3"
            >
              <BookOpenIcon className="h-5 w-5 text-blue-500" />
              Browse Exams
            </Link>
            <Link
              href="/plans"
              className="px-4 py-3 rounded-xl text-base font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 dark:text-slate-200 dark:bg-slate-900 flex items-center gap-3"
            >
              <CrownIcon className="h-5 w-5 text-amber-500" />
              Pricing Plans
            </Link>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link href="/login" className="w-full">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-base font-medium"
              >
                Log in
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button className="w-full h-12 rounded-xl bg-blue-600 text-white text-base font-semibold shadow-md">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
