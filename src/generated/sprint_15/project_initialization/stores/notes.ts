// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: フロントエンド基盤
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:15 task:15-1
// @generated-by: codd implement --sprint 15

import { writable } from 'svelte/store';
import type { NoteMetadata } from '../lib/types';

/**
 * Reactive cache of NoteMetadata for the current view.
 * Written by EditorView (after create/delete) and GridView (after list/search).
 * Never written directly from components — only via IPC responses.
 */
export const notesStore = writable<NoteMetadata[]>([]);

/**
 * The currently selected/active note id in the editor.
 * null means no note is loaded (fresh state after app start or Cmd+N).
 */
export const activeNoteId = writable<string | null>(null);
