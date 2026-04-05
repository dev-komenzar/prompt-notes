// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=46 task=46-1 node=detail:grid_search
// Date formatting utilities for grid view filters.
// from_date / to_date sent to Rust list_notes / search_notes use "YYYY-MM-DD" format.

/**
 * Format a Date object as "YYYY-MM-DD" string for IPC date filter parameters.
 * Rust side parses with chrono::NaiveDate::parse_from_str("%Y-%m-%d").
 */
export function formatDateForFilter(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day filter range used by GridView on mount.
 * Returns { fromDate, toDate } as "YYYY-MM-DD" strings.
 *
 * CONV-GRID-1: Default filter is last 7 days.
 * The calculation is owned by the Svelte frontend; Rust side receives
 * explicit from_date / to_date and has no concept of a default range.
 */
export function getDefault7DayRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return {
    fromDate: formatDateForFilter(sevenDaysAgo),
    toDate: formatDateForFilter(now),
  };
}

/**
 * Parse a "YYYY-MM-DDTHHMMSS" timestamp (from a note filename without .md extension)
 * into a human-readable display string like "2026-04-04 14:30".
 * Used by NoteCard.svelte to render created_at.
 */
export function formatCreatedAtForDisplay(createdAt: string): string {
  // created_at from Rust is "2026-04-04T14:30:52" (ISO-like with colons)
  // We display as "2026-04-04 14:30"
  if (createdAt.length < 16) return createdAt;
  return createdAt.slice(0, 10) + ' ' + createdAt.slice(11, 16);
}
