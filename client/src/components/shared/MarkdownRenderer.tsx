"use client";

/**
 * components/shared/MarkdownRenderer.tsx
 *
 * Renders lightweight markdown in question content and explanations.
 * Wraps react-markdown with a strict allowlist — only the elements
 * that appear in exam questions. No headers, no tables, no HTML injection.
 *
 * INSTALL REQUIRED:
 *   npm install react-markdown
 *
 * Pipeline for question content:
 *   Raw string → MathRenderer (splits LaTeX) → MarkdownRenderer (text formatting)
 *
 * For explanation text (solutions screen):
 *   Raw string → MarkdownRenderer (explanations use more markdown features)
 *
 * Allowed elements in question mode: strong, em, code, p, br, sub, sup
 * Allowed elements in explanation mode: above + ol, ul, li, blockquote, hr
 */

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { MathRenderer } from "./MathRenderer";

// ── Try to load react-markdown dynamically ────────────────────────────────────
// Graceful fallback if not installed

type ReactMarkdownType = React.ComponentType<{
  children: string;
  allowedElements?: string[];
  components?: Record<
    string,
    React.ComponentType<React.HTMLAttributes<HTMLElement> & { node?: unknown }>
  >;
  skipHtml?: boolean;
}>;

let ReactMarkdown: ReactMarkdownType | null = null;

// Attempt dynamic load — will succeed after npm install react-markdown
if (typeof window !== "undefined") {
  import("react-markdown")
    .then((mod) => {
      ReactMarkdown = mod.default;
    })
    .catch(() => {
      /* react-markdown not installed */
    });
}

// ── Allowed element sets ──────────────────────────────────────────────────────

const QUESTION_ELEMENTS = ["p", "strong", "em", "code", "br", "sub", "sup"];

const EXPLANATION_ELEMENTS = [
  ...QUESTION_ELEMENTS,
  "ol",
  "ul",
  "li",
  "blockquote",
  "hr",
];

// ── Component overrides ───────────────────────────────────────────────────────
// Override default react-markdown rendering to apply our Tailwind classes

const questionComponents = {
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-2 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong
      className="font-semibold text-slate-900 dark:text-slate-100"
      {...props}
    >
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-slate-700 dark:text-slate-300" {...props}>
      {children}
    </em>
  ),
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[0.85em] text-slate-800 dark:text-slate-200"
      {...props}
    >
      {children}
    </code>
  ),
  sub: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <sub className="text-[0.75em]" {...props}>
      {children}
    </sub>
  ),
  sup: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <sup className="text-[0.75em]" {...props}>
      {children}
    </sup>
  ),
};

const explanationComponents = {
  ...questionComponents,
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1" {...props}>
      {children}
    </ol>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-5 mb-3 space-y-1" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className="border-l-4 border-blue-300 dark:border-blue-700 pl-4 py-1 my-2 text-slate-600 dark:text-slate-400 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
};

// ── Component ─────────────────────────────────────────────────────────────────

interface MarkdownRendererProps {
  /** Raw markdown string — may also contain LaTeX delimiters */
  content: string;
  /**
   * "question" — restricted set (strong, em, code only)
   * "explanation" — fuller set (lists, blockquote)
   */
  mode?: "question" | "explanation";
  className?: string;
  /** If true, also run content through MathRenderer first */
  withMath?: boolean;
}

export function MarkdownRenderer({
  content,
  mode = "question",
  className,
  withMath = true,
}: MarkdownRendererProps) {
  const allowedElements =
    mode === "explanation" ? EXPLANATION_ELEMENTS : QUESTION_ELEMENTS;

  const components =
    mode === "explanation" ? explanationComponents : questionComponents;

  // Memoize — content strings in an exam never change
  const processedContent = useMemo(() => content, [content]);

  // Fallback: react-markdown not loaded yet or not installed
  if (!ReactMarkdown) {
    if (withMath) {
      return <MathRenderer content={processedContent} className={className} />;
    }
    return (
      <span className={cn("whitespace-pre-wrap", className)}>
        {processedContent}
      </span>
    );
  }

  // Full path: react-markdown + optional math rendering
  // For math: we pass the content through MathRenderer inside the p component
  // so both math and markdown work together
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        allowedElements={allowedElements}
        skipHtml // Never render raw HTML from content
        components={
          withMath
            ? {
                ...components,
                // Override paragraph to pass content through MathRenderer
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">
                    {React.Children.map(children, (child) => {
                      if (typeof child === "string") {
                        return <MathRenderer content={child} />;
                      }
                      return child;
                    })}
                  </p>
                ),
              }
            : (components as Record<
                string,
                React.ComponentType<
                  React.HTMLAttributes<HTMLElement> & { node?: unknown }
                >
              >)
        }
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
