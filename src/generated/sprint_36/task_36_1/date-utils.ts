// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Date Utility Functions
// Used by module:grid for default 7-day filter and date parameter formatting.
// CoDD trace: detail:grid_search, detail:storage_fileformat

import { DEFAULT_FILTER_DAYS } from "./constants";

/**
 * Format a Date object as "YYYY-MM-DD" string for IPC parameters.
 * Rust backend parses this with chrono::NaiveDate::parse_from_str.
 */
export function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the default "from" date for the grid view filter.
 * Returns a date string representing N days ago (default: 7 days).
 *
 * CONV-GRID-1: Default filter is last 7 days.
 */
export function getDefaultFromDate(daysBack: number = DEFAULT_FILTER_DAYS): string {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return formatDateParam(date);
}

/**
 * Get today's date as a formatted string for the "to" date parameter.
 */
export function getDefaultToDate(): string {
  return formatDateParam(new Date());
}

/**
 * Parse a note filename into a Date object.
 * Filename format: YYYY-MM-DDTHHMMSS.md or YYYY-MM-DDTHHMMSS_N.md
 *
 * @returns Date object or null if the filename cannot be parsed.
 */
export function parseDateFromFilename(filename: string): Date | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(_\d+)?\.md$/,
  );
  if (!match) {
    return null;
  }
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
 * Format a created_at string (from NoteEntry) into a human-readable display string.
 * Input format: "2026-04-04T14:30:52"
 * Output format: "2026-04-04 14:30"
 */
export function formatCreatedAtDisplay(createdAt: string): string {
  const match = createdAt.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(:\d{2})?$/,
  );
  if (!match) {
    return createdAt;
  }
  return `${match[1]} ${match[2]}`;
}

/**
 * Compute the default filter date range for the grid view.
 * Returns { from_date, to_date } suitable for listNotes() params.
 */
export function getDefaultDateRange(): { from_date: string; to_date: string } {
  return {
    from_date: getDefaultFromDate(),
    to_date: getDefaultToDate(),
  };
}
