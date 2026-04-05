// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:13 task:13-1 module:storage
// Date formatting utilities for IPC filter parameter construction.
// Used by module:grid for the default 7-day filter and custom date range filters.

import { DEFAULT_FILTER_DAYS } from './constants';

/**
 * Formats a Date as "YYYY-MM-DD" for passing to Rust-side IPC commands
 * (`list_notes` / `search_notes` date parameters).
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns `{ from_date, to_date }` representing the default grid view filter
 * (today minus DEFAULT_FILTER_DAYS through today inclusive).
 */
export function getDefaultDateRange(): { from_date: string; to_date: string } {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - DEFAULT_FILTER_DAYS);
  return {
    from_date: formatDateParam(past),
    to_date: formatDateParam(now),
  };
}
