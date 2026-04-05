// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=12 task=12-1 module=date-utils
// Date utilities for grid view filtering and display.
// Date calculations for default 7-day filter are performed on the frontend
// (Svelte side), then passed to Rust backend via IPC parameters.

import { DEFAULT_GRID_DAYS } from './constants';

/**
 * Format a Date object to YYYY-MM-DD string for IPC date parameters.
 * Rust backend parses this with chrono::NaiveDate::parse_from_str.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day filter range for grid view initial display.
 * Returns { fromDate, toDate } as YYYY-MM-DD strings.
 *
 * CONV-GRID-1: Default filter is past 7 days based on filename timestamps.
 */
export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - DEFAULT_GRID_DAYS);
  return {
    fromDate: formatDateParam(past),
    toDate: formatDateParam(now),
  };
}

/**
 * Format a created_at string (from NoteEntry) to a human-readable display string.
 * Input format: "2026-04-04T14:30:52" (ISO-like from Rust).
 * Output: "2026-04-04 14:30" (for grid card display).
 */
export function formatCreatedAt(createdAt: string): string {
  // Replace T with space and drop seconds for compact display
  const match = createdAt.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  // Fallback: try alternate format without T separator
  const alt = createdAt.match(/^(\d{4}-\d{2}-\d{2})[\sT](\d{2}:\d{2})/);
  if (alt) {
    return `${alt[1]} ${alt[2]}`;
  }
  return createdAt;
}

/**
 * Parse a filename timestamp into a Date object.
 * Filename format: YYYY-MM-DDTHHMMSS.md (e.g. "2026-04-04T143052.md")
 */
export function parseFilenameTimestamp(filename: string): Date | null {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return new Date(
    parseInt(y, 10),
    parseInt(mo, 10) - 1,
    parseInt(d, 10),
    parseInt(h, 10),
    parseInt(mi, 10),
    parseInt(s, 10),
  );
}
