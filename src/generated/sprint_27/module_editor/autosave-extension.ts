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

// Sprint 27 – module:editor – Auto-save via EditorView.updateListener (CONV-AUTOSAVE / RBC-3)
// Debounce 500ms (OQ-004 default). No explicit save button or Cmd+S needed.
// Rust backend performs stateless overwrite via std::fs::write.

import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { createDebounce, type DebouncedFn } from './debounce';

/**
 * Callback that persists content to the Rust backend.
 * Expected signature matches saveNote(filename, content).
 * The filename is managed externally by the component; this extension
 * only supplies the document content string.
 */
export type SaveContentFn = (content: string) => void;

export interface AutosaveHandle {
  /** The CM6 extension to add to the editor. */
  readonly extension: Extension;
  /** Flush any pending save immediately (call on destroy / note switch). */
  flush(): void;
  /** Cancel pending save without executing (call on teardown if content is discarded). */
  cancel(): void;
  /** Whether a save is currently pending in the debounce timer. */
  readonly pending: boolean;
}

/**
 * Create an auto-save extension that debounces document changes.
 *
 * @param onSave - Called with the full document string after debounce elapses.
 * @param delay  - Debounce interval in ms. Default 500 (OQ-004).
 * @returns An AutosaveHandle with the extension and lifecycle controls.
 */
export function createAutosave(onSave: SaveContentFn, delay: number = 500): AutosaveHandle {
  const debouncedSave: DebouncedFn<[string]> = createDebounce(
    (content: string) => onSave(content),
    delay,
  );

  const extension = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      debouncedSave(update.state.doc.toString());
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
