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
// Grid business logic: data loading, filter application, search, navigation.
// All data fetching goes through ipc-api.ts → Rust backend. No client-side file access.
// Stale-response protection via loadGeneration counter prevents race conditions.

import { get } from 'svelte/store';
import {
  gridNotes,
  gridLoading,
  gridError,
  gridFilters,
  resetFilters,
  updateFilterTag,
  updateFilterDates,
  updateFilterQuery,
  clearSearch,
} from './grid-store';
import { listNotes, searchNotes } from './ipc-api';
import { navigateToEditor } from './app-store';
import { debounce } from './debounce';
import type { NoteEntry } from './types';

const SEARCH_DEBOUNCE_MS = 300;

let loadGeneration = 0;

/**
 * Fetch notes from backend based on current filter state.
 * Uses search_notes when query is non-empty, list_notes otherwise.
 * Stale responses from superseded calls are silently discarded.
 */
export async function loadNotes(): Promise<void> {
  const generation = ++loadGeneration;
  const filters = get(gridFilters);

  gridLoading.set(true);
  gridError.set(null);

  try {
    let notes: NoteEntry[];

    if (filters.query.trim() !== '') {
      notes = await searchNotes({
        query: filters.query,
        from_date: filters.fromDate || undefined,
        to_date: filters.toDate || undefined,
        tag: filters.tag,
      });
    } else {
      notes = await listNotes({
        from_date: filters.fromDate || undefined,
        to_date: filters.toDate || undefined,
        tag: filters.tag,
      });
    }

    if (generation !== loadGeneration) {
      return;
    }

    gridNotes.set(notes);
  } catch (err: unknown) {
    if (generation !== loadGeneration) {
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    gridError.set(message);
    gridNotes.set([]);
  } finally {
    if (generation === loadGeneration) {
      gridLoading.set(false);
    }
  }
}

const debouncedLoad = debounce(() => {
  loadNotes();
}, SEARCH_DEBOUNCE_MS);

/**
 * Handle search input. Updates filter state immediately for UI reactivity,
 * debounces the actual IPC call (300ms) to avoid excessive backend load.
 */
export function onSearchInput(query: string): void {
  updateFilterQuery(query);
  debouncedLoad();
}

/**
 * Apply tag filter and reload immediately.
 */
export async function applyTagFilter(tag: string | undefined): Promise<void> {
  updateFilterTag(tag);
  await loadNotes();
}

/**
 * Apply date range filter and reload immediately.
 */
export async function applyDateFilter(
  fromDate: string,
  toDate: string,
): Promise<void> {
  updateFilterDates(fromDate, toDate);
  await loadNotes();
}

/**
 * Clear search query, revert to list_notes, and reload.
 */
export async function clearSearchAndReload(): Promise<void> {
  clearSearch();
  await loadNotes();
}

/**
 * Navigate to editor view for the given note. Called on card click.
 * module:grid passes filename only; module:editor handles read_note IPC.
 */
export function handleCardClick(filename: string): void {
  navigateToEditor(filename);
}

/**
 * Reset all filters to defaults (last 7 days, no tag, no query) and reload.
 * Called after notes_dir change or manual reset.
 */
export async function refreshGrid(): Promise<void> {
  resetFilters();
  await loadNotes();
}
