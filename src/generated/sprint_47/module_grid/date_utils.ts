// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:47 task:47-1 module:grid
// Date utilities for grid filter date calculations.
// from_date / to_date are formatted as "YYYY-MM-DD" for Rust
// chrono::NaiveDate::parse_from_str compatibility.

import { DEFAULT_FILTER_DAYS } from './constants';

/**
 * Format a `Date` as `YYYY-MM-DD` (local time).
 * This is the wire format consumed by list_notes / search_notes IPC params.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day filter range (CONV-GRID-1).
 *
 * `fromDate` = today minus {@link DEFAULT_FILTER_DAYS} days.
 * `toDate`   = today.
 */
export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - DEFAULT_FILTER_DAYS);
  return {
    fromDate: formatDateParam(past),
    toDate: formatDateParam(now),
  };
}

/**
 * Format an ISO-style `created_at` string (e.g. "2026-04-04T14:30:52")
 * into a compact human-readable display string (e.g. "2026-04-04 14:30").
 *
 * Returns the input unchanged if it cannot be parsed.
 */
export function formatDisplayDate(createdAt: string): string {
  // created_at is "YYYY-MM-DDTHH:MM:SS" per module:storage contract.
  if (createdAt.length < 16) {
    return createdAt;
  }
  // Replace 'T' with space and drop seconds.
  return createdAt.slice(0, 10) + ' ' + createdAt.slice(11, 16);
}

/**
 * Parse a filename (e.g. "2026-04-04T143052.md") into a Date.
 * Returns `null` for malformed filenames.
 */
export function parseDateFromFilename(filename: string): Date | null {
  // Pattern: YYYY-MM-DDTHHMMSS.md  or  YYYY-MM-DDTHHMMSS_N.md
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(?:_\d+)?\.md$/,
  );
  if (!match) return null;
  const [, yr, mo, dy, hh, mm, ss] = match;
  return new Date(
    Number(yr),
    Number(mo) - 1,
    Number(dy),
    Number(hh),
    Number(mm),
    Number(ss),
  );
}
