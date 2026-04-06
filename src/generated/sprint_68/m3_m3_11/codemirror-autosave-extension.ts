// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 68-1
// @task-title: M3（M3-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=68, task=68-1, module=module:editor, oq=OQ-004
// CodeMirror 6 extension that bridges EditorView.updateListener to AutoSaveManager.
// Per editor_clipboard_design §4.5: trigger only on docChanged, not cursor/scroll.

import type { AutoSaveConfig, GetContentFn, SaveNoteFn } from './types';
import { AutoSaveManager } from './autosave-manager';

/**
 * Options for creating the CodeMirror auto-save extension.
 */
export interface AutoSaveExtensionOptions {
  /** Initial filename of the note being edited. */
  filename: string;
  /** IPC save function (api.ts saveNote wrapper). */
  saveFn: SaveNoteFn;
  /** Partial auto-save config overrides. */
  config?: Partial<AutoSaveConfig>;
}

/**
 * Result of creating the auto-save extension.
 * Provides the CodeMirror extension value and the manager handle for lifecycle control.
 */
export interface AutoSaveExtensionResult {
  /**
   * CodeMirror extension function to pass to EditorState.create({ extensions: [...] }).
   * This is a ViewUpdate listener that triggers auto-save on document changes.
   *
   * Usage with CodeMirror 6:
   *   import { EditorView } from '@codemirror/view';
   *   const { extension, manager } = createAutoSaveExtension({ ... });
   *   // Pass `extension` as: EditorView.updateListener.of(extension)
   */
  extension: (update: { docChanged: boolean; view: { state: { doc: { toString(): string } } } }) => void;
  /** The underlying AutoSaveManager for lifecycle control (flush, dispose, switchNote). */
  manager: AutoSaveManager;
}

/**
 * Creates a CodeMirror 6 update listener and AutoSaveManager pair.
 *
 * The returned `extension` should be used with `EditorView.updateListener.of(extension)`.
 * The returned `manager` must be used for:
 *   - `manager.flush()` before note switch or unmount
 *   - `manager.switchNote(newFilename)` when loading a different note
 *   - `manager.dispose()` in Svelte `onDestroy`
 *
 * @example
 * ```ts
 * import { EditorView } from '@codemirror/view';
 * import { createAutoSaveExtension } from './codemirror-autosave-extension';
 * import { saveNote } from '$lib/api';
 *
 * const { extension, manager } = createAutoSaveExtension({
 *   filename: '2026-04-04T143052.md',
 *   saveFn: saveNote,
 *   config: { debounceMs: 500 },
 * });
 *
 * const view = new EditorView({
 *   state: EditorState.create({
 *     extensions: [
 *       EditorView.updateListener.of(extension),
 *       // ... other extensions
 *     ],
 *   }),
 *   parent: containerEl,
 * });
 *
 * // On destroy:
 * onDestroy(async () => {
 *   await manager.dispose();
 *   view.destroy();
 * });
 * ```
 */
export function createAutoSaveExtension(
  options: AutoSaveExtensionOptions,
): AutoSaveExtensionResult {
  let currentView: { state: { doc: { toString(): string } } } | null = null;

  const getContent: GetContentFn = () => {
    if (!currentView) return '';
    return currentView.state.doc.toString();
  };

  const manager = new AutoSaveManager(
    options.filename,
    options.saveFn,
    getContent,
    options.config,
  );

  const extension = (update: {
    docChanged: boolean;
    view: { state: { doc: { toString(): string } } };
  }): void => {
    currentView = update.view;
    if (update.docChanged) {
      manager.handleDocChanged();
    }
  };

  return { extension, manager };
}
