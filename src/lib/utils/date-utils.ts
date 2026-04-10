/**
 * Format a Date to YYYY-MM-DD for IPC.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get default 7-day date range.
 */
export function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return {
    from: formatDate(weekAgo),
    to: formatDate(now)
  };
}

/**
 * Parse filename to Date.
 * Filename format: YYYY-MM-DDTHHMMSS.md
 */
export function parseFilenameDate(filename: string): Date | null {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})\.md$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return new Date(
    parseInt(y),
    parseInt(mo) - 1,
    parseInt(d),
    parseInt(h),
    parseInt(mi),
    parseInt(s)
  );
}

/**
 * Format a filename date for display.
 */
export function formatDisplayDate(filename: string): string {
  const date = parseFilenameDate(filename);
  if (!date) return filename;
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
