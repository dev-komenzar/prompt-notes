// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 34-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:34 task:34-1 module:editor
// CoDD trace: detail:editor_clipboard → plan:implementation_plan
// Convention 8, 19: Cmd+N / Ctrl+N で即座に新規ノート作成しフォーカス移動必須。
// CM6 'Mod-n' maps to Cmd on macOS and Ctrl on Linux automatically.

import { keymap } from '@codemirror/view';
import type { KeyBinding } from '@codemirror/view';

export interface EditorKeybindingHandlers {
  /** Handler for Cmd+N (macOS) / Ctrl+N (Linux) new note creation. */
  onCreateNote: () => boolean;
}

/**
 * Creates the CM6 KeyBinding for new note creation.
 * Uses 'Mod-n' which CM6 resolves to:
 *   - macOS: Cmd+N (Meta+n)
 *   - Linux: Ctrl+N (Control+n)
 * This is the sole platform-aware keybinding mapping point.
 */
export function createNewNoteKeybinding(
  handler: () => boolean,
): KeyBinding {
  return {
    key: 'Mod-n',
    run: handler,
    preventDefault: true,
  };
}

/**
 * Returns the CM6 keymap extension with all editor keybindings.
 */
export function editorKeymapExtension(
  handlers: EditorKeybindingHandlers,
) {
  return keymap.of([createNewNoteKeybinding(handlers.onCreateNote)]);
}
