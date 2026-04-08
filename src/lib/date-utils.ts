// Sprint 6/18 – Date formatting and default range utilities

/**
 * Format a Date as YYYY-MM-DD for IPC date parameters.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get default date range: 7 days back from today.
 * Returns { from, to } as YYYY-MM-DD strings.
 */
export function getDefaultDateRange(days: number = 7): {
  from: string;
  to: string;
} {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return {
    from: formatDateParam(from),
    to: formatDateParam(now),
  };
}

/**
 * Format an ISO-8601 created_at timestamp for display.
 * Shows "YYYY-MM-DD HH:MM" format.
 */
export function formatCreatedAt(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${mo}-${day} ${h}:${min}`;
  } catch {
    return isoString;
  }
}

/**
 * Format a relative time string (e.g., "2 hours ago", "3 days ago").
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    return formatCreatedAt(isoString);
  } catch {
    return isoString;
  }
}
