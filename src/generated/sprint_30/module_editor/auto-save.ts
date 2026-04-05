// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 30-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:30 | module:editor | CoDD trace: detail:editor_clipboard, detail:storage_fileformat
// Auto-save controller: EditorView.updateListener + 500ms debounce.
// Rust backend is stateless (overwrites entire file content).
// No manual save button or Cmd+S — auto-save is the only persistence path.

import { EditorView, type ViewUpdate } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { debounce, type DebouncedFn } from './debounce';
import { saveNote } from './api';

const AUTOSAVE_DEBOUNCE_MS = 500;

export interface AutoSaveController {
  /** CodeMirror extension to register on the EditorView. */
  readonly extension: Extension;
  /** Immediately execute any pending save (e.g. before note switch or destroy). */
  flush(): void;
  /** Discard any pending save. */
  cancel(): void;
  /** Whether a save is pending in the debounce timer. */
  pending(): boolean;
  /** Update the target filename (call when switching notes). */
  setFilename(filename: string): void;
}

export function createAutoSave(initialFilename: string): AutoSaveController {
  let currentFilename = initialFilename;

  const debouncedSave: DebouncedFn<(filename: string, content: string) => void> =
    debounce(
      async (filename: string, content: string) => {
        try {
          await saveNote(filename, content);
        } catch (err) {
          // OQ-006: error notification strategy TBD; log for now
          console.error('[auto-save] save_note failed:', filename, err);
        }
      },
      AUTOSAVE_DEBOUNCE_MS,
    );

  const extension = EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.docChanged && currentFilename) {
      const content = update.state.doc.toString();
      debouncedSave(currentFilename, content);
    }
  });

  return {
    extension,
    flush() {
      debouncedSave.flush();
    },
    cancel() {
      debouncedSave.cancel();
    },
    pending() {
      return debouncedSave.pending();
    },
    setFilename(filename: string) {
      currentFilename = filename;
    },
  };
}
