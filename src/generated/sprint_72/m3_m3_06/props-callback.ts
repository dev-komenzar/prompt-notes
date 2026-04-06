// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 72-1
// @task-title: M3（M3-06）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:72 | task:72-1 | module:editor | OQ-E02
//
// Pattern A — Props Callback
//
// The parent component (Editor.svelte) creates a GetTextFn via the factory
// helpers below and passes it as a prop to CopyButton.svelte.
//
// Advantages
// ----------
// • Dependency flow is explicit: CopyButton declares its data need as a prop.
// • No implicit coupling through shared context keys.
// • Straightforward to unit-test: supply a stub function.
// • Hierarchy is shallow (Editor → CopyButton) so no prop-drilling concern.
//
// Usage sketch (Editor.svelte):
//
//   import { createEditorViewRef, createGetBodyTextFn } from './props-callback';
//
//   const viewRef = createEditorViewRef();
//   const getTextFn = createGetBodyTextFn(viewRef);
//
//   onMount(() => {
//     const view = new EditorView({ ... });
//     viewRef.current = view;
//   });
//
//   <CopyButton {getTextFn} />
//

import type { EditorViewRef, GetTextFn } from './types';
import { getFullText, getBodyText } from './editor-text-accessor';

/**
 * Creates a fresh mutable ref with `current` initialised to `null`.
 * Assign the EditorView instance in `onMount`.
 */
export function createEditorViewRef(): EditorViewRef {
  return { current: null };
}

/**
 * Creates a `GetTextFn` returning the **full** document text
 * (frontmatter included).
 *
 * Returns `''` when the EditorView has not yet been mounted.
 */
export function createGetFullTextFn(ref: EditorViewRef): GetTextFn {
  return (): string => {
    if (!ref.current) {
      return '';
    }
    return getFullText(ref.current);
  };
}

/**
 * Creates a `GetTextFn` returning the **body** text with frontmatter stripped.
 *
 * Per AC-ED-05 the copy button copies body text excluding frontmatter.
 * Returns `''` when the EditorView has not yet been mounted.
 */
export function createGetBodyTextFn(ref: EditorViewRef): GetTextFn {
  return (): string => {
    if (!ref.current) {
      return '';
    }
    return getBodyText(ref.current);
  };
}
