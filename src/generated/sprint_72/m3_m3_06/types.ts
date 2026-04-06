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
import type { EditorView } from '@codemirror/view';

/**
 * Synchronous callback returning the current document text from an EditorView.
 * Used by the props-callback pattern (Option A of OQ-E02).
 */
export type GetTextFn = () => string;

/**
 * Mutable ref wrapper for an EditorView instance.
 * Allows callbacks created before onMount to access the view once it is initialised.
 */
export interface EditorViewRef {
  current: EditorView | null;
}

/**
 * Result of a clipboard write attempt.
 */
export interface CopyResult {
  success: boolean;
  error?: Error;
}
