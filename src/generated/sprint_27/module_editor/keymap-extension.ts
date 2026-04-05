// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 27 – module:editor – Cmd+N / Ctrl+N new note keymap (RBC-1 / CONV-4)
// Mod-n maps to Cmd on macOS and Ctrl on Linux automatically via CM6.

import { keymap } from '@codemirror/view';
import type { Extension, EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

/**
 * Callback invoked when the user presses Mod-n (Cmd+N / Ctrl+N).
 * Expected to call createNote IPC and update the editor.
 * The function is fire-and-forget from the keymap handler's perspective.
 */
export type NewNoteHandler = (view: EditorView) => void;

/**
 * CodeMirror 6 keymap extension for instant new note creation.
 * The handler receives the EditorView so it can dispatch content changes
 * and focus management after the IPC call resolves.
 *
 * Performance requirement: key-press to focus-move must have no perceptible delay.
 * Rust-side create_note is < 1 ms; IPC overhead < 10 ms total.
 */
export function newNoteKeymap(onNewNote: NewNoteHandler): Extension {
  return keymap.of([
    {
      key: 'Mod-n',
      preventDefault: true,
      run(view: EditorView): boolean {
        onNewNote(view);
        return true;
      },
    },
  ]);
}
