// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=11, task=11-1, modules=[storage,grid]
// Date utilities for IPC filter parameters.
// Default 7-day range is computed on the frontend; Rust has no default concept.

/**
 * Format a Date as "YYYY-MM-DD" for IPC date filter parameters.
 * Rust parses these via chrono::NaiveDate::parse_from_str.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface DateRange {
  readonly from_date: string;
  readonly to_date: string;
}

/**
 * Compute the default 7-day date range for the grid view.
 * from_date = today − 7 days, to_date = today.
 * Both are inclusive boundaries.
 *
 * @param now  Optional override for "now" (useful in tests).
 */
export function getDefaultDateRange(now?: Date): DateRange {
  const today = now ?? new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  return {
    from_date: formatDateParam(sevenDaysAgo),
    to_date: formatDateParam(today),
  };
}

/**
 * Format a created_at string (from NoteEntry) for human-readable display.
 * "2026-04-04T14:30:52" → "2026-04-04 14:30"
 */
export function formatCreatedAtDisplay(createdAt: string): string {
  // created_at is "YYYY-MM-DDTHH:MM:SS"
  return createdAt.replace('T', ' ').substring(0, 16);
}
