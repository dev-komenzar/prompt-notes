// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-1
// @task-title: CodeMirror 6 `EditorView` のライフサイクル管理。拡張登録: `@codemirror
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-traceability: sprint=28 task=28-1 module=editor
// CodeMirror 6 EditorView lifecycle management (create/destroy) for CodeMirrorWrapper.svelte.

import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { buildBaseExtensions } from './editor-extensions';

export interface CreateEditorOptions {
  /** DOM element to mount the editor into. */
  parent: HTMLElement;
  /** Initial document content (frontmatter + body). */
  initialDoc: string;
  /** Additional extensions to compose (e.g. autosave, frontmatter decoration). */
  extraExtensions?: Extension[];
}

/**
 * Creates and mounts a CodeMirror 6 EditorView.
 *
 * Lifecycle ownership: CodeMirrorWrapper.svelte calls createEditor in onMount
 * and destroyEditor in onDestroy. This module does not manage the Svelte lifecycle.
 */
export function createEditor(options: CreateEditorOptions): EditorView {
  const { parent, initialDoc, extraExtensions = [] } = options;

  const extensions: Extension[] = [
    ...buildBaseExtensions(),
    ...extraExtensions,
  ];

  const state = EditorState.create({
    doc: initialDoc,
    extensions,
  });

  return new EditorView({ state, parent });
}

/**
 * Destroys the EditorView and detaches it from the DOM.
 * Must be called in onDestroy to prevent memory leaks.
 */
export function destroyEditor(view: EditorView): void {
  view.destroy();
}

/**
 * Replaces the entire document content without recreating the EditorView.
 * Preserves undo history (history extension must be active).
 */
export function setEditorContent(view: EditorView, content: string): void {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: content,
    },
  });
}

/**
 * Returns the full document text from the EditorView.
 */
export function getEditorContent(view: EditorView): string {
  return view.state.doc.toString();
}
