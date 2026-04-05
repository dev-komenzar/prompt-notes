// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 41-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:41 task:41-1 module:grid
// Date formatting helpers for grid filters and card display.

/**
 * Format a Date to "YYYY-MM-DD" string for IPC params.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return default 7-day date range (CONV-GRID-1).
 */
export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return {
    fromDate: formatDateParam(sevenDaysAgo),
    toDate: formatDateParam(now),
  };
}

/**
 * Format created_at string for human-readable card display.
 * "2026-04-04T14:30:52" → "2026-04-04 14:30"
 */
export function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  return iso.replace('T', ' ').slice(0, 16);
}
