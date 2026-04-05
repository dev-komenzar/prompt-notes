// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:18 task:18-1 module:storage
// Date formatting utilities for IPC filter parameters.
// Dates sent to Rust backend use YYYY-MM-DD string format.

/**
 * Formats a Date to "YYYY-MM-DD" string for IPC date filter parameters.
 * Uses local date components (not UTC) to match Rust-side chrono::Local behaviour.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the default 7-day date range for grid view initial load.
 * from_date = today minus 7 days, to_date = today.
 * CONV-GRID-1: Default filter is last 7 days.
 */
export function getDefaultDateRange(): { from_date: string; to_date: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return {
    from_date: formatDateParam(sevenDaysAgo),
    to_date: formatDateParam(now),
  };
}

/**
 * Parses a created_at string (from NoteEntry) into a Date object.
 * Expected format from Rust: "2026-04-04T14:30:52"
 * Returns null if parsing fails.
 */
export function parseCreatedAt(createdAt: string): Date | null {
  const match = createdAt.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10),
  );

  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a created_at string for human-readable display on cards.
 * Example: "2026-04-04T14:30:52" → "2026-04-04 14:30"
 */
export function formatCreatedAtDisplay(createdAt: string): string {
  const date = parseCreatedAt(createdAt);
  if (!date) {
    return createdAt;
  }

  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');

  return `${y}-${mo}-${d} ${h}:${mi}`;
}
