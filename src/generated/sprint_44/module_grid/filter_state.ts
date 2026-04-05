// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// design-ref: detail:grid_search §2.3 (state diagram)

import type {
  FilterCriteria,
  GridViewState,
  ListNotesParams,
  SearchNotesParams,
} from './types';
import { getDefault7DayRange } from './date_utils';

/**
 * Derive the GridViewState enum value from the current filter criteria.
 *
 * State machine (detail:grid_search §2.3):
 *   - query non-empty  →  search_result  (regardless of other filters)
 *   - tag set + date differs from default  →  filtered_by_tag_and_date
 *   - tag set only  →  filtered_by_tag
 *   - date differs from default only  →  filtered_by_date
 *   - otherwise  →  default
 */
export function deriveViewState(
  criteria: FilterCriteria,
  defaultFromDate: string,
  defaultToDate: string,
): GridViewState {
  if (criteria.query.length > 0) {
    return 'search_result';
  }

  const hasTag = criteria.tag !== null && criteria.tag.length > 0;
  const hasCustomDate =
    criteria.fromDate !== defaultFromDate || criteria.toDate !== defaultToDate;

  if (hasTag && hasCustomDate) return 'filtered_by_tag_and_date';
  if (hasTag) return 'filtered_by_tag';
  if (hasCustomDate) return 'filtered_by_date';
  return 'default';
}

/**
 * Build the initial FilterCriteria using the 7-day default.
 * CONV-GRID-1: Default filter is last 7 days.
 */
export function createDefaultFilterCriteria(): FilterCriteria {
  const { fromDate, toDate } = getDefault7DayRange();
  return {
    fromDate,
    toDate,
    tag: null,
    query: '',
  };
}

/**
 * Produce IPC parameters from the current criteria.
 *
 * Key rule (detail:grid_search §2.3):
 *   - If query is non-empty → search_notes  (tag + date filters forwarded)
 *   - If query is empty     → list_notes    (tag + date filters forwarded)
 *
 * Returns a discriminated union so callers can branch on the command name.
 */
export type ResolvedQuery =
  | { command: 'list_notes'; params: ListNotesParams }
  | { command: 'search_notes'; params: SearchNotesParams };

export function resolveQuery(criteria: FilterCriteria): ResolvedQuery {
  const base = {
    from_date: criteria.fromDate,
    to_date: criteria.toDate,
    tag: criteria.tag ?? undefined,
  };

  if (criteria.query.length > 0) {
    return {
      command: 'search_notes',
      params: { ...base, query: criteria.query },
    };
  }

  return { command: 'list_notes', params: base };
}

/**
 * Apply a tag change, returning a new FilterCriteria.
 */
export function applyTagChange(
  current: FilterCriteria,
  tag: string | null,
): FilterCriteria {
  return { ...current, tag };
}

/**
 * Apply a date range change, returning a new FilterCriteria.
 */
export function applyDateChange(
  current: FilterCriteria,
  fromDate: string,
  toDate: string,
): FilterCriteria {
  return { ...current, fromDate, toDate };
}

/**
 * Apply a search query change, returning a new FilterCriteria.
 */
export function applyQueryChange(
  current: FilterCriteria,
  query: string,
): FilterCriteria {
  return { ...current, query };
}

/**
 * Reset all filters to the 7-day default.
 */
export function resetFilters(): FilterCriteria {
  return createDefaultFilterCriteria();
}

/**
 * Clear only the search query while preserving tag/date filters.
 */
export function clearSearch(current: FilterCriteria): FilterCriteria {
  return { ...current, query: '' };
}
