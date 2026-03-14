/**
 * lib/utils/time.ts
 *
 * Shared time formatting utilities to eliminate duplicates across components.
 */

/**
 * Format duration in seconds to human-readable string
 * Returns "—" for null/undefined values
 * Examples: "1h 23m", "45m 12s", "23s"
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Format duration in milliseconds to HH:MM:SS or MM:SS format
 * Used for exam timers and countdown displays
 */
export function formatTime(ms: number): string {
  if (ms <= 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  // When < 1 hour, show MM:SS — less cluttered on mobile
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format time taken for display in leaderboards and history
 * Similar to formatDuration but with consistent naming
 */
export function formatTimeTaken(secs: number | null): string {
  return formatDuration(secs);
}
