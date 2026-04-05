// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 33-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=33, task=33-1, module=shared, node=detail:grid_search
// Date formatting helpers used by module:grid for filter parameter construction.

/**
 * Format a Date object as "YYYY-MM-DD" string for IPC date parameters.
 * Uses local time (not UTC) to match the Rust backend's chrono::Local usage.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day grid view window.
 *
 * @returns `{ from_date, to_date }` strings in "YYYY-MM-DD" format
 *          where from_date = today − 7 days and to_date = today.
 */
export function defaultDateRange(): { from_date: string; to_date: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return {
    from_date: formatDateParam(sevenDaysAgo),
    to_date: formatDateParam(now),
  };
}
