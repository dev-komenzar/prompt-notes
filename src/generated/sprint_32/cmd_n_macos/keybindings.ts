// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `Cmd+N`（macOS）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { goto } from '$app/navigation';
import { createNote } from '$lib/api/notes';
import type { EditorView } from '@codemirror/view';

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export function registerGlobalKeybindings(getEditorView?: () => EditorView | null): () => void {
  const handler = async (e: KeyboardEvent) => {
    const isNewNote = (isMac ? e.metaKey : e.ctrlKey) && e.key === 'n';
    if (!isNewNote) return;

    e.preventDefault();

    const { filename } = await createNote();
    await goto(`/edit/${filename}`);

    // Focus is handled by EditorRoot.svelte onMount after navigation,
    // but attempt immediate focus if editorView is already available.
    const view = getEditorView?.();
    if (view) {
      focusAfterFrontmatter(view);
    }
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

export function focusAfterFrontmatter(view: EditorView): void {
  view.focus();

  const doc = view.state.doc.toString();
  if (!doc.startsWith('---\n')) {
    // No frontmatter: place cursor at start
    view.dispatch({ selection: { anchor: 0 } });
    return;
  }

  const endIndex = doc.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    view.dispatch({ selection: { anchor: 0 } });
    return;
  }

  // Position cursor at the line after the closing ---
  const cursorPos = endIndex + '\n---\n'.length;
  const safePos = Math.min(cursorPos, doc.length);
  view.dispatch({ selection: { anchor: safePos } });
}
