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
// Svelte store definitions for GridView reactive state.
// GridView.svelte owns these stores (created per mount via createGridStores).

import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { NoteEntry, GridFilterState } from './types';
import { getDefaultDateRange } from './date_utils';
import { collectUniqueTags } from './tag_collector';

export interface GridStores {
  /** Current note list (result of list_notes or search_notes). */
  readonly notes: Writable<readonly NoteEntry[]>;
  /** Whether an IPC fetch is in progress. */
  readonly loading: Writable<boolean>;
  /** Last error message, or null. */
  readonly error: Writable<string | null>;
  /** Active filter/search state. */
  readonly filters: Writable<GridFilterState>;
  /** Tags derived from current notes (for TagFilter UI candidates). */
  readonly availableTags: Readable<readonly string[]>;
}

/**
 * Factory: create a fresh set of grid stores.
 *
 * Each GridView mount should call this once, ensuring state isolation
 * if the component is re-mounted.  Default filter is last 7 days
 * (CONV-GRID-1).
 */
export function createGridStores(): GridStores {
  const { fromDate, toDate } = getDefaultDateRange();

  const notes = writable<readonly NoteEntry[]>([]);
  const loading = writable<boolean>(false);
  const error = writable<string | null>(null);
  const filters = writable<GridFilterState>({
    fromDate,
    toDate,
    tag: undefined,
    query: '',
  });

  const availableTags: Readable<readonly string[]> = derived(
    notes,
    ($notes) => collectUniqueTags($notes),
  );

  return { notes, loading, error, filters, availableTags };
}
