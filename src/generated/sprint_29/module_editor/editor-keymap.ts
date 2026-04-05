// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:29 task:29-1 module:editor
// CoDD trace: detail:editor_clipboard §4.4, test:acceptance_criteria AC-ED-04
// CONV-8 / CONV-19: Cmd+N (macOS) / Ctrl+N (Linux) instant new note creation
// with focus move is release-blocking.
// CodeMirror's `Mod` prefix maps to Cmd on macOS and Ctrl on Linux
// automatically — no platform branching required (detail §4.7).

import { keymap, type KeyBinding } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { createNote } from './api';

export interface NewNoteKeymapCallbacks {
  /** Invoked after the Rust backend has created the note file. */
  onNoteCreated: (filename: string, path: string) => void;
  /** Invoked when `create_note` IPC rejects. */
  onError?: (error: unknown) => void;
}

/**
 * Returns a CodeMirror keymap extension that binds `Mod-n` to new-note
 * creation via the `create_note` IPC command.
 *
 * The key handler returns `true` synchronously (consuming the event and
 * preventing the browser's default "new window" action). The IPC call
 * runs asynchronously in the background; the {@link NewNoteKeymapCallbacks.onNoteCreated}
 * callback fires once the file has been created on disk.
 */
export function createNewNoteKeymap(callbacks: NewNoteKeymapCallbacks): Extension {
  const handleCreateNote = (): boolean => {
    void (async () => {
      try {
        const result = await createNote();
        callbacks.onNoteCreated(result.filename, result.path);
      } catch (error: unknown) {
        callbacks.onError?.(error);
      }
    })();
    return true;
  };

  const bindings: readonly KeyBinding[] = [
    {
      key: 'Mod-n',
      run: handleCreateNote,
      preventDefault: true,
    },
  ];

  return keymap.of(bindings);
}
