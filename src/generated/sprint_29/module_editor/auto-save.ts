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
// CoDD trace: detail:editor_clipboard §4.5, detail:storage_fileformat §4.2
// CONV-AUTOSAVE / CONV-11: Auto-save is mandatory. No explicit save action.
// Sprint 29 deliverable: 500 ms debounce (OQ-004 baseline).

import { EditorView, type ViewUpdate } from '@codemirror/view';
import { debounce, type DebouncedFn } from './debounce';
import { saveNote } from './api';

/** Default debounce interval in milliseconds. */
export const AUTOSAVE_DEBOUNCE_MS = 500;

export interface AutoSaveCallbacks {
  /** Returns the filename of the note currently being edited, or null. */
  getFilename: () => string | null;
  /** Called just before the IPC save is dispatched. */
  onSaveStart?: () => void;
  /** Called after a successful save. */
  onSaveComplete?: () => void;
  /** Called when the save IPC call rejects. */
  onSaveError?: (error: unknown) => void;
}

export interface AutoSaveHandle {
  /** CodeMirror extension — register this in the EditorState. */
  extension: ReturnType<typeof EditorView.updateListener.of>;
  /** Immediately persist any pending changes (fire-and-forget). */
  flush: () => void;
  /** Discard the pending debounced save without persisting. */
  cancel: () => void;
  /** True when a debounced save is waiting to fire. */
  pending: () => boolean;
}

/**
 * Creates the auto-save machinery for the editor.
 *
 * Listens for `docChanged` via `EditorView.updateListener` and schedules
 * a debounced `save_note` IPC call.  The debounce interval defaults to
 * {@link AUTOSAVE_DEBOUNCE_MS} (500 ms).
 *
 * Lifecycle guarantees the caller must uphold:
 * - Call `flush()` before switching to a different note.
 * - Call `flush()` or `cancel()` before destroying the EditorView.
 */
export function createAutoSave(
  callbacks: AutoSaveCallbacks,
  debounceMs: number = AUTOSAVE_DEBOUNCE_MS,
): AutoSaveHandle {
  const performSave = async (content: string): Promise<void> => {
    const filename = callbacks.getFilename();
    if (filename === null) return;

    callbacks.onSaveStart?.();
    try {
      await saveNote(filename, content);
      callbacks.onSaveComplete?.();
    } catch (error: unknown) {
      callbacks.onSaveError?.(error);
    }
  };

  const debouncedSave: DebouncedFn<(content: string) => void> = debounce(
    (content: string) => {
      void performSave(content);
    },
    debounceMs,
  );

  const extension = EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.docChanged) {
      debouncedSave(update.state.doc.toString());
    }
  });

  return {
    extension,
    flush: () => debouncedSave.flush(),
    cancel: () => debouncedSave.cancel(),
    pending: () => debouncedSave.pending(),
  };
}
