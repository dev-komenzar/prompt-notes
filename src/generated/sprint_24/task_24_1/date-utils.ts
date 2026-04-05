// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Date Utilities
// Used by module:grid for default 7-day filter calculation
// and by display logic for human-readable date formatting.

import { DEFAULT_FILTER_DAYS } from './constants';

/**
 * Format a Date to YYYY-MM-DD string for IPC date filter parameters.
 * Rust backend parses this format with chrono::NaiveDate::parse_from_str.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day filter date range for grid view initial display.
 * Returns { from_date, to_date } in YYYY-MM-DD format.
 *
 * from_date = today minus DEFAULT_FILTER_DAYS
 * to_date = today
 *
 * Date calculation is performed on the frontend (Svelte side).
 * Rust backend does not hold default filter logic; it accepts arbitrary date ranges.
 */
export function getDefaultDateRange(): { from_date: string; to_date: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - DEFAULT_FILTER_DAYS);

  return {
    from_date: formatDateParam(from),
    to_date: formatDateParam(now),
  };
}

/**
 * Parse a note filename timestamp into a human-readable display string.
 *
 * Input:  "2026-04-04T143052.md" or "2026-04-04T143052_1.md"
 * Output: "2026-04-04 14:30"
 *
 * Returns the filename as-is if parsing fails. Authoritative datetime
 * derivation from filenames is on the Rust side (NoteEntry.created_at).
 * This function is a convenience for client-side display only.
 */
export function formatFilenameDate(filename: string): string {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    return filename;
  }
  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * Parse a NoteEntry.created_at ISO string into a Date object.
 * created_at format from Rust: "2026-04-04T14:30:52"
 */
export function parseCreatedAt(createdAt: string): Date {
  return new Date(createdAt.replace('T', ' '));
}

/**
 * Format a NoteEntry.created_at string for display in grid cards.
 * Input:  "2026-04-04T14:30:52"
 * Output: "2026-04-04 14:30"
 */
export function formatCreatedAt(createdAt: string): string {
  const match = createdAt.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) {
    return createdAt;
  }
  return `${match[1]} ${match[2]}`;
}
