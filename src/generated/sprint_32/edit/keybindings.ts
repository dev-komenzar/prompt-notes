// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-3
// @task-title: edit
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: sprint=32 task=32-3 deliverable=edit-keybindings

import { registerGlobalKeybindings, focusAfterFrontmatter } from '../ui_foundation/keybindings';
import type { EditorView } from '@codemirror/view';

export { registerGlobalKeybindings, focusAfterFrontmatter };

/**
 * Initialize keybindings for the editor page.
 * Call this on mount; call the returned cleanup function on destroy.
 *
 * @param getEditorView - Getter for the current EditorView instance (may be null before mount).
 * @returns Cleanup function to remove the event listener.
 */
export function initEditorPageKeybindings(
  getEditorView: () => EditorView | null
): () => void {
  const cleanup = registerGlobalKeybindings(getEditorView);
  return cleanup;
}

/**
 * Focus the editor and place the cursor at the first line after the frontmatter block.
 * Called after navigation to /edit/:filename completes and the EditorView is mounted.
 */
export function activateEditorFocus(editorView: EditorView): void {
  focusAfterFrontmatter(editorView);
}
