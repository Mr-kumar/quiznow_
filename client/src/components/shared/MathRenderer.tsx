"use client";

/**
 * components/shared/MathRenderer.tsx
 *
 * Renders LaTeX math expressions inside question content.
 * Uses KaTeX (fastest LaTeX renderer — used by Khan Academy, Wikipedia).
 *
 * INSTALL REQUIRED:
 *   npm install katex
 *   npm install --save-dev @types/katex
 *
 * Also add to app/layout.tsx (KaTeX CSS):
 *   import 'katex/dist/katex.min.css'
 *
 * Supported delimiters:
 *   Inline:  \( ... \)   or   $ ... $
 *   Block:   \[ ... \]   or   $$ ... $$
 *
 * Fallback: if KaTeX fails to parse, shows the raw LaTeX string.
 * The exam never crashes due to a malformed math expression.
 */

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

// ── KaTeX dynamic import ──────────────────────────────────────────────────────
// We import katex lazily and handle the case where it's not installed yet.
// This prevents build errors if katex is not yet in package.json.

let katex: typeof import("katex") | null = null;

// Try to load katex — silent fail if not installed
if (typeof window !== "undefined") {
  import("katex")
    .then((mod) => {
      katex = mod.default ?? mod;
    })
    .catch(() => {
      /* katex not installed */
    });
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MathFragment =
  | { type: "text"; content: string }
  | { type: "inline"; content: string }
  | { type: "block"; content: string };

// ── Parser: split text + math segments ───────────────────────────────────────

/**
 * Parse a string into alternating text and math fragments.
 * Handles both NTA-style \( \) delimiters and $ $ delimiters.
 *
 * Priority (checked in order):
 *   1. \[ ... \]  → block
 *   2. $$ ... $$  → block
 *   3. \( ... \)  → inline
 *   4. $ ... $    → inline (single — must not be a currency symbol)
 */
function parseFragments(content: string): MathFragment[] {
  const fragments: MathFragment[] = [];
  let remaining = content;

  // Ordered from most-specific to least-specific
  const PATTERNS: { regex: RegExp; type: "inline" | "block" }[] = [
    { regex: /\\\[(.+?)\\\]/s, type: "block" }, // \[ ... \]
    { regex: /\$\$(.+?)\$\$/s, type: "block" }, // $$ ... $$
    { regex: /\\\((.+?)\\\)/s, type: "inline" }, // \( ... \)
    { regex: /\$([^$\n]+?)\$/, type: "inline" }, // $ ... $ (single line only)
  ];

  while (remaining.length > 0) {
    let earliestMatch: RegExpExecArray | null = null;
    let earliestType: "inline" | "block" = "inline";
    let earliestIndex = Infinity;

    // Find whichever math delimiter appears first in the remaining string
    for (const { regex, type } of PATTERNS) {
      const m = regex.exec(remaining);
      if (m && m.index < earliestIndex) {
        earliestMatch = m;
        earliestType = type;
        earliestIndex = m.index;
      }
    }

    if (!earliestMatch) {
      // No more math — rest is plain text
      if (remaining.trim()) {
        fragments.push({ type: "text", content: remaining });
      }
      break;
    }

    // Text before the match
    if (earliestIndex > 0) {
      fragments.push({
        type: "text",
        content: remaining.slice(0, earliestIndex),
      });
    }

    // The math fragment
    fragments.push({ type: earliestType, content: earliestMatch[1].trim() });

    // Advance past this match
    remaining = remaining.slice(earliestIndex + earliestMatch[0].length);
  }

  return fragments;
}

// ── KaTeX renderer ────────────────────────────────────────────────────────────

function renderKatex(latex: string, displayMode: boolean): string {
  if (!katex) return latex; // Not loaded yet — show raw
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false, // Never throw — degrade gracefully
      errorColor: "#cc0000", // Show red for invalid LaTeX
      strict: false, // Permissive — NTA questions can have quirky LaTeX
      trust: false, // Never allow \href etc
      output: "html",
    });
  } catch {
    return latex; // Absolute fallback — show raw string
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MathRendererProps {
  /** The raw content string, potentially containing LaTeX delimiters */
  content: string;
  className?: string;
}

export function MathRenderer({ content, className }: MathRendererProps) {
  const fragments = useMemo(() => parseFragments(content), [content]);

  // If no math found — render as plain text (most common case, fast path)
  if (fragments.length === 1 && fragments[0].type === "text") {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={cn("math-content", className)}>
      {fragments.map((frag, idx) => {
        if (frag.type === "text") {
          return <React.Fragment key={idx}>{frag.content}</React.Fragment>;
        }

        const html = renderKatex(frag.content, frag.type === "block");

        if (frag.type === "block") {
          return (
            <span
              key={idx}
              className="block my-3 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        // inline
        return (
          <span
            key={idx}
            className="inline align-middle"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}
