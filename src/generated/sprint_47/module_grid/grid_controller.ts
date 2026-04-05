// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:47 task:47-1 module:grid
// GridController orchestrates data fetching, filter updates, search debounce,
// and card-click navigation for the grid view.
//
// Design invariants enforced:
//   - All data fetching via Tauri IPC (CONV-IPC).
//   - No client-side search or file filtering (CONV-GRID-2 / design §4.5).
//   - query == '' → list_notes;  query != '' → search_notes.
//   - Debounce interval: 300ms (OQ-GRID-001 resolved, Sprint 47).
//   - Default 7-day filter applied on init (CONV-GRID-1).

import { get } from 'svelte/store';
import type { GridStores } from './grid_state';
import type { GridFilterState, NoteEntry } from './types';
import { listNotes, searchNotes, deleteNote as ipcDeleteNote } from './ipc';
import { debounce, type DebouncedFn } from './debounce';
import { SEARCH_DEBOUNCE_MS } from './constants';

export interface GridController {
  /** Initialise the grid: fetch notes with default 7-day filter. */
  init(): Promise<void>;

  /** Update the tag filter and refetch. Pass `undefined` to clear. */
  setTag(tag: string | undefined): void;

  /** Update the date range filter and refetch. */
  setDateRange(fromDate: string, toDate: string): void;

  /**
   * Update the search query.  Fetching is debounced at 300ms
   * (OQ-GRID-001).  Empty string reverts to list_notes.
   */
  setSearchQuery(query: string): void;

  /** Handle card click: returns the filename for navigation. */
  handleCardClick(filename: string): void;

  /** Delete a note and refresh the grid. */
  deleteNote(filename: string): Promise<void>;

  /** Tear down (cancel pending debounce, etc.). Call on component destroy. */
  destroy(): void;
}

export type OnNavigate = (view: 'editor', filename: string) => void;

/**
 * Factory: create a GridController bound to the given stores.
 *
 * @param stores   - Reactive Svelte stores created by `createGridStores()`.
 * @param onNavigate - Callback invoked on card click; the parent (App.svelte)
 *                     uses it to set `currentView = 'editor'` and pass the filename.
 */
export function createGridController(
  stores: GridStores,
  onNavigate: OnNavigate,
): GridController {
  // ── internal helpers ────────────────────────────────────────────

  function currentFilters(): GridFilterState {
    return get(stores.filters);
  }

  async function fetchNotes(): Promise<void> {
    const f = currentFilters();
    stores.loading.set(true);
    stores.error.set(null);

    try {
      let result: NoteEntry[];

      if (f.query.length > 0) {
        result = await searchNotes({
          query: f.query,
          from_date: f.fromDate,
          to_date: f.toDate,
          tag: f.tag,
        });
      } else {
        result = await listNotes({
          from_date: f.fromDate,
          to_date: f.toDate,
          tag: f.tag,
        });
      }

      // Rust side returns descending sort; no client re-sort.
      stores.notes.set(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err);
      stores.error.set(message);
      stores.notes.set([]);
    } finally {
      stores.loading.set(false);
    }
  }

  // Debounced fetch used exclusively for search-query changes.
  const debouncedFetch: DebouncedFn<[]> = debounce(
    () => {
      void fetchNotes();
    },
    SEARCH_DEBOUNCE_MS,
  );

  function updateFilters(patch: Partial<GridFilterState>): void {
    stores.filters.update((prev) => ({ ...prev, ...patch }));
  }

  // ── public API ──────────────────────────────────────────────────

  async function init(): Promise<void> {
    await fetchNotes();
  }

  function setTag(tag: string | undefined): void {
    updateFilters({ tag });
    // Tag changes are not debounced — immediate refetch.
    void fetchNotes();
  }

  function setDateRange(fromDate: string, toDate: string): void {
    updateFilters({ fromDate, toDate });
    void fetchNotes();
  }

  function setSearchQuery(query: string): void {
    updateFilters({ query });
    // Search query changes are debounced at SEARCH_DEBOUNCE_MS (300ms).
    debouncedFetch();
  }

  function handleCardClick(filename: string): void {
    // Delegate navigation to parent (App.svelte) via callback.
    // module:grid does NOT call read_note; that is module:editor's responsibility.
    onNavigate('editor', filename);
  }

  async function doDeleteNote(filename: string): Promise<void> {
    try {
      await ipcDeleteNote(filename);
      // Refresh grid after deletion.
      await fetchNotes();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err);
      stores.error.set(message);
    }
  }

  function destroy(): void {
    debouncedFetch.cancel();
  }

  return {
    init,
    setTag,
    setDateRange,
    setSearchQuery,
    handleCardClick,
    deleteNote: doDeleteNote,
    destroy,
  };
}
