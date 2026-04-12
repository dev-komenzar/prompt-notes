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

// @codd:sprint=11 module:storage — notes store
// Caches NoteMetadata[] from list_notes / search_notes IPC responses.
// Written by editor and grid modules after IPC calls; never by direct file access.

import { writable } from 'svelte/store';
import type { NoteFilter, NoteMetadata } from '../types';
import { listNotes, searchNotes } from '../ipc';

function createNotesStore() {
  const { subscribe, set, update } = writable<NoteMetadata[]>([]);

  return {
    subscribe,

    async refresh(filter?: NoteFilter): Promise<void> {
      const notes = await listNotes(filter);
      set(notes);
    },

    async search(query: string, filter?: NoteFilter): Promise<void> {
      const notes = await searchNotes(query, filter);
      set(notes);
    },

    upsert(metadata: NoteMetadata): void {
      update((notes) => {
        const idx = notes.findIndex((n) => n.id === metadata.id);
        if (idx >= 0) {
          const updated = [...notes];
          updated[idx] = metadata;
          return updated;
        }
        return [metadata, ...notes];
      });
    },

    remove(id: string): void {
      update((notes) => notes.filter((n) => n.id !== id));
    },

    reset(): void {
      set([]);
    },
  };
}

export const notesStore = createNotesStore();
