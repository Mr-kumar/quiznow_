/**
 * app/sitemap.ts
 *
 * Dynamic sitemap for Next.js (App Router).
 * Returns MetadataRoute.Sitemap — Next.js serialises this to /sitemap.xml.
 *
 * Included URLs:
 *   /              — landing page, weekly, priority 1.0
 *   /exams         — exam browse, weekly, priority 0.9
 *   /plans         — pricing, monthly, priority 0.8
 *   /exams/[id]    — per exam detail, weekly, priority 0.7
 *   /series/[id]   — per series, weekly, priority 0.6
 *
 * Excluded (never indexed):
 *   /dashboard     — private, auth-gated student + admin area
 *   /test          — private, per-user exam sessions and results
 *   /login         — utility page, no SEO value
 *
 * Revalidates every 24 hours via ISR (revalidate: 86400).
 */

import type { MetadataRoute } from "next";
import type { Exam, TestSeries } from "@/api/tests";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quiznow.in";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function fetchExams(): Promise<Exam[]> {
  try {
    const res = await fetch(`${API}/exams`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data ?? json) as Exam[];
  } catch {
    return [];
  }
}

async function fetchAllSeries(): Promise<TestSeries[]> {
  try {
    const res = await fetch(`${API}/test-series`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data ?? json) as TestSeries[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [exams, series] = await Promise.all([fetchExams(), fetchAllSeries()]);

  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/exams`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/plans`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Exam detail pages — one per active exam
  const examRoutes: MetadataRoute.Sitemap = exams
    .filter((e) => e.isActive)
    .map((exam) => ({
      url: `${SITE_URL}/exams/${exam.id}`,
      lastModified: new Date(exam.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // Series pages — one per active series
  const seriesRoutes: MetadataRoute.Sitemap = series
    .filter((s) => s.isActive)
    .map((s) => ({
      url: `${SITE_URL}/series/${s.id}`,
      lastModified: new Date(s.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...examRoutes, ...seriesRoutes];
}
