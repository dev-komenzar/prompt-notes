// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @sprint: 36 — list_note_files() 共通関数 (module:storage notes store)

import { writable } from 'svelte/store';
import type { NoteMetadata } from './types';

export const notesStore = writable<NoteMetadata[]>([]);

export function setNotes(notes: NoteMetadata[]): void {
  notesStore.set(notes);
}

export function prependNote(note: NoteMetadata): void {
  notesStore.update((notes) => [note, ...notes]);
}

export function removeNote(id: string): void {
  notesStore.update((notes) => notes.filter((n) => n.id !== id));
}

export function updateNote(updated: NoteMetadata): void {
  notesStore.update((notes) =>
    notes.map((n) => (n.id === updated.id ? updated : n)),
  );
}
