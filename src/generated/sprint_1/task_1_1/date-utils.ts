// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD trace: plan:implementation_plan > sprint:1 > task:1-1
// Date formatting and calculation utilities for module:grid.
// Default 7-day filter calculation is owned by Svelte frontend (GridView.svelte).
// Rust backend has no default-value logic; it filters by the parameters it receives.

/**
 * Formats a Date object to "YYYY-MM-DD" string for IPC date parameters.
 *
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the default 7-day filter range for grid view initial display.
 *
 * CONV-GRID-1: Default filter is the last 7 days.
 * The range is [today - 7 days, today] inclusive.
 *
 * @returns Object with fromDate and toDate in "YYYY-MM-DD" format
 */
export function getDefault7DayRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return {
    fromDate: formatDateParam(sevenDaysAgo),
    toDate: formatDateParam(now),
  };
}

/**
 * Formats a created_at string for human-readable display on grid cards.
 *
 * Accepts formats:
 * - "2026-04-04T14:30:52" (colon-separated)
 * - "2026-04-04T143052"   (compact)
 *
 * @param createdAt - Timestamp string from NoteEntry.created_at
 * @returns Human-readable format "YYYY-MM-DD HH:MM"
 */
export function formatDisplayDate(createdAt: string): string {
  const match = createdAt.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):?(\d{2}):?(\d{2})$/,
  );
  if (!match) {
    return createdAt;
  }
  const [, datePart, hours, minutes] = match;
  return `${datePart} ${hours}:${minutes}`;
}

/**
 * Parses a note filename (YYYY-MM-DDTHHMMSS.md) into a Date object.
 *
 * NOTE: Filename generation and validation are exclusively owned by
 * module:storage (Rust side). This function is for frontend display only.
 *
 * @param filename - Note filename, e.g. "2026-04-04T143052.md"
 * @returns Parsed Date or null if format doesn't match
 */
export function parseFilenameDate(filename: string): Date | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(?:_\d+)?\.md$/,
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
