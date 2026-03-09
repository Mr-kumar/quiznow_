/**
 * components/seo/JsonLd.tsx
 *
 * Renders a JSON-LD <script> tag for structured data.
 * Used on public pages to emit schema.org markup for SEO rich results.
 *
 * Usage:
 *   <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", ... }} />
 *
 * Server Component — no "use client" needed, outputs static HTML.
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional for JSON-LD
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ── Pre-built schema helpers ──────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quiznow.in";

/** Organization schema — for landing page / root layout */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QuizNow",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      "https://twitter.com/quiznow",
      "https://linkedin.com/company/quiznow",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@quiznow.in",
    },
  };
}

/** WebSite schema — for root layout (enables Google Sitelinks Search) */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "QuizNow",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/exams?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Course schema — for exam detail pages */
export function courseSchema(opts: {
  name: string;
  description: string;
  url: string;
  provider?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    provider: {
      "@type": "Organization",
      name: opts.provider ?? "QuizNow",
      url: SITE_URL,
    },
  };
}

/** FAQ schema — for plans/pricing page */
export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

/** Product schema — for pricing page */
export function productSchema(opts: {
  name: string;
  description: string;
  price: number;
  currency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    offers: {
      "@type": "Offer",
      price: opts.price,
      priceCurrency: opts.currency ?? "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/plans`,
    },
  };
}
