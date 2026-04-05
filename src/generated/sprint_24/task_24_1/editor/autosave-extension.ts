// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — CodeMirror 6 Auto-Save Extension
// Monitors document changes via EditorView.updateListener and triggers
// debounced save through the IPC wrapper (api.ts).
// Debounce timer (500ms) is managed on the frontend (JavaScript) side.
// Rust backend performs stateless overwrite; it does not track editor state.
// No manual save button or Cmd+S binding exists by design.

import { EditorView, type ViewUpdate } from '@codemirror/view';
import { debounce, type DebouncedFn } from '../debounce';
import { AUTOSAVE_DEBOUNCE_MS } from '../constants';

export interface AutosaveCallbacks {
  /** Called with current document content when debounce timer fires. */
  onSave: (content: string) => void | Promise<void>;
}

/**
 * Creates a CodeMirror 6 extension that auto-saves document content
 * after a debounce period following each document change.
 *
 * The returned object includes:
 * - `extension`: the CM6 extension to add to EditorView configuration
 * - `flush()`: force immediate save of pending changes (call on note switch / destroy)
 * - `cancel()`: discard pending save without executing
 *
 * Usage in Editor.svelte:
 *   const autosave = createAutosaveExtension({
 *     onSave: (content) => saveNote({ filename: currentFilename, content }),
 *   });
 *   // In EditorView extensions: autosave.extension
 *   // On component destroy: autosave.flush()
 */
export function createAutosaveExtension(callbacks: AutosaveCallbacks): {
  extension: ReturnType<typeof EditorView.updateListener.of>;
  flush: () => void;
  cancel: () => void;
  readonly pending: boolean;
} {
  const debouncedSave: DebouncedFn<[string]> = debounce(
    (content: string) => {
      callbacks.onSave(content);
    },
    AUTOSAVE_DEBOUNCE_MS,
  );

  const extension = EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.docChanged) {
      const content = update.state.doc.toString();
      debouncedSave(content);
    }
  });

  return {
    extension,
    flush: () => debouncedSave.flush(),
    cancel: () => debouncedSave.cancel(),
    get pending() {
      return debouncedSave.pending;
    },
  };
}
