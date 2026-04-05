// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 19-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=19, task=19-1, module=storage, node=detail:storage_fileformat
// Date formatting utilities for IPC date parameters.
// Date filter computation is owned by Svelte frontend (not Rust backend).

/**
 * Formats a Date object to YYYY-MM-DD string for IPC date parameters.
 * Rust backend expects this format for from_date/to_date parsing via chrono::NaiveDate.
 */
export function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes the default 7-day filter range for grid view initial display.
 * Returns { from_date, to_date } in YYYY-MM-DD format.
 *
 * Per CONV-GRID-1: Default filter is last 7 days.
 * Date computation is frontend responsibility; Rust side receives parameters only.
 */
export function getDefault7DayRange(): { from_date: string; to_date: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return {
    from_date: formatDateParam(sevenDaysAgo),
    to_date: formatDateParam(now),
  };
}

/**
 * Parses a YYYY-MM-DDTHHMMSS filename into a human-readable datetime string.
 * Used for display in NoteCard components.
 *
 * @example
 * parseFilenameTimestamp("2026-04-04T143052.md") // "2026-04-04 14:30"
 */
export function parseFilenameTimestamp(filename: string): string | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(_\d+)?\.md$/,
  );
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * Validates that a date string conforms to YYYY-MM-DD format
 * expected by the Rust backend's chrono::NaiveDate parser.
 */
export function isValidDateParam(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const parsed = new Date(dateStr + 'T00:00:00');
  return !isNaN(parsed.getTime());
}
