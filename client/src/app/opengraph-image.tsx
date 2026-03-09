/**
 * app/opengraph-image.tsx
 *
 * Default OG image for the root layout.
 * Shown when sharing quiznow.in on WhatsApp, Twitter, LinkedIn, etc.
 *
 * Uses Next.js ImageResponse (built-in, no extra deps needed).
 * Size: 1200×630 — the standard for Twitter Summary Large Card + OG.
 *
 * EXAM-SPECIFIC OG IMAGES:
 * Create app/(public)/exams/[examId]/opengraph-image.tsx for per-exam images.
 * The pattern is identical — just read params.examId, fetch exam name, render.
 *
 * To customise:
 *  - Change BG gradient colours in the container style
 *  - Add your logo image: <img src="https://quiznow.in/logo.png" ... />
 *  - Add dynamic stat counts from your API
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "QuizNow — India's #1 Mock Test Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #4f46e5 100%)",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background pattern dots */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.07,
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Logo mark */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: "rgba(255,255,255,0.15)",
          border: "2px solid rgba(255,255,255,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          fontSize: 36,
          fontWeight: 700,
          color: "white",
        }}
      >
        Q
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "white",
          margin: 0,
          letterSpacing: "-2px",
          textAlign: "center",
        }}
      >
        QuizNow
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontSize: 28,
          color: "rgba(219, 234, 254, 0.9)",
          margin: "16px 0 0",
          fontWeight: 400,
          textAlign: "center",
          maxWidth: 700,
        }}
      >
        India&apos;s #1 Mock Test Platform
      </p>

      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          gap: 48,
          marginTop: 48,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "20px 48px",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {[
          { n: "2M+", l: "Students" },
          { n: "50K+", l: "Tests" },
          { n: "98%", l: "Selection Rate" },
        ].map(({ n, l }) => (
          <div
            key={l}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: "white" }}>
              {n}
            </span>
            <span style={{ fontSize: 16, color: "rgba(191, 219, 254, 0.9)" }}>
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
    },
  );
}
