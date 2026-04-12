// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 19-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: plan:implementation_plan > sprint:19 > task:19-1 > module:editor
// @codd-trace: detail:component_architecture > stores/notes.ts
// @codd-trace: detail:editor_clipboard > EditorView.svelte

import { writable } from 'svelte/store';
import type { NoteMetadata } from '../../../lib/types';

function createNotesStore() {
  const { subscribe, set, update } = writable<NoteMetadata[]>([]);

  return {
    subscribe,
    set,
    /** Prepend a newly created note to the top of the list (newest-first order). */
    prepend(note: NoteMetadata): void {
      update(notes => [note, ...notes]);
    },
    /** Replace the metadata for an existing note in-place (e.g. after save_note). */
    updateOne(updated: NoteMetadata): void {
      update(notes => notes.map(n => (n.id === updated.id ? updated : n)));
    },
    /** Remove a note from the list by id (after delete_note). */
    remove(id: string): void {
      update(notes => notes.filter(n => n.id !== id));
    },
    /** Replace the entire list (e.g. after list_notes / search_notes IPC response). */
    reset(): void {
      set([]);
    },
  };
}

export const notesStore = createNotesStore();
