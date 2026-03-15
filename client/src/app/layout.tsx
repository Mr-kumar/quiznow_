import type { Metadata } from "next";
import {
  Inter,
  Noto_Sans_Devanagari,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { cn } from "../lib/utils";
import { AppProviders } from "../providers/app-providers";
import {
  JsonLd,
  organizationSchema,
  websiteSchema,
} from "@/components/seo/JsonLd";

// ── Fonts ─────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

// Required for Hindi question content
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-devanagari",
  display: "swap",
  preload: false, // Don't preload — only needed when lang=HI
});

// ── Metadata ──────────────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quiznow.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "QuizNow — India's #1 Mock Test Platform",
    template: "%s | QuizNow",
  },
  description:
    "Practice with 50,000+ mock tests for JEE, NEET, UPSC, SSC, Banking & more. NTA-style interface, bilingual, instant results with detailed explanations.",
  keywords: [
    "mock test",
    "JEE",
    "NEET",
    "UPSC",
    "SSC",
    "exam preparation",
    "online test",
  ],
  authors: [{ name: "QuizNow", url: SITE_URL }],
  creator: "QuizNow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "QuizNow",
    title: "QuizNow — India's #1 Mock Test Platform",
    description:
      "Practice with 50,000+ mock tests. NTA-style, bilingual, instant results.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "QuizNow — India's #1 Mock Test Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuizNow — India's #1 Mock Test Platform",
    description:
      "Practice with 50,000+ mock tests. NTA-style, bilingual, instant results.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  // manifest: "/manifest.json", // Uncomment when PWA is added (S9)
};

// ── Root Layout ───────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased text-foreground",
          inter.variable,
          notoDevanagari.variable,
          plusJakarta.variable,
          plusJakarta.className
        )}
      >
        {/* Global JSON-LD schemas */}
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />

        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
