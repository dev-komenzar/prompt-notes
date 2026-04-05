// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:37 task:37-1 module:grid — Date calculation and formatting utilities

import { DEFAULT_FILTER_DAYS, FILENAME_TIMESTAMP_REGEX } from './constants';

/**
 * Formats a Date to "YYYY-MM-DD" string for IPC parameters.
 * Used when passing from_date / to_date to list_notes / search_notes.
 */
export function formatDateForIPC(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the default date range for the grid view:
 * fromDate = today - DEFAULT_FILTER_DAYS, toDate = today.
 *
 * CONV-GRID-1: Default filter is last 7 days.
 * Date calculation is performed on the Svelte side; Rust receives
 * the computed range and applies filename-timestamp filtering.
 */
export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - DEFAULT_FILTER_DAYS);

  return {
    fromDate: formatDateForIPC(sevenDaysAgo),
    toDate: formatDateForIPC(now),
  };
}

/**
 * Parses a filename timestamp into a Date object.
 * Filename format: YYYY-MM-DDTHHMMSS.md (with optional _N suffix).
 * Returns null if the filename does not match the expected pattern.
 */
export function parseFilenameTimestamp(filename: string): Date | null {
  const match = FILENAME_TIMESTAMP_REGEX.exec(filename);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10),
  );
}

/**
 * Formats a created_at ISO-like string for human-readable card display.
 * Input: "2026-04-04T14:30:52" (from module:storage NoteEntry.created_at)
 * Output: "2026-04-04 14:30"
 */
export function formatDisplayDate(createdAt: string): string {
  if (!createdAt || createdAt.length < 16) return createdAt;
  return createdAt.substring(0, 10) + ' ' + createdAt.substring(11, 16);
}

/**
 * Formats a created_at string as a relative time description.
 * e.g., "2 hours ago", "3 days ago", "just now"
 */
export function formatRelativeTime(createdAt: string): string {
  const date = new Date(createdAt.replace('T', ' '));
  if (isNaN(date.getTime())) return createdAt;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDisplayDate(createdAt);
}
