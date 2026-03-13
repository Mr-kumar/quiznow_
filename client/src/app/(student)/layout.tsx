"use client";

/**
 * app/(student)/layout.tsx
 *
 * THE AUTH GUARD for every student page.
 *
 * Every route under (student)/ — dashboard, profile, history, leaderboard,
 * test/* — inherits this layout. Nothing works without it.
 *
 * Auth logic:
 *  1. Middleware (middleware.ts) already does a server-side redirect for
 *     unauthenticated requests to protected paths. This layout is the
 *     client-side backup — handles SPA navigations that bypass middleware.
 *  2. Reads from useAuthStore (Zustand + persist) — works on hydration.
 *  3. Redirects to /login?reason=session if token is expired.
 *  4. Allows both STUDENT and ADMIN roles (admin can preview student view).
 *
 * Layout structure:
 *  Desktop: [Sidebar 240px fixed] [Main content scrollable]
 *  Mobile:  [Header bar] [Main content] [Bottom nav bar]
 *
 * Sidebar links: Dashboard · My Tests · History · Leaderboard · Profile
 * Bottom nav: same 5 icons, condensed
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  ClockIcon,
  TrophyIcon,
  UserIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ZapIcon,
  BellIcon,
  CrownIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

// ── Navigation config ─────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  matchExact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    matchExact: true,
  },
  { href: "/dashboard/tests", label: "My Tests", icon: BookOpenIcon },
  { href: "/test/history", label: "History", icon: ClockIcon },
  { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon }, // BUG-5 FIX: Added missing leaderboard nav item
  { href: "/profile", label: "Profile", icon: UserIcon },
  { href: "/upgrade", label: "Upgrade", icon: CrownIcon },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isNavActive(
  href: string,
  pathname: string,
  matchExact = false,
): boolean {
  if (matchExact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

// ── Sidebar nav link ──────────────────────────────────────────────────────────

function SidebarLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const active = isNavActive(item.href, pathname, item.matchExact);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
      )}
    >
      <Icon
        className={cn("h-4.5 w-4.5 shrink-0", active ? "text-white" : "")}
        style={{ height: "1.125rem", width: "1.125rem" }}
      />
      {item.label}
    </Link>
  );
}

// ── Bottom nav item ───────────────────────────────────────────────────────────

function BottomNavItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = isNavActive(item.href, pathname, item.matchExact);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors min-w-0 flex-1",
        active
          ? "text-blue-600 dark:text-blue-400"
          : "text-slate-500 dark:text-slate-400",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-[10px] font-medium truncate">{item.label}</span>
    </Link>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <ZapIcon className="h-5 w-5 text-white animate-pulse" />
        </div>
        <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-[loading_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

// ── Layout component ──────────────────────────────────────────────────────────

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login?reason=session");
      return;
    }

    // Only STUDENT and ADMIN can access student pages
    if (user.role !== "STUDENT" && user.role !== "ADMIN") {
      router.replace("/login");
      return;
    }

    if (user.status === "SUSPENDED" || user.status === "BANNED") {
      // For now, redirect to login page with reason (or a dedicated suspended page later)
      router.replace("/login?reason=suspended");
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // ── Auth loading / guard ───────────────────────────────────────────────────
  if (
    isLoading ||
    !isAuthenticated ||
    !user ||
    user.status === "SUSPENDED" ||
    user.status === "BANNED"
  ) {
    return <AuthLoading />;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const initials = user.name ? getInitials(user.name) : "?";

  // ── Exam mode: hide layout chrome during active exam ───────────────────────
  const isExamMode = /^\/test\/[^/]+\/attempt/.test(pathname);
  if (isExamMode) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col fixed inset-y-0 left-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-slate-200 dark:border-slate-700">
          <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
            <ZapIcon className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight">
            QuizNow
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <Separator />

        {/* User footer */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar>
              <AvatarFallback className="bg-linear-to-br from-blue-400 to-indigo-600 text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-8"
            onClick={handleLogout}
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            Log out
          </Button>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ────────────────────────────────────────── */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 flex flex-col shadow-2xl lg:hidden">
            {/* Mobile sidebar header */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <ZapIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  QuizNow
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onClick={() => setMobileSidebarOpen(false)}
                />
              ))}
            </nav>

            <Separator />

            <div className="p-3">
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <Avatar>
                  <AvatarFallback className="bg-linear-to-br from-blue-400 to-indigo-600 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8"
                onClick={handleLogout}
              >
                <LogOutIcon className="h-3.5 w-3.5" />
                Log out
              </Button>
            </div>
          </aside>
        </>
      )}

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        {/* Mobile top header */}
        <header className="lg:hidden sticky top-0 z-20 h-14 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <ZapIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              QuizNow
            </span>
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9">
            <BellIcon
              className="h-4.5 w-4.5"
              style={{ height: "1.125rem", width: "1.125rem" }}
            />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 flex bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 safe-area-bottom">
          {NAV_ITEMS.map((item) => (
            <BottomNavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>
    </div>
  );
}
