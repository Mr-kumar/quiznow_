/**
 * app/robots.ts
 *
 * Generates /robots.txt via Next.js MetadataRoute.Robots.
 *
 * Rules:
 *  Allow:    all public pages (/, /exams, /plans, /series/*)
 *  Disallow: auth-gated and real-time pages
 *
 * Disallowed paths:
 *   /dashboard     — admin + student private area
 *   /test          — exam room, result, solutions (private per-user)
 *   /login         — utility, no value to index
 *
 * sitemap reference helps crawlers find all public URLs.
 */

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quiznow.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/exams", "/exams/", "/series/", "/plans"],
        disallow: ["/dashboard", "/dashboard/", "/test/", "/login", "/api/"],
      },
      {
        // Block AI scrapers from training on exam content
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
