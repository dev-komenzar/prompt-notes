// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=11 module:storage — filters store
// Default filter: last 7 days (RBC-GRID-1).
// Written only by grid module (FilterBar, SearchInput); read by GridView.

import { writable } from 'svelte/store';
import type { NoteFilter } from '../types';

export interface GridFilters extends NoteFilter {
  query: string;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function defaultFilters(): GridFilters {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    tags: [],
    date_from: isoDate(sevenDaysAgo),
    date_to: isoDate(now),
    query: '',
  };
}

function createFiltersStore() {
  const { subscribe, set, update } = writable<GridFilters>(defaultFilters());

  return {
    subscribe,

    setQuery(query: string): void {
      update((f) => ({ ...f, query }));
    },

    toggleTag(tag: string): void {
      update((f) => ({
        ...f,
        tags: f.tags?.includes(tag)
          ? f.tags.filter((t) => t !== tag)
          : [...(f.tags ?? []), tag],
      }));
    },

    setDateFrom(date_from: string): void {
      update((f) => ({ ...f, date_from }));
    },

    setDateTo(date_to: string): void {
      update((f) => ({ ...f, date_to }));
    },

    reset(): void {
      set(defaultFilters());
    },
  };
}

export const filtersStore = createFiltersStore();
