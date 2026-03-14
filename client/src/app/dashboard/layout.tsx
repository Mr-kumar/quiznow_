"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useHierarchyCounts } from "@/hooks/use-hierarchy-counts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FolderTree,
  FileText,
  BookOpen,
  Users,
  PlusCircle,
  Settings,
  BarChart3,
  Target,
  Award,
  Clock,
  Shield,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Library,
  DollarSign,
  CreditCard,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();
  const [isSidebarOpen, setSidebarOpen] = useState(false); // W-6 fix: default closed on mobile
  const { data: hierarchyCounts } = useHierarchyCounts();

  // Protect the route
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // BUG-2 FIX: Add role guard — students cannot access admin dashboard
    if (user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    if (user.status === "SUSPENDED" || user.status === "BANNED") {
      router.replace("/login?reason=suspended");
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading spinner while auth state is loading or redirecting
  if (
    isLoading ||
    !isAuthenticated ||
    !user ||
    user.status === "SUSPENDED" ||
    user.status === "BANNED"
  ) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // BUG-7 FIX: Student routes now point to correct existing pages
  const studentLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/tests", label: "My Tests", icon: BookOpen },
    { href: "/exams", label: "Browse Exams", icon: Target }, // Used Target as close match to SearchIcon or keep Target
    { href: "/test/history", label: "History", icon: Clock },
    { href: "/leaderboard", label: "Leaderboard", icon: Award },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/upgrade", label: "Upgrade", icon: CreditCard },
  ];

  const adminLinkGroups = [
    {
      label: "OVERVIEW",
      links: [
        {
          href: "/dashboard/admin",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/dashboard/admin/analytics",
          label: "Analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "CONTENT",
      links: [
        {
          href: "/dashboard/admin/tests",
          label: "Manage Tests",
          icon: FileText,
        },
        {
          href: "/dashboard/admin/tests/create",
          label: "Create Test",
          icon: PlusCircle,
        },
        {
          href: "/dashboard/admin/questions",
          label: "Question Vault",
          icon: BookOpen,
        },
      ],
    },
    {
      label: "BILLING",
      links: [
        {
          href: "/dashboard/admin/plans",
          label: "Plans",
          icon: DollarSign,
        },
        {
          href: "/dashboard/admin/subscriptions",
          label: "Subscriptions",
          icon: CreditCard,
        },
        {
          href: "/dashboard/admin/payments",
          label: "Payments",
          icon: DollarSign,
        },
      ],
    },
    {
      label: "SYSTEM",
      links: [
        {
          href: "/dashboard/admin/users",
          label: "Users",
          icon: Users,
        },
        {
          href: "/dashboard/admin/audit-logs",
          label: "Audit Logs",
          icon: Shield,
        },
        {
          href: "/dashboard/admin/settings",
          label: "Settings",
          icon: Settings,
        },
      ],
    },
  ];

  // Flatten for student view
  const adminLinks = adminLinkGroups.flatMap((g) => g.links);
  const links = user.role === "ADMIN" ? adminLinks : studentLinks;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-slate-900 flex">
      {/* 1. Sidebar (Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-200/60 dark:border-zinc-800/60 transform transition-all duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 shadow-xl lg:shadow-none`}
      >
        <div className="h-full flex flex-col">
          {/* 🎨 Dynamic Logo */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-linear-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5">
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-xl ${user.role === "ADMIN" ? "bg-linear-to-br from-red-500 to-orange-600" : "bg-linear-to-br from-blue-500 to-purple-600"} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
              >
                {user.role === "ADMIN" ? <Shield className="h-4 w-4" /> : "Q"}
              </div>
              <span className="text-xl font-bold tracking-tight bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {user.role === "ADMIN" ? "QuizNow Admin" : "QuizNow"}
              </span>
            </div>
          </div>

          {/* 🚀 Dynamic Nav Links */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            {user.role === "ADMIN" ? (
              <div className="space-y-5">
                {adminLinkGroups.map((group) => (
                  <div key={group.label}>
                    <p className="px-4 mb-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.links.map((link, index) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                          <Link
                            key={`${link.href}-${index}`}
                            href={link.href}
                            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                              isActive
                                ? "bg-linear-to-r from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/25"
                                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 group"
                            }`}
                          >
                            <Icon
                              className={`mr-3 h-4.5 w-4.5 ${isActive ? "text-white" : "group-hover:scale-110 transition-transform"}`}
                              style={{ height: "1.125rem", width: "1.125rem" }}
                            />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {links.map((link, index) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={`${link.href}-${index}`}
                      href={link.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 group"
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "group-hover:scale-110 transition-transform"}`}
                      />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-linear-to-t from-zinc-50/50 to-white/50 dark:from-zinc-800/50 dark:to-zinc-900/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div
                className={`h-10 w-10 rounded-full ${user.role === "ADMIN" ? "bg-linear-to-br from-red-400 to-orange-600" : "bg-linear-to-br from-blue-400 to-purple-600"} flex items-center justify-center shadow-lg`}
              >
                {user.role === "ADMIN" ? (
                  <Shield className="h-5 w-5 text-white" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                  {user.name}
                </p>
                <p
                  className={`text-xs truncate flex items-center gap-1 ${user.role === "ADMIN" ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${user.role === "ADMIN" ? "bg-red-500" : "bg-green-500"} animate-pulse`}
                  ></span>
                  {user.role} {user.role === "ADMIN" ? "⚡" : "🎯"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800 transition-all duration-200 group"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              <LogOut className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              Log out
            </Button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              Q
            </div>
            <span className="font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              QuizNow
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {/* W-7 FIX: Removed hardcoded fake notification red dot */}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Welcome back, {user.name}!
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              Online
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {/* W-7 FIX: Removed hardcoded fake notification red dot */}
            </Button>
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-lg">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
