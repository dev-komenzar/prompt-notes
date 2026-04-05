// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:37 task:37-1 module:grid — Filter and search state logic
// All filtering/searching is performed server-side (Rust module:storage).
// This module builds IPC parameters from the UI filter state.
// Client-side filtering of NoteEntry[] is PROHIBITED.

import type {
  GridFilterState,
  ListNotesParams,
  SearchNotesParams,
  NoteEntry,
} from './types';
import { getDefaultDateRange } from './date-utils';

/**
 * Creates the default filter state for grid initialization.
 * CONV-GRID-1: Default filter is last 7 days.
 */
export function createDefaultFilterState(): GridFilterState {
  const { fromDate, toDate } = getDefaultDateRange();
  return {
    fromDate,
    toDate,
    selectedTag: undefined,
    searchQuery: '',
  };
}

/**
 * Determines whether the search_notes IPC command should be used
 * instead of list_notes, based on the current filter state.
 *
 * Rule: use search_notes when query is non-empty; list_notes otherwise.
 */
export function shouldUseSearchCommand(state: GridFilterState): boolean {
  return state.searchQuery.trim().length > 0;
}

/**
 * Builds IPC parameters for the list_notes command from the current filter state.
 */
export function buildListParams(state: GridFilterState): ListNotesParams {
  return {
    from_date: state.fromDate,
    to_date: state.toDate,
    tag: state.selectedTag,
  };
}

/**
 * Builds IPC parameters for the search_notes command from the current filter state.
 */
export function buildSearchParams(state: GridFilterState): SearchNotesParams {
  return {
    query: state.searchQuery.trim(),
    from_date: state.fromDate,
    to_date: state.toDate,
    tag: state.selectedTag,
  };
}

/**
 * Collects all unique tags from a list of notes.
 * Used to populate the TagFilter UI with available tags.
 *
 * Tags are collected from IPC response only — no client-side
 * introspection of file contents.
 */
export function collectAvailableTags(notes: readonly NoteEntry[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

/**
 * Checks if the current filter state differs from the default.
 * Useful for displaying a "reset filters" button.
 */
export function isFilterActive(state: GridFilterState): boolean {
  const defaults = createDefaultFilterState();
  return (
    state.selectedTag !== undefined ||
    state.searchQuery.trim().length > 0 ||
    state.fromDate !== defaults.fromDate ||
    state.toDate !== defaults.toDate
  );
}

/**
 * Applies a tag selection to an existing filter state.
 * Returns a new state object (immutable update).
 */
export function withTag(state: GridFilterState, tag: string | undefined): GridFilterState {
  return { ...state, selectedTag: tag };
}

/**
 * Applies a date range to an existing filter state.
 * Returns a new state object (immutable update).
 */
export function withDateRange(
  state: GridFilterState,
  fromDate: string,
  toDate: string,
): GridFilterState {
  return { ...state, fromDate, toDate };
}

/**
 * Applies a search query to an existing filter state.
 * Returns a new state object (immutable update).
 */
export function withSearchQuery(state: GridFilterState, query: string): GridFilterState {
  return { ...state, searchQuery: query };
}
