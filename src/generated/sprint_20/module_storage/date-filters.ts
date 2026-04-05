// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=20 task=20-1 module=storage
// Date filter computation utilities for module:grid.
// CONV-GRID-1: Default filter is last 7 days. Calculation is frontend-side;
// Rust backend receives from_date/to_date parameters and filters accordingly.

import { DEFAULT_FILTER_DAYS } from './constants';
import { formatDateForFilter } from './filename';
import type { ListNotesArgs } from './types';

/**
 * Computes the default 7-day filter range for the grid view.
 * Returns { from_date, to_date } as YYYY-MM-DD strings.
 */
export function computeDefaultDateRange(): { from_date: string; to_date: string } {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - DEFAULT_FILTER_DAYS);

  return {
    from_date: formatDateForFilter(past),
    to_date: formatDateForFilter(now),
  };
}

/**
 * Builds ListNotesArgs with the default 7-day range and an optional tag filter.
 * Convenience function for module:grid initial data fetch.
 */
export function buildDefaultListArgs(tag?: string): ListNotesArgs {
  const { from_date, to_date } = computeDefaultDateRange();
  const args: ListNotesArgs = { from_date, to_date };
  if (tag !== undefined && tag !== '') {
    return { ...args, tag };
  }
  return args;
}

/**
 * Builds ListNotesArgs from explicit date range and optional tag filter.
 * Used when the user changes the date filter in module:grid.
 */
export function buildListArgs(
  fromDate: Date,
  toDate: Date,
  tag?: string,
): ListNotesArgs {
  const args: ListNotesArgs = {
    from_date: formatDateForFilter(fromDate),
    to_date: formatDateForFilter(toDate),
  };
  if (tag !== undefined && tag !== '') {
    return { ...args, tag };
  }
  return args;
}
