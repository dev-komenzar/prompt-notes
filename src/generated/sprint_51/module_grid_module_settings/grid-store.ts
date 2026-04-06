// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: `module:grid`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:51 | task:51-1 | module:grid
// Pure reactive state for the grid view. No side effects or IPC calls.
// Business logic (load, filter, search) lives in grid-controller.ts.

import { writable, derived } from 'svelte/store';
import type { NoteEntry, FilterState } from './types';
import { getDefaultDateRange } from './date-utils';

function createDefaultFilters(): FilterState {
  const range = getDefaultDateRange();
  return {
    fromDate: range.fromDate,
    toDate: range.toDate,
    tag: undefined,
    query: '',
  };
}

export const gridNotes = writable<NoteEntry[]>([]);
export const gridLoading = writable<boolean>(false);
export const gridError = writable<string | null>(null);
export const gridFilters = writable<FilterState>(createDefaultFilters());

export const availableTags = derived(gridNotes, ($notes) => {
  const tagSet = new Set<string>();
  for (const note of $notes) {
    for (const tag of note.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
});

export const noteCount = derived(gridNotes, ($notes) => $notes.length);

export function resetFilters(): void {
  gridFilters.set(createDefaultFilters());
}

export function updateFilterTag(tag: string | undefined): void {
  gridFilters.update((f) => ({ ...f, tag }));
}

export function updateFilterDates(fromDate: string, toDate: string): void {
  gridFilters.update((f) => ({ ...f, fromDate, toDate }));
}

export function updateFilterQuery(query: string): void {
  gridFilters.update((f) => ({ ...f, query }));
}

export function clearSearch(): void {
  gridFilters.update((f) => ({ ...f, query: '' }));
}
