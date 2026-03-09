/**
 * app/(public)/layout.tsx
 *
 * Public layout — wraps the marketing/browse pages:
 *   /exams, /plans, /series/[seriesId], and the (public) landing page.
 *
 * Structure:
 *  [Sticky top navbar — logo + links + login/signup CTAs]
 *  [Page content]
 *  [Footer — sitemap + social links + copyright]
 *
 * Server Component — no auth required on public pages.
 * Navbar uses a client sub-component for scroll-based shadow effect.
 */

import Link from "next/link";
import { PublicNavbar } from "@/app/(public)/PublicNavbar";
import { ZapIcon, GithubIcon, TwitterIcon, LinkedinIcon } from "lucide-react";

// ── Footer ────────────────────────────────────────────────────────────────────

function PublicFooter() {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "Browse Exams", href: "/exams" },
        { label: "Pricing", href: "/plans" },
        { label: "Features", href: "/#features" },
      ],
    },
    {
      title: "Learn",
      links: [
        { label: "UPSC", href: "/exams?category=upsc" },
        { label: "SSC", href: "/exams?category=ssc" },
        { label: "Banking", href: "/exams?category=banking" },
        { label: "Railways", href: "/exams?category=railways" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Cookies", href: "/cookies" },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <ZapIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-lg">
                QuizNow
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[180px] leading-relaxed">
              India's leading platform for competitive exam preparation.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="QuizNow on GitHub"
              >
                <GithubIcon
                  className="h-4.5 w-4.5"
                  style={{ height: "1.125rem", width: "1.125rem" }}
                />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="QuizNow on Twitter"
              >
                <TwitterIcon
                  className="h-4.5 w-4.5"
                  style={{ height: "1.125rem", width: "1.125rem" }}
                />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="QuizNow on LinkedIn"
              >
                <LinkedinIcon
                  className="h-4.5 w-4.5"
                  style={{ height: "1.125rem", width: "1.125rem" }}
                />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} QuizNow. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Made with ❤️ for aspirants across India
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
