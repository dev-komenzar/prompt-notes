// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-2
// @task-title: `Ctrl+N`（Linux）グローバルキーバインド。`navigator.platform` で OS 判定。`event.preventDefault()` でブラウザデフォルト動作抑制。`createNote()` → `goto('
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: sprint:32 task:32-2 module:editor
// Deliverable: Cmd+N (macOS) / Ctrl+N (Linux) global keybinding with platform detection via navigator.platform

import { goto } from '$app/navigation';
import { createNote } from '$lib/api/notes';
import { focusAfterFrontmatter } from '../cmd_n_macos/keybindings';

export { focusAfterFrontmatter };

const isMac = (() => {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
})();

/**
 * Registers Cmd+N (macOS) / Ctrl+N (Linux) as a global keybinding.
 * Uses navigator.platform for OS detection.
 * Calls createNote() → goto('/edit/${filename}') → editorView.focus() via focusAfterFrontmatter.
 * Returns a cleanup function to remove the listener.
 */
export function registerGlobalKeybindings(): () => void {
  const handler = async (e: KeyboardEvent): Promise<void> => {
    const isNewNote = isMac
      ? e.metaKey && e.key === 'n'
      : e.ctrlKey && e.key === 'n';

    if (!isNewNote) return;

    e.preventDefault();

    const { filename } = await createNote();
    await goto(`/edit/${filename}`);
    // editorView.focus() with cursor after frontmatter is handled in EditorRoot.svelte onMount via focusAfterFrontmatter
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}
