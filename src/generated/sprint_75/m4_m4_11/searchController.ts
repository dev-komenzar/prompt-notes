// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 75-1
// @task-title: M4（M4-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint_75 / task 75-1 / M4-11 / OQ-GRID-001
// Search controller: manages debounced search (300ms) with filter state.
// Search logic (str::contains) is owned by module:storage (Rust).
// Client-side search/filtering is prohibited (CONV-GRID-2 / §4.5).

import type { NoteEntry, GridFilterState } from './types';
import { debounce } from './debounce';
import { SEARCH_DEBOUNCE_MS } from './constants';
import { listNotes, searchNotes } from './api';
import { computeDefaultDateRange } from './dateUtils';

export type SearchResultCallback = (notes: NoteEntry[], error: Error | null) => void;

export interface SearchController {
  updateQuery(query: string): void;
  updateTag(tag: string | undefined): void;
  updateDateRange(fromDate: string, toDate: string): void;
  resetFilters(): void;
  getFilterState(): Readonly<GridFilterState>;
  executeImmediate(): Promise<void>;
  destroy(): void;
}

export function createSearchController(
  onResult: SearchResultCallback,
): SearchController {
  const defaultRange = computeDefaultDateRange();

  const state: GridFilterState = {
    fromDate: defaultRange.fromDate,
    toDate: defaultRange.toDate,
    tag: undefined,
    query: '',
  };

  let destroyed = false;

  async function executeSearch(): Promise<void> {
    if (destroyed) return;

    try {
      let notes: NoteEntry[];

      if (state.query.trim().length > 0) {
        // Non-empty query: use search_notes (file full-scan on Rust side)
        notes = await searchNotes({
          query: state.query.trim(),
          from_date: state.fromDate,
          to_date: state.toDate,
          tag: state.tag,
        });
      } else {
        // Empty query: use list_notes with filters only
        notes = await listNotes({
          from_date: state.fromDate,
          to_date: state.toDate,
          tag: state.tag,
        });
      }

      if (!destroyed) {
        onResult(notes, null);
      }
    } catch (err) {
      if (!destroyed) {
        onResult([], err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  // 300ms debounce for search input per OQ-GRID-001 resolution
  const debouncedSearch = debounce(executeSearch, SEARCH_DEBOUNCE_MS);

  function updateQuery(query: string): void {
    if (destroyed) return;
    (state as { query: string }).query = query;
    debouncedSearch();
  }

  function updateTag(tag: string | undefined): void {
    if (destroyed) return;
    (state as { tag: string | undefined }).tag = tag;
    // Tag changes execute immediately (no debounce needed for discrete selection)
    debouncedSearch.cancel();
    void executeSearch();
  }

  function updateDateRange(fromDate: string, toDate: string): void {
    if (destroyed) return;
    (state as { fromDate: string }).fromDate = fromDate;
    (state as { toDate: string }).toDate = toDate;
    // Date range changes execute immediately
    debouncedSearch.cancel();
    void executeSearch();
  }

  function resetFilters(): void {
    if (destroyed) return;
    const range = computeDefaultDateRange();
    (state as { fromDate: string }).fromDate = range.fromDate;
    (state as { toDate: string }).toDate = range.toDate;
    (state as { tag: string | undefined }).tag = undefined;
    (state as { query: string }).query = '';
    debouncedSearch.cancel();
    void executeSearch();
  }

  function getFilterState(): Readonly<GridFilterState> {
    return { ...state };
  }

  async function executeImmediate(): Promise<void> {
    if (destroyed) return;
    debouncedSearch.cancel();
    await executeSearch();
  }

  function destroy(): void {
    destroyed = true;
    debouncedSearch.cancel();
  }

  return {
    updateQuery,
    updateTag,
    updateDateRange,
    resetFilters,
    getFilterState,
    executeImmediate,
    destroy,
  };
}
