"use client";

/**
 * PublicNavbar.tsx — Enhanced version
 *
 * Key differences from old version:
 *  - More nav links: Exams (mega menu), Practice, PYQ Papers, Rankings, Plans
 *  - "Exams" opens a VISUAL mega-menu (4-column card grid), NOT testbook's
 *    confusing sidebar + nested grid. Each category card has emoji, name,
 *    count, and clickable sub-exam pills — one click, no double hover.
 *  - Mobile: collapsible accordion for exam categories.
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ZapIcon,
  MenuIcon,
  XIcon,
  CrownIcon,
  ChevronDownIcon,
  TrophyIcon,
  FileTextIcon,
  BookOpenIcon,
  ChevronRightIcon,
  SearchIcon,
  ArrowRightIcon,
  GraduationCapIcon,
  FlameIcon,
  BarChart3Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EXAM_CATEGORIES } from "@/constants/exams";

const NAV_LINKS = [
  {
    href: "/practice",
    label: "Practice",
    icon: BookOpenIcon,
    desc: "Topic-wise questions",
  },
  {
    href: "/pyq",
    label: "PYQ Papers",
    icon: FileTextIcon,
    desc: "Previous year papers",
  },
  {
    href: "/rankings",
    label: "Rankings",
    icon: TrophyIcon,
    desc: "All-India leaderboard",
  },
  {
    href: "/plans",
    label: "Pricing",
    icon: CrownIcon,
    desc: "Plans & subscriptions",
    amber: true,
  },
];

// ─── Mega Menu ────────────────────────────────────────────────────────────────

function ExamMegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[min(96vw,920px)] z-50">
      <div className="relative">
        {/* Arrow pointer */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white dark:bg-slate-900 border-l border-t border-slate-200 dark:border-slate-700 rounded-sm" />
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Search row */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <SearchIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <Link
              href="/exams"
              onClick={onClose}
              className="flex-1 text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Search across 1500+ tests…
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
              <FlameIcon className="h-3 w-3" />
              Trending: UPSC CSE, SBI PO
            </div>
          </div>

          {/* 4-column category grid */}
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {EXAM_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className={cn(
                  "rounded-xl border p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                  cat.navbarBg,
                  cat.border,
                )}
              >
                {/* Header — links to category listing */}
                <Link
                  href={`/exams?category=${cat.id}`}
                  onClick={onClose}
                  className="flex items-center gap-2 mb-2.5 group"
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {cat.label}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {cat.count} tests
                    </p>
                  </div>
                  <ChevronRightIcon className="h-3 w-3 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors shrink-0" />
                </Link>

                {/* Sub-exam pills — direct links, no extra hover needed */}
                <div className="flex flex-wrap gap-1">
                  {cat.subs.slice(0, 4).map((sub) => (
                    <Link
                      key={sub}
                      href={`/exams?category=${cat.id}&q=${encodeURIComponent(sub)}`}
                      onClick={onClose}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-colors border border-white/60 dark:border-slate-700/40 whitespace-nowrap"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any exam category or sub-exam pill to jump straight in
            </p>
            <Link
              href="/exams"
              onClick={onClose}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Browse all exams
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PublicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileExamsOpen, setMobileExamsOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!megaOpen) return;
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [megaOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-all duration-200",
        scrolled &&
          "shadow-sm border-b border-slate-200/80 dark:border-slate-800/80",
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <ZapIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
              QuizNow
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* Exams mega menu trigger */}
            <div ref={megaRef} className="relative">
              <button
                type="button"
                onClick={() => setMegaOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 select-none",
                  megaOpen || pathname.startsWith("/exams")
                    ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                <GraduationCapIcon className="h-4 w-4" />
                Exams
                <ChevronDownIcon
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    megaOpen && "rotate-180",
                  )}
                />
              </button>
              {megaOpen && <ExamMegaMenu onClose={() => setMegaOpen(false)} />}
            </div>

            {/* Other links */}
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30"
                      : link.amber
                        ? "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 dark:text-slate-300 font-medium"
              >
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-5 shadow-sm"
              >
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <XIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-h-[80vh] overflow-y-auto px-4 py-4 space-y-1.5">
            {/* Exams accordion */}
            <button
              type="button"
              onClick={() => setMobileExamsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <GraduationCapIcon className="h-4 w-4 text-blue-500" />
                All Exams
              </span>
              <ChevronDownIcon
                className={cn(
                  "h-4 w-4 transition-transform",
                  mobileExamsOpen && "rotate-180",
                )}
              />
            </button>

            {mobileExamsOpen && (
              <div className="pl-3 space-y-0.5">
                {EXAM_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/exams?category=${cat.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="font-medium">{cat.label}</span>
                    <span className="ml-auto text-xs text-slate-400">
                      {cat.count} tests
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Other links */}
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Icon className="h-4 w-4 text-blue-500" />
                  <div>
                    <p>{link.label}</p>
                    <p className="text-xs text-slate-400 font-normal">
                      {link.desc}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 ml-auto text-slate-400" />
                </Link>
              );
            })}

            {/* CTAs */}
            <div className="pt-3 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl font-medium"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full h-11 rounded-xl bg-blue-600 text-white font-semibold">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
