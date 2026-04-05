// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=9, task=9-1, module=shared, file=date.ts
// Design refs: detail:grid_search §4.1
// Date formatting utilities for IPC parameter construction.
// Used by module:grid to compute default 7-day filter range.

/**
 * Format a Date object as "YYYY-MM-DD" string for IPC date parameters.
 * Rust-side parses this with chrono::NaiveDate::parse_from_str.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day filter range for the grid view.
 * Returns { from_date, to_date } as YYYY-MM-DD strings.
 *
 * Design contract (detail:grid_search §4.1, CONV-GRID-1):
 *   GridView.svelte onMount computes from_date = today - 7 days,
 *   to_date = today, and passes them to list_notes IPC command.
 */
export function defaultDateRange(): { from_date: string; to_date: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return {
    from_date: formatDate(sevenDaysAgo),
    to_date: formatDate(now),
  };
}
