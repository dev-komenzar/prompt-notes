// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:14 task:14-1 module:storage
// Date formatting utilities for IPC filter parameters.
// list_notes and search_notes accept date strings in "YYYY-MM-DD" format.

/**
 * Formats a Date object to "YYYY-MM-DD" string for IPC filter parameters.
 * Uses local time to match Rust-side chrono::Local behaviour.
 *
 * @param date - The date to format.
 * @returns Date string in "YYYY-MM-DD" format.
 */
export function formatDateForFilter(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes the default 7-day filter range for the grid view (CONV-GRID-1).
 * Returns { from_date, to_date } in "YYYY-MM-DD" format.
 *
 * @param now - Reference date (defaults to current date).
 * @param days - Number of days to look back (defaults to 7).
 * @returns An object with from_date and to_date strings.
 */
export function getDefaultDateRange(
  now: Date = new Date(),
  days: number = 7
): { from_date: string; to_date: string } {
  const toDate = new Date(now);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - days);

  return {
    from_date: formatDateForFilter(fromDate),
    to_date: formatDateForFilter(toDate),
  };
}

/**
 * Parses a YYYY-MM-DDTHHMMSS filename into a Date object.
 * Returns null if the filename does not match the expected pattern.
 *
 * @param filename - e.g. "2026-04-04T143052.md"
 * @returns Parsed Date or null.
 */
export function parseDateFromFilename(filename: string): Date | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(_\d+)?\.md$/
  );
  if (!match) {
    return null;
  }
  const [, year, month, day, hours, minutes, seconds] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  );
}
