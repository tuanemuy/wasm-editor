/**
 * Utility functions for working with dates
 */

/**
 * Format a date using Intl.DateTimeFormat
 * Default format: "Jan 1, 2025, 10:30 AM"
 */
export function formatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return new Intl.DateTimeFormat("en-US", options || defaultOptions).format(
    date,
  );
}

/**
 * Format a date as relative time
 * Examples: "just now", "2 minutes ago", "1 hour ago", "yesterday", "Jan 1, 2025"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "just now";
  }

  if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  }

  if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  }

  if (diffDay === 1) {
    return "yesterday";
  }

  if (diffDay < 7) {
    return `${diffDay} days ago`;
  }

  // For older dates, use absolute format
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is within the last N days
 */
export function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}
