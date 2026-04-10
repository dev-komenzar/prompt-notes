// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 41-1
// @task-title: `list_notes` 結果からタグ候補を収集・重複排除。複数選択（AND 条件）。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { writable, derived, get } from 'svelte/store';
import type { NoteMetadata } from '$lib/types/note';
import { collectUniqueTags } from './collectTags';

/** Currently selected tags for AND-condition filtering. */
export const selectedTags = writable<string[]>([]);

/** Available tag candidates derived from the current note list. */
export const availableTags = writable<string[]>([]);

/**
 * Refreshes available tag candidates from the given note list.
 * Call this whenever list_notes / search_notes returns a fresh result.
 */
export function refreshAvailableTags(notes: NoteMetadata[]): void {
  availableTags.set(collectUniqueTags(notes));
}

/**
 * Toggles a tag in the selection.
 * Adds the tag if not selected; removes it if already selected.
 * The AND condition is enforced by passing selectedTags to search_notes.
 */
export function toggleTag(tag: string): void {
  selectedTags.update((current) => {
    const idx = current.indexOf(tag);
    if (idx === -1) {
      return [...current, tag];
    }
    return current.filter((t) => t !== tag);
  });
}

/** Clears all selected tags. */
export function clearSelectedTags(): void {
  selectedTags.set([]);
}

/** Returns true when the given tag is currently selected. */
export function isTagSelected(tag: string): boolean {
  return get(selectedTags).includes(tag);
}

/**
 * Derived store: the current selectedTags array as the AND-condition tags[]
 * parameter for search_notes / list_notes IPC calls.
 */
export const andFilterTags = derived(selectedTags, ($tags) => $tags);
