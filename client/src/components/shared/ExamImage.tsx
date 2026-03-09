"use client";

/**
 * components/shared/ExamImage.tsx
 *
 * Displays a question image with click-to-zoom fullscreen capability.
 * Some exam diagrams (circuit diagrams, geometry figures) are detailed
 * and need to be enlarged for clear reading.
 *
 * Uses next/image for optimisation (WebP conversion, lazy loading, blur placeholder).
 *
 * NEXT.CONFIG REQUIRED — add your image host to remotePatterns:
 *   images: {
 *     remotePatterns: [{ protocol: 'https', hostname: 'your-cdn.com' }]
 *   }
 */

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ZoomInIcon, XIcon, ZoomOutIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExamImageProps {
  src: string;
  /** alt text — use question content summary for SEO + accessibility */
  alt: string;
  /** Width in px — provide when known to avoid layout shift (CLS) */
  width?: number;
  /** Height in px */
  height?: number;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExamImage({
  src,
  alt,
  width = 600,
  height = 400,
  className,
}: ExamImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [imgError, setImgError] = useState(false);

  const openZoom = useCallback(() => {
    setIsZoomed(true);
    setZoomScale(1);
  }, []);
  const closeZoom = useCallback(() => {
    setIsZoomed(false);
    setZoomScale(1);
  }, []);
  const zoomIn = useCallback(
    () => setZoomScale((s) => Math.min(s + 0.5, 3)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoomScale((s) => Math.max(s - 0.5, 1)),
    [],
  );

  // Image failed to load — show placeholder
  if (imgError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 text-xs",
          "min-h-[80px]",
          className,
        )}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <>
      {/* ── Thumbnail ──────────────────────────────────────────────────── */}
      <div
        className={cn(
          "group relative inline-block rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden cursor-zoom-in",
          "max-w-full hover:border-blue-300 dark:hover:border-blue-600 transition-colors",
          className,
        )}
        onClick={openZoom}
        role="button"
        aria-label="Click to zoom image"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openZoom();
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="object-contain max-h-64 w-auto"
          loading="lazy"
          onError={() => setImgError(true)}
          quality={85}
        />

        {/* Zoom hint overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg">
            <ZoomInIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
      </div>

      {/* ── Zoom dialog ──────────────────────────────────────────────────── */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-2 overflow-hidden flex flex-col gap-0"
          showCloseButton={false}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {Math.round(zoomScale * 100)}%
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoomScale <= 1}
                aria-label="Zoom out"
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ZoomOutIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoomScale >= 3}
                aria-label="Zoom in"
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ZoomInIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                type="button"
                onClick={closeZoom}
                aria-label="Close"
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ml-1"
              >
                <XIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Zoomable image area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0">
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: "center",
                transition: "transform 200ms ease",
              }}
            >
              <Image
                src={src}
                alt={alt}
                width={width * 2}
                height={height * 2}
                className="object-contain max-w-none"
                quality={95}
                priority
              />
            </div>
          </div>

          {/* Caption */}
          {alt && (
            <p className="shrink-0 text-center text-xs text-slate-400 dark:text-slate-500 px-4 py-2 border-t border-slate-100 dark:border-slate-800">
              {alt}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
