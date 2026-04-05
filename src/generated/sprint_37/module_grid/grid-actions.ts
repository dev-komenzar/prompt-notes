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

// sprint:37 task:37-1 module:grid — Grid action handlers
// Orchestrates IPC calls and store updates for all grid user flows.
// All data fetching is via ipc.ts; no direct invoke() calls here.

import type { GridStore } from './grid-store';
import type { GridFilterState, NoteEntry } from './types';
import {
  shouldUseSearchCommand,
  buildListParams,
  buildSearchParams,
  withTag,
  withDateRange,
  withSearchQuery,
  createDefaultFilterState,
} from './filters';
import { listNotes, searchNotes, deleteNote as ipcDeleteNote } from './ipc';
import { debounceCancellable } from './debounce';
import { SEARCH_DEBOUNCE_MS } from './constants';

/**
 * Fetches notes from module:storage based on the current filter state.
 * Dispatches list_notes or search_notes IPC command as appropriate.
 *
 * This is the single data-fetching function for the grid.
 * Called on mount (default 7-day view) and after every filter change.
 */
export async function fetchNotes(store: GridStore): Promise<void> {
  let currentFilter: GridFilterState | undefined;
  const unsubscribe = store.filterState.subscribe((f) => {
    currentFilter = f;
  });
  unsubscribe();

  if (!currentFilter) return;

  store.setLoading(true);

  try {
    let notes: NoteEntry[];
    if (shouldUseSearchCommand(currentFilter)) {
      notes = await searchNotes(buildSearchParams(currentFilter));
    } else {
      notes = await listNotes(buildListParams(currentFilter));
    }
    store.setNotes(notes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    store.setError(message);
  }
}

/**
 * Applies a tag filter and reloads notes.
 *
 * @param store - Grid store instance
 * @param tag - Tag to filter by, or undefined to clear tag filter
 */
export async function applyTagFilter(store: GridStore, tag: string | undefined): Promise<void> {
  let current: GridFilterState | undefined;
  const unsub = store.filterState.subscribe((f) => {
    current = f;
  });
  unsub();
  if (!current) return;

  store.updateFilter(withTag(current, tag));
  await fetchNotes(store);
}

/**
 * Applies a date range filter and reloads notes.
 *
 * @param store - Grid store instance
 * @param fromDate - Start date (YYYY-MM-DD)
 * @param toDate - End date (YYYY-MM-DD)
 */
export async function applyDateFilter(
  store: GridStore,
  fromDate: string,
  toDate: string,
): Promise<void> {
  let current: GridFilterState | undefined;
  const unsub = store.filterState.subscribe((f) => {
    current = f;
  });
  unsub();
  if (!current) return;

  store.updateFilter(withDateRange(current, fromDate, toDate));
  await fetchNotes(store);
}

/**
 * Creates a debounced search handler that updates the query and fetches results.
 * Uses SEARCH_DEBOUNCE_MS (300ms) to avoid excessive IPC calls during typing.
 *
 * Returns an object with call/cancel/flush for lifecycle management.
 */
export function createSearchHandler(store: GridStore) {
  async function executeSearch(query: string): Promise<void> {
    store.updateFilter({ searchQuery: query });
    await fetchNotes(store);
  }

  return debounceCancellable(
    (query: string) => {
      void executeSearch(query);
    },
    SEARCH_DEBOUNCE_MS,
  );
}

/**
 * Immediately applies a search query without debounce.
 * Used for explicit search submission (e.g., pressing Enter).
 */
export async function applySearchImmediate(store: GridStore, query: string): Promise<void> {
  store.updateFilter({ searchQuery: query });
  await fetchNotes(store);
}

/**
 * Clears all filters and reloads with default 7-day view.
 */
export async function clearAllFilters(store: GridStore): Promise<void> {
  store.resetFilters();
  await fetchNotes(store);
}

/**
 * Deletes a note and refreshes the grid.
 *
 * @param store - Grid store instance
 * @param filename - Note filename to delete
 */
export async function deleteNoteAndRefresh(store: GridStore, filename: string): Promise<void> {
  try {
    await ipcDeleteNote(filename);
    await fetchNotes(store);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    store.setError(message);
  }
}

/**
 * Initializes the grid view on mount.
 * Loads notes with the default 7-day filter (CONV-GRID-1).
 */
export async function initializeGrid(store: GridStore): Promise<void> {
  store.resetFilters();
  await fetchNotes(store);
}
