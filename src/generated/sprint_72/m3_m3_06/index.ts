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
// Public API for the EditorView text-sharing module.
//
// This module resolves OQ-E02 by providing two concrete, production-ready
// implementations for sharing EditorView text between Editor.svelte and
// CopyButton.svelte:
//
//   Pattern A — Props Callback  (props-callback.ts)
//     Editor creates a GetTextFn and passes it as a prop.
//     Recommended for the current two-component hierarchy.
//
//   Pattern B — Svelte Context  (context.ts)
//     Editor registers an EditorViewContext; children consume it.
//     Useful if deeper nesting or additional consumers are introduced.
//

// ── Types ──────────────────────────────────────────────────────────────
export type { GetTextFn, EditorViewRef, CopyResult } from './types';

// ── Frontmatter utilities ──────────────────────────────────────────────
export { detectFrontmatterRange, stripFrontmatter } from './frontmatter';

// ── EditorView text extraction ─────────────────────────────────────────
export { getFullText, getBodyText } from './editor-text-accessor';

// ── Clipboard ──────────────────────────────────────────────────────────
export { copyToClipboard } from './clipboard';

// ── Pattern A: Props Callback ──────────────────────────────────────────
export {
  createEditorViewRef,
  createGetFullTextFn,
  createGetBodyTextFn,
} from './props-callback';

// ── Pattern B: Svelte Context ──────────────────────────────────────────
export type { EditorViewContext } from './context';
export {
  provideEditorViewContext,
  consumeEditorViewContext,
} from './context';
