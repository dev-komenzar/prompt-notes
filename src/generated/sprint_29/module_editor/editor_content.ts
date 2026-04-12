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

// @codd:sprint=29 task=29-1 module=editor artifact=getEditorContent

import type { EditorView } from '@codemirror/view';
import { extractBody } from './extract_body';

/**
 * Returns a `getEditorContent` callback suitable for passing to CopyButton as its
 * `getContent` prop.  The callback reads the current CodeMirror document and strips
 * any leading frontmatter so that only the Markdown body is copied to the clipboard.
 *
 * @param viewRef - A getter that returns the live EditorView instance, or null/undefined
 *                  before the editor is mounted.
 */
export function makeGetEditorContent(
  viewRef: () => EditorView | null | undefined,
): () => string {
  return (): string => {
    const view = viewRef();
    if (!view) return '';
    const raw = view.state.doc.toString();
    return extractBody(raw);
  };
}
