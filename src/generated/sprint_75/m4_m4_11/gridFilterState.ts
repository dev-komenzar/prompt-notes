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

// CoDD Trace: sprint_75 / task 75-1 / M4-11
// Reactive grid filter state store for Svelte integration.
// All filtering/search logic is delegated to Rust backend via IPC.
// No client-side filtering permitted (CONV-GRID-2 / §4.5).

import type { NoteEntry, GridFilterState } from './types';

export interface GridState {
  readonly notes: readonly NoteEntry[];
  readonly filters: Readonly<GridFilterState>;
  readonly loading: boolean;
  readonly error: string | null;
}

export type GridStateSubscriber = (state: GridState) => void;

export interface GridStateStore {
  subscribe(subscriber: GridStateSubscriber): () => void;
  getState(): Readonly<GridState>;
  setNotes(notes: readonly NoteEntry[]): void;
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  setFilters(filters: Partial<GridFilterState>): void;
}

export function createGridStateStore(initialFilters: GridFilterState): GridStateStore {
  const subscribers = new Set<GridStateSubscriber>();

  let state: GridState = {
    notes: [],
    filters: { ...initialFilters },
    loading: false,
    error: null,
  };

  function notify(): void {
    const snapshot = state;
    for (const sub of subscribers) {
      sub(snapshot);
    }
  }

  function subscribe(subscriber: GridStateSubscriber): () => void {
    subscribers.add(subscriber);
    subscriber(state);
    return () => {
      subscribers.delete(subscriber);
    };
  }

  function getState(): Readonly<GridState> {
    return state;
  }

  function setNotes(notes: readonly NoteEntry[]): void {
    state = { ...state, notes, loading: false, error: null };
    notify();
  }

  function setLoading(loading: boolean): void {
    state = { ...state, loading };
    notify();
  }

  function setError(error: string | null): void {
    state = { ...state, error, loading: false };
    notify();
  }

  function setFilters(partial: Partial<GridFilterState>): void {
    state = {
      ...state,
      filters: { ...state.filters, ...partial },
    };
    notify();
  }

  return { subscribe, getState, setNotes, setLoading, setError, setFilters };
}
