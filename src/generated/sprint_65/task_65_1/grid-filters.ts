// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=grid
// Grid view filter state management and IPC call orchestration.
// CONV-GRID-1: Default filter is last 7 days.
// CONV-GRID-2: Tag filter, date filter, full-text search are mandatory.
// All data fetching goes through api.ts; no client-side filtering (CONV-IPC).

import type { NoteEntry, ListNotesArgs, SearchNotesArgs } from "./types";
import { listNotes, searchNotes } from "./api";
import { getDefault7DayRange } from "./date-utils";

/**
 * Represents the current filter/search state of the grid view.
 * GridView.svelte owns this state via Svelte reactive variables.
 */
export interface GridFilterState {
  from_date: string;
  to_date: string;
  tag: string | null;
  query: string;
}

/**
 * Creates the initial filter state with the default 7-day range.
 * Called on GridView.svelte mount (CONV-GRID-1).
 */
export function createDefaultFilterState(): GridFilterState {
  const { from_date, to_date } = getDefault7DayRange();
  return {
    from_date,
    to_date,
    tag: null,
    query: "",
  };
}

/**
 * Fetches notes based on the current filter state.
 * Chooses between list_notes and search_notes IPC commands based on query presence.
 *
 * - query is empty → list_notes (with date/tag filters)
 * - query is non-empty → search_notes (with date/tag filters + query)
 *
 * Sorting is handled by module:storage (Rust); returns newest-first.
 */
export async function fetchFilteredNotes(state: GridFilterState): Promise<NoteEntry[]> {
  if (state.query.trim().length > 0) {
    const args: SearchNotesArgs = {
      query: state.query.trim(),
      from_date: state.from_date,
      to_date: state.to_date,
      ...(state.tag != null ? { tag: state.tag } : {}),
    };
    return searchNotes(args);
  }

  const args: ListNotesArgs = {
    from_date: state.from_date,
    to_date: state.to_date,
    ...(state.tag != null ? { tag: state.tag } : {}),
  };
  return listNotes(args);
}

/**
 * Extracts unique tags from a list of NoteEntry items.
 * Used by TagFilter.svelte to populate the tag selection UI.
 * Tags are sorted alphabetically for consistent display.
 */
export function extractUniqueTags(notes: NoteEntry[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      if (tag.trim().length > 0) {
        tagSet.add(tag.trim());
      }
    }
  }
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}
