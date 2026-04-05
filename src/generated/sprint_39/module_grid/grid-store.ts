// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 39-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:39 task:39-1 module:grid
// Svelte store for grid view state management.
// CONV-GRID-1: Default 7-day filter applied on initialization.
// CONV-GRID-2: Tag/date filter and full-text search delegated entirely to module:storage via IPC.
// CONV-IPC: No client-side filtering or searching. All logic in Rust backend.

import { writable, get } from 'svelte/store';
import type { NoteEntry, GridState } from './types';
import { listNotes, searchNotes } from './api';
import { getDefaultDateRange } from './date-utils';

function collectUniqueTags(notes: NoteEntry[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

export function createGridStore() {
  const { from_date, to_date } = getDefaultDateRange();

  const internal = writable<GridState>({
    notes: [],
    filters: {
      from_date,
      to_date,
      tag: undefined,
      query: '',
    },
    loading: false,
    error: null,
    availableTags: [],
  });

  let fetchGeneration = 0;

  async function fetchNotes(refreshTags: boolean): Promise<void> {
    const generation = ++fetchGeneration;
    internal.update((s) => ({ ...s, loading: true, error: null }));

    const state = get(internal);
    const { filters } = state;

    try {
      let notes: NoteEntry[];

      if (filters.query.trim() !== '') {
        notes = await searchNotes({
          query: filters.query,
          from_date: filters.from_date || undefined,
          to_date: filters.to_date || undefined,
          tag: filters.tag,
        });
      } else {
        notes = await listNotes({
          from_date: filters.from_date || undefined,
          to_date: filters.to_date || undefined,
          tag: filters.tag,
        });
      }

      if (generation !== fetchGeneration) return;

      internal.update((s) => {
        const next: GridState = { ...s, notes, loading: false, error: null };
        if (refreshTags) {
          next.availableTags = collectUniqueTags(notes);
        }
        return next;
      });
    } catch (err: unknown) {
      if (generation !== fetchGeneration) return;
      const message = err instanceof Error ? err.message : String(err);
      internal.update((s) => ({
        ...s,
        notes: [],
        loading: false,
        error: message,
      }));
    }
  }

  return {
    subscribe: internal.subscribe,

    async init(): Promise<void> {
      await fetchNotes(true);
    },

    async setTag(tag: string | undefined): Promise<void> {
      internal.update((s) => ({
        ...s,
        filters: { ...s.filters, tag },
      }));
      await fetchNotes(false);
    },

    async setDateRange(from_date: string, to_date: string): Promise<void> {
      internal.update((s) => ({
        ...s,
        filters: { ...s.filters, from_date, to_date, tag: undefined },
      }));
      await fetchNotes(true);
    },

    async setQuery(query: string): Promise<void> {
      internal.update((s) => ({
        ...s,
        filters: { ...s.filters, query },
      }));
      await fetchNotes(true);
    },

    async resetFilters(): Promise<void> {
      const defaults = getDefaultDateRange();
      internal.update((s) => ({
        ...s,
        filters: {
          from_date: defaults.from_date,
          to_date: defaults.to_date,
          tag: undefined,
          query: '',
        },
      }));
      await fetchNotes(true);
    },

    async refresh(): Promise<void> {
      const state = get(internal);
      await fetchNotes(state.filters.tag === undefined);
    },
  };
}
