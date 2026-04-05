// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 28 | Task 28-1 | module:editor
// Traceability: detail:editor_clipboard §4.5, detail:storage_fileformat §4.2
// Auto-save extension: EditorView.updateListener + 500ms debounce.
// No manual save button or Cmd+S needed (CONV-AUTOSAVE).

import { EditorView, type ViewUpdate } from '@codemirror/view';
import { saveNote } from './api';
import { debounce, type DebouncedFn } from './debounce';

const DEFAULT_DEBOUNCE_MS = 500;

export interface AutosaveHandle {
  /** Immediately persist any pending changes. Call on note switch or destroy. */
  flush(): void;
  /** Cancel any pending save without writing. */
  cancel(): void;
  /** The CM6 extension to include in EditorState.create. */
  extension: ReturnType<typeof EditorView.updateListener.of>;
}

/**
 * Creates an auto-save extension that persists document changes via IPC
 * after a debounce interval.
 *
 * @param getCurrentFilename - Returns the filename of the currently-active note.
 *   Must reflect the latest state so that saves target the correct file.
 * @param debounceMs - Debounce interval in ms. Defaults to 500.
 */
export function createAutosave(
  getCurrentFilename: () => string,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): AutosaveHandle {
  let latestView: EditorView | null = null;

  const debouncedSave: DebouncedFn<() => void> = debounce(async () => {
    const view = latestView;
    const filename = getCurrentFilename();
    if (!view || !filename) return;
    const content = view.state.doc.toString();
    try {
      await saveNote(filename, content);
    } catch (err) {
      console.error('[autosave] save_note failed:', err);
    }
  }, debounceMs) as DebouncedFn<() => void>;

  const extension = EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.docChanged) {
      latestView = update.view;
      debouncedSave();
    }
  });

  return {
    flush: () => debouncedSave.flush(),
    cancel: () => debouncedSave.cancel(),
    extension,
  };
}
