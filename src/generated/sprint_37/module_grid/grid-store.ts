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

// sprint:37 task:37-1 module:grid — Svelte store for grid state management

import { writable, derived, type Readable, type Writable } from 'svelte/store';
import type { GridState, GridFilterState, NoteEntry } from './types';
import { createDefaultFilterState, collectAvailableTags, isFilterActive } from './filters';

/**
 * Creates the initial grid state with default 7-day filter.
 */
function createInitialState(): GridState {
  return {
    notes: [],
    filterState: createDefaultFilterState(),
    availableTags: [],
    isLoading: false,
    error: null,
  };
}

export interface GridStore extends Writable<GridState> {
  /** Reactive accessor: current note list. */
  readonly notes: Readable<readonly NoteEntry[]>;
  /** Reactive accessor: current filter state. */
  readonly filterState: Readable<GridFilterState>;
  /** Reactive accessor: all unique tags from current result set. */
  readonly availableTags: Readable<readonly string[]>;
  /** Reactive accessor: loading flag. */
  readonly isLoading: Readable<boolean>;
  /** Reactive accessor: error message or null. */
  readonly error: Readable<string | null>;
  /** Reactive accessor: whether any non-default filter is active. */
  readonly hasActiveFilter: Readable<boolean>;
  /** Reactive accessor: number of notes in current view. */
  readonly noteCount: Readable<number>;

  /** Sets the loading state. */
  setLoading(loading: boolean): void;
  /** Sets notes and recalculates available tags. */
  setNotes(notes: NoteEntry[]): void;
  /** Sets an error message. */
  setError(error: string | null): void;
  /** Updates the filter state. */
  updateFilter(partial: Partial<GridFilterState>): void;
  /** Resets all filters to defaults. */
  resetFilters(): void;
}

/**
 * Factory function that creates a reactive Svelte store for the grid module.
 *
 * Follows the custom store pattern:
 *   const store = createGridStore();
 *   $store.notes  // reactive in Svelte components
 */
export function createGridStore(): GridStore {
  const internal: Writable<GridState> = writable(createInitialState());

  const notes = derived(internal, ($s) => $s.notes);
  const filterState = derived(internal, ($s) => $s.filterState);
  const availableTags = derived(internal, ($s) => $s.availableTags);
  const isLoading = derived(internal, ($s) => $s.isLoading);
  const error = derived(internal, ($s) => $s.error);
  const hasActiveFilter = derived(internal, ($s) => isFilterActive($s.filterState));
  const noteCount = derived(internal, ($s) => $s.notes.length);

  function setLoading(loading: boolean): void {
    internal.update((s) => ({ ...s, isLoading: loading, error: loading ? null : s.error }));
  }

  function setNotes(newNotes: NoteEntry[]): void {
    internal.update((s) => ({
      ...s,
      notes: newNotes,
      availableTags: collectAvailableTags(newNotes),
      isLoading: false,
      error: null,
    }));
  }

  function setError(err: string | null): void {
    internal.update((s) => ({ ...s, error: err, isLoading: false }));
  }

  function updateFilter(partial: Partial<GridFilterState>): void {
    internal.update((s) => ({
      ...s,
      filterState: { ...s.filterState, ...partial },
    }));
  }

  function resetFilters(): void {
    internal.update((s) => ({
      ...s,
      filterState: createDefaultFilterState(),
    }));
  }

  return {
    subscribe: internal.subscribe,
    set: internal.set,
    update: internal.update,
    notes,
    filterState,
    availableTags,
    isLoading,
    error,
    hasActiveFilter,
    noteCount,
    setLoading,
    setNotes,
    setError,
    updateFilter,
    resetFilters,
  };
}

/** Singleton grid store instance for the application. */
export const gridStore: GridStore = createGridStore();
